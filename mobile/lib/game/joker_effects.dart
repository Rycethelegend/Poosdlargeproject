import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/data/jokers.dart';
import 'package:poosdalatro/game/hands.dart';
// More helpers for writing effects: cardChips, isFace (cards.dart) and
// containsPair, containsTwoPair, isFlushType, isStraightType (hands.dart)

// How each Joker in data/jokers.dart works, by id. The names, descriptions and
// buff/debuff labels live in data/jokers.dart; keep them matching what's written here.
// Negative numbers are debuffs. A hand never drops below 0 chips or 1 mult.

class Effect {
  final int chips;
  final double mult;
  final double xmult;
  const Effect({this.chips = 0, this.mult = 0, this.xmult = 0});

  bool get isEmpty => chips == 0 && mult == 0 && xmult == 0;
}

/// What a Joker can look at when a hand is played
class PlayContext {
  final HandType handType;
  final List<PlayingCard> played;
  final List<PlayingCard> scoring;
  final int handsLeftBefore; // hands left before this one was played
  final int discardsUsed; // discards used so far this round
  final int handsPlayedRun; // hands played this run, counting this one
  final int jokerCount;
  final List<String> jokerIds; // ids of every joker the player has
  final double? roll; // random 0-1 for chance jokers; null in the live preview

  const PlayContext({
    required this.handType,
    required this.played,
    required this.scoring,
    required this.handsLeftBefore,
    required this.discardsUsed,
    required this.handsPlayedRun,
    required this.jokerCount,
    required this.jokerIds,
    required this.roll,
  });
}

class JokerEffect {
  final Effect? Function(PlayingCard card, PlayContext ctx)? onCard; // once per scoring card
  final Effect? Function(PlayContext ctx)? onHand; // once per hand, after the cards
  final int Function()? onRoundEnd; // extra $ when a round is won

  const JokerEffect({this.onCard, this.onHand, this.onRoundEnd});
}

// Jokers marked cat: true in data/jokers.dart
final Set<String> _catIds = {for (final j in jokers) if (j.cat) j.id};

// How many cat jokers the player has, not counting the one asking
int _catCount(PlayContext ctx, String self) =>
    ctx.jokerIds.where((id) => id != self && _catIds.contains(id)).length;

final Map<String, JokerEffect> jokerEffects = {
  'rubberDuck': JokerEffect(
    onHand: (ctx) => const Effect(mult: 3),
  ),
  'chuckElephant': JokerEffect(
    onHand: (ctx) => const Effect(xmult: 1.5),
  ),
  'moneyBags': JokerEffect(
    onRoundEnd: () => 2,
  ),
  'redTeam': JokerEffect(
    onCard: (card, ctx) => isRed(card) ? const Effect(mult: 2) : null,
  ),
  'blueTeam': JokerEffect(
    onCard: (card, ctx) => isRed(card) ? null : const Effect(chips: 25),
  ),
  'sixSeven': JokerEffect(
    onHand: (ctx) => ctx.played.any((c) => c.rank == 6) && ctx.played.any((c) => c.rank == 7)
        ? const Effect(chips: 67, mult: 6)
        : null,
  ),
  'dog': JokerEffect(
    onHand: (ctx) => Effect(mult: _catCount(ctx, 'dog') > 0 ? 6 : 2),
  ),
  'mouse': JokerEffect(
    onHand: (ctx) => Effect(mult: _catCount(ctx, 'mouse') > 0 ? -4 : 8),
  ),
  // 25% each: -2 mult, nothing, +3 mult, +8 mult. Not rolled in the preview.
  'dice': JokerEffect(
    onHand: (ctx) {
      final roll = ctx.roll;
      if (roll == null) return null;
      const sides = [Effect(mult: -2), null, Effect(mult: 3), Effect(mult: 8)];
      return sides[(roll * 4).floor().clamp(0, 3)];
    },
  ),
  'catLeader': JokerEffect(
    onHand: (ctx) {
      final cats = _catCount(ctx, 'catLeader');
      return cats > 0 ? Effect(mult: 3.0 * cats) : null;
    },
  ),
};
