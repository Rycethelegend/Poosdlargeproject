import { useEffect, useState, type FormEvent } from 'react';
import { createRoom, fetchRoom, joinRoom, listRooms, type OpenRoom, type RoomResponse } from '../multiplayerApi';

const REFRESH_MS = 3000;

// Create a room, join one by code, or pick an open one. If this user is already
// in a room (say, after a reload), it goes straight back to it.
const RoomBrowser = ({ onEnter }: { onEnter: (res: RoomResponse) => void }) => {
    const [rooms, setRooms] = useState<OpenRoom[] | null>(null);
    const [code, setCode] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        async function load(first: boolean) {
            try {
                const { rooms, currentRoom } = await listRooms();
                if (cancelled) return;
                if (first && currentRoom) {
                    const res = await fetchRoom(currentRoom.id);
                    if (cancelled) return;
                    if (res.room) return onEnter(res);
                }
                setRooms(rooms);
            }
            catch (err) {
                if (!cancelled) setError((err as Error).message);
            }
            if (!cancelled) timer = setTimeout(() => load(false), REFRESH_MS);
        }

        load(true);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [onEnter]);

    async function enter(request: () => Promise<RoomResponse>) {
        setBusy(true);
        setError('');
        try {
            const res = await request();
            if (res.room) onEnter(res);
        }
        catch (err) {
            setError((err as Error).message);
            setBusy(false);
        }
    }

    function submitCode(e: FormEvent) {
        e.preventDefault();
        if (code.trim()) enter(() => joinRoom(code));
    }

    return (
        <div className="feltPanel p-4 sm:p-6 flex flex-col gap-4">
            <div>
                <p className="text-3xl sm:text-4xl font-semibold">Multiplayer</p>
                <p className="text-lg">A score tournament: everyone plays the same tables at once, and the lowest scores drop out until one player is left.</p>
            </div>

            {error && <p role="alert" className="formError">{error}</p>}

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-cream/85 rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-2xl font-semibold">Host a game</p>
                    <label className="flex items-center gap-2 text-lg">
                        <input type="checkbox" className="w-5 h-5 accent-felt-edge" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                        Private (join by code only)
                    </label>
                    <button className="gameButton text-xl mt-auto" disabled={busy} onClick={() => enter(() => createRoom(isPrivate))}>
                        Create room
                    </button>
                </div>

                <form className="bg-cream/85 rounded-2xl p-4 flex flex-col gap-3" onSubmit={submitCode}>
                    <p className="text-2xl font-semibold">Join with a code</p>
                    <input
                        className="feltInput uppercase tracking-widest"
                        aria-label="Room code"
                        placeholder="ABC123"
                        maxLength={6}
                        autoCapitalize="characters"
                        autoComplete="off"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button className="gameButton text-xl" type="submit" disabled={busy || code.trim().length < 6}>Join</button>
                </form>
            </div>

            <div className="bg-cream/85 rounded-2xl overflow-hidden">
                <p className="px-4 py-2 font-semibold text-lg border-b-2 border-felt-edge/40">Open rooms</p>
                {rooms === null ? (
                    <p className="px-4 py-4 text-center">Looking for rooms…</p>
                ) : rooms.length === 0 ? (
                    <p className="px-4 py-4 text-center">No open rooms right now. Create one and invite your friends!</p>
                ) : (
                    <ul>
                        {rooms.map((room) => (
                            <li key={room.id} className="flex items-center justify-between gap-3 px-4 py-2 odd:bg-black/5">
                                <span className="min-w-0">
                                    <span className="font-semibold">{room.hostName}'s room</span>{' '}
                                    <span className="text-sm tracking-widest">{room.code}</span>
                                </span>
                                <span className="flex items-center gap-3 shrink-0">
                                    <span className="tabular-nums">{room.players}/{room.maxPlayers}</span>
                                    <button className="gameButton py-1" disabled={busy} onClick={() => enter(() => joinRoom(room.code))}>Join</button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default RoomBrowser;
