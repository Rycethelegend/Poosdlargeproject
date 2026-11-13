import type { ReactNode } from 'react';
import { Stat } from '../game/GamePieces';
import type { Room, RoomPlayer, TableResult } from '../multiplayerApi';
import { bonusIfFinishedNow, clock, numberEnding, OUTCOME_TEXT, percent, playerStatusText, timeOf } from './matchFormat';


export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {

    return <div className={`bg-cream/85 rounded-2xl p-4 sm:p-5 ${className}`}>{children}</div>;
}


// The tournament rules, with this room's numbers
export function HowItWorks({ room }: { room: Room }) {

    const { settings, bonus } = room;

    return (
        <ul className="text-lg text-left space-y-1">
            <li>Everyone plays the same <b>Table</b> at the same time, each on their own run. Clear all three rounds to finish it.</li>
            <li>
                Each Table has a <b>{clock(settings.tableTimeLimitSec * 1000)}</b> clock. Once the first player
                finishes, everyone else has <b>{settings.finishWindowSec} seconds</b> left.
            </li>
            <li>
                The 1st and 2nd to finish get <b>+{percent(bonus.place[0] ?? 0)}</b> and <b>+{percent(bonus.place[1] ?? 0)}</b> of
                the required score. Finishers also get <b>+{percent(bonus.perSecondLeft)}</b> for every second left on the clock.
            </li>
            <li>
                When the Table ends, the chips you scored on it plus your bonuses must reach its <b>required score</b>.
                Didn't finish, missed a round's target or fell short? You're out.
            </li>
            <li>Last player standing wins. If everyone left fails the same Table, the highest score wins.</li>
            <li>Your final score (chips + bonuses) goes on the leaderboard.</li>
        </ul>
    );
}


// Table, required score, players left and the clock
export function MatchHeader({ room, now }: { room: Room; now: number }) {

    const stillIn = room.players.filter(p => p.status === 'alive' || p.status === 'winner').length;
    const start = timeOf(room.startsAt);
    const deadline = timeOf(room.deadline);
    const hard = timeOf(room.hardDeadline);
    const finishWindow = room.status === 'table' && deadline < hard;

    let label = 'Status';
    let value = room.status === 'finished' ? 'Over' : '';

    if (room.status === 'table' && now < start) {

        label = 'Starts in';
        value = clock(start - now);
    }
    else if (room.status === 'table') {

        label = finishWindow ? 'Finish window' : 'Time left';
        value = clock(deadline - now);
    }
    else if (room.status === 'results') {

        label = 'Next table in';
        value = clock(timeOf(room.nextTableAt) - now);
    }

    const timeBar = room.status === 'table' && now >= start ? Math.max(0, Math.min(100, ((deadline - now) / Math.max(1, hard - start)) * 100)) : 0;

    return (
        <div className="flex flex-col gap-2">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label={`Room ${room.code}`}>{room.status === 'finished' ? 'Final' : `Table ${room.table}`}</Stat>
                <Stat label="Required" chip="red">{room.requiredScore.toLocaleString()}</Stat>
                <Stat label="Players left">{stillIn} / {room.players.length}</Stat>
                <Stat label={label} className={finishWindow ? 'bg-danger! text-[#f2e8cf]' : ''}>{value}</Stat>
            </div>

            {room.status === 'table' && (
                <div className="h-3 bg-black/20 rounded-full overflow-hidden" aria-hidden>
                    <div
                        className={`h-full transition-[width] duration-300 ${finishWindow ? 'bg-danger' : 'bg-money'}`}
                        style={{ width: `${timeBar}%` }} />
                </div>
            )}
        </div>
    );
}


const SCOREBOARD_COLUMNS = 'grid grid-cols-[1.5rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_11rem_6rem_6rem] gap-x-3';
export function Scoreboard({ room, myId }: { room: Room; myId: string }) {

    return (

        <div className="bg-cream/85 rounded-2xl overflow-hidden">

            <div className={`${SCOREBOARD_COLUMNS} px-3 py-1.5 text-sm font-semibold border-b-2 border-felt-edge/40`}>
                <span>#</span>
                <span>Player</span>
                <span className="hidden sm:block">Status</span>
                <span className="text-right"><span className="sm:hidden">Table</span><span className="hidden sm:inline">This table</span></span>
                <span className="text-right">Score</span>
            </div>

            <ol>
                {room.players.map((p, i) => (
                    <li
                        key={p.userId}
                        className={`${SCOREBOARD_COLUMNS} px-3 py-1.5 items-center odd:bg-black/5 ${p.userId === myId ? 'font-semibold bg-wood-light/50!' : ''} ${p.status === 'eliminated' ? 'opacity-60' : ''}`}>
                        <span className="tabular-nums">{p.finalRank ?? i + 1}</span>
                        <span className="min-w-0">
                            <span className="flex items-center gap-2 min-w-0">
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${p.connected ? 'bg-teal' : 'bg-black/30'}`}
                                    title={p.connected ? 'Connected' : 'Not connected'} />
                                <span className="truncate">{p.username}{p.userId === myId && ' (you)'}</span>
                            </span>
                            <span className="sm:hidden block text-xs font-normal truncate">{playerStatusText(room, p)}</span>
                        </span>
                        <span className="hidden sm:block truncate">{playerStatusText(room, p)}</span>
                        <span className="text-right tabular-nums">{p.status === 'alive' ? p.tableChips.toLocaleString() : '–'}</span>
                        <span className="text-right tabular-nums">{p.score.toLocaleString()}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}


// Under the game HUD: how this player is doing against the required score
export function TableBanner({ room, me, tableChips, now }: { room: Room; me: RoomPlayer; tableChips: number; now: number }) {

    const required = room.requiredScore;
    const fill = Math.min(100, (tableChips / required) * 100);

    let line: ReactNode;

    if (me.tableStatus === 'finished') {

        line = <>You finished <b>{numberEnding(me.place ?? 1)}</b>! Shop while the others finish. Bonuses are added when the table ends.</>;
    }
    else {

        const { place, placeBonus, timeBonus } = bonusIfFinishedNow(room, now);
        const withBonuses = tableChips + placeBonus + timeBonus;
        line = (
            <>
                Finish now ({numberEnding(place)}): {placeBonus > 0 && <>+{placeBonus.toLocaleString()} place, </>}
                +{timeBonus.toLocaleString()} time → <b>{withBonuses.toLocaleString()}</b>
                {withBonuses >= required ? ', enough to stay in' : `, ${(required - withBonuses).toLocaleString()} short`}
            </>
        );
    }

    return (
        <div className="bg-cream/85 rounded-2xl px-4 py-2 flex flex-col gap-1">

            <div className="flex flex-wrap justify-between gap-x-4">
                <span>This table: <b className="tabular-nums">{tableChips.toLocaleString()}</b> / {required.toLocaleString()} required</span>
                <span>{line}</span>
            </div>

            <div className="h-2 bg-black/15 rounded-full overflow-hidden" aria-hidden>
                <div className="h-full bg-chips transition-[width] duration-500" style={{ width: `${fill}%` }} />
            </div>

        </div>
    );
}


export function TableResults({ result, myId, footer }: { result: TableResult; myId: string; footer?: ReactNode }) {

    return (

        <Panel className="flex flex-col gap-2 animate-[popIn_0.35s_ease-out]">

            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-2xl font-semibold">Table {result.table} results</p>
                <p>Required: <b>{result.requiredScore.toLocaleString()}</b></p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left tabular-nums">

                    <thead>
                        <tr className="text-sm border-b-2 border-felt-edge/40">
                            <th className="py-1 pr-2">Player</th>
                            <th className="py-1 px-2 text-right">Chips</th>
                            <th className="py-1 px-2 text-right">Place</th>
                            <th className="py-1 px-2 text-right">Time</th>
                            <th className="py-1 px-2 text-right">Total</th>
                            <th className="py-1 pl-2">Result</th>
                        </tr>
                    </thead>

                    <tbody>
                        {result.entries.map((e) => (
                            <tr key={e.userId} className={`odd:bg-black/5 ${e.userId === myId ? 'font-semibold' : ''}`}>
                                <td className="py-1 pr-2">{e.username}{e.place && <span className="text-sm"> ({numberEnding(e.place)})</span>}</td>
                                <td className="py-1 px-2 text-right">{e.tableChips.toLocaleString()}</td>
                                <td className="py-1 px-2 text-right">{e.placeBonus ? `+${e.placeBonus.toLocaleString()}` : '–'}</td>
                                <td className="py-1 px-2 text-right">{e.timeBonus ? `+${e.timeBonus.toLocaleString()}` : '–'}</td>
                                <td className="py-1 px-2 text-right font-semibold">{e.tableScore.toLocaleString()}</td>
                                <td className={`py-1 pl-2 ${e.outcome === 'passed' ? '' : 'text-danger'}`}>{OUTCOME_TEXT[e.outcome]}</td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
            {footer}
        </Panel>
    );
}


export function FinalStandings({ room, me, onExit }: { room: Room; me: RoomPlayer; onExit: () => void }) {

    const winner = room.players.find(p => p.status === 'winner');

    const headline = !winner ? 'No winner' : winner.userId === me.userId ? 'You won!' : `${winner.username} wins!`;

    return (

        <Panel className="flex flex-col gap-2 text-center animate-[popIn_0.35s_ease-out]">

            <p className="text-sm uppercase tracking-wide">Tournament over</p>
            <p className="text-4xl font-semibold">{headline}</p>
            <p>
                You placed <b>{numberEnding(me.finalRank ?? room.players.length)}</b> with{' '}
                <b>{me.score.toLocaleString()}</b> ({me.chips.toLocaleString()} chips + {me.bonus.toLocaleString()} bonus).
            </p>
            <p>{me.leaderboardRank ? `Saved! Leaderboard rank #${me.leaderboardRank.toLocaleString()}` : 'Saving your score…'}</p>
            <button className="gameButton text-xl self-center mt-2" onClick={onExit}>Back to rooms</button>

        </Panel>
    );
}


// Shown to a player who has been knocked out while the others play on
export function OutPanel({ me, onExit }: { me: RoomPlayer; onExit: () => void }) {

    return (

        <Panel className="flex flex-col gap-1 text-center animate-[popIn_0.35s_ease-out]">

            <p className="text-3xl font-semibold">{me.outcome === 'left' ? 'You left the game' : "You're out"}</p>
            {me.outcome && me.outcome !== 'left' && <p>{OUTCOME_TEXT[me.outcome]} at Table {me.eliminatedAtTable}.</p>}
            <p className="text-sm uppercase tracking-wide mt-2">Final score</p>
            <p className="text-5xl font-semibold tabular-nums">{me.score.toLocaleString()}</p>
            <p className="text-sm">{me.chips.toLocaleString()} chips + {me.bonus.toLocaleString()} bonus</p>
            <p className="mt-1">{me.leaderboardRank ? `Saved! Leaderboard rank #${me.leaderboardRank.toLocaleString()}` : 'Saving your score…'}</p>
            <p className="text-sm mt-2">You can keep watching the others, or leave.</p>
            <button className="gameButton text-xl self-center mt-1" onClick={onExit}>Leave room</button>

        </Panel>
    );
}

export function WaitPanel({ title, children }: { title: string; children?: ReactNode }) {

    return (
        
        <Panel className="flex flex-col gap-2 items-center text-center animate-[popIn_0.35s_ease-out]">
            <p className="text-3xl font-semibold">{title}</p>
            {children}
        </Panel>
    );
}