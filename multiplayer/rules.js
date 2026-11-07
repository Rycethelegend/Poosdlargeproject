// =============================================================================
// Multiplayer tournament rules
// =============================================================================
// Pure functions only. Each one takes a room (a plain object, the way it's stored
// in the Rooms collection) and returns the fields that should change. Nothing in
// this file touches the database, so a whole tournament can be tested without
// one. multiplayer/api.js does the loading and saving.
//
// How a tournament plays out
//   - Everyone plays the same Table at the same time, each on their own run
//     (the normal singleplayer game, running in their browser).
//   - You finish a Table by clearing its High Roller round. Missing a round's
//     target ("busting") or running out of time means you didn't finish.
//   - The 1st and 2nd players to finish get a placement bonus. The moment the
//     first player finishes, everyone else has finishWindowSec seconds left.
//     A Table can never run longer than tableTimeLimitSec in total.
//   - When the clock runs out (or nobody is still playing) the Table is scored.
//     Finishers also get a time bonus for the seconds left on the Table's clock.
//     Chips scored this Table + bonuses must reach the Table's required score.
//     Anyone who didn't finish, or finished short, is eliminated.
//   - Repeat until one player is left. If every remaining player fails the same
//     Table, the one with the highest score wins.

const SETTINGS = {
    maxPlayers: 8,
    minPlayers: 2,
    startCountdownSec: 5,     // "Get ready" before Table 1
    tableTimeLimitSec: 300,   // longest a Table can last (3 rounds + 2 shops)
    finishWindowSec: 30,      // after the first player finishes, the rest get this long
    resultsSec: 15,           // results screen between Tables (finished players can keep shopping)
    lobbyTimeoutSec: 30,      // lobby players who stop checking in this long are removed
};

// Bonuses are a share of the Table's required score, so they stay worth
// something as the targets grow.
const BONUS = {
    place: [0.20, 0.10],      // 1st and 2nd to finish
    perSecondLeft: 0.001,     // per second left on the Table's clock when you finished
};

// A Table's required score = this × the sum of its three round targets
const REQUIRED_SCALE = 1.2;

const ROOM_LIFETIME_SEC = 12 * 60 * 60;    // MongoDB deletes rooms this old on its own
const FINISHED_ROOM_LIFETIME_SEC = 60 * 60; // finished rooms stay viewable for an hour
const CONNECTED_SEC = 10;                   // "connected" dot in the player list

// Same numbers as frontend/src/game/rounds.ts. Keep the two in sync.
const TABLE_TARGETS = [250, 600, 1500, 3500, 8000, 16000, 30000, 55000];
const ROUND_SCALES = [1, 1.5, 2];

function tableBaseTarget(table) {
    if (table <= TABLE_TARGETS.length) return TABLE_TARGETS[table - 1];
    let target = TABLE_TARGETS[TABLE_TARGETS.length - 1];
    for (let t = TABLE_TARGETS.length; t < table; t++) {
        target = Math.round((target * 1.8) / 500) * 500;
    }
    return target;
}

function roundTarget(table, round) {
    return Math.round(tableBaseTarget(table) * ROUND_SCALES[round]);
}

// Chips (plus bonuses) a player needs from one Table to stay in, rounded to 50
function requiredScore(table) {
    const sum = ROUND_SCALES.reduce((total, _, round) => total + roundTarget(table, round), 0);
    return Math.round((sum * REQUIRED_SCALE) / 50) * 50;
}

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function sameId(a, b) {
    return a != null && b != null && String(a) === String(b);
}

function addSeconds(date, seconds) {
    return new Date(date.getTime() + seconds * 1000);
}

function score(player) {
    return player.chips + player.bonus;
}

function findPlayer(room, userId) {
    return room.players.find(p => sameId(p.userId, userId)) ?? null;
}

function replacePlayer(players, updated) {
    return players.map(p => (sameId(p.userId, updated.userId) ? updated : p));
}

function fail(status, error) {
    return { status, error };
}

// The browser's Date.getTimezoneOffset(), kept for the leaderboard's "day" field
function cleanTzOffset(tzOffset) {
    return Number.isInteger(tzOffset) && Math.abs(tzOffset) <= 14 * 60 ? tzOffset : 0;
}

// Players who have finished this Table, fastest first
function finishOrder(room) {
    return room.players
        .filter(p => p.status === 'alive' && p.tableStatus === 'finished')
        .sort((a, b) => a.finishedAt - b.finishedAt);
}

// -----------------------------------------------------------------------------
// Creating, joining and leaving
// -----------------------------------------------------------------------------

function newPlayer(userId, username, tzOffset, now) {
    return {
        userId,
        username,
        tzOffset: cleanTzOffset(tzOffset),
        status: 'lobby',          // lobby → alive → eliminated | winner
        tableStatus: 'waiting',   // during a Table: playing → finished | busted
        round: 0,                 // 0-2, the round they're on (for the scoreboard)
        chips: 0,                 // the run's totalScore, as last reported
        tableStartChips: 0,       // chips when the current Table started
        bonus: 0,                 // placement + time bonuses earned so far
        finishedAt: null,
        outcome: null,            // why they're out: busted | timeout | short | left
        eliminatedAtTable: null,
        finalRank: null,
        saved: null,              // { rank, bestScore } once the run is on the leaderboard
        joinedAt: now,
        lastSeen: now,
    };
}

function newRoom({ code, host, isPrivate, now }) {
    return {
        code,
        hostId: host.userId,
        isPrivate: Boolean(isPrivate),
        status: 'lobby',          // lobby → table ⇄ results → finished
        table: 0,
        startsAt: null,
        hardDeadline: null,       // tableTimeLimitSec after the Table starts
        deadline: null,           // when the Table actually ends (moves earlier once someone finishes)
        nextTableAt: null,
        settings: { ...SETTINGS },
        players: [host],
        results: [],
        winnerId: null,
        finishedAt: null,
        rev: 0,                   // bumped on every write (see saveIfUnchanged in api.js)
        expiresAt: addSeconds(now, ROOM_LIFETIME_SEC),
    };
}

function joinRoom(room, player) {
    if (findPlayer(room, player.userId)) return { patch: null };
    if (room.status !== 'lobby') return fail(409, 'That game has already started');
    if (room.players.length >= room.settings.maxPlayers) return fail(409, 'That room is full');
    return { patch: { players: [...room.players, player] } };
}

function leaveRoom(room, userId) {
    const me = findPlayer(room, userId);
    if (!me) return { patch: null };

    if (room.status === 'lobby') {
        const players = room.players.filter(p => p !== me);
        if (players.length === 0) return { deleteRoom: true };
        const hostId = sameId(room.hostId, userId) ? players[0].userId : room.hostId;
        return { patch: { players, hostId } };
    }

    // Leaving a game in progress forfeits it. The run still goes on the leaderboard.
    if (me.status === 'alive') {
        const left = {
            ...me,
            status: 'eliminated',
            tableStatus: room.status === 'table' ? 'busted' : me.tableStatus,
            outcome: 'left',
            eliminatedAtTable: room.table,
        };
        return { patch: { players: replacePlayer(room.players, left) } };
    }

    return { patch: null };
}

// -----------------------------------------------------------------------------
// Playing
// -----------------------------------------------------------------------------

function startTable(room, table, startsAt) {
    const hardDeadline = addSeconds(startsAt, room.settings.tableTimeLimitSec);
    return {
        status: 'table',
        table,
        startsAt,
        hardDeadline,
        deadline: hardDeadline,
        nextTableAt: null,
        players: room.players.map(p => p.status !== 'alive' ? p : {
            ...p,
            tableStatus: 'playing',
            round: 0,
            tableStartChips: p.chips,
            finishedAt: null,
        }),
    };
}

function startGame(room, userId, now) {
    if (room.status !== 'lobby') return fail(409, 'The game has already started');
    if (!sameId(room.hostId, userId)) return fail(403, 'Only the host can start the game');
    if (room.players.length < room.settings.minPlayers) {
        return fail(400, `You need at least ${room.settings.minPlayers} players to start`);
    }

    const players = room.players.map(p => ({ ...p, status: 'alive', chips: 0, bonus: 0, tableStartChips: 0 }));
    const startsAt = addSeconds(now, room.settings.startCountdownSec);
    return { patch: startTable({ ...room, players }, 1, startsAt) };
}

// A player's browser reporting on their run.
// event: 'progress' (scored a hand), 'finished' (cleared the High Roller) or
// 'busted' (missed a target or ended the run). Returns { accepted, patch }.
function applyReport(room, userId, report, now) {
    const me = findPlayer(room, userId);
    const rejected = (reason) => ({ accepted: false, reason, patch: null });

    if (room.status !== 'table' || room.table !== report.table) return rejected('That table is over');
    if (!me || me.status !== 'alive') return rejected("You're not playing in this game");
    if (me.tableStatus !== 'playing') return rejected('You already finished this table');
    if (now < room.startsAt) return rejected("The table hasn't started yet");
    if (now >= room.deadline) return rejected("Time's up");
    if (report.totalScore < me.chips) return rejected("Your score can't go down");

    const updated = { ...me, chips: report.totalScore, round: report.round };
    const patch = {};

    if (report.event === 'finished') {
        updated.tableStatus = 'finished';
        updated.finishedAt = now;
        // The first finish starts everyone else's countdown
        const windowEnds = addSeconds(now, room.settings.finishWindowSec);
        if (windowEnds < room.deadline) patch.deadline = windowEnds;
    }
    else if (report.event === 'busted') {
        updated.tableStatus = 'busted';
    }
    else if (updated.chips === me.chips && updated.round === me.round) {
        return { accepted: true, patch: null }; // nothing new
    }

    patch.players = replacePlayer(room.players, updated);
    return { accepted: true, patch };
}

// Scores the Table that just ended and decides who goes on
function resolveTable(room, now) {
    const table = room.table;
    const required = requiredScore(table);
    const finishers = finishOrder(room);
    const entries = [];

    let players = room.players.map((p) => {
        if (p.status !== 'alive') {
            // Show players who left during this Table in its results too
            if (p.outcome === 'left' && p.eliminatedAtTable === table) {
                entries.push({
                    userId: p.userId, username: p.username, place: null, outcome: 'left',
                    tableChips: p.chips - p.tableStartChips, placeBonus: 0, timeBonus: 0,
                    tableScore: p.chips - p.tableStartChips,
                });
            }
            return p;
        }

        const tableChips = p.chips - p.tableStartChips;
        const place = finishers.indexOf(p) + 1 || null;
        let placeBonus = 0;
        let timeBonus = 0;
        let outcome;

        if (p.tableStatus === 'finished') {
            const secondsLeft = Math.max(0, Math.floor((room.hardDeadline - p.finishedAt) / 1000));
            placeBonus = Math.round(required * (BONUS.place[place - 1] ?? 0));
            timeBonus = Math.round(required * BONUS.perSecondLeft * secondsLeft);
            outcome = tableChips + placeBonus + timeBonus >= required ? 'passed' : 'short';
        }
        else {
            outcome = p.tableStatus === 'busted' ? 'busted' : 'timeout';
        }

        const tableScore = tableChips + placeBonus + timeBonus;
        entries.push({ userId: p.userId, username: p.username, place, outcome, tableChips, placeBonus, timeBonus, tableScore });

        return {
            ...p,
            bonus: p.bonus + placeBonus + timeBonus,
            tableStatus: 'waiting',
            outcome: outcome === 'passed' ? null : outcome,
        };
    });

    entries.sort((a, b) => (b.outcome === 'passed') - (a.outcome === 'passed') || b.tableScore - a.tableScore);
    const results = [...room.results, { table, requiredScore: required, entries, resolvedAt: now }];

    const contenders = players.filter(p => p.status === 'alive');
    const survivors = contenders.filter(p => p.outcome === null);

    let winnerId = null;
    if (survivors.length === 1) {
        winnerId = survivors[0].userId;
    }
    else if (survivors.length === 0 && contenders.length > 0) {
        // Everyone failed this Table: the highest score wins
        winnerId = [...contenders].sort((a, b) => score(b) - score(a))[0].userId;
    }

    const goesOn = (p) => survivors.length >= 2 && survivors.includes(p);
    players = players.map((p) => {
        if (p.status !== 'alive' || goesOn(p) || sameId(p.userId, winnerId)) return p;
        return { ...p, status: 'eliminated', eliminatedAtTable: table };
    });

    if (survivors.length >= 2) {
        return {
            status: 'results',
            players,
            results,
            nextTableAt: addSeconds(now, room.settings.resultsSec),
        };
    }
    return finishTournament({ ...room, players, results }, winnerId, now);
}

// Final standings: the winner, then whoever lasted longest, then by score
function rankPlayers(players, winnerId) {
    const order = [...players].sort((a, b) => {
        const aWon = sameId(a.userId, winnerId);
        const bWon = sameId(b.userId, winnerId);
        if (aWon !== bWon) return aWon ? -1 : 1;
        const lasted = (b.eliminatedAtTable ?? 0) - (a.eliminatedAtTable ?? 0);
        return lasted || score(b) - score(a);
    });
    return players.map(p => ({ ...p, finalRank: order.indexOf(p) + 1 }));
}

function finishTournament(room, winnerId, now) {
    const players = room.players.map((p) => {
        if (sameId(p.userId, winnerId)) return { ...p, status: 'winner', tableStatus: 'waiting' };
        if (p.status === 'alive') return { ...p, status: 'eliminated', tableStatus: 'waiting', eliminatedAtTable: room.table };
        return p;
    });
    return {
        status: 'finished',
        players: rankPlayers(players, winnerId),
        results: room.results,
        winnerId,
        finishedAt: now,
        nextTableAt: null,
        expiresAt: addSeconds(now, FINISHED_ROOM_LIFETIME_SEC),
    };
}

// What should happen to a room right now, given the time. Called whenever a
// room is read and by a timer in api.js. Returns { patch }, { deleteRoom } or null.
function nextTransition(room, now) {
    const alive = room.players.filter(p => p.status === 'alive');

    switch (room.status) {
        case 'lobby': {
            const cutoff = addSeconds(now, -room.settings.lobbyTimeoutSec);
            const here = room.players.filter(p => p.lastSeen >= cutoff);
            if (here.length === room.players.length) return null;
            if (here.length === 0) return { deleteRoom: true };
            const hostId = here.some(p => sameId(p.userId, room.hostId)) ? room.hostId : here[0].userId;
            return { patch: { players: here, hostId } };
        }

        case 'table': {
            // Everyone else left: the last player standing wins
            if (alive.length <= 1) return { patch: finishTournament(room, alive[0]?.userId ?? null, now) };
            const nobodyPlaying = alive.every(p => p.tableStatus !== 'playing');
            if (now >= room.deadline || nobodyPlaying) return { patch: resolveTable(room, now) };
            return null;
        }

        case 'results': {
            if (alive.length <= 1) return { patch: finishTournament(room, alive[0]?.userId ?? null, now) };
            if (now >= room.nextTableAt) return { patch: startTable(room, room.table + 1, now) };
            return null;
        }

        default:
            return null;
    }
}

// -----------------------------------------------------------------------------
// Leaderboard and what the browser sees
// -----------------------------------------------------------------------------

// Players whose run is over but isn't on the leaderboard yet
function pendingSaves(room) {
    return room.players
        .filter(p => (p.status === 'eliminated' || p.status === 'winner') && !p.saved)
        .map(p => ({
            userId: p.userId,
            username: p.username,
            runId: `mp-${room._id}-${p.userId}`,
            score: score(p),
            table: Math.max(1, p.eliminatedAtTable ?? room.table),
            tzOffset: p.tzOffset,
        }));
}

function playerOrder(room) {
    if (room.status === 'finished') {
        return [...room.players].sort((a, b) => a.finalRank - b.finalRank);
    }
    if (room.status === 'lobby') return room.players;
    const stillIn = (p) => (p.status === 'alive' || p.status === 'winner' ? 1 : 0);
    return [...room.players].sort((a, b) =>
        stillIn(b) - stillIn(a)
        || (b.eliminatedAtTable ?? 0) - (a.eliminatedAtTable ?? 0)
        || score(b) - score(a));
}

// The room as the browser sees it. Ids become strings; dates stay Dates and
// turn into ISO strings in the JSON.
function view(room, now) {
    const finishers = finishOrder(room);
    return {
        id: String(room._id),
        rev: room.rev,            // lets the browser ignore an older answer that arrives late
        code: room.code,
        isPrivate: room.isPrivate,
        hostId: String(room.hostId),
        status: room.status,
        table: room.table,
        requiredScore: requiredScore(Math.max(1, room.table)),
        startsAt: room.startsAt,
        hardDeadline: room.hardDeadline,
        deadline: room.deadline,
        nextTableAt: room.nextTableAt,
        finishedAt: room.finishedAt,
        winnerId: room.winnerId ? String(room.winnerId) : null,
        settings: room.settings,
        bonus: BONUS,
        players: playerOrder(room).map(p => ({
            userId: String(p.userId),
            username: p.username,
            status: p.status,
            tableStatus: p.tableStatus,
            round: p.round,
            chips: p.chips,
            bonus: p.bonus,
            score: score(p),
            tableChips: p.status === 'alive' ? p.chips - p.tableStartChips : 0,
            place: finishers.indexOf(p) + 1 || null,
            outcome: p.outcome,
            eliminatedAtTable: p.eliminatedAtTable,
            finalRank: p.finalRank,
            leaderboardRank: p.saved?.rank ?? null,
            connected: now - p.lastSeen < CONNECTED_SEC * 1000,
        })),
        results: room.results.map(r => ({
            ...r,
            entries: r.entries.map(e => ({ ...e, userId: String(e.userId) })),
        })),
    };
}

module.exports = {
    SETTINGS,
    BONUS,
    REQUIRED_SCALE,
    requiredScore,
    roundTarget,
    sameId,
    findPlayer,
    newPlayer,
    newRoom,
    joinRoom,
    leaveRoom,
    startGame,
    applyReport,
    resolveTable,
    nextTransition,
    pendingSaves,
    view,
};
