import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRoom, type Room, type RoomResponse, type RoomStatus } from '../multiplayerApi';

// How often to ask the server for the room
const POLL_MS: Record<RoomStatus, number> = { lobby: 2000, table: 1000, results: 1000, finished: 5000 };

export type SendRoomRequest = <T extends RoomResponse>(request: () => Promise<T>) => Promise<T>;

// Keeps a room up to date by polling the server, and keeps a clock in step with
// the server's so every player sees the same countdown.
//   room       - latest room (null until the first answer, or once it's gone)
//   gone       - the room was deleted, or this user is no longer in it
//   send       - wraps any request that answers with a room (start, report...)
//                so its answer updates the room straight away
//   serverTime - the server's current time in ms
export function useRoom(roomId: string, initial: RoomResponse | null) {
    const [room, setRoom] = useState<Room | null>(initial?.room ?? null);
    const [gone, setGone] = useState(false);
    const [error, setError] = useState('');
    const offset = useRef(0);          // server clock minus this computer's clock
    const latestRev = useRef(-1);      // answers can arrive out of order; keep the newest
    const pollEvery = useRef(POLL_MS[initial?.room?.status ?? 'lobby']);
    const stopped = useRef(false);

    useEffect(() => {
        if (initial) offset.current = Date.parse(initial.serverNow) - Date.now();
    }, [initial]);

    const apply = useCallback((res: RoomResponse, sentAt: number) => {
        // Halfway between sending and receiving is the best guess for "serverNow"
        offset.current = Date.parse(res.serverNow) - (sentAt + Date.now()) / 2;
        if (!res.room) {
            stopped.current = true;
            setGone(true);
            setRoom(null);
            return;
        }
        if (res.room.rev < latestRev.current) return;
        latestRev.current = res.room.rev;
        pollEvery.current = POLL_MS[res.room.status];
        setRoom(res.room);
    }, []);

    const send: SendRoomRequest = useCallback(async (request) => {
        const sentAt = Date.now();
        const res = await request();
        apply(res, sentAt);
        return res;
    }, [apply]);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        async function poll() {
            try {
                await send(() => fetchRoom(roomId));
                if (!cancelled) setError('');
            }
            catch (err) {
                if (!cancelled) setError((err as Error).message);
            }
            if (!cancelled && !stopped.current) timer = setTimeout(poll, pollEvery.current);
        }

        poll();
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [roomId, send]);

    const serverTime = useCallback(() => Date.now() + offset.current, []);

    return { room, gone, error, send, serverTime };
}

// The server's time, updated a few times a second (for countdowns)
export function useServerNow(serverTime: () => number, everyMs = 250): number {
    const [now, setNow] = useState(serverTime);
    useEffect(() => {
        const id = setInterval(() => setNow(serverTime()), everyMs);
        return () => clearInterval(id);
    }, [serverTime, everyMs]);
    return now;
}
