import { cardChips, isFace, isRed, type Card } from './cards';
import { containsPair, containsTwoPair, isFlushType, isStraightType, type HandType } from './hands';

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
        onHand: () => ({ mult: 4 }),
    },
    coffeeMug: {
        onHand: () => ({ chips: 30 }),
    },
    pairProgramming: {
        onHand: (ctx) => containsPair(ctx.handType) ? { mult: 9 } : null,
    },
    codeReview: {
        onHand: (ctx) => containsTwoPair(ctx.handType) ? { chips: 70 } : null,
    },
    hotFix: {
        onHand: (ctx) => ctx.played.length <= 3 ? { mult: 14 } : null,
    },
    redTeam: {
        onCard: (card) => isRed(card) ? { mult: 2 } : null,
    },
    blueTeam: {
        onCard: (card) => isRed(card) ? null : { chips: 18 },
    },
    faceValidation: {
        onCard: (card) => isFace(card) ? { chips: 25 } : null,
    },
    offByOne: {
        onCard: (card) => card.rank === 14 || card.rank === 2 ? { mult: 5 } : null,
    },
    evenSplit: {
        onCard: (card) => card.rank <= 10 && card.rank % 2 === 0 ? { chips: cardChips(card) } : null,
    },
    mergeConflict: {
        onHand: (ctx) => isFlushType(ctx.handType) ? { xmult: 2 } : null,
    },
    stackOverflow: {
        onHand: (ctx) => isStraightType(ctx.handType) ? { xmult: 2 } : null,
    },
    recursion: {
        onHand: (ctx) => ({ mult: ctx.handsPlayedRun }),
    },
    cleanCode: {
        onHand: (ctx) => ctx.discardsUsed === 0 ? { mult: 18 } : null,
    },
    legacyCode: {
        onHand: (ctx) => ({ mult: 3 * ctx.jokerCount }),
    },
    finalExam: {
        onHand: (ctx) => ctx.handsLeftBefore === 1 ? { xmult: 3 } : null,
    },
    ventureCapital: {
        onRoundEnd: () => 3,
    },
};
