import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import GameView from '../game/GameView';
import { HIGH_ROLLER } from '../game/rounds';
import { newRun, parseSavedRun, runReducer, type RunAction, type RunState } from '../game/run';
import { fetchRoom, leaveRoom, reportRun, type ReportEvent, type Room, type RoomPlayer } from '../multiplayerApi';
import { clock, timeOf } from './matchFormat';
import { FinalStandings, MatchHeader, OutPanel, Scoreboard, TableBanner, TableResults, WaitPanel } from './MatchPanels';
import type { SendRoomRequest } from './useRoom';

// Each player's run is the normal singleplayer game (runReducer), played in this
// browser. This component starts it when Table 1 begins, moves it on to the next
// Table when the server starts one, and reports every hand to the server.

type Props = {
    room: Room;
    me: RoomPlayer;
    now: number;
    serverTime: () => number;
    send: SendRoomRequest;
    onExit: () => void;
};

// Kept on this device so a reload doesn't lose the run
function storageKey(roomId: string, userId: string): string {
    return `poosdalatro-mp-run-${roomId}-${userId}`;
}

function loadRun(key: string): RunState | null {
    try {
        return parseSavedRun(localStorage.getItem(key));
    }
    catch {
        return null;
    }
}

// Where the run should be, given the room: a new run when Table 1 starts, or on
// to the next Table once the server has started it. Otherwise unchanged.
function syncRun(run: RunState | null, room: Room, me: RoomPlayer, now: number): RunState | null {
    if (room.status !== 'table' || now < timeOf(room.startsAt)) return run;
    if (me.status !== 'alive' || me.tableStatus !== 'playing') return run;

    if (!run) return room.table === 1 ? newRun() : null;

    const clearedLastTable = run.table === room.table - 1 && run.round === HIGH_ROLLER
        && (run.phase === 'roundWon' || run.phase === 'shop');
    if (clearedLastTable) {
        const inShop = run.phase === 'roundWon' ? runReducer(run, { type: 'collectReward' }) : run;
        return runReducer(inShop, { type: 'nextRound' });
    }
    return run;
}

function eventFor(run: RunState): ReportEvent {
    if (run.phase === 'gameOver') return 'busted';
    if (run.round === HIGH_ROLLER && (run.phase === 'roundWon' || run.phase === 'shop')) return 'finished';
    return 'progress';
}

// GameView's run-over screen isn't used in multiplayer (the panels below are)
const NO_SAVE = { onNewRun: () => {}, saveStatus: 'idle', saveError: '', onRetrySave: () => {} } as const;

const MatchView = ({ room, me, now, serverTime, send, onExit }: Props) => {
    const key = storageKey(room.id, me.userId);
    const [run, setRun] = useState<RunState | null>(() => loadRun(key));
    const [retryReport, setRetryReport] = useState(0);
    const [error, setError] = useState('');
    const lastReport = useRef('');

    const timeUp = room.status === 'table' && now >= timeOf(room.deadline);
    const frozen = me.status !== 'alive' || me.tableStatus === 'busted' || (me.tableStatus === 'playing' && timeUp);

    // The interval and dispatch below read the latest props from here
    const latest = useRef({ room, me, frozen });
    useEffect(() => {
        latest.current = { room, me, frozen };
    });

    // Start or move on the run when a Table begins (checked a few times a second)
    useEffect(() => {
        const id = setInterval(() => {
            const { room, me } = latest.current;
            setRun(current => syncRun(current, room, me, serverTime()));
        }, 250);
        return () => clearInterval(id);
    }, [serverTime]);

    useEffect(() => {
        try {
            if (run && me.status === 'alive') localStorage.setItem(key, JSON.stringify(run));
            else if (me.status !== 'alive') localStorage.removeItem(key);
        }
        catch {
            // Storage full or blocked: the run still works, it just won't survive a reload
        }
    }, [run, key, me.status]);

    // Tell the server about every hand, the finish, or a bust. A failed report is
    // sent again a second later.
    useEffect(() => {
        if (!run || room.status !== 'table' || run.table !== room.table) return;
        if (me.status !== 'alive' || me.tableStatus !== 'playing') return;

        const report = { table: run.table, round: run.round, totalScore: run.totalScore, event: eventFor(run) };
        const id = JSON.stringify(report);
        if (id === lastReport.current) return;
        lastReport.current = id;
        if (report.event === 'progress' && report.totalScore === me.chips && report.round === me.round) return;

        send(() => reportRun(room.id, report)).catch(() => {
            lastReport.current = '';
            setTimeout(() => setRetryReport(n => n + 1), 1000);
        });
    }, [run, room.id, room.status, room.table, me.status, me.tableStatus, me.chips, me.round, send, retryReport]);

    const dispatch = useCallback((action: RunAction) => {
        setRun((current) => {
            if (!current || latest.current.frozen) return current;
            // The server starts the next Table for everyone at once
            if (action.type === 'nextRound' && current.round === HIGH_ROLLER) return current;
            return runReducer(current, action);
        });
    }, []);

    async function forfeit() {
        setError('');
        try {
            await leaveRoom(room.id);
            await send(() => fetchRoom(room.id));
        }
        catch (err) {
            setError((err as Error).message);
        }
    }

    const lastResult = room.results.at(-1) ?? null;
    const tableStart = me.chips - me.tableChips;  // the run's total when this Table began

    const forfeitProps = {
        onGiveUp: forfeit,
        giveUpLabel: 'Forfeit',
        giveUpPrompt: 'Leave the tournament? Your score so far still goes on the leaderboard.',
    };

    // panels go under the scoreboard; game is the GameView (its own felt panel)
    let panels: ReactNode = null;
    let game: ReactNode = null;

    if (room.status === 'finished') {
        panels = (
            <>
                <FinalStandings room={room} me={me} onExit={onExit} />
                {lastResult && <TableResults result={lastResult} myId={me.userId} />}
            </>
        );
    }
    else if (me.status !== 'alive') {
        panels = (
            <>
                <OutPanel me={me} onExit={onExit} />
                {lastResult && <TableResults result={lastResult} myId={me.userId} />}
            </>
        );
    }
    else if (room.status === 'results') {
        const startsIn = clock(timeOf(room.nextTableAt) - now);
        panels = lastResult && (
            <TableResults
                result={lastResult}
                myId={me.userId}
                footer={<p className="text-center text-lg">You made it! Table {room.table + 1} starts in {startsIn}.</p>}
            />
        );
        if (run && run.phase !== 'gameOver') {
            game = <GameView state={run} dispatch={dispatch} {...NO_SAVE} {...forfeitProps} nextLocked={`Table ${room.table + 1} starts for everyone in ${startsIn}`} />;
        }
    }
    else if (now < timeOf(room.startsAt)) {
        panels = (
            <WaitPanel title={`Table ${room.table} starts in`}>
                <p className="text-6xl font-semibold tabular-nums">{Math.ceil((timeOf(room.startsAt) - now) / 1000)}</p>
            </WaitPanel>
        );
    }
    else if (!run) {
        panels = room.table === 1 ? <WaitPanel title="Dealing…" /> : (
            <WaitPanel title="This run isn't on this device">
                <p>Your run for this tournament was started in another browser. Open it there to keep playing.</p>
                <button className="gameButton text-xl" onClick={forfeit}>Forfeit instead</button>
            </WaitPanel>
        );
    }
    else if (me.tableStatus === 'busted' || run.phase === 'gameOver') {
        panels = (
            <WaitPanel title="You missed the target">
                <p>You needed {run.target.toLocaleString()} chips and scored {run.roundScore.toLocaleString()}, so you're out after this table.</p>
                <p>Waiting for the others to finish…</p>
            </WaitPanel>
        );
    }
    else if (timeUp && me.tableStatus === 'playing') {
        panels = <WaitPanel title="Time's up"><p>The table is being scored…</p></WaitPanel>;
    }
    else {
        game = (
            <GameView
                state={run}
                dispatch={dispatch}
                {...NO_SAVE}
                {...forfeitProps}
                banner={<TableBanner room={room} me={me} tableChips={run.totalScore - tableStart} now={now} />}
                nextLocked={run.round === HIGH_ROLLER ? 'The next table starts for everyone once this one ends' : undefined}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="feltPanel p-3 sm:p-5 flex flex-col gap-4">
                <MatchHeader room={room} now={now} />
                <Scoreboard room={room} myId={me.userId} />
                {error && <p role="alert" className="formError">{error}</p>}
                {panels}
            </div>
            {game}
        </div>
    );
}

export default MatchView;
