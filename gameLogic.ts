export type Suit = '♠' | '♥' | '♦' | '♣' | '🤡'; 

export interface Card {
  id: string;
  suit: Suit;
  suitIndex: number;   
  rank: number;        
  rankIndex: number;   
  displayRank: string;
  isJoker?: boolean;
}

export interface HandEvaluation {
  handName: string;
  baseChips: number;
  multiplier: number;
  score: number;
}

const SUITS: { suit: Suit; index: number }[] = [
  { suit: '♠', index: 0 },
  { suit: '♥', index: 1 },
  { suit: '♦', index: 2 },
  { suit: '♣', index: 3 },
  { suit: '🤡', index: 4 }, 
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

      // Sprite index mapping (assuming standard Ace-first or 2-first layout)
      // If your sprite starts with Ace = 0, rank 14 is index 0, rank 2 is index 1, etc.
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

// Evaluate played cards (up to 5 cards) using Balatro-style scoring
export const evaluateHand = (selectedCards: Card[]): HandEvaluation => {
  if (selectedCards.length === 0) {
    return { handName: 'High Card', baseChips: 5, multiplier: 1, score: 5 };
  }

  const ranks = selectedCards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = selectedCards.map((c) => c.suit);

  // Card chip contribution: Face value (Jack/Queen/King = 10, Ace = 11)
  const cardChipSum = selectedCards.reduce((sum, card) => {
    if (card.rank >= 10 && card.rank <= 13) return sum + 10;
    if (card.rank === 14) return sum + 11;
    return sum + card.rank;
  }, 0);

  // Rank frequency map
  const rankCounts: { [key: number]: number } = {};
  ranks.forEach((r) => (rankCounts[r] = (rankCounts[r] || 0) + 1));
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  // Check Flush / Straight
  const isFlush = selectedCards.length === 5 && new Set(suits).size === 1;
  const isStraight =
    selectedCards.length === 5 &&
    (ranks[4] - ranks[0] === 4 || (ranks[4] === 14 && ranks[3] === 5)); // Includes A-2-3-4-5 low straight

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