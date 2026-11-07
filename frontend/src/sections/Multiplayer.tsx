import { useState } from "react";
import type { RoomResponse } from "../multiplayerApi";
import { getUser } from "../tokenStorage";
import RoomBrowser from "../multiplayer/RoomBrowser";
import RoomLobby from "../multiplayer/RoomLobby";
import MatchView from "../multiplayer/MatchView";
import { useRoom, useServerNow } from "../multiplayer/useRoom";

// Multiplayer: pick a room, wait in its lobby, then play the tournament.
// The rooms themselves live in MongoDB; see multiplayer/api.js on the server.
const Multiplayer = () => {

    // The room we're in, as the server last described it on joining
    const [entered, setEntered] = useState<RoomResponse | null>(null);

    if (!entered?.room) return <RoomBrowser onEnter={setEntered} />;
    return <RoomScreen key={entered.room.id} entered={entered} onExit={() => setEntered(null)} />;
}

function RoomScreen({ entered, onExit }: { entered: RoomResponse; onExit: () => void }) {
    const { room, gone, error, send, serverTime } = useRoom(entered.room!.id, entered);
    const now = useServerNow(serverTime);
    const myId = getUser()?.userId ?? '';
    const me = room?.players.find(p => p.userId === myId);

    if (gone || (room && !me)) {
        return (
            <div className="feltPanel p-8 flex flex-col items-center gap-4 text-center">
                <p className="text-3xl font-semibold">This room is closed</p>
                <p className="text-lg">It was deleted, or you were removed after being away from the lobby.</p>
                <button className="gameButton text-xl" onClick={onExit}>Back to rooms</button>
            </div>
        );
    }

    if (!room || !me) {
        return <div className="feltPanel p-8 text-center text-2xl">{error || 'Loading the room…'}</div>;
    }

    if (room.status === 'lobby') {
        return <RoomLobby room={room} me={me} send={send} onExit={onExit} />;
    }

    return <MatchView room={room} me={me} now={now} serverTime={serverTime} send={send} onExit={onExit} />;
}

export default Multiplayer;
