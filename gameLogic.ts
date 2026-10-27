export type Suit = '♠' | '♥' | '♦' | '♣' | '🤡';

export interface Card {
  id: string;          
  suit: Suit;
  suitIndex: number;   // 0: Hearts, 1: Diamonds, 2: Spades, 3: Clubs, 4: Jokers (matching your sprite rows)
  rank: number;        // 2 through 14 (Ace = 14)
  rankIndex: number;   // 0 through 14 (A-K = 0-12, Jokers = 13, 14)
  displayRank: string;
}

export interface HandEvaluation {
  handName: string;
  baseChips: number;
  multiplier: number;
  score: number;
}

// Mapping to match your poker-cards.png sprite sheet layout:
// Row 0: Hearts (+ Jokers at the end)
// Row 1: Diamonds
// Row 2: Spades
// Row 3: Clubs
const SUITS: { suit: Suit; index: number }[] = [
  { suit: '♥', index: 0 },
  { suit: '♦', index: 1 },
  { suit: '♠', index: 2 },
  { suit: '♣', index: 3 },
];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  SUITS.forEach(({ suit, index: suitIndex }) => {
    for (let rank = 2; rank <= 14; rank++) {
      let displayRank = rank.toString();
      if (rank === 11) displayRank = 'J';
      if (rank === 12) displayRank = 'Q';
      if (rank === 13) displayRank = 'K';
      if (rank === 14) displayRank = 'A';

      // Columns 0 to 12: Ace (rank 14 -> index 0), 2 (rank 2 -> index 1), ..., King (rank 13 -> index 12)
      const rankIndex = rank === 14 ? 0 : rank - 1;

      deck.push({
        id: `${suit}-${rank}-${Math.random()}`,
        suit,
        suitIndex,
        rank,
        rankIndex,
        displayRank,
      });
    }
  });

  // Optionally add Jokers (located on Row 0, columns 13 and 14 in your sprite sheet)
  deck.push({
    id: `joker-red-${Math.random()}`,
    suit: '🤡',
    suitIndex: 0,
    rank: 15,
    rankIndex: 13,
    displayRank: 'JOKER',
  });

  deck.push({
    id: `joker-black-${Math.random()}`,
    suit: '🤡',
    suitIndex: 0,
    rank: 15,
    rankIndex: 14,
    displayRank: 'JOKER',
  });

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const evaluateHand = (selectedCards: Card[]): HandEvaluation => {
  if (selectedCards.length === 0) {
    return { handName: 'High Card', baseChips: 5, multiplier: 1, score: 5 };
  }

  const ranks = selectedCards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = selectedCards.map((c) => c.suit);

  const cardChipSum = selectedCards.reduce((sum, card) => {
    if (card.suit === '🤡') return sum + 15; // Joker chip bonus
    if (card.rank >= 10 && card.rank <= 13) return sum + 10;
    if (card.rank === 14) return sum + 11;
    return sum + card.rank;
  }, 0);

  const rankCounts: { [key: number]: number } = {};
  ranks.forEach((r) => (rankCounts[r] = (rankCounts[r] || 0) + 1));
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isFlush = selectedCards.length === 5 && new Set(suits.filter(s => s !== '🤡')).size === 1;
  const isStraight =
    selectedCards.length === 5 &&
    (ranks[4] - ranks[0] === 4 || (ranks[4] === 14 && ranks[3] === 5));

  let handName = 'High Card';
  let baseChips = 5;
  let multiplier = 1;

  if (isFlush && isStraight) {
    handName = 'Straight Flush';
    baseChips = 100;
    multiplier = 8;
  } else if (counts[0] === 4) {
    handName = 'Four of a Kind';
    baseChips = 60;
    multiplier = 7;
  } else if (counts[0] === 3 && counts[1] === 2) {
    handName = 'Full House';
    baseChips = 40;
    multiplier = 4;
  } else if (isFlush) {
    handName = 'Flush';
    baseChips = 35;
    multiplier = 4;
  } else if (isStraight) {
    handName = 'Straight';
    baseChips = 30;
    multiplier = 4;
  } else if (counts[0] === 3) {
    handName = 'Three of a Kind';
    baseChips = 30;
    multiplier = 3;
  } else if (counts[0] === 2 && counts[1] === 2) {
    handName = 'Two Pair';
    baseChips = 20;
    multiplier = 2;
  } else if (counts[0] === 2) {
    handName = 'One Pair';
    baseChips = 10;
    multiplier = 2;
  }

  const totalChips = baseChips + cardChipSum;
  const score = totalChips * multiplier;

  return { handName, baseChips: totalChips, multiplier, score };
};