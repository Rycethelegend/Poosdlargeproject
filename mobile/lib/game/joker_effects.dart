import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/hands.dart';
// More helpers for writing effects: cardChips, isFace (cards.dart) and
// containsPair, containsTwoPair, isFlushType, isStraightType (hands.dart)

// How each Joker in data/jokers.dart works, by id. The names and descriptions
// live in data/jokers.dart; keep the description there matching what's written here.

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

  const PlayContext({
    required this.handType,
    required this.played,
    required this.scoring,
    required this.handsLeftBefore,
    required this.discardsUsed,
    required this.handsPlayedRun,
    required this.jokerCount,
  });
}

class JokerEffect {
  final Effect? Function(PlayingCard card, PlayContext ctx)? onCard; // once per scoring card
  final Effect? Function(PlayContext ctx)? onHand; // once per hand, after the cards
  final int Function()? onRoundEnd; // extra $ when a round is won

  const JokerEffect({this.onCard, this.onHand, this.onRoundEnd});
}

final Map<String, JokerEffect> jokerEffects = {
  'rubberDuck': JokerEffect(
    onHand: (ctx) => const Effect(mult: 4),
  ),
  'chuckElephant': JokerEffect(
    onHand: (ctx) => const Effect(chips: 10, mult: 2),
  ),
  'moneyBags': JokerEffect(
    onRoundEnd: () => 1,
  ),
  'redTeam': JokerEffect(
    onCard: (card, ctx) => isRed(card) ? const Effect(mult: 2) : null,
  ),
  'blueTeam': JokerEffect(
    onCard: (card, ctx) => isRed(card) ? null : const Effect(chips: 18),
  ),
};
