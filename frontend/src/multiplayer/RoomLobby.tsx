import { useState } from 'react';
import { leaveRoom, startRoom, type Room, type RoomPlayer } from '../multiplayerApi';
import { HowItWorks } from './MatchPanels';
import type { SendRoomRequest } from './useRoom';

// The waiting room before the host starts the tournament
const RoomLobby = ({ room, me, send, onExit }: { room: Room; me: RoomPlayer; send: SendRoomRequest; onExit: () => void }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const isHost = room.hostId === me.userId;
    const host = room.players.find(p => p.userId === room.hostId);
    const enoughPlayers = room.players.length >= room.settings.minPlayers;

    async function act(action: () => Promise<unknown>) {
        setBusy(true);
        setError('');
        try {
            await action();
        }
        catch (err) {
            setError((err as Error).message);
        }
        finally {
            setBusy(false);
        }
    }

    function copyCode() {
        navigator.clipboard?.writeText(room.code)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => { });
    }

    return (
        <div className="feltPanel p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-3xl sm:text-4xl font-semibold">{host ? `${host.username}'s room` : 'Room'}</p>
                    <p className="text-lg">{room.isPrivate ? 'Private: share the code to invite people.' : 'Open: anyone can join from the rooms list.'}</p>
                </div>
                <button
                    className="bg-cream/85 hover:bg-cream rounded-2xl px-4 w-full max-w-40 py-2 text-center"
                    onClick={copyCode}
                    title="Copy the room code">
                    <p className="text-sm uppercase tracking-wide">{copied ? 'Copied!' : 'Room code'}</p>
                    <div className="group cursor-pointer text-3xl font-semibold tracking-widest">

                        <span className="inline group-hover:hidden">--- ---</span>

                        <span className="hidden group-hover:inline">{room.code}</span>

                    </div>
                </button>
            </div>

            {error && <p role="alert" className="formError">{error}</p>}

            <div className="bg-cream/85 rounded-2xl overflow-hidden">
                <p className="px-4 py-2 font-semibold text-lg border-b-2 border-felt-edge/40">
                    Players {room.players.length}/{room.settings.maxPlayers}
                </p>
                <ul>
                    {room.players.map((p) => (
                        <li key={p.userId} className={`flex items-center gap-2 px-4 py-2 odd:bg-black/5 ${p.userId === me.userId ? 'font-semibold' : ''}`}>
                            <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-teal' : 'bg-black/30'}`} title={p.connected ? 'Connected' : 'Not connected'} />
                            <span className="truncate">{p.username}{p.userId === me.userId && ' (you)'}</span>
                            {p.userId === room.hostId && <span className="text-sm bg-wood-light rounded-lg px-2">Host</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <details className="bg-cream/85 rounded-2xl p-4" open>
                <summary className="cursor-pointer text-lg font-semibold">How the tournament works</summary>
                <div className="mt-2"><HowItWorks room={room} /></div>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="underline underline-offset-4" disabled={busy} onClick={() => act(async () => { await leaveRoom(room.id); onExit(); })}>
                    Leave room
                </button>
                {isHost ? (
                    <div className="flex items-center gap-3">
                        {!enoughPlayers && <span>Waiting for at least {room.settings.minPlayers} players…</span>}
                        <button className="gameButton text-2xl px-8" disabled={busy || !enoughPlayers} onClick={() => act(() => send(() => startRoom(room.id)))}>
                            Start
                        </button>
                    </div>
                ) : (
                    <p className="text-lg">Waiting for {host?.username ?? 'the host'} to start…</p>
                )}
            </div>
        </div>
    );
}

export default RoomLobby;
