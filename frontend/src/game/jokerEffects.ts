import { isRed, type Card } from './cards';
import type { HandType } from './hands';
import { JOKERS } from './data/jokers';
// More helpers for writing effects: cardChips, isFace (./cards) and
// containsPair, containsTwoPair, isFlushType, isStraightType (./hands)

// How each Joker in data/jokers.ts works, by id. The names, descriptions and
// buff/debuff labels live in data/jokers.ts; keep them matching what's written here.
// Negative numbers are debuffs. A hand never drops below 0 chips or 1 mult.

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
    jokerIds: string[];        // ids of every joker the player has
    roll: number | null;       // random 0-1 for chance jokers; null in the live preview
}

export interface JokerEffect {
    onCard?: (card: Card, ctx: PlayContext) => Effect | null;  // once per scoring card
    onHand?: (ctx: PlayContext) => Effect | null;               // once per hand, after the cards
    onRoundEnd?: () => number;                                  // extra $ when a round is won
}

// Jokers marked cat: true in data/jokers.ts
const CAT_IDS = new Set(JOKERS.filter(j => j.cat).map(j => j.id));

// How many cat jokers the player has, not counting the one asking
function catCount(ctx: PlayContext, self: string): number {
    return ctx.jokerIds.filter(id => id !== self && CAT_IDS.has(id)).length;
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
    sixSeven: {
        onHand: (ctx) => ctx.played.some(c => c.rank === 6) && ctx.played.some(c => c.rank === 7)
            ? { chips: 67, mult: 6 }
            : null,
    },
    dog: {
        onHand: (ctx) => ({ mult: catCount(ctx, 'dog') > 0 ? 6 : 2 }),
    },
    mouse: {
        onHand: (ctx) => ({ mult: catCount(ctx, 'mouse') > 0 ? -4 : 8 }),
    },
    dice: {
        // 25% each: -2 mult, nothing, +3 mult, +8 mult. Not rolled in the preview.
        onHand: (ctx) => {
            if (ctx.roll === null) return null;
            const sides: (Effect | null)[] = [{ mult: -2 }, null, { mult: 3 }, { mult: 8 }];
            return sides[Math.min(3, Math.floor(ctx.roll * 4))];
        },
    },
    catLeader: {
        onHand: (ctx) => {
            const cats = catCount(ctx, 'catLeader');
            return cats > 0 ? { mult: 3 * cats } : null;
        },
    },
};
