import 'dart:convert';

// A multiplayer room as the server describes it (multiplayer/rules.js, view()).
// Same shapes as the web's multiplayerApi.ts.

enum RoomStatus { lobby, table, results, finished }

enum PlayerStatus { lobby, alive, eliminated, winner }

enum TableStatus { waiting, playing, finished, busted }

enum Outcome { passed, busted, timeout, short, left }

enum ReportEvent { progress, finished, busted }

// An unknown name (a newer server) falls back instead of crashing
T _named<T extends Enum>(List<T> values, dynamic name, T fallback) {
  for (final value in values) {
    if (value.name == name) return value;
  }
  return fallback;
}

int _int(dynamic n) => (n as num? ?? 0).toInt();

int? _intOrNull(dynamic n) => (n as num?)?.toInt();

// Dates arrive as ISO strings; kept as milliseconds, 0 when there isn't one
int _time(dynamic iso) =>
    DateTime.tryParse('${iso ?? ''}')?.millisecondsSinceEpoch ?? 0;

class RoomPlayer {
  final String userId;
  final String username;
  final PlayerStatus status;
  final TableStatus tableStatus;
  final int round;
  final int chips; // run total, as last reported
  final int bonus; // placement + time bonuses so far
  final int score; // chips + bonus: what the tournament (and leaderboard) uses
  final int tableChips; // chips scored this Table
  final int? place; // finish order this Table
  final Outcome? outcome;
  final int? eliminatedAtTable;
  final int? finalRank;
  final int? leaderboardRank;
  final bool connected;

  RoomPlayer.fromJson(Map<String, dynamic> j)
      : userId = '${j['userId']}',
        username = '${j['username'] ?? ''}',
        status = _named(PlayerStatus.values, j['status'], PlayerStatus.lobby),
        tableStatus =
            _named(TableStatus.values, j['tableStatus'], TableStatus.waiting),
        round = _int(j['round']),
        chips = _int(j['chips']),
        bonus = _int(j['bonus']),
        score = _int(j['score']),
        tableChips = _int(j['tableChips']),
        place = _intOrNull(j['place']),
        outcome = j['outcome'] == null
            ? null
            : _named(Outcome.values, j['outcome'], Outcome.busted),
        eliminatedAtTable = _intOrNull(j['eliminatedAtTable']),
        finalRank = _intOrNull(j['finalRank']),
        leaderboardRank = _intOrNull(j['leaderboardRank']),
        connected = j['connected'] == true;
}

class TableResultEntry {
  final String userId;
  final String username;
  final int? place;
  final Outcome outcome;
  final int tableChips;
  final int placeBonus;
  final int timeBonus;
  final int tableScore;

  TableResultEntry.fromJson(Map<String, dynamic> j)
      : userId = '${j['userId']}',
        username = '${j['username'] ?? ''}',
        place = _intOrNull(j['place']),
        outcome = _named(Outcome.values, j['outcome'], Outcome.busted),
        tableChips = _int(j['tableChips']),
        placeBonus = _int(j['placeBonus']),
        timeBonus = _int(j['timeBonus']),
        tableScore = _int(j['tableScore']);
}

class TableResult {
  final int table;
  final int requiredScore;
  final List<TableResultEntry> entries;

  TableResult.fromJson(Map<String, dynamic> j)
      : table = _int(j['table']),
        requiredScore = _int(j['requiredScore']),
        entries = [
          for (final e in j['entries'] as List? ?? [])
            TableResultEntry.fromJson(Map<String, dynamic>.from(e)),
        ];
}

class RoomSettings {
  final int maxPlayers;
  final int minPlayers;
  final int tableTimeLimitSec;
  final int finishWindowSec;

  RoomSettings.fromJson(Map<String, dynamic> j)
      : maxPlayers = _int(j['maxPlayers']),
        minPlayers = _int(j['minPlayers']),
        tableTimeLimitSec = _int(j['tableTimeLimitSec']),
        finishWindowSec = _int(j['finishWindowSec']);
}

/// One room, as the server describes it. Times are in milliseconds.
class Room {
  final String id;
  final int rev;
  final String code;
  final bool isPrivate;
  final String hostId;
  final RoomStatus status;
  final int table;
  final int requiredScore;
  final int startsAt;
  final int hardDeadline;
  final int deadline;
  final int nextTableAt;
  final RoomSettings settings;
  final List<double> placeBonus; // share of the required score, for 1st and 2nd
  final double bonusPerSecondLeft;
  final List<RoomPlayer> players;
  final List<TableResult> results;

  Room.fromJson(Map<String, dynamic> j)
      : id = '${j['id']}',
        rev = _int(j['rev']),
        code = '${j['code'] ?? ''}',
        isPrivate = j['isPrivate'] == true,
        hostId = '${j['hostId']}',
        status = _named(RoomStatus.values, j['status'], RoomStatus.lobby),
        table = _int(j['table']),
        requiredScore = _int(j['requiredScore']),
        startsAt = _time(j['startsAt']),
        hardDeadline = _time(j['hardDeadline']),
        deadline = _time(j['deadline']),
        nextTableAt = _time(j['nextTableAt']),
        settings =
            RoomSettings.fromJson(Map<String, dynamic>.from(j['settings'] ?? {})),
        placeBonus = [
          for (final share in j['bonus']?['place'] as List? ?? [])
            (share as num).toDouble(),
        ],
        bonusPerSecondLeft =
            (j['bonus']?['perSecondLeft'] as num? ?? 0).toDouble(),
        players = [
          for (final p in j['players'] as List? ?? [])
            RoomPlayer.fromJson(Map<String, dynamic>.from(p)),
        ],
        results = [
          for (final r in j['results'] as List? ?? [])
            TableResult.fromJson(Map<String, dynamic>.from(r)),
        ];

  RoomPlayer? player(String userId) {
    for (final p in players) {
      if (p.userId == userId) return p;
    }
    return null;
  }
}

/// What every room route answers with. room is null once the room is deleted
/// or this player is no longer in it.
class RoomResponse {
  final Room? room;
  final int serverNow;
  // the room exactly as it arrived, to tell whether anything changed
  final String signature;

  RoomResponse.fromJson(Map<String, dynamic> j)
      : room = j['room'] == null
            ? null
            : Room.fromJson(Map<String, dynamic>.from(j['room'])),
        serverNow = _time(j['serverNow']),
        signature = jsonEncode(j['room']);
}

class OpenRoom {
  final String id;
  final String code;
  final String hostName;
  final int players;
  final int maxPlayers;

  OpenRoom.fromJson(Map<String, dynamic> j)
      : id = '${j['id']}',
        code = '${j['code'] ?? ''}',
        hostName = '${j['hostName'] ?? ''}',
        players = _int(j['players']),
        maxPlayers = _int(j['maxPlayers']);
}
