import { saveScore } from '../scoresApi';
import { getUser } from '../tokenStorage';

// Scores that haven't reached the server yet (e.g. the run ended offline).
// The server ignores a runId it already has, so resending is fine.

export interface PendingScore {
    runId: string;
    score: number;
    table: number;
    endedAt: string;
}

export type SaveResult = { bestScore: number; rank: number };

function storageKey(): string {
    return `poosdalatro-pending-scores-${getUser()?.userId ?? 'guest'}`;
}

export function getPendingScores(): PendingScore[] {
    try {
        const list = JSON.parse(localStorage.getItem(storageKey()) ?? '[]');
        return Array.isArray(list) ? list : [];
    }
    catch {
        return [];
    }
}

function setPendingScores(list: PendingScore[]): void {
    try {
        if (list.length) localStorage.setItem(storageKey(), JSON.stringify(list));
        else localStorage.removeItem(storageKey());
    }
    catch {
        // storage blocked
    }
}

export function queueScore(entry: PendingScore): void {
    const list = getPendingScores();
    if (!list.some(p => p.runId === entry.runId)) setPendingScores([...list, entry]);
}

let flushing: Promise<void> | null = null;

// Sends queued scores oldest first and stops at the first failure
export function flushPendingScores(onSaved?: (runId: string, result: SaveResult) => void): Promise<void> {
    if (flushing) return flushing.then(() => flushPendingScores(onSaved));

    flushing = (async () => {
        for (const entry of getPendingScores()) {
            const result = await saveScore(entry.runId, entry.score, entry.table, entry.endedAt);
            setPendingScores(getPendingScores().filter(p => p.runId !== entry.runId));
            onSaved?.(entry.runId, result);
        }
    })().finally(() => { flushing = null; });

    return flushing;
}
