import 'dart:math';

// Same order as the rows of assets/poker-cards.png
enum Suit { hearts, diamonds, spades, clubs }

const Map<Suit, String> suitSymbol = {
  Suit.hearts: '♥',
  Suit.diamonds: '♦',
  Suit.spades: '♠',
  Suit.clubs: '♣',
};

enum SortMode { rank, suit }

/// rank: 2-10, 11 = Jack, 12 = Queen, 13 = King, 14 = Ace
class PlayingCard {
  final String id;
  final Suit suit;
  final int rank;

  const PlayingCard(this.id, this.suit, this.rank);

  Map<String, dynamic> toJson() => {'id': id, 'suit': suit.name, 'rank': rank};

  factory PlayingCard.fromJson(Map<String, dynamic> json) =>
      PlayingCard(json['id'], Suit.values.byName(json['suit']), json['rank']);
}

const _rankNames = {11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace'};
const _rankShort = {11: 'J', 12: 'Q', 13: 'K', 14: 'A'};

String rankShort(int rank) => _rankShort[rank] ?? '$rank';

String suitName(Suit suit) =>
    suit.name[0].toUpperCase() + suit.name.substring(1);

String cardName(PlayingCard card) =>
    '${_rankNames[card.rank] ?? card.rank} of ${suitName(card.suit)}';

String cardLabel(PlayingCard card) =>
    rankShort(card.rank) + suitSymbol[card.suit]!;

/// Chips a card adds when it scores: number cards = their number, faces = 10, Ace = 11
int cardChips(PlayingCard card) {
  if (card.rank == 14) return 11;
  if (card.rank >= 11) return 10;
  return card.rank;
}

bool isFace(PlayingCard card) => card.rank >= 11 && card.rank <= 13;

bool isRed(PlayingCard card) =>
    card.suit == Suit.hearts || card.suit == Suit.diamonds;

List<PlayingCard> createDeck() => [
      for (final suit in Suit.values)
        for (int rank = 2; rank <= 14; rank++)
          PlayingCard('${suit.name}-$rank', suit, rank),
    ];

final _random = Random();

List<T> shuffled<T>(List<T> items) => [...items]..shuffle(_random);

List<PlayingCard> sortCards(List<PlayingCard> cards, SortMode mode) {
  return [...cards]..sort((a, b) {
      final byRank = b.rank - a.rank;
      final bySuit = a.suit.index - b.suit.index;
      return mode == SortMode.rank
          ? (byRank != 0 ? byRank : bySuit)
          : (bySuit != 0 ? bySuit : byRank);
    });
}
