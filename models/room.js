const mongoose = require('mongoose');
const { Schema } = mongoose;

// A multiplayer room. Everything about a tournament lives in this one document:
// who's in it, which Table they're on, the clock, and every Table's results.
// Field meanings are described in multiplayer/rules.js (newRoom / newPlayer).

const SavedRunSchema = new Schema({

    rank: Number,
    bestScore: Number,

}, { _id: false });


const PlayerSchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    tzOffset: { type: Number, default: 0 },
    status: { type: String, enum: ['lobby', 'alive', 'eliminated', 'winner'], default: 'lobby' },
    tableStatus: { type: String, enum: ['waiting', 'playing', 'finished', 'busted'], default: 'waiting' },
    round: { type: Number, default: 0 },
    chips: { type: Number, default: 0 },
    tableStartChips: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    finishedAt: { type: Date, default: null },
    outcome: { type: String, enum: [null, 'busted', 'timeout', 'short', 'left'], default: null },
    eliminatedAtTable: { type: Number, default: null },
    finalRank: { type: Number, default: null },
    saved: { type: SavedRunSchema, default: null },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },

}, { _id: false });


const ResultEntrySchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true },
    username: String,
    place: { type: Number, default: null },
    outcome: { type: String, enum: ['passed', 'busted', 'timeout', 'short', 'left'] },
    tableChips: Number,
    placeBonus: Number,
    timeBonus: Number,
    tableScore: Number,

}, { _id: false });


const TableResultSchema = new Schema({

    table: Number,
    requiredScore: Number,
    entries: [ResultEntrySchema],
    resolvedAt: Date,

}, { _id: false });


const SettingsSchema = new Schema({

    maxPlayers: Number,
    minPlayers: Number,
    startCountdownSec: Number,
    tableTimeLimitSec: Number,
    finishWindowSec: Number,
    resultsSec: Number,
    lobbyTimeoutSec: Number,

}, { _id: false });


const RoomSchema = new Schema({

    code: { type: String, required: true, unique: true },
    hostId: { type: Schema.Types.ObjectId, required: true },
    isPrivate: { type: Boolean, default: false },
    status: { type: String, enum: ['lobby', 'table', 'results', 'finished'], default: 'lobby' },
    table: { type: Number, default: 0 },
    startsAt: { type: Date, default: null },
    hardDeadline: { type: Date, default: null },
    deadline: { type: Date, default: null },
    nextTableAt: { type: Date, default: null },
    settings: { type: SettingsSchema, required: true },
    players: { type: [PlayerSchema], default: [] },
    results: { type: [TableResultSchema], default: [] },
    winnerId: { type: Schema.Types.ObjectId, default: null },
    finishedAt: { type: Date, default: null },
    // Bumped by every write. A write only goes through if rev hasn't changed since
    // the room was read, so two requests can't overwrite each other's changes.
    rev: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },

}, { collection: 'Rooms', timestamps: true });


// MongoDB deletes rooms on its own once expiresAt passes
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Open rooms list
RoomSchema.index({ status: 1, isPrivate: 1, createdAt: -1 });

// "Which room am I in?"
RoomSchema.index({ 'players.userId': 1, status: 1 });

// The timer in multiplayer/api.js looking for Tables whose clock ran out
RoomSchema.index({ status: 1, deadline: 1 });
RoomSchema.index({ status: 1, nextTableAt: 1 });

module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);