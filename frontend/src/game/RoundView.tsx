import { useMemo } from 'react';
import { sortCards } from './cards';
import { MAX_JOKERS } from './jokers';
import { formatMult, stepText } from './format';
import { BlindLabel, JokerRow, ChipsTimesMult } from './GamePieces';
import { HANDS } from './hands';
import { rulesFor, scorePlay, selectedCards, type RunAction, type RunState } from './run';
import { CardFace, DeckBox } from './sprites';

// The playing phase: hand of cards, Play / Discard, and what the last hand scored
const RoundView = ({ state, dispatch }: { state: RunState; dispatch: (a: RunAction) => void }) => {
    const rules = rulesFor(state);
    const selected = selectedCards(state);
    const preview = useMemo(() => scorePlay(state, selected), [state, selected]);
    const hand = sortCards(state.hand, state.sortMode);
    const last = state.lastPlay;

    return (
        <div className="flex flex-col gap-4">

            {rules.activeBlind && (
                <div className="bg-danger text-[#f2e8cf] rounded-2xl px-4 py-2 text-center">
                    <BlindLabel blindId={rules.activeBlind} prefix="Blind" />
                </div>
            )}

            <JokerRow jokers={state.jokers} max={MAX_JOKERS} />

            {/* Live preview of the selected cards, or the result of the last hand */}
            <div className="bg-black/15 rounded-2xl p-3 min-h-28 flex flex-col items-center justify-center gap-2 text-center">
                {preview ? (
                    <>
                        <p className="text-xl font-semibold">
                            {HANDS[preview.handType].name} <span className="opacity-70 text-base">level {preview.level}</span>
                        </p>
                        <ChipsTimesMult chips={preview.chips} mult={preview.mult} big />
                        <p className="text-lg">= <span className="font-semibold">{preview.score.toLocaleString()}</span> chips</p>
                    </>
                ) : last ? (
                    <div key={state.handsPlayedRun} className="animate-[popIn_0.35s_ease-out] w-full">
                        <p className="text-lg">
                            Last hand: <span className="font-semibold">{HANDS[last.handType].name}</span> scored{' '}
                            <span className="font-semibold">{last.score.toLocaleString()}</span>
                        </p>
                        <details className="mt-1 text-left max-w-md mx-auto">
                            <summary className="cursor-pointer text-center text-sm underline underline-offset-4">How it scored</summary>
                            <ul className="mt-1 text-sm space-y-0.5">
                                {last.steps.map((step, i) => (
                                    <li key={i} className="flex justify-between gap-4">
                                        <span>{step.source}</span><span className="tabular-nums">{stepText(step)}</span>
                                    </li>
                                ))}
                                <li className="flex justify-between gap-4 font-semibold border-t border-black/20 pt-1">
                                    <span>Total</span>
                                    <span className="tabular-nums">{last.chips.toLocaleString()} × {formatMult(last.mult)}</span>
                                </li>
                            </ul>
                        </details>
                    </div>
                ) : (
                    <p className="text-lg">Pick up to {rules.maxSelect} cards to make a poker hand.</p>
                )}
            </div>

            {/* The hand */}
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 pt-4">
                {hand.map((card) => {
                    const isSelected = state.selected.includes(card.id);
                    return (
                        <button
                            key={card.id}
                            aria-pressed={isSelected}
                            onClick={() => dispatch({ type: 'toggleSelect', cardId: card.id })}
                            className={`rounded-md transition-transform duration-150 focus-visible:outline-4 focus-visible:outline-wood ${isSelected ? '-translate-y-4 ring-4 ring-money' : 'hover:-translate-y-1'}`}>
                            <CardFace card={card} className="w-[clamp(2.6rem,10vw,5.5rem)] rounded-md shadow-md" />
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                    className="gameButton text-xl bg-chips! text-white hover:brightness-110"
                    disabled={selected.length === 0}
                    onClick={() => dispatch({ type: 'play' })}>
                    Play Hand
                </button>
                <button
                    className="gameButton text-xl bg-mult! text-white hover:brightness-110"
                    disabled={selected.length === 0 || state.discardsLeft === 0}
                    onClick={() => dispatch({ type: 'discard' })}>
                    Discard ({state.discardsLeft})
                </button>
                <div className="flex rounded-2xl overflow-hidden" role="group" aria-label="Sort hand">
                    {(['rank', 'suit'] as const).map((mode) => (
                        <button
                            key={mode}
                            aria-pressed={state.sortMode === mode}
                            className={`px-3 py-2 font-semibold ${state.sortMode === mode ? 'bg-wood' : 'bg-wood-light hover:bg-wood'}`}
                            onClick={() => dispatch({ type: 'sort', mode })}>
                            Sort {mode}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1" title="Cards left in the deck">
                    <DeckBox className="w-9" />
                    <span className="font-semibold tabular-nums">{state.drawPile.length}</span>
                </div>
            </div>
        </div>
    );
}

export default RoundView;
