# Multiplayer

A score tournament built on Express + MongoDB (Mongoose). No sockets and no game
server: browsers poll the API, and every room is one document in the `Rooms`
collection.

## How it works

1. A player creates a room (public or private) and gets a 6-character code.
   Others join from the open rooms list or with the code. The host presses Start.
2. Everyone plays the same Table at the same time. Each player's run is the normal
   singleplayer game (`runReducer`) running in their browser. After every hand the
   browser sends `POST /api/mp/report` with the run's `totalScore`.
3. Clearing the High Roller round reports `finished`. The first finish shortens the
   clock to `finishWindowSec`. Missing a target reports `busted`.
4. When the clock runs out, or nobody is still playing, the Table is scored on the
   server: placement bonus (1st/2nd), time bonus (seconds left on the Table's clock),
   and `chips this Table + bonuses >= required score`. Everyone else is eliminated
   and their run goes on the Leaderboard straight away.
5. After a short results screen (finished players can keep shopping), the next Table
   starts for everyone. Repeat until one player is left. If everyone left fails the
   same Table, the highest score wins.

## Files

| File | What it does |
| --- | --- |
| `models/room.js` | Mongoose schema for a room, its players and each Table's results |
| `multiplayer/rules.js` | The tournament rules as pure functions (no database) |
| `multiplayer/api.js` | The `/api/mp/...` routes, and a timer for rooms nobody is polling |
| `api.js` | `recordScore()` (shared with `/api/savescore`) and the line that loads the routes |
| `frontend/src/multiplayerApi.ts` | Calls the routes |
| `frontend/src/multiplayer/` | Room list, lobby, match screen, polling hook |
| `frontend/src/sections/Multiplayer.tsx` | The Multiplayer window |

## Routes (all POST, all need `jwtToken`)

| Route | Body | Does |
| --- | --- | --- |
| `/api/mp/rooms` | | Open rooms + the room you're already in |
| `/api/mp/create` | `isPrivate`, `tzOffset` | New room, you're the host |
| `/api/mp/join` | `code`, `tzOffset` | Join a lobby |
| `/api/mp/room` | `roomId` | Polled about once a second |
| `/api/mp/start` | `roomId` | Host only |
| `/api/mp/report` | `roomId`, `table`, `round`, `totalScore`, `event` | `progress`, `finished` or `busted` |
| `/api/mp/leave` | `roomId` | Leave the lobby, or forfeit (your run is still saved) |

## Tuning

All in `multiplayer/rules.js`:

- `SETTINGS`: player limits, countdown, `tableTimeLimitSec` (whole Table),
  `finishWindowSec` (after the first finish), `resultsSec`, lobby timeout.
  For a pure 30-second Table, set `tableTimeLimitSec: 30`.
- `BONUS`: placement bonuses and the per-second time bonus, as a share of the
  Table's required score.
- `REQUIRED_SCALE`: required score = this × the Table's three round targets.
- `TABLE_TARGETS` must match `frontend/src/game/rounds.ts`.

Settings are copied into each room when it's created, so changes only affect
new rooms.

## Things to know

- **Concurrency:** every write to a room bumps its `rev` field and only goes through
  if `rev` hasn't changed since the room was read; otherwise it re-reads and retries.
  That way two players finishing at the same moment can't overwrite each other.
- **Clock:** there's no game loop. Whenever a room is read, the rules check whether
  the clock says a Table should end or start, and save that. A 2-second timer does
  the same for rooms nobody is looking at, so abandoned games still end and save.
- **Leaderboard:** multiplayer runs are saved with `runId` `mp-<roomId>-<userId>`
  and `mode: 'multiplayer'`. The score is chips + bonuses.
- **Trust:** like `/api/savescore`, scores come from the player's browser. The
  server checks they only go up, but can't check the cards themselves.
- **Clean-up:** MongoDB deletes rooms through a TTL index on `expiresAt`: 12 hours
  after creation, or an hour after the tournament ends. Lobby players who stop
  polling for 30 seconds (closed the tab, or left the Multiplayer window) are removed.
- **One room at a time:** you can't create or join a room while you're still in one.
  Opening Multiplayer takes you back to it.
