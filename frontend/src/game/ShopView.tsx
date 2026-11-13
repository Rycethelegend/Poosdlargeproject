import { JOKERS_BY_ID, MAX_JOKERS, sellPrice } from './jokers';
import { BossLabel, JokerCard, JokerRow } from './GamePieces';
import { HANDS, handValues } from './hands';
import { HIGH_ROLLER, ROUNDS, roundTarget } from './rounds';
import { STUDY_PRICE, type RunAction, type RunState } from './run';

// Between rounds: buy jokers and Study Guides (hand level-ups), sell jokers, reroll.
// nextLocked (multiplayer) replaces the Next round button with a reason to wait.
const ShopView = ({ state, dispatch, nextLocked }: { state: RunState; dispatch: (a: RunAction) => void; nextLocked?: string }) => {
    const shop = state.shop!;
    const jokersFull = state.jokers.length >= MAX_JOKERS;

    // What comes after the shop
    const nextIsNewTable = state.round === HIGH_ROLLER;
    const nextTable = nextIsNewTable ? state.table + 1 : state.table;
    const nextRound = nextIsNewTable ? 0 : state.round + 1;
    const nextBoss = nextRound === HIGH_ROLLER;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-3xl font-semibold">Shop</p>
                <button
                    className="gameButton"
                    disabled={state.money < shop.rerollCost}
                    onClick={() => dispatch({ type: 'reroll' })}>
                    Reroll jokers (${shop.rerollCost})
                </button>
            </div>

            <section>
                <p className="text-lg font-semibold mb-2">Jokers for sale</p>
                <div className="flex flex-wrap gap-3">
                    {shop.jokerOffers.map((id, slot) => {
                        if (!id) {
                            return <div key={slot} className="w-36 sm:w-40 min-h-28 rounded-2xl border-4 border-dashed border-felt-edge grid place-items-center opacity-70">Sold</div>;
                        }
                        const joker = JOKERS_BY_ID[id];
                        const tooPoor = state.money < joker.price;
                        return (
                            <JokerCard
                                key={slot}
                                joker={joker}
                                footer={
                                    <button
                                        className="gameButton py-1 mt-auto"
                                        disabled={tooPoor || jokersFull}
                                        title={jokersFull ? `You can hold ${MAX_JOKERS} jokers. Sell one first.` : undefined}
                                        onClick={() => dispatch({ type: 'buyJoker', slot })}>
                                        Buy ${joker.price}
                                    </button>
                                }
                            />
                        );
                    })}
                </div>
            </section>

            <section>
                <p className="text-lg font-semibold mb-2">Study Guides <span className="font-normal text-base">(level up a poker hand)</span></p>
                <div className="flex flex-wrap gap-3">
                    {shop.studyOffers.map((type, slot) => {
                        if (!type) {
                            return <div key={slot} className="w-44 min-h-24 rounded-2xl border-4 border-dashed border-felt-edge grid place-items-center opacity-70">Sold</div>;
                        }
                        const level = state.handLevels[type];
                        const now = handValues(type, level);
                        const next = handValues(type, level + 1);
                        return (
                            <div key={slot} className="w-44 bg-cream rounded-2xl p-2 flex flex-col gap-1 shadow-md">
                                <p className="font-semibold">{HANDS[type].name}</p>
                                <p className="text-sm">Level {level} → {level + 1}</p>
                                <p className="text-sm tabular-nums">{now.chips} × {now.mult} → {next.chips} × {next.mult}</p>
                                <button
                                    className="gameButton py-1 mt-auto"
                                    disabled={state.money < STUDY_PRICE}
                                    onClick={() => dispatch({ type: 'buyStudy', slot })}>
                                    Buy ${STUDY_PRICE}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="bg-black/15 rounded-2xl p-3">
                <JokerRow
                    jokers={state.jokers}
                    max={MAX_JOKERS}
                    renderFooter={(owned) => (
                        <button className="gameButton py-1 mt-auto" onClick={() => dispatch({ type: 'sellJoker', uid: owned.uid })}>
                            Sell ${sellPrice(JOKERS_BY_ID[owned.id])}
                        </button>
                    )}
                />
            </section>

            <div className="bg-cream/85 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-semibold">Next: Table {nextTable}, {ROUNDS[nextRound].name}</p>
                    <p>Target {roundTarget(nextTable, nextRound as 0 | 1 | 2).toLocaleString()} chips</p>
                    {nextBoss && <p className="text-danger"><BossLabel bossId={state.boss} prefix="Boss" /></p>}
                    {nextIsNewTable && <p className="text-sm opacity-80">The new table's High Roller boss is revealed when you reach it.</p>}
                </div>
                {nextLocked ? (
                    <p className="font-semibold max-w-xs text-right">{nextLocked}</p>
                ) : (
                    <button className="gameButton text-xl" onClick={() => dispatch({ type: 'nextRound' })}>
                        Next round
                    </button>
                )}
            </div>
        </div>
    );
}

export default ShopView;
