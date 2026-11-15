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

// Base targets for tables 1-8 (keep in sync with multiplayer/rules.js)
const TABLE_TARGETS = [250, 600, 1300, 2600, 4800, 8500, 14000, 22000];
const LATE_GROWTH = 1.6;

export function tableBaseTarget(table: number): number {
    if (table <= TABLE_TARGETS.length) return TABLE_TARGETS[table - 1];
    // after table 8: grows 1.6x per table, rounded to the nearest 500
    const last = TABLE_TARGETS[TABLE_TARGETS.length - 1];
    return Math.round(last * LATE_GROWTH ** (table - TABLE_TARGETS.length) / 500) * 500;
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

// Multiplayer: the same boss for everyone in a room at a given table, picked
// from the room id. mobile/lib/game/rounds.dart does the same math, so keep
// the boss list in the same order in both.
export function sharedBoss(roomId: string, table: number): string {
    let hash = 0;
    for (const ch of `${table}-${roomId}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    // mix the bits so the boss order doesn't follow a pattern
    for (let i = 0; i < 3; i++) {
        hash = (hash ^ (hash >>> 16)) >>> 0;
        hash = ((hash & 0xFFFF) * 40503 + (hash >>> 16)) >>> 0;
    }
    return PLAYABLE_BOSS_IDS[hash % PLAYABLE_BOSS_IDS.length];
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
