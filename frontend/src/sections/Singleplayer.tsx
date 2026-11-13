import { useCallback, useEffect, useState } from "react";
import GameView, { type SaveStatus } from "../game/GameView";
import { flushPendingScores, queueScore } from "../game/pendingScores";
import { newRun, parseSavedRun, runReducer, type RunAction, type RunState } from "../game/run";
import { ROUNDS } from "../game/rounds";
import { CardFace, ChipStack } from "../game/sprites";
import { getUser } from "../tokenStorage";
import { useOnline, useOnReconnect } from "../useOnline";

// The run in progress is kept on this device so "Go back" or a page reload
// doesn't lose it. Finished scores are saved to the server.
function storageKey(): string {
    return `poosdalatro-run-${getUser()?.userId ?? 'guest'}`;
}

function loadRun(): RunState | null {
    try {
        return parseSavedRun(localStorage.getItem(storageKey()));
    }
    catch {
        return null;
    }
}

const Singleplayer = () => {

    const [state, setState] = useState<RunState | null>(loadRun);
    const [saveError, setSaveError] = useState('');
    // Opening Singleplayer shows the description first, so "Go back" still works
    const [showIntro, setShowIntro] = useState(true);
    const online = useOnline();

    const saveStatus: SaveStatus = state?.phase !== 'gameOver' ? 'idle'
        : state.saved ? 'saved'
        : !online ? 'waiting'
        : saveError ? 'error'
        : 'saving';

    const dispatch = useCallback((action: RunAction) => {
        setState((current) => current && runReducer(current, action));
    }, []);

    useEffect(() => {
        try {
            if (state) localStorage.setItem(storageKey(), JSON.stringify(state));
            else localStorage.removeItem(storageKey());
        }
        catch {
            // Storage full or blocked: the run still works, it just won't survive a reload
        }
    }, [state]);

    // Sends any queued scores (including ones from earlier runs)
    const sendQueued = useCallback(() => {
        if (!navigator.onLine) return;
        flushPendingScores((runId, result) => {
            setState((current) => current && current.runId === runId
                ? runReducer(current, { type: 'scoreSaved', bestScore: result.bestScore, rank: result.rank })
                : current);
        })
            .then(() => setSaveError(''))
            .catch((err) => setSaveError((err as Error).message));
    }, []);

    // Queue the score when a run ends, then try to send it
    const endedRunId = state?.phase === 'gameOver' && !state.saved ? state.runId : null;
    useEffect(() => {
        if (!endedRunId || !state) return;
        queueScore({ runId: state.runId, score: state.totalScore, table: state.table, endedAt: state.endedAt ?? new Date().toISOString() });
        sendQueued();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endedRunId, sendQueued]);

    useEffect(() => { sendQueued(); }, [sendQueued]);
    useOnReconnect(sendQueued);

    function startRun() {
        setSaveError('');
        setState(newRun());
        setShowIntro(false);
    }

    // A run that was left partway through (not one that already ended)
    const unfinished = state && state.phase !== 'gameOver' ? state : null;

    if (showIntro) {
        return (
            <div className="feltPanel p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
                <div className="flex items-end gap-2" aria-hidden>
                    <CardFace card={{ id: 'a', suit: 'spades', rank: 14 }} className="w-14 -rotate-6 rounded-md shadow-md" />
                    <CardFace card={{ id: 'k', suit: 'hearts', rank: 13 }} className="w-14 rounded-md shadow-md" />
                    <ChipStack color="blue" height={3} className="w-10" />
                    <ChipStack color="red" height={2} className="w-10" />
                </div>
                <p className="text-4xl font-semibold">Poosdalatro</p>
                <ul className="text-lg text-left max-w-lg space-y-1 bg-cream/85 rounded-2xl p-4">
                    <li>Play poker hands from your 8 cards. Each hand scores <b>chips × mult</b>.</li>
                    <li>Reach the round's target within 4 hands. You can discard up to 3 times to redraw.</li>
                    <li>
                        A <b>Table</b> is how far into the run you are. Each Table has three rounds: <b>Warm-up</b>,{' '}
                        <b>Main Event</b> and <b>High Roller</b>, each with a bigger target. The High Roller also has
                        a <b>Boss</b> that changes the rules.
                    </li>
                    <li>Beat the High Roller to move on to the next Table, where every target is higher.</li>
                    <li>Spend your winnings in the shop on <b>Jokers</b> and <b>Study Guides</b>.</li>
                    <li>The run ends when you miss a target. Every chip you scored goes on the leaderboard.</li>
                </ul>

                {unfinished ? (
                    <div className="flex flex-col items-center gap-2">
                        <button className="gameButton text-2xl px-8" onClick={() => setShowIntro(false)}>
                            Continue run
                        </button>
                        <p>
                            Table {unfinished.table}, {ROUNDS[unfinished.round].name} · {unfinished.totalScore.toLocaleString()} chips so far
                        </p>
                    </div>
                ) : (
                    <button className="gameButton text-2xl px-8" onClick={startRun}>Start</button>
                )}
            </div>
        );
    }

    if (!state) return null;

    return (
        <GameView
            state={state}
            dispatch={dispatch}
            onNewRun={startRun}
            onGiveUp={() => dispatch({ type: 'giveUp' })}
            saveStatus={saveStatus}
            saveError={saveError}
            onRetrySave={sendQueued}
        />
    );
}

export default Singleplayer;
