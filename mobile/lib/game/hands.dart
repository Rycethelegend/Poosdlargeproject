import 'package:poosdalatro/game/cards.dart';

// Weakest to strongest
enum HandType {
  highCard,
  pair,
  twoPair,
  threeKind,
  straight,
  flush,
  fullHouse,
  fourKind,
  straightFlush,
}

class HandInfo {
  final String name;
  final int chips; // base chips at level 1
  final int mult; // base mult at level 1
  final int levelChips; // added per Study Guide level
  final int levelMult;
  final String howToMake;

  const HandInfo(this.name, this.chips, this.mult, this.levelChips,
      this.levelMult, this.howToMake);
}

const Map<HandType, HandInfo> hands = {
  HandType.highCard: HandInfo('High Card', 5, 1, 10, 1,
      'Anything else: only your highest card scores'),
  HandType.pair: HandInfo('Pair', 12, 2, 12, 1, '2 cards of the same rank'),
  HandType.twoPair:
      HandInfo('Two Pair', 24, 2, 18, 1, '2 pairs of different ranks'),
  HandType.threeKind:
      HandInfo('Three of a Kind', 32, 3, 20, 2, '3 cards of the same rank'),
  HandType.straight: HandInfo(
      'Straight', 36, 4, 25, 2, '5 cards in a row (A-2-3-4-5 counts)'),
  HandType.flush: HandInfo('Flush', 40, 4, 18, 2, '5 cards of the same suit'),
  HandType.fullHouse:
      HandInfo('Full House', 48, 4, 24, 2, '3 of one rank and 2 of another'),
  HandType.fourKind:
      HandInfo('Four of a Kind', 64, 6, 30, 3, '4 cards of the same rank'),
  HandType.straightFlush: HandInfo('Straight Flush', 110, 8, 40, 4,
      '5 cards in a row, all the same suit'),
};

Map<HandType, int> startingLevels() => {for (final t in HandType.values) t: 1};

({int chips, int mult}) handValues(HandType type, int level) {
  final info = hands[type]!;
  return (
    chips: info.chips + (level - 1) * info.levelChips,
    mult: info.mult + (level - 1) * info.levelMult,
  );
}

class HandResult {
  final HandType type;
  final List<PlayingCard> scoring; // only the cards that make the hand add their chips
  const HandResult(this.type, this.scoring);
}

/// Finds the best poker hand in 1-5 played cards
HandResult? evaluateHand(List<PlayingCard> cards) {
  if (cards.isEmpty) return null;

  final byRank = <int, List<PlayingCard>>{};
  for (final card in cards) {
    byRank.putIfAbsent(card.rank, () => []).add(card);
  }
  // Biggest groups first, higher rank breaks ties
  final groups = byRank.values.toList()
    ..sort((a, b) => b.length != a.length
        ? b.length - a.length
        : b[0].rank - a[0].rank);

  final isFlush =
      cards.length == 5 && cards.every((c) => c.suit == cards[0].suit);
  final ranks = byRank.keys.toList()..sort();
  final isStraight = cards.length == 5 &&
      ranks.length == 5 &&
      (ranks[4] - ranks[0] == 4 || ranks.join(',') == '2,3,4,5,14');
  final second = groups.length > 1 ? groups[1].length : 0;

  if (isStraight && isFlush) return HandResult(HandType.straightFlush, cards);
  if (groups[0].length == 4) return HandResult(HandType.fourKind, groups[0]);
  if (groups[0].length == 3 && second == 2) {
    return HandResult(HandType.fullHouse, cards);
  }
  if (isFlush) return HandResult(HandType.flush, cards);
  if (isStraight) return HandResult(HandType.straight, cards);
  if (groups[0].length == 3) return HandResult(HandType.threeKind, groups[0]);
  if (groups[0].length == 2 && second == 2) {
    return HandResult(HandType.twoPair, [...groups[0], ...groups[1]]);
  }
  if (groups[0].length == 2) return HandResult(HandType.pair, groups[0]);

  final highest = [...cards]..sort((a, b) => b.rank - a.rank);
  return HandResult(HandType.highCard, [highest.first]);
}

bool containsPair(HandType type) => const [
      HandType.pair,
      HandType.twoPair,
      HandType.threeKind,
      HandType.fullHouse,
      HandType.fourKind,
    ].contains(type);

bool containsTwoPair(HandType type) =>
    type == HandType.twoPair || type == HandType.fullHouse;

bool isStraightType(HandType type) =>
    type == HandType.straight || type == HandType.straightFlush;

bool isFlushType(HandType type) =>
    type == HandType.flush || type == HandType.straightFlush;
