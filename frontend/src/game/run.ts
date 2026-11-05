import { cardChips, cardLabel, createDeck, shuffle, type Card, type SortMode } from './cards';
import { JOKERS_BY_ID, MAX_JOKERS, sellPrice, SHOP_JOKER_IDS, type Effect, type PlayContext } from './jokers';
import { evaluateHand, HAND_TYPES, HANDS, handValues, startingLevels, type HandLevels, type HandType } from './hands';
import {
    activeBlindRules, HIGH_ROLLER, isBlocked, randomBlind, ROUNDS, roundRules, roundTarget, savingsBonus,
    type RoundIndex,
} from './rounds';

export const STARTING_MONEY = 4;
export const STUDY_PRICE = 3;
export const FIRST_REROLL_COST = 4;
const SHOP_JOKER_SLOTS = 2;
const SHOP_STUDY_SLOTS = 2;

export type Phase = 'playing' | 'roundWon' | 'shop' | 'gameOver';

export interface OwnedJoker {
    uid: number;
    id: string;
}

export interface ScoreStep {
    source: string;
    chips?: number;
    mult?: number;
    xmult?: number;
}

export interface PlayResult {
    handType: HandType;
    level: number;
    cards: Card[];
    scoringIds: string[];
    steps: ScoreStep[];
    chips: number;
    mult: number;
    score: number;
}

export interface Reward {
    round: number;
    handsLeft: number;
    savings: number;
    jokers: number;
    total: number;
}

export interface ShopState {
    jokerOffers: (string | null)[];
    studyOffers: (HandType | null)[];
    rerollCost: number;
}

export interface RunState {
    version: 2;
    runId: string;
    phase: Phase;

    table: number;
    round: RoundIndex;
    blind: string;             // id from data/blinds.ts: the High Roller blind for this table

    target: number;
    roundScore: number;
    totalScore: number;        // every chip scored this run: what goes on the leaderboard
    handsLeft: number;
    discardsLeft: number;
    discardsUsed: number;

    drawPile: Card[];
    hand: Card[];
    selected: string[];
    sortMode: SortMode;

    money: number;
    jokers: OwnedJoker[];
    handLevels: HandLevels;
    handsPlayedRun: number;
    bestHand: number;

    lastPlay: PlayResult | null;
    reward: Reward | null;
    shop: ShopState | null;
    nextUid: number;

    saved: { bestScore: number; rank: number } | null;
    gaveUp?: boolean;
}

export type RunAction =
    | { type: 'toggleSelect'; cardId: string }
    | { type: 'clearSelection' }
    | { type: 'sort'; mode: SortMode }
    | { type: 'play' }
    | { type: 'discard' }
    | { type: 'collectReward' }
    | { type: 'buyJoker'; slot: number }
    | { type: 'buyStudy'; slot: number }
    | { type: 'sellJoker'; uid: number }
    | { type: 'reroll' }
    | { type: 'nextRound' }
    | { type: 'giveUp' }
    | { type: 'scoreSaved'; bestScore: number; rank: number };

function newRunId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function rulesFor(state: Pick<RunState, 'round' | 'blind'>) {
    return roundRules(state.round, state.blind);
}

// Deals a fresh, fully shuffled deck for the current round
function startRound(state: RunState): RunState {
    const rules = rulesFor(state);
    const deck = shuffle(createDeck());
    return {
        ...state,
        phase: 'playing',
        target: roundTarget(state.table, state.round),
        roundScore: 0,
        handsLeft: rules.hands,
        discardsLeft: rules.discards,
        discardsUsed: 0,
        hand: deck.slice(0, rules.handSize),
        drawPile: deck.slice(rules.handSize),
        selected: [],
        lastPlay: null,
        reward: null,
        shop: null,
    };
}

export function newRun(): RunState {
    return startRound({
        version: 2,
        runId: newRunId(),
        phase: 'playing',
        table: 1,
        round: 0,
        blind: randomBlind(),
        target: 0,
        roundScore: 0,
        totalScore: 0,
        handsLeft: 0,
        discardsLeft: 0,
        discardsUsed: 0,
        drawPile: [],
        hand: [],
        selected: [],
        sortMode: 'rank',
        money: STARTING_MONEY,
        jokers: [],
        handLevels: startingLevels(),
        handsPlayedRun: 0,
        bestHand: 0,
        lastPlay: null,
        reward: null,
        shop: null,
        nextUid: 1,
        saved: null,
    });
}

function applyEffect(totals: { chips: number; mult: number }, effect: Effect) {
    if (effect.chips) totals.chips += effect.chips;
    if (effect.mult) totals.mult += effect.mult;
    if (effect.xmult) totals.mult *= effect.xmult;
}

// Works out what the selected cards would score. Also used for the live preview.
export function scorePlay(state: RunState, played: Card[]): PlayResult | null {
    const hand = evaluateHand(played);
    if (!hand) return null;

    const level = state.handLevels[hand.type];
    const base = handValues(hand.type, level);
    if (activeBlindRules(state.round, state.blind)?.halveBase) {
        base.chips = Math.ceil(base.chips / 2);
        base.mult = Math.max(1, Math.ceil(base.mult / 2));
    }

    const totals = { chips: base.chips, mult: base.mult };
    const steps: ScoreStep[] = [{ source: `${HANDS[hand.type].name} (level ${level})`, chips: base.chips, mult: base.mult }];

    const ctx: PlayContext = {
        handType: hand.type,
        played,
        scoring: hand.scoring,
        handsLeftBefore: state.handsLeft,
        discardsUsed: state.discardsUsed,
        handsPlayedRun: state.handsPlayedRun + 1,
        jokerCount: state.jokers.length,
    };
    const jokers = state.jokers.map(c => JOKERS_BY_ID[c.id]).filter(Boolean);

    const scoringIds: string[] = [];
    for (const card of hand.scoring) {
        if (isBlocked(card, state.round, state.blind)) {
            steps.push({ source: `${cardLabel(card)} (blocked)` });
            continue;
        }
        scoringIds.push(card.id);
        const chips = cardChips(card);
        totals.chips += chips;
        steps.push({ source: cardLabel(card), chips });

        for (const joker of jokers) {
            const effect = joker.onCard?.(card, ctx);
            if (effect) {
                applyEffect(totals, effect);
                steps.push({ source: `${joker.name} (${cardLabel(card)})`, ...effect });
            }
        }
    }

    for (const joker of jokers) {
        const effect = joker.onHand?.(ctx);
        if (effect && (effect.chips || effect.mult || effect.xmult)) {
            applyEffect(totals, effect);
            steps.push({ source: joker.name, ...effect });
        }
    }

    return {
        handType: hand.type,
        level,
        cards: played,
        scoringIds,
        steps,
        chips: totals.chips,
        mult: totals.mult,
        score: Math.floor(totals.chips * totals.mult),
    };
}

export function selectedCards(state: RunState): Card[] {
    return state.hand.filter(c => state.selected.includes(c.id));
}

// Removes the given cards from the hand and draws back up to hand size
function replaceCards(state: RunState, removed: string[]) {
    const kept = state.hand.filter(c => !removed.includes(c.id));
    const drawCount = Math.max(0, rulesFor(state).handSize - kept.length);
    return {
        hand: [...kept, ...state.drawPile.slice(0, drawCount)],
        drawPile: state.drawPile.slice(drawCount),
    };
}

function computeReward(state: RunState): Reward {
    const jokers = state.jokers.reduce((sum, c) => sum + (JOKERS_BY_ID[c.id]?.onRoundEnd?.() ?? 0), 0);
    const reward = {
        round: ROUNDS[state.round].reward,
        handsLeft: state.handsLeft,
        savings: savingsBonus(state.money),
        jokers,
    };
    return { ...reward, total: reward.round + reward.handsLeft + reward.savings + reward.jokers };
}

function pickRandom<T>(pool: T[], count: number): (T | null)[] {
    const picked = shuffle(pool).slice(0, count);
    while (picked.length < count) picked.push(null as T);
    return picked;
}

function jokerOffers(state: RunState): (string | null)[] {
    const owned = new Set(state.jokers.map(c => c.id));
    return pickRandom(SHOP_JOKER_IDS.filter(id => !owned.has(id)), SHOP_JOKER_SLOTS);
}

function openShop(state: RunState): ShopState {
    return {
        jokerOffers: jokerOffers(state),
        studyOffers: pickRandom(HAND_TYPES, SHOP_STUDY_SLOTS),
        rerollCost: FIRST_REROLL_COST,
    };
}

export function runReducer(state: RunState, action: RunAction): RunState {
    switch (action.type) {

        case 'toggleSelect': {
            if (state.phase !== 'playing') return state;
            if (state.selected.includes(action.cardId)) {
                return { ...state, selected: state.selected.filter(id => id !== action.cardId) };
            }
            if (state.selected.length >= rulesFor(state).maxSelect) return state;
            return { ...state, selected: [...state.selected, action.cardId] };
        }

        case 'clearSelection':
            return { ...state, selected: [] };

        case 'sort':
            return { ...state, sortMode: action.mode };

        case 'play': {
            if (state.phase !== 'playing' || state.handsLeft <= 0) return state;
            const played = selectedCards(state);
            if (played.length === 0 || played.length > rulesFor(state).maxSelect) return state;

            const result = scorePlay(state, played)!;
            const next: RunState = {
                ...state,
                ...replaceCards(state, state.selected),
                selected: [],
                roundScore: state.roundScore + result.score,
                totalScore: state.totalScore + result.score,
                handsLeft: state.handsLeft - 1,
                handsPlayedRun: state.handsPlayedRun + 1,
                bestHand: Math.max(state.bestHand, result.score),
                money: Math.max(0, state.money - (activeBlindRules(state.round, state.blind)?.costPerHand ?? 0)),
                lastPlay: result,
            };

            if (next.roundScore >= next.target) {
                return { ...next, phase: 'roundWon', reward: computeReward(next) };
            }
            if (next.handsLeft === 0 || next.hand.length === 0) {
                return { ...next, phase: 'gameOver' };
            }
            return next;
        }

        case 'discard': {
            if (state.phase !== 'playing' || state.discardsLeft <= 0) return state;
            if (state.selected.length === 0) return state;
            return {
                ...state,
                ...replaceCards(state, state.selected),
                selected: [],
                discardsLeft: state.discardsLeft - 1,
                discardsUsed: state.discardsUsed + 1,
            };
        }

        case 'collectReward': {
            if (state.phase !== 'roundWon' || !state.reward) return state;
            const withMoney = { ...state, money: state.money + state.reward.total };
            return { ...withMoney, phase: 'shop', shop: openShop(withMoney) };
        }

        case 'buyJoker': {
            const id = state.shop?.jokerOffers[action.slot];
            if (state.phase !== 'shop' || !state.shop || !id) return state;
            const joker = JOKERS_BY_ID[id];
            if (state.money < joker.price || state.jokers.length >= MAX_JOKERS) return state;
            const jokerOffersLeft = [...state.shop.jokerOffers];
            jokerOffersLeft[action.slot] = null;
            return {
                ...state,
                money: state.money - joker.price,
                jokers: [...state.jokers, { uid: state.nextUid, id }],
                nextUid: state.nextUid + 1,
                shop: { ...state.shop, jokerOffers: jokerOffersLeft },
            };
        }

        case 'buyStudy': {
            const hand = state.shop?.studyOffers[action.slot];
            if (state.phase !== 'shop' || !state.shop || !hand || state.money < STUDY_PRICE) return state;
            const studyOffersLeft = [...state.shop.studyOffers];
            studyOffersLeft[action.slot] = null;
            return {
                ...state,
                money: state.money - STUDY_PRICE,
                handLevels: { ...state.handLevels, [hand]: state.handLevels[hand] + 1 },
                shop: { ...state.shop, studyOffers: studyOffersLeft },
            };
        }

        case 'sellJoker': {
            if (state.phase !== 'shop') return state;
            const owned = state.jokers.find(c => c.uid === action.uid);
            if (!owned) return state;
            return {
                ...state,
                money: state.money + sellPrice(JOKERS_BY_ID[owned.id]),
                jokers: state.jokers.filter(c => c.uid !== action.uid),
            };
        }

        case 'reroll': {
            if (state.phase !== 'shop' || !state.shop || state.money < state.shop.rerollCost) return state;
            return {
                ...state,
                money: state.money - state.shop.rerollCost,
                shop: { ...state.shop, jokerOffers: jokerOffers(state), rerollCost: state.shop.rerollCost + 1 },
            };
        }

        case 'nextRound': {
            if (state.phase !== 'shop') return state;
            const nextTable = state.round === HIGH_ROLLER;
            return startRound({
                ...state,
                table: nextTable ? state.table + 1 : state.table,
                round: nextTable ? 0 : (state.round + 1) as RoundIndex,
                blind: nextTable ? randomBlind() : state.blind,
            });
        }

        case 'giveUp':
            if (state.phase !== 'playing' && state.phase !== 'shop') return state;
            return { ...state, phase: 'gameOver', gaveUp: true, selected: [] };

        case 'scoreSaved':
            return { ...state, saved: { bestScore: action.bestScore, rank: action.rank } };
    }
}

// Loads a saved run from localStorage, or null if it's missing or from an older version
// (version 1 runs used the old Charm names and are dropped)
export function parseSavedRun(json: string | null): RunState | null {
    if (!json) return null;
    try {
        const state = JSON.parse(json) as RunState;
        return state && state.version === 2 && Array.isArray(state.hand) ? state : null;
    }
    catch {
        return null;
    }
}
