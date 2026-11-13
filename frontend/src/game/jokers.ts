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

// Only Jokers with an effect and a rarity above 0 show up in the shop
export const SHOP_JOKER_IDS: string[] = JOKERS.filter(j => JOKER_EFFECTS[j.id] && j.rarity > 0).map(j => j.id);

// rarity x = a 1 in x chance, so its weight is 1 / x
function weight(id: string): number {
    const rarity = JOKERS_BY_ID[id]?.rarity ?? 0;
    return rarity > 0 ? 1 / rarity : 0;
}

// Weighted pick without repeats; empty slots are null
export function pickWeightedJokers(ids: string[], count: number, random = Math.random): (string | null)[] {
    const pool = ids.filter(id => weight(id) > 0);
    const picked: (string | null)[] = [];
    while (picked.length < count && pool.length > 0) {
        const total = pool.reduce((sum, id) => sum + weight(id), 0);
        let roll = random() * total;
        let index = 0;
        while (index < pool.length - 1 && roll >= weight(pool[index])) {
            roll -= weight(pool[index]);
            index++;
        }
        picked.push(pool.splice(index, 1)[0]);
    }
    while (picked.length < count) picked.push(null);
    return picked;
}

const missing = JOKERS.filter(j => !JOKER_EFFECTS[j.id]).map(j => j.name);
if (missing.length && import.meta.env?.DEV) {
    console.info(`Jokers without an effect yet (not sold in the shop): ${missing.join(', ')}`);
}

export function sellPrice(joker: JokerInfo): number {
    return Math.max(1, Math.floor(joker.price / 2));
}
