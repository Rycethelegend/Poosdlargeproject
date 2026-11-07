const crypto = require('crypto');
const mongoose = require('mongoose');
const Room = require('../models/room.js');
const rules = require('./rules.js');

// =============================================================================
// Multiplayer API
// =============================================================================
// Rooms live in MongoDB (the Rooms collection, models/room.js). Browsers poll
// POST /api/mp/room about once a second to see the room, and report their run
// with POST /api/mp/report after every hand. Each player's game runs in their own
// browser with the normal runReducer(); the server owns everything shared:
// who's in, the clock, finish order, bonuses and eliminations.
//
// There's no game loop. Whenever a room is read, the rules check whether the
// clock says something should happen (a Table ending, the next one starting) and
// save it. A timer below does the same for rooms nobody is looking at.

const SWEEP_EVERY_MS = 2000;
const MAX_WRITE_ATTEMPTS = 8;
const TOUCH_EVERY_MS = 5000;         // how often a poll updates the player's lastSeen
const OPEN_ROOMS_SHOWN = 20;
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
const CODE_LENGTH = 6;

const REPORT_EVENTS = ['progress', 'finished', 'busted'];

function makeCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_LETTERS[crypto.randomInt(CODE_LETTERS.length)];
    return code;
}

function cleanCode(code) {
    return typeof code === 'string' ? code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
}

// Saves the fields a rule changed, but only if nobody else has written to the
// room since it was read (every write bumps rev). Returns the saved room, or
// null when another request got there first.
function saveIfUnchanged(room, patch) {
    return Room.findOneAndUpdate(
        { _id: room._id, rev: room.rev },
        { $set: patch, $inc: { rev: 1 } },
        { returnDocument: 'after' }
    ).lean();
}

exports.setApp = function (app, { route, fail, requireLogin, users, recordScore }) {

    // Runs being put on the leaderboard right now, so two requests don't both do it
    const savingRuns = new Set();

    // Puts finished runs on the leaderboard (once each; recordScore ignores repeats)
    async function savePendingRuns(room) {
        let changed = false;
        for (const run of rules.pendingSaves(room)) {
            if (savingRuns.has(run.runId)) continue;
            savingRuns.add(run.runId);
            try {
                const saved = await recordScore({ ...run, mode: 'multiplayer' });
                await Room.updateOne(
                    { _id: room._id, players: { $elemMatch: { userId: run.userId, saved: null } } },
                    { $set: { 'players.$.saved': saved }, $inc: { rev: 1 } }
                );
                changed = true;
            }
            catch (e) {
                console.error(`Saving multiplayer run ${run.runId} failed (will retry):`, e.message);
            }
            finally {
                savingRuns.delete(run.runId);
            }
        }
        return changed ? (await Room.findById(room._id).lean()) ?? room : room;
    }

    // Applies whatever the clock says should have happened by now. Returns the
    // up-to-date room, or null if it was deleted.
    async function advance(room) {
        for (let attempt = 0; room && attempt < MAX_WRITE_ATTEMPTS; attempt++) {
            const step = rules.nextTransition(room, new Date());
            if (!step) break;

            if (step.deleteRoom) {
                const { deletedCount } = await Room.deleteOne({ _id: room._id, rev: room.rev });
                if (deletedCount) return null;
            }
            else {
                const saved = await saveIfUnchanged(room, step.patch);
                if (saved) {
                    room = saved;
                    continue; // one change can lead to another (e.g. Table over → tournament over)
                }
            }
            room = await Room.findById(room._id).lean(); // someone else changed it: look again
        }
        return room && savePendingRuns(room);
    }

    async function loadRoom(roomId) {
        const room = await Room.findById(roomId).lean();
        return room && advance(room);
    }

    // Reads the room, lets `change` (a rule) work out the new fields, and saves
    // them. If another request wrote first, it reads the room again and retries.
    // Returns { room, ...whatever change returned } or { error, status }.
    async function updateRoom(roomId, change) {
        let room = await loadRoom(roomId);
        for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
            if (!room) return { status: 404, error: 'That room no longer exists' };

            const result = change(room);
            if (result.error) return result;

            if (result.deleteRoom) {
                const { deletedCount } = await Room.deleteOne({ _id: room._id, rev: room.rev });
                if (deletedCount) return { ...result, room: null };
            }
            else if (!result.patch) {
                return { ...result, room };
            }
            else {
                const saved = await saveIfUnchanged(room, result.patch);
                if (saved) return { ...result, room: await advance(saved) };
            }
            room = await loadRoom(roomId);
        }
        return { status: 503, error: 'The room is busy. Please try again.' };
    }

    // The room this user is playing in (or waiting in), if any
    function currentRoomOf(userId) {
        return Room.findOne(
            { status: { $ne: 'finished' }, players: { $elemMatch: { userId, status: { $in: ['lobby', 'alive'] } } } },
            { code: 1 }
        ).lean();
    }

    function roomIdFrom(req, res) {
        const roomId = req.body.roomId;
        if (typeof roomId !== 'string' || !mongoose.isValidObjectId(roomId)) {
            fail(res, 400, 'roomId is missing or invalid');
            return null;
        }
        return roomId;
    }

    function sendRoom(res, login, room, extra = {}) {
        res.status(200).json({
            room: room ? rules.view(room, new Date()) : null,
            serverNow: new Date(),
            ...extra,
            jwtToken: login.jwtToken,
            error: '',
        });
    }

    async function loggedInUser(login, res) {
        const user = await users.findOne({ _id: login.userId }, { projection: { username: 1 } });
        if (!user) fail(res, 401, 'Your login has expired. Please log in again.');
        return user;
    }

    // ---------------------------------------------------------------------------
    // POST /api/mp/rooms
    // Open rooms anyone can join, and the room this user is already in.
    // incoming: jwtToken
    // outgoing: rooms[{id, code, hostName, players, maxPlayers}], currentRoom {id, code} | null, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/rooms', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;

        const activeSince = new Date(Date.now() - rules.SETTINGS.lobbyTimeoutSec * 1000);
        const [open, current] = await Promise.all([
            Room.find({ status: 'lobby', isPrivate: false, updatedAt: { $gte: activeSince } })
                .sort({ createdAt: -1 })
                .limit(OPEN_ROOMS_SHOWN)
                .lean(),
            currentRoomOf(login.userId),
        ]);

        const rooms = open
            .filter(r => r.players.length < r.settings.maxPlayers)
            .map(r => ({
                id: String(r._id),
                code: r.code,
                hostName: rules.findPlayer(r, r.hostId)?.username ?? r.players[0]?.username ?? '',
                players: r.players.length,
                maxPlayers: r.settings.maxPlayers,
            }));

        res.status(200).json({
            rooms,
            currentRoom: current ? { id: String(current._id), code: current.code } : null,
            jwtToken: login.jwtToken,
            error: '',
        });
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/create
    // Makes a room with this user as the host.
    // incoming: jwtToken, isPrivate (left out of the open rooms list), tzOffset
    // outgoing: room, serverNow, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/create', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;

        const current = await currentRoomOf(login.userId);
        if (current) return fail(res, 409, `You're already in room ${current.code}. Leave it first.`);

        const user = await loggedInUser(login, res);
        if (!user) return;

        const now = new Date();
        const host = rules.newPlayer(login.userId, user.username, req.body.tzOffset, now);

        // Codes are random, so try again in the rare case one is already taken
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const room = await Room.create(rules.newRoom({ code: makeCode(), host, isPrivate: req.body.isPrivate === true, now }));
                return sendRoom(res, login, room.toObject());
            }
            catch (e) {
                if (e.code !== 11000) throw e;
            }
        }
        fail(res, 503, "Couldn't make a room code. Please try again.");
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/join
    // incoming: jwtToken, code, tzOffset
    // outgoing: room, serverNow, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/join', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;

        const code = cleanCode(req.body.code);
        if (code.length !== CODE_LENGTH) return fail(res, 400, `Room codes are ${CODE_LENGTH} letters and numbers`);

        const found = await Room.findOne({ code: code }, { _id: 1, players: 1 }).lean();
        if (!found) return fail(res, 404, 'No room has that code');

        if (!rules.findPlayer(found, login.userId)) {
            const current = await currentRoomOf(login.userId);
            if (current) return fail(res, 409, `You're already in room ${current.code}. Leave it first.`);
        }

        const user = await loggedInUser(login, res);
        if (!user) return;

        const player = rules.newPlayer(login.userId, user.username, req.body.tzOffset, new Date());
        const result = await updateRoom(found._id, room => rules.joinRoom(room, player));
        if (result.error) return fail(res, result.status, result.error);
        sendRoom(res, login, result.room);
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/room
    // Polled by every player about once a second.
    // incoming: jwtToken, roomId
    // outgoing: room (null once deleted), serverNow, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/room', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;
        const roomId = roomIdFrom(req, res);
        if (!roomId) return;

        // "Still here" for the lobby. Not a rev change: it doesn't affect the game.
        const now = new Date();
        await Room.updateOne(
            { _id: roomId, players: { $elemMatch: { userId: login.userId, lastSeen: { $lt: new Date(now - TOUCH_EVERY_MS) } } } },
            { $set: { 'players.$.lastSeen': now } }
        );

        // Someone removed from the lobby (or a deleted room) just gets room: null
        const room = await loadRoom(roomId);
        sendRoom(res, login, room && rules.findPlayer(room, login.userId) ? room : null);
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/start
    // The host starts the tournament. Table 1 begins after a short countdown.
    // incoming: jwtToken, roomId
    // outgoing: room, serverNow, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/start', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;
        const roomId = roomIdFrom(req, res);
        if (!roomId) return;

        const result = await updateRoom(roomId, room => rules.startGame(room, login.userId, new Date()));
        if (result.error) return fail(res, result.status, result.error);
        sendRoom(res, login, result.room);
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/report
    // The player's browser reporting on their run during a Table.
    // event: 'progress' after a hand, 'finished' after clearing the High Roller,
    //        'busted' after missing a target or ending the run.
    // incoming: jwtToken, roomId, table, round, totalScore, event
    // outgoing: accepted, reason, room, serverNow, jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/report', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;
        const roomId = roomIdFrom(req, res);
        if (!roomId) return;

        const { table, round, totalScore, event } = req.body;
        if (!REPORT_EVENTS.includes(event)) return fail(res, 400, `event must be one of: ${REPORT_EVENTS.join(', ')}`);
        if (!Number.isSafeInteger(table) || table < 1) return fail(res, 400, 'table must be a positive whole number');
        if (![0, 1, 2].includes(round)) return fail(res, 400, 'round must be 0, 1 or 2');
        if (!Number.isSafeInteger(totalScore) || totalScore < 0) return fail(res, 400, 'totalScore must be a whole number of chips');

        // Finish order goes by when the report arrived, even if the write has to retry
        const arrived = new Date();
        const result = await updateRoom(roomId, room =>
            rules.applyReport(room, login.userId, { table, round, totalScore, event }, arrived));
        if (result.error) return fail(res, result.status, result.error);
        sendRoom(res, login, result.room, { accepted: result.accepted, reason: result.reason ?? '' });
    }));

    // ---------------------------------------------------------------------------
    // POST /api/mp/leave
    // Leaves the lobby, or forfeits a game in progress (the run is still saved).
    // incoming: jwtToken, roomId
    // outgoing: jwtToken, error
    // ---------------------------------------------------------------------------
    app.post('/api/mp/leave', route(async (req, res) => {
        const login = requireLogin(req, res);
        if (!login) return;
        const roomId = roomIdFrom(req, res);
        if (!roomId) return;

        const result = await updateRoom(roomId, room => rules.leaveRoom(room, login.userId));
        if (result.error && result.status !== 404) return fail(res, result.status, result.error);
        res.status(200).json({ jwtToken: login.jwtToken, error: '' });
    }));

    // ---------------------------------------------------------------------------
    // Timer: moves along rooms nobody is polling (everyone closed the tab, or the
    // last players went quiet), so Tables still end and runs still get saved.
    // ---------------------------------------------------------------------------
    let sweeping = false;
    async function sweep() {
        if (sweeping || mongoose.connection.readyState !== 1) return;
        sweeping = true;
        try {
            const now = new Date();
            const lobbyCutoff = new Date(now - rules.SETTINGS.lobbyTimeoutSec * 1000);
            const due = await Room.find({
                $or: [
                    { status: 'table', deadline: { $lte: now } },
                    { status: 'results', nextTableAt: { $lte: now } },
                    { status: 'lobby', 'players.lastSeen': { $lt: lobbyCutoff } },
                    { players: { $elemMatch: { status: { $in: ['eliminated', 'winner'] }, saved: null } } },
                ],
            }).limit(50).lean();
            for (const room of due) await advance(room);
        }
        catch (e) {
            console.error('Multiplayer timer failed:', e.message);
        }
        finally {
            sweeping = false;
        }
    }
    setInterval(sweep, SWEEP_EVERY_MS).unref();
};