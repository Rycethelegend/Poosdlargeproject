import { useCallback, useEffect, useRef, useState } from "react";
import GameView, { type SaveStatus } from "../game/GameView";
import { newRun, parseSavedRun, runReducer, type RunAction, type RunState } from "../game/run";
import { ROUNDS } from "../game/rounds";
import { CardFace, ChipStack } from "../game/sprites";
import { GAME_TITLE } from "../gameInfo";
import { saveScore } from "../scoresApi";
import { getUser } from "../tokenStorage";

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
    const savingRunId = useRef<string | null>(null);

    // A finished run is "saving" until the server answers or the request fails
    const saveStatus: SaveStatus = state?.phase !== 'gameOver' ? 'idle'
        : state.saved ? 'saved'
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

    // Save the score as soon as a run ends (a failed save waits for "Try again").
    // The ref stops a second request for the same run while one is in flight.
    useEffect(() => {
        if (state?.phase !== 'gameOver' || state.saved || saveError) return;
        if (savingRunId.current === state.runId) return;

        savingRunId.current = state.runId;
        saveScore(state.runId, state.totalScore, state.table)
            .then((result) => dispatch({ type: 'scoreSaved', bestScore: result.bestScore, rank: result.rank }))
            .catch((err) => {
                savingRunId.current = null;
                setSaveError((err as Error).message);
            });
    }, [state, saveError, dispatch]);

    function startRun() {
        setSaveError('');
        setState(newRun());
        setShowIntro(false);
    }

    function retrySave() {
        // Clearing the error lets the effect above send it again
        setSaveError('');
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
                <p className="text-4xl font-semibold">{GAME_TITLE}</p>
                <ul className="text-lg text-left max-w-lg space-y-1 bg-cream/85 rounded-2xl p-4">
                    <li>Play poker hands from your 8 cards. Each hand scores <b>chips × mult</b>.</li>
                    <li>Reach the round's target within 4 hands. You can discard up to 3 times to redraw.</li>
                    <li>
                        A <b>Table</b> is how far into the run you are. Each Table has three rounds: <b>Warm-up</b>,{' '}
                        <b>Main Event</b> and <b>High Roller</b>, each with a bigger target. The High Roller also has
                        a <b>Blind</b> that changes the rules.
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
            onRetrySave={retrySave}
        />
    );
}

export default Singleplayer;
