import 'dart:math';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/joker_effects.dart';
import 'package:poosdalatro/game/jokers.dart';
import 'package:poosdalatro/game/rounds.dart';

const int startingMoney = 4;
const int studyPrice = 3;
const int firstRerollCost = 4;
const int _shopJokerSlots = 2;
const int _shopStudySlots = 2;

enum Phase { playing, roundWon, shop, gameOver }

class OwnedJoker {
  final int uid;
  final String id;
  const OwnedJoker(this.uid, this.id);
}

class ScoreStep {
  final String source;
  final int chips;
  final double mult;
  final double xmult;
  const ScoreStep(this.source, {this.chips = 0, this.mult = 0, this.xmult = 0});
}

class PlayResult {
  final HandType handType;
  final int level;
  final List<PlayingCard> cards;
  final List<String> scoringIds;
  final List<ScoreStep> steps;
  final int chips;
  final double mult;
  final int score;

  const PlayResult({
    required this.handType,
    required this.level,
    required this.cards,
    required this.scoringIds,
    required this.steps,
    required this.chips,
    required this.mult,
    required this.score,
  });
}

class Reward {
  final int round;
  final int handsLeft;
  final int savings;
  final int jokers;
  const Reward(this.round, this.handsLeft, this.savings, this.jokers);
  int get total => round + handsLeft + savings + jokers;
}

class ShopState {
  List<String?> jokerOffers;
  List<HandType?> studyOffers;
  int rerollCost;
  ShopState(this.jokerOffers, this.studyOffers, this.rerollCost);
}

class SavedScore {
  final int bestScore;
  final int rank;
  const SavedScore(this.bestScore, this.rank);
}

String _newRunId() {
  final random = Random.secure();
  final hex = List.generate(32, (_) => random.nextInt(16).toRadixString(16)).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-'
      '${hex.substring(16, 20)}-${hex.substring(20)}';
}

/// One singleplayer run. The screen calls these methods and then setState.
class RunState {
  String runId;
  Phase phase = Phase.playing;

  int table = 1;
  int round = 0;
  String boss; // the High Roller boss for this table

  int target = 0;
  int roundScore = 0;
  int totalScore = 0; // every chip scored this run: what goes on the leaderboard
  int handsLeft = 0;
  int discardsLeft = 0;
  int discardsUsed = 0;

  List<PlayingCard> drawPile = [];
  List<PlayingCard> hand = [];
  List<String> selected = [];
  SortMode sortMode = SortMode.rank;

  int money = startingMoney;
  List<OwnedJoker> jokers = [];
  Map<HandType, int> handLevels = startingLevels();
  int handsPlayedRun = 0;
  int bestHand = 0;

  PlayResult? lastPlay;
  Reward? reward;
  ShopState? shop;
  int nextUid = 1;

  SavedScore? saved;
  bool gaveUp = false;
  String? endedAt;

  RunState._(this.runId, this.boss);

  factory RunState.newRun() {
    final run = RunState._(_newRunId(), randomBoss());
    run._startRound();
    return run;
  }

  RoundRules get rules => roundRules(round, boss);

  List<PlayingCard> get selectedCards =>
      hand.where((c) => selected.contains(c.id)).toList();

  // Deals a fresh, fully shuffled deck for the current round
  void _startRound() {
    final deck = shuffled(createDeck());
    final r = rules;
    phase = Phase.playing;
    target = roundTarget(table, round);
    roundScore = 0;
    handsLeft = r.hands;
    discardsLeft = r.discards;
    discardsUsed = 0;
    hand = deck.sublist(0, r.handSize);
    drawPile = deck.sublist(r.handSize);
    selected = [];
    lastPlay = null;
    reward = null;
    shop = null;
  }

  /// Works out what the given cards would score. Also used for the live preview.
  PlayResult? scorePlay(List<PlayingCard> played) {
    final result = evaluateHand(played);
    if (result == null) return null;

    final level = handLevels[result.type]!;
    var (:chips, :mult) = handValues(result.type, level);
    if (activeBossRules(round, boss)?.halveBase ?? false) {
      chips = (chips / 2).ceil();
      mult = max(1, (mult / 2).ceil());
    }

    var totalChips = chips;
    double totalMult = mult.toDouble();
    final steps = <ScoreStep>[
      ScoreStep('${hands[result.type]!.name} (level $level)',
          chips: chips, mult: mult.toDouble()),
    ];

    void apply(Effect e) {
      totalChips += e.chips;
      totalMult += e.mult;
      if (e.xmult != 0) totalMult *= e.xmult;
    }

    final ctx = PlayContext(
      handType: result.type,
      played: played,
      scoring: result.scoring,
      handsLeftBefore: handsLeft,
      discardsUsed: discardsUsed,
      handsPlayedRun: handsPlayedRun + 1,
      jokerCount: jokers.length,
    );
    final owned = jokers
        .where((j) => jokersById.containsKey(j.id))
        .map((j) => (info: jokersById[j.id]!, effect: jokerEffects[j.id]))
        .toList();

    final scoringIds = <String>[];
    for (final card in result.scoring) {
      if (isBlocked(card, round, boss)) {
        steps.add(ScoreStep('${cardLabel(card)} (blocked)'));
        continue;
      }
      scoringIds.add(card.id);
      totalChips += cardChips(card);
      steps.add(ScoreStep(cardLabel(card), chips: cardChips(card)));

      for (final joker in owned) {
        final e = joker.effect?.onCard?.call(card, ctx);
        if (e != null && !e.isEmpty) {
          apply(e);
          steps.add(ScoreStep('${joker.info.name} (${cardLabel(card)})',
              chips: e.chips, mult: e.mult, xmult: e.xmult));
        }
      }
    }

    for (final joker in owned) {
      final e = joker.effect?.onHand?.call(ctx);
      if (e != null && !e.isEmpty) {
        apply(e);
        steps.add(ScoreStep(joker.info.name,
            chips: e.chips, mult: e.mult, xmult: e.xmult));
      }
    }

    return PlayResult(
      handType: result.type,
      level: level,
      cards: played,
      scoringIds: scoringIds,
      steps: steps,
      chips: totalChips,
      mult: totalMult,
      score: (totalChips * totalMult).floor(),
    );
  }

  // Removes the given cards from the hand and draws back up to hand size
  void _replaceCards(List<String> removed) {
    final kept = hand.where((c) => !removed.contains(c.id)).toList();
    final drawCount = min(drawPile.length, max(0, rules.handSize - kept.length));
    hand = [...kept, ...drawPile.take(drawCount)];
    drawPile = drawPile.sublist(drawCount);
  }

  Reward _computeReward() {
    final fromJokers = jokers.fold<int>(
        0, (sum, j) => sum + (jokerEffects[j.id]?.onRoundEnd?.call() ?? 0));
    return Reward(rounds[round].reward, handsLeft, savingsBonus(money), fromJokers);
  }

  List<String?> _jokerOffers() {
    final owned = jokers.map((j) => j.id).toSet();
    return pickWeightedJokers(
        shopJokerIds.where((id) => !owned.contains(id)).toList(), _shopJokerSlots);
  }

  void _openShop() {
    final studies = <HandType?>[...shuffled(HandType.values).take(_shopStudySlots)];
    shop = ShopState(_jokerOffers(), studies, firstRerollCost);
  }

  void toggleSelect(String cardId) {
    if (phase != Phase.playing) return;
    if (selected.contains(cardId)) {
      selected = selected.where((id) => id != cardId).toList();
    } else if (selected.length < rules.maxSelect) {
      selected = [...selected, cardId];
    }
  }

  void sort(SortMode mode) => sortMode = mode;

  void play() {
    if (phase != Phase.playing || handsLeft <= 0) return;
    final played = selectedCards;
    if (played.isEmpty || played.length > rules.maxSelect) return;

    final result = scorePlay(played)!;
    _replaceCards(selected);
    selected = [];
    roundScore += result.score;
    totalScore += result.score;
    handsLeft--;
    handsPlayedRun++;
    bestHand = max(bestHand, result.score);
    money = max(0, money - (activeBossRules(round, boss)?.costPerHand ?? 0));
    lastPlay = result;

    if (roundScore >= target) {
      phase = Phase.roundWon;
      reward = _computeReward();
    } else if (handsLeft == 0 || hand.isEmpty) {
      phase = Phase.gameOver;
      endedAt = DateTime.now().toUtc().toIso8601String();
    }
  }

  void discard() {
    if (phase != Phase.playing || discardsLeft <= 0 || selected.isEmpty) return;
    _replaceCards(selected);
    selected = [];
    discardsLeft--;
    discardsUsed++;
  }

  void collectReward() {
    if (phase != Phase.roundWon || reward == null) return;
    money += reward!.total;
    phase = Phase.shop;
    _openShop();
  }

  void buyJoker(int slot) {
    final id = shop?.jokerOffers[slot];
    if (phase != Phase.shop || id == null) return;
    final joker = jokersById[id]!;
    if (money < joker.price || jokers.length >= maxJokers) return;
    money -= joker.price;
    jokers = [...jokers, OwnedJoker(nextUid++, id)];
    shop!.jokerOffers[slot] = null;
  }

  void buyStudy(int slot) {
    final type = shop?.studyOffers[slot];
    if (phase != Phase.shop || type == null || money < studyPrice) return;
    money -= studyPrice;
    handLevels[type] = handLevels[type]! + 1;
    shop!.studyOffers[slot] = null;
  }

  void sellJoker(int uid) {
    if (phase != Phase.shop) return;
    final owned = jokers.where((j) => j.uid == uid).firstOrNull;
    if (owned == null) return;
    money += sellPrice(jokersById[owned.id]!);
    jokers = jokers.where((j) => j.uid != uid).toList();
  }

  void reroll() {
    if (phase != Phase.shop || shop == null || money < shop!.rerollCost) return;
    money -= shop!.rerollCost;
    shop!.jokerOffers = _jokerOffers();
    shop!.rerollCost++;
  }

  void nextRound() {
    if (phase != Phase.shop) return;
    if (round == highRoller) {
      table++;
      round = 0;
      boss = randomBoss();
    } else {
      round++;
    }
    _startRound();
  }

  void giveUp() {
    if (phase != Phase.playing && phase != Phase.shop) return;
    phase = Phase.gameOver;
    gaveUp = true;
    selected = [];
    endedAt = DateTime.now().toUtc().toIso8601String();
  }

  // Saving on the phone

  static const int _version = 1;

  Map<String, dynamic> toJson() => {
        'version': _version,
        'runId': runId,
        'phase': phase.name,
        'table': table,
        'round': round,
        'boss': boss,
        'target': target,
        'roundScore': roundScore,
        'totalScore': totalScore,
        'handsLeft': handsLeft,
        'discardsLeft': discardsLeft,
        'discardsUsed': discardsUsed,
        'drawPile': drawPile.map((c) => c.toJson()).toList(),
        'hand': hand.map((c) => c.toJson()).toList(),
        'selected': selected,
        'sortMode': sortMode.name,
        'money': money,
        'jokers': jokers.map((j) => {'uid': j.uid, 'id': j.id}).toList(),
        'handLevels': handLevels.map((k, v) => MapEntry(k.name, v)),
        'handsPlayedRun': handsPlayedRun,
        'bestHand': bestHand,
        'lastPlay': lastPlay == null ? null : _playToJson(lastPlay!),
        'reward': reward == null
            ? null
            : [reward!.round, reward!.handsLeft, reward!.savings, reward!.jokers],
        'shop': shop == null
            ? null
            : {
                'jokerOffers': shop!.jokerOffers,
                'studyOffers': shop!.studyOffers.map((t) => t?.name).toList(),
                'rerollCost': shop!.rerollCost,
              },
        'nextUid': nextUid,
        'saved': saved == null ? null : [saved!.bestScore, saved!.rank],
        'gaveUp': gaveUp,
        'endedAt': endedAt,
      };

  static Map<String, dynamic> _playToJson(PlayResult p) => {
        'handType': p.handType.name,
        'level': p.level,
        'cards': p.cards.map((c) => c.toJson()).toList(),
        'scoringIds': p.scoringIds,
        'steps': p.steps
            .map((s) => [s.source, s.chips, s.mult, s.xmult])
            .toList(),
        'chips': p.chips,
        'mult': p.mult,
        'score': p.score,
      };

  /// Loads a saved run, or null if it's missing or from an older version
  static RunState? fromJson(Map<String, dynamic> j) {
    if (j['version'] != _version) return null;
    List<PlayingCard> cards(dynamic list) => (list as List)
        .map((c) => PlayingCard.fromJson(Map<String, dynamic>.from(c)))
        .toList();
    double d(dynamic n) => (n as num).toDouble();

    final run = RunState._(j['runId'], j['boss'])
      ..phase = Phase.values.byName(j['phase'])
      ..table = j['table']
      ..round = j['round']
      ..target = j['target']
      ..roundScore = j['roundScore']
      ..totalScore = j['totalScore']
      ..handsLeft = j['handsLeft']
      ..discardsLeft = j['discardsLeft']
      ..discardsUsed = j['discardsUsed']
      ..drawPile = cards(j['drawPile'])
      ..hand = cards(j['hand'])
      ..selected = List<String>.from(j['selected'])
      ..sortMode = SortMode.values.byName(j['sortMode'])
      ..money = j['money']
      ..jokers = (j['jokers'] as List)
          .map((o) => OwnedJoker(o['uid'], o['id']))
          .where((o) => jokersById.containsKey(o.id))
          .toList()
      ..handLevels = {
        for (final t in HandType.values) t: (j['handLevels'][t.name] as int?) ?? 1
      }
      ..handsPlayedRun = j['handsPlayedRun']
      ..bestHand = j['bestHand']
      ..nextUid = j['nextUid']
      ..gaveUp = j['gaveUp'] ?? false
      ..endedAt = j['endedAt'];

    final p = j['lastPlay'];
    if (p != null) {
      run.lastPlay = PlayResult(
        handType: HandType.values.byName(p['handType']),
        level: p['level'],
        cards: cards(p['cards']),
        scoringIds: List<String>.from(p['scoringIds']),
        steps: (p['steps'] as List)
            .map((s) => ScoreStep(s[0], chips: s[1], mult: d(s[2]), xmult: d(s[3])))
            .toList(),
        chips: p['chips'],
        mult: d(p['mult']),
        score: p['score'],
      );
    }
    final r = j['reward'];
    if (r != null) run.reward = Reward(r[0], r[1], r[2], r[3]);
    final s = j['shop'];
    if (s != null) {
      run.shop = ShopState(
        List<String?>.from(s['jokerOffers'])
            .map((id) => jokersById.containsKey(id) ? id : null)
            .toList(),
        (s['studyOffers'] as List)
            .map((t) => t == null ? null : HandType.values.byName(t))
            .toList(),
        s['rerollCost'],
      );
    }
    final saved = j['saved'];
    if (saved != null) run.saved = SavedScore(saved[0], saved[1]);
    return run;
  }
}
