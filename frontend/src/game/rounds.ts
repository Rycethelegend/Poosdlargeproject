import type { Card } from './cards';
import { BLIND_EFFECTS, type BlindRules } from './blindEffects';
import { BLINDS, type BlindInfo } from './data/blinds';

// A run is a series of Tables. Each Table has three rounds; the third one uses
// a Blind from data/blinds.ts. The run goes on until a round's target is missed.

export const ROUNDS = [
    { name: 'Warm-up',     targetScale: 1,   reward: 3 },
    { name: 'Main Event',  targetScale: 1.5, reward: 4 },
    { name: 'High Roller', targetScale: 2,   reward: 5 },
] as const;

export type RoundIndex = 0 | 1 | 2;
export const HIGH_ROLLER: RoundIndex = 2;

const TABLE_TARGETS = [250, 600, 1500, 3500, 8000, 16000, 30000, 55000];

export function tableBaseTarget(table: number): number {
    if (table <= TABLE_TARGETS.length) return TABLE_TARGETS[table - 1];
    // Past table 8 each table is 1.8× harder, rounded to the nearest 500
    let target = TABLE_TARGETS[TABLE_TARGETS.length - 1];
    for (let t = TABLE_TARGETS.length; t < table; t++) {
        target = Math.round((target * 1.8) / 500) * 500;
    }
    return target;
}

export function roundTarget(table: number, round: RoundIndex): number {
    return Math.round(tableBaseTarget(table) * ROUNDS[round].targetScale);
}

export const BLINDS_BY_ID: Record<string, BlindInfo> = Object.fromEntries(BLINDS.map(b => [b.id, b]));

// Only Blinds whose rules have been written get picked
const PLAYABLE_BLIND_IDS = BLINDS.filter(b => BLIND_EFFECTS[b.id]).map(b => b.id);

const missing = BLINDS.filter(b => !BLIND_EFFECTS[b.id]).map(b => b.name);
if (missing.length && import.meta.env?.DEV) {
    console.info(`Blinds without rules yet (never picked): ${missing.join(', ')}`);
}

export function randomBlind(): string {
    return PLAYABLE_BLIND_IDS[Math.floor(Math.random() * PLAYABLE_BLIND_IDS.length)];
}

// The rules of the Blind in play this round, or null outside the High Roller
export function activeBlindRules(round: RoundIndex, blindId: string): BlindRules | null {
    return round === HIGH_ROLLER ? BLIND_EFFECTS[blindId] ?? null : null;
}

// Starting hands, discards and hand size for a round
export function roundRules(round: RoundIndex, blindId: string) {
    const blind = activeBlindRules(round, blindId);
    return {
        activeBlind: blind ? blindId : null,
        hands: blind?.hands ?? 4,
        discards: blind?.discards ?? 3,
        handSize: 8 + (blind?.handSizeChange ?? 0),
        maxSelect: blind?.maxSelect ?? 5,
    };
}

// True when the Blind in play stops this card from scoring
export function isBlocked(card: Card, round: RoundIndex, blindId: string): boolean {
    return activeBlindRules(round, blindId)?.blocksCard?.(card) ?? false;
}

// Money for winning a round
export function savingsBonus(money: number): number {
    return Math.min(3, Math.floor(money / 10)); // $1 per $10 held, up to $3
}
