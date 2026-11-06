import type { Card } from './cards';
import { BOSS_EFFECTS, type BossRules } from './bossEffects';
import { BOSSES, type BossInfo } from './data/bosses';

// A run is a series of Tables. Each Table has three rounds; the third one uses
// a Boss from data/bosses.ts. The run goes on until a round's target is missed.

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

export const BOSSES_BY_ID: Record<string, BossInfo> = Object.fromEntries(BOSSES.map(b => [b.id, b]));

// Only Bosses whose rules have been written get picked
const PLAYABLE_BOSS_IDS = BOSSES.filter(b => BOSS_EFFECTS[b.id]).map(b => b.id);

const missing = BOSSES.filter(b => !BOSS_EFFECTS[b.id]).map(b => b.name);
if (missing.length && import.meta.env?.DEV) {
    console.info(`Bosses without rules yet (never picked): ${missing.join(', ')}`);
}

export function randomBoss(): string {
    return PLAYABLE_BOSS_IDS[Math.floor(Math.random() * PLAYABLE_BOSS_IDS.length)];
}

// The rules of the Boss in play this round, or null outside the High Roller
export function activeBossRules(round: RoundIndex, bossId: string): BossRules | null {
    return round === HIGH_ROLLER ? BOSS_EFFECTS[bossId] ?? null : null;
}

// Starting hands, discards and hand size for a round
export function roundRules(round: RoundIndex, bossId: string) {
    const boss = activeBossRules(round, bossId);
    return {
        activeBoss: boss ? bossId : null,
        hands: boss?.hands ?? 4,
        discards: boss?.discards ?? 3,
        handSize: 8 + (boss?.handSizeChange ?? 0),
        maxSelect: boss?.maxSelect ?? 5,
    };
}

// True when the Boss in play stops this card from scoring
export function isBlocked(card: Card, round: RoundIndex, bossId: string): boolean {
    return activeBossRules(round, bossId)?.blocksCard?.(card) ?? false;
}

// Money for winning a round
export function savingsBonus(money: number): number {
    return Math.min(3, Math.floor(money / 10)); // $1 per $10 held, up to $3
}
