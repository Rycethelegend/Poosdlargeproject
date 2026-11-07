import { ROUNDS } from '../game/rounds';
import type { Outcome, Room, RoomPlayer } from '../multiplayerApi';

// 4:05
export function clock(ms: number): string {

    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// 1 → "1st", 2 → "2nd", 11 → "11th"
export function numberEnding(n: number): string {

    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function timeOf(iso: string | null): number {

    return iso ? Date.parse(iso) : 0;
}

export function percent(fraction: number): string {

    return `${Math.round(fraction * 1000) / 10}%`;
}

export const OUTCOME_TEXT: Record<Outcome | 'passed', string> = {

    passed: 'Made it',
    busted: "Missed a round's target",
    timeout: "Didn't finish in time",
    short: 'Finished below the required score',
    left: 'Left the game',
};

// "Playing Main Event", "Finished 1st", "Out at Table 3"...
export function playerStatusText(room: Room, p: RoomPlayer): string {

    if (p.status === 'winner') return 'Winner';

    if (p.status === 'eliminated') return p.outcome === 'left' ? `Left at Table ${p.eliminatedAtTable}` : `Out at Table ${p.eliminatedAtTable}`;

    if (p.status === 'lobby') return 'In the lobby';

    if (room.status === 'results') return 'Made it';

    if (p.tableStatus === 'finished') return p.place ? `Finished ${numberEnding(p.place)}` : 'Finished';

    if (p.tableStatus === 'busted') return 'Busted';

    return `Playing ${ROUNDS[p.round]?.name ?? ''}`;
}

// Bonuses for finishing right now: the next free place, and seconds left on the clock
export function bonusIfFinishedNow(room: Room, now: number): { place: number; placeBonus: number; timeBonus: number } {

    const place = room.players.filter(p => p.status === 'alive' && p.tableStatus === 'finished').length + 1;

    const secondsLeft = Math.max(0, Math.floor((timeOf(room.hardDeadline) - now) / 1000));

    return {

        place,
        placeBonus: Math.round(room.requiredScore * (room.bonus.place[place - 1] ?? 0)),
        timeBonus: Math.round(room.requiredScore * room.bonus.perSecondLeft * secondsLeft),
    };
}