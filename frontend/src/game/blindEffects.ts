import { isFace, type Card } from './cards';

// How each Blind in data/blinds.ts works, by id. The names and descriptions
// live in data/blinds.ts; keep the description there matching what's written here.
// Every field is optional: leave out whatever the Blind doesn't change.

export interface BlindRules {
    hands?: number;              // hands this round (normally 4)
    discards?: number;           // discards this round (normally 3)
    handSizeChange?: number;     // added to the hand size (normally 8)
    maxSelect?: number;          // most cards per hand (normally 5)
    blocksCard?: (card: Card) => boolean;  // true = that card scores no chips
    halveBase?: boolean;         // halves the poker hand's base chips and mult
    costPerHand?: number;        // $ taken for every hand played
}

export const BLIND_EFFECTS: Record<string, BlindRules> = {
    shortStack: { hands: 3 },
    noRedraws: { discards: 0 },
    heartbreak: { blocksCard: (card) => card.suit === 'hearts' },
    clubClosed: { blocksCard: (card) => card.suit === 'clubs' },
    smallTalk: { maxSelect: 4 },
    royalSnub: { blocksCard: (card) => isFace(card) },
    tightGrip: { handSizeChange: -2 },
    payToPlay: { costPerHand: 1 },
    halftime: { halveBase: true },
};
