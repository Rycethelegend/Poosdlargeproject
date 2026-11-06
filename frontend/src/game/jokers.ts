import { JOKERS, type JokerInfo } from './data/jokers';
import { JOKER_EFFECTS, type JokerEffect } from './jokerEffects';

export type { Effect, PlayContext } from './jokerEffects';

// Jokers are bought in the shop and change how hands score. Up to MAX_JOKERS
// at once; they trigger left to right.
export const MAX_JOKERS = 5;

export type JokerDef = JokerInfo & JokerEffect;

export const JOKERS_BY_ID: Record<string, JokerDef> = Object.fromEntries(
    JOKERS.map(info => [info.id, { ...info, ...JOKER_EFFECTS[info.id] }])
);

// Only Jokers whose effect has been written can appear in the shop
export const SHOP_JOKER_IDS: string[] = JOKERS.filter(j => JOKER_EFFECTS[j.id]).map(j => j.id);

const missing = JOKERS.filter(j => !JOKER_EFFECTS[j.id]).map(j => j.name);
if (missing.length && import.meta.env?.DEV) {
    console.info(`Jokers without an effect yet (not sold in the shop): ${missing.join(', ')}`);
}

export function sellPrice(joker: JokerInfo): number {
    return Math.max(1, Math.floor(joker.price / 2));
}
