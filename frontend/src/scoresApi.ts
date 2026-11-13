import { postJson } from './authApi';
import { clearToken, retrieveToken, storeToken } from './tokenStorage';

export interface ScoreEntry {
    score: number;
    table: number;
    date: string;  // ISO timestamp
    day: string;   // "YYYY-MM-DD" in the player's time zone (what search matches)
}

export interface LeaderboardEntry extends ScoreEntry {
    username: string;
}

export interface MyScores {
    username: string;
    bestScore: number;
    gamesPlayed: number;
    scores: ScoreEntry[];
}

// Sends the saved login token along and keeps the refreshed one the server returns.
// An expired login sends the user back to the login page.
export async function postWithLogin<T>(route: string, body: object): Promise<T> {
    try {
        const data = await postJson<T & { jwtToken?: string }>(route, { ...body, jwtToken: retrieveToken() });
        if (data.jwtToken) storeToken(data.jwtToken);
        return data;
    }
    catch (err) {
        if (/login has expired/i.test((err as Error).message)) {
            clearToken();
            window.location.assign('/login');
        }
        throw err;
    }
}

export async function saveScore(runId: string, score: number, table: number, endedAt?: string): Promise<{ bestScore: number; rank: number }> {
    return postWithLogin('api/savescore', { runId, score, table, endedAt, tzOffset: new Date().getTimezoneOffset() });
}

export type ScoreSort = 'date' | 'score';

export async function fetchMyScores(search: string, sort: ScoreSort): Promise<MyScores> {
    return postWithLogin('api/myscores', { search, sort });
}

export async function fetchLeaderboard(search: string): Promise<LeaderboardEntry[]> {
    const { results } = await postWithLogin<{ results: LeaderboardEntry[] }>('api/leaderboard', { search });
    return results;
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
