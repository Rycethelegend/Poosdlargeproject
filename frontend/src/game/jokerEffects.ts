import { isRed, type Card } from './cards';
import type { HandType } from './hands';
// More helpers for writing effects: cardChips, isFace (./cards) and
// containsPair, containsTwoPair, isFlushType, isStraightType (./hands)

// How each Joker in data/jokers.ts works, by id. The names and descriptions
// live in data/jokers.ts; keep the description there matching what's written here.

export interface Effect {
    chips?: number;
    mult?: number;
    xmult?: number;
}

// What a Joker can look at when a hand is played
export interface PlayContext {
    handType: HandType;
    played: Card[];
    scoring: Card[];
    handsLeftBefore: number;   // hands left before this one was played
    discardsUsed: number;      // discards used so far this round
    handsPlayedRun: number;    // hands played this run, counting this one
    jokerCount: number;
}

export interface JokerEffect {
    onCard?: (card: Card, ctx: PlayContext) => Effect | null;  // once per scoring card
    onHand?: (ctx: PlayContext) => Effect | null;               // once per hand, after the cards
    onRoundEnd?: () => number;                                  // extra $ when a round is won
}

export const JOKER_EFFECTS: Record<string, JokerEffect> = {
    rubberDuck: {
        onHand: () => ({ mult: 3 }),
    },
    chuckElephant: {
        onHand: () => ({ xmult: 1.5 }),
    },
    moneyBags: {
        onRoundEnd: () => 2,
    },
    redTeam: {
        onCard: (card) => isRed(card) ? { mult: 2 } : null,
    },
    blueTeam: {
        onCard: (card) => isRed(card) ? null : { chips: 25 },
    },
};
