import { isFace, type Card } from './cards';

// How each Boss in data/bosses.ts works, by id. The names and descriptions
// live in data/bosses.ts; keep the description there matching what's written here.
// Every field is optional: leave out whatever the Boss doesn't change.

export interface BossRules {
    hands?: number;              // hands this round (normally 4)
    discards?: number;           // discards this round (normally 3)
    handSizeChange?: number;     // added to the hand size (normally 8)
    maxSelect?: number;          // most cards per hand (normally 5)
    blocksCard?: (card: Card) => boolean;  // true = that card scores no chips
    halveBase?: boolean;         // halves the poker hand's base chips and mult
    costPerHand?: number;        // $ taken for every hand played
}

export const BOSS_EFFECTS: Record<string, BossRules> = {
    shortStack: { hands: 3 },
    nodiscards: { discards: 0 },
    heartbreak: { blocksCard: (card) => card.suit === 'hearts' },
    clubClosed: { blocksCard: (card) => card.suit === 'clubs' },
    downWithRoyals: { blocksCard: (card) => isFace(card) },
};
