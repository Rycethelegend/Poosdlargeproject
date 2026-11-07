import { postWithLogin } from './scoresApi';

// Talks to the multiplayer routes in multiplayer/api.js. Field meanings are
// described in multiplayer/rules.js.

export type RoomStatus = 'lobby' | 'table' | 'results' | 'finished';
export type PlayerStatus = 'lobby' | 'alive' | 'eliminated' | 'winner';
export type TableStatus = 'waiting' | 'playing' | 'finished' | 'busted';
export type Outcome = 'busted' | 'timeout' | 'short' | 'left';
export type ReportEvent = 'progress' | 'finished' | 'busted';

export interface RoomPlayer {
    userId: string;
    username: string;
    status: PlayerStatus;
    tableStatus: TableStatus;
    round: number;
    chips: number;            // run total, as last reported
    bonus: number;            // placement + time bonuses so far
    score: number;            // chips + bonus: what the tournament (and leaderboard) uses
    tableChips: number;       // chips scored this Table
    place: number | null;     // finish order this Table
    outcome: Outcome | null;
    eliminatedAtTable: number | null;
    finalRank: number | null;
    leaderboardRank: number | null;
    connected: boolean;
}

export interface TableResultEntry {
    userId: string;
    username: string;
    place: number | null;
    outcome: 'passed' | Outcome;
    tableChips: number;
    placeBonus: number;
    timeBonus: number;
    tableScore: number;
}

export interface TableResult {
    table: number;
    requiredScore: number;
    entries: TableResultEntry[];
    resolvedAt: string;
}

export interface RoomSettings {
    maxPlayers: number;
    minPlayers: number;
    startCountdownSec: number;
    tableTimeLimitSec: number;
    finishWindowSec: number;
    resultsSec: number;
    lobbyTimeoutSec: number;
}

// Dates are ISO strings
export interface Room {
    id: string;
    rev: number;
    code: string;
    isPrivate: boolean;
    hostId: string;
    status: RoomStatus;
    table: number;
    requiredScore: number;
    startsAt: string | null;
    hardDeadline: string | null;
    deadline: string | null;
    nextTableAt: string | null;
    finishedAt: string | null;
    winnerId: string | null;
    settings: RoomSettings;
    bonus: { place: number[]; perSecondLeft: number };
    players: RoomPlayer[];
    results: TableResult[];
}

export interface RoomResponse {
    room: Room | null;
    serverNow: string;
}

export interface ReportResponse extends RoomResponse {
    accepted: boolean;
    reason: string;
}

export interface OpenRoom {
    id: string;
    code: string;
    hostName: string;
    players: number;
    maxPlayers: number;
}

const tzOffset = () => new Date().getTimezoneOffset();

export function listRooms(): Promise<{ rooms: OpenRoom[]; currentRoom: { id: string; code: string } | null }> {
    return postWithLogin('api/mp/rooms', {});
}

export function createRoom(isPrivate: boolean): Promise<RoomResponse> {
    return postWithLogin('api/mp/create', { isPrivate, tzOffset: tzOffset() });
}

export function joinRoom(code: string): Promise<RoomResponse> {
    return postWithLogin('api/mp/join', { code, tzOffset: tzOffset() });
}

export function fetchRoom(roomId: string): Promise<RoomResponse> {
    return postWithLogin('api/mp/room', { roomId });
}

export function startRoom(roomId: string): Promise<RoomResponse> {
    return postWithLogin('api/mp/start', { roomId });
}

export function reportRun(
    roomId: string,
    report: { table: number; round: number; totalScore: number; event: ReportEvent },
): Promise<ReportResponse> {
    return postWithLogin('api/mp/report', { roomId, ...report });
}

export async function leaveRoom(roomId: string): Promise<void> {
    await postWithLogin('api/mp/leave', { roomId });
}
