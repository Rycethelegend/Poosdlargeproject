import { useState, type ReactNode } from 'react';
import { HANDS } from './hands';
import { HIGH_ROLLER, ROUNDS } from './rounds';
import RoundView from './RoundView';
import ShopView from './ShopView';
import { BossLabel, Stat } from './GamePieces';
import type { RunAction, RunState } from './run';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
    state: RunState;
    dispatch: (a: RunAction) => void;
    onNewRun: () => void;
    onGiveUp: () => void;
    saveStatus: SaveStatus;
    saveError: string;
    onRetrySave: () => void;
    // Multiplayer extras: shown under the HUD, a reason the shop can't move on
    // yet, and different wording for ending the run
    banner?: ReactNode;
    nextLocked?: string;
    giveUpPrompt?: string;
    giveUpLabel?: string;
};

const GameView = ({ state, dispatch, onNewRun, onGiveUp, saveStatus, saveError, onRetrySave, banner, nextLocked, giveUpPrompt, giveUpLabel = 'End run' }: Props) => {
    const [confirmGiveUp, setConfirmGiveUp] = useState(false);
    const round = ROUNDS[state.round];
    const progress = Math.min(100, (state.roundScore / state.target) * 100);

    return (
        <div className="feltPanel p-3 sm:p-5 flex flex-col gap-4">

            {/* HUD */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))] gap-2">
                <Stat label={`Table ${state.table}`} className="col-span-3 sm:col-span-1">{round.name}</Stat>
                <Stat label="Target" chip="red">{state.target.toLocaleString()}</Stat>
                <Stat label="Score" chip="blue">{state.roundScore.toLocaleString()}</Stat>
                <Stat label="Hands">{state.handsLeft}</Stat>
                <Stat label="Discards">{state.discardsLeft}</Stat>
                <Stat label="Money" chip="orange">${state.money}</Stat>
                <Stat label="Run total" chip="black">{state.totalScore.toLocaleString()}</Stat>
            </div>

            {banner}

            {state.phase === 'playing' && (
                <>
                    <div className="h-3 bg-black/20 rounded-full overflow-hidden" aria-hidden>
                        <div className="h-full bg-money transition-[width] duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    {state.round !== HIGH_ROLLER && (
                        <p className="text-sm text-center -mt-2">
                            <BossLabel bossId={state.boss} prefix="This table's High Roller boss:" />
                        </p>
                    )}
                    <RoundView state={state} dispatch={dispatch} />
                </>
            )}

            {state.phase === 'roundWon' && state.reward && (
                <div className="bg-cream/85 rounded-2xl p-5 max-w-md w-full mx-auto flex flex-col gap-2 animate-[popIn_0.35s_ease-out]">
                    <p className="text-3xl font-semibold text-center">Round cleared!</p>
                    <p className="text-center">
                        {state.roundScore.toLocaleString()} / {state.target.toLocaleString()} chips
                    </p>
                    <ul className="text-lg tabular-nums">
                        <li className="flex justify-between"><span>{round.name} reward</span><span>${state.reward.round}</span></li>
                        <li className="flex justify-between"><span>$1 per hand left ({state.reward.handsLeft})</span><span>${state.reward.handsLeft}</span></li>
                        <li className="flex justify-between"><span>Savings ($1 per $10 held, max $3)</span><span>${state.reward.savings}</span></li>
                        {state.reward.jokers > 0 && (
                            <li className="flex justify-between"><span>Jokers</span><span>${state.reward.jokers}</span></li>
                        )}
                        <li className="flex justify-between font-semibold border-t border-black/20 pt-1"><span>Total</span><span>${state.reward.total}</span></li>
                    </ul>
                    <button className="gameButton text-xl mt-2" onClick={() => dispatch({ type: 'collectReward' })}>
                        Collect ${state.reward.total} and go to the shop
                    </button>
                </div>
            )}

            {state.phase === 'shop' && <ShopView state={state} dispatch={dispatch} nextLocked={nextLocked} />}

            {state.phase === 'gameOver' && (
                <div className="bg-cream/85 rounded-2xl p-5 max-w-md w-full mx-auto flex flex-col gap-2 text-center animate-[popIn_0.35s_ease-out]">
                    <p className="text-3xl font-semibold">Run over</p>
                    <p>
                        {state.gaveUp
                            ? 'You ended the run.'
                            : `You needed ${state.target.toLocaleString()} chips and scored ${state.roundScore.toLocaleString()}.`}
                    </p>
                    <p className="text-sm uppercase tracking-wide mt-2">Final score</p>
                    <p className="text-5xl font-semibold tabular-nums">{state.totalScore.toLocaleString()}</p>
                    <p>Reached Table {state.table}, {round.name}</p>
                    {state.lastPlay && <p className="text-sm">Best hand: {state.bestHand.toLocaleString()} chips · Last hand: {HANDS[state.lastPlay.handType].name}</p>}

                    <div className="min-h-12 mt-2">
                        {saveStatus === 'saving' && <p>Saving your score…</p>}
                        {state.saved && (
                            <p className="font-semibold">
                                Saved! Leaderboard rank #{state.saved.rank.toLocaleString()} · Your best: {state.saved.bestScore.toLocaleString()}
                            </p>
                        )}
                        {saveStatus === 'error' && !state.saved && (
                            <div className="formError flex flex-col gap-2">
                                <span>{saveError}</span>
                                <button className="underline" onClick={onRetrySave}>Try again</button>
                            </div>
                        )}
                    </div>

                    <button className="gameButton text-xl" onClick={onNewRun} disabled={!state.saved && saveStatus !== 'error'}>
                        New run
                    </button>
                </div>
            )}

            {(state.phase === 'playing' || state.phase === 'shop') && (
                <div className="flex justify-end">
                    {confirmGiveUp ? (
                        <div className="flex items-center gap-2 bg-cream/85 rounded-2xl px-3 py-1">
                            <span>{giveUpPrompt ?? `End this run and save ${state.totalScore.toLocaleString()} chips?`}</span>
                            <button className="gameButton py-1" onClick={() => { setConfirmGiveUp(false); onGiveUp(); }}>{giveUpLabel}</button>
                            <button className="underline" onClick={() => setConfirmGiveUp(false)}>Keep playing</button>
                        </div>
                    ) : (
                        <button className="text-sm underline underline-offset-4" onClick={() => setConfirmGiveUp(true)}>
                            {giveUpLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default GameView;
