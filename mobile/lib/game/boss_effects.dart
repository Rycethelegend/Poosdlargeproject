import 'package:poosdalatro/game/cards.dart';

// How each Boss in data/bosses.dart works, by id. The names and descriptions
// live in data/bosses.dart; keep the description there matching what's written here.
// Every field is optional: leave out whatever the Boss doesn't change.

class BossRules {
  final int? hands; // hands this round (normally 4)
  final int? discards; // discards this round (normally 3)
  final int handSizeChange; // added to the hand size (normally 8)
  final int? maxSelect; // most cards per hand (normally 5)
  final bool Function(PlayingCard card)? blocksCard; // true = that card scores no chips
  final bool halveBase; // halves the poker hand's base chips and mult
  final int costPerHand; // $ taken for every hand played

  const BossRules({
    this.hands,
    this.discards,
    this.handSizeChange = 0,
    this.maxSelect,
    this.blocksCard,
    this.halveBase = false,
    this.costPerHand = 0,
  });
}

final Map<String, BossRules> bossEffects = {
  'shortStack': const BossRules(hands: 3),
  'nodiscards': const BossRules(discards: 0),
  'heartbreak': BossRules(blocksCard: (card) => card.suit == Suit.hearts),
  'clubClosed': BossRules(blocksCard: (card) => card.suit == Suit.clubs),
  'downWithRoyals': BossRules(blocksCard: (card) => isFace(card)),
};
