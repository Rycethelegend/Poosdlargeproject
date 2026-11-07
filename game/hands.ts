import type { Card } from './cards';

export type HandType =
    | 'highCard' | 'pair' | 'twoPair' | 'threeKind' | 'straight'
    | 'flush' | 'fullHouse' | 'fourKind' | 'straightFlush';

// Weakest to strongest
export const HAND_TYPES: HandType[] = [
    'highCard', 'pair', 'twoPair', 'threeKind', 'straight',
    'flush', 'fullHouse', 'fourKind', 'straightFlush',
];

interface HandInfo {
    name: string;
    chips: number;       // base chips at level 1
    mult: number;        // base mult at level 1
    levelChips: number;  // added per Study Guide level
    levelMult: number;
}

export const HANDS: Record<HandType, HandInfo> = {
    highCard:      { name: 'High Card',       chips: 5,   mult: 1, levelChips: 10, levelMult: 1 },
    pair:          { name: 'Pair',            chips: 12,  mult: 2, levelChips: 12, levelMult: 1 },
    twoPair:       { name: 'Two Pair',        chips: 24,  mult: 2, levelChips: 18, levelMult: 1 },
    threeKind:     { name: 'Three of a Kind', chips: 32,  mult: 3, levelChips: 20, levelMult: 2 },
    straight:      { name: 'Straight',        chips: 36,  mult: 4, levelChips: 25, levelMult: 2 },
    flush:         { name: 'Flush',           chips: 40,  mult: 4, levelChips: 18, levelMult: 2 },
    fullHouse:     { name: 'Full House',      chips: 48,  mult: 4, levelChips: 24, levelMult: 2 },
    fourKind:      { name: 'Four of a Kind',  chips: 64,  mult: 6, levelChips: 30, levelMult: 3 },
    straightFlush: { name: 'Straight Flush',  chips: 110, mult: 8, levelChips: 40, levelMult: 4 },
};

export type HandLevels = Record<HandType, number>;

export function startingLevels(): HandLevels {
    return Object.fromEntries(HAND_TYPES.map(t => [t, 1])) as HandLevels;
}

export function handValues(type: HandType, level: number): { chips: number; mult: number } {
    const info = HANDS[type];
    return {
        chips: info.chips + (level - 1) * info.levelChips,
        mult: info.mult + (level - 1) * info.levelMult,
    };
}

export interface HandResult {
    type: HandType;
    scoring: Card[]; // only the cards that make the hand add their chips
}

// Finds the best poker hand in 1-5 played cards
export function evaluateHand(cards: Card[]): HandResult | null {
    if (cards.length === 0) return null;

    const byRank = new Map<number, Card[]>();
    for (const card of cards) {
        byRank.set(card.rank, [...(byRank.get(card.rank) ?? []), card]);
    }
    // Biggest groups first, higher rank breaks ties
    const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);

    const isFlush = cards.length === 5 && cards.every(c => c.suit === cards[0].suit);
    const ranks = [...byRank.keys()].sort((a, b) => a - b);
    const isStraight = cards.length === 5 && ranks.length === 5 &&
        (ranks[4] - ranks[0] === 4 || ranks.join() === '2,3,4,5,14');

    if (isStraight && isFlush) return { type: 'straightFlush', scoring: cards };
    if (groups[0].length === 4) return { type: 'fourKind', scoring: groups[0] };
    if (groups[0].length === 3 && groups[1]?.length === 2) return { type: 'fullHouse', scoring: cards };
    if (isFlush) return { type: 'flush', scoring: cards };
    if (isStraight) return { type: 'straight', scoring: cards };
    if (groups[0].length === 3) return { type: 'threeKind', scoring: groups[0] };
    if (groups[0].length === 2 && groups[1]?.length === 2) {
        return { type: 'twoPair', scoring: [...groups[0], ...groups[1]] };
    }
    if (groups[0].length === 2) return { type: 'pair', scoring: groups[0] };

    const highest = [...cards].sort((a, b) => b.rank - a.rank)[0];
    return { type: 'highCard', scoring: [highest] };
}

export function containsPair(type: HandType): boolean {
    return ['pair', 'twoPair', 'threeKind', 'fullHouse', 'fourKind'].includes(type);
}

export function containsTwoPair(type: HandType): boolean {
    return type === 'twoPair' || type === 'fullHouse';
}

export function isStraightType(type: HandType): boolean {
    return type === 'straight' || type === 'straightFlush';
}

export function isFlushType(type: HandType): boolean {
    return type === 'flush' || type === 'straightFlush';
}
