import 'dart:math';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/multiplayer/room.dart';

// Wording and numbers for the match screens. Same as the web's matchFormat.ts.

/// 4:05
String clock(int ms) {
  final seconds = max(0, (ms / 1000).ceil());
  return '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
}

/// 1 → "1st", 2 → "2nd", 11 → "11th"
String numberEnding(int n) {
  final v = n % 100;
  if (v >= 11 && v <= 13) return '${n}th';
  return '$n${const {1: 'st', 2: 'nd', 3: 'rd'}[v % 10] ?? 'th'}';
}

/// 0.2 → "20%", 0.001 → "0.1%"
String percent(double fraction) {
  final tenths = (fraction * 1000).round();
  return tenths % 10 == 0 ? '${tenths ~/ 10}%' : '${tenths / 10}%';
}

const Map<Outcome, String> outcomeText = {
  Outcome.passed: 'Made it',
  Outcome.busted: "Missed a round's target",
  Outcome.timeout: "Didn't finish in time",
  Outcome.short: 'Finished below the required score',
  Outcome.left: 'Left the game',
};

/// "Playing Main Event", "Finished 1st", "Out at Table 3"...
String playerStatusText(Room room, RoomPlayer p) {
  if (p.status == PlayerStatus.winner) return 'Winner';
  if (p.status == PlayerStatus.eliminated) {
    return p.outcome == Outcome.left
        ? 'Left at Table ${p.eliminatedAtTable}'
        : 'Out at Table ${p.eliminatedAtTable}';
  }
  if (p.status == PlayerStatus.lobby) return 'In the lobby';
  if (room.status == RoomStatus.results) return 'Made it';
  if (p.tableStatus == TableStatus.finished) {
    return p.place != null ? 'Finished ${numberEnding(p.place!)}' : 'Finished';
  }
  if (p.tableStatus == TableStatus.busted) return 'Busted';
  final round = p.round >= 0 && p.round < rounds.length ? rounds[p.round].name : '';
  return 'Playing $round';
}

/// Bonuses for finishing right now: the next free place, and the seconds left
/// on the clock
({int place, int placeBonus, int timeBonus}) bonusIfFinishedNow(Room room, int now) {
  final place = room.players
          .where((p) =>
              p.status == PlayerStatus.alive &&
              p.tableStatus == TableStatus.finished)
          .length +
      1;
  final secondsLeft = max(0, (room.hardDeadline - now) ~/ 1000);
  final share = place <= room.placeBonus.length ? room.placeBonus[place - 1] : 0.0;
  return (
    place: place,
    placeBonus: (room.requiredScore * share).round(),
    timeBonus:
        (room.requiredScore * room.bonusPerSecondLeft * secondsLeft).round(),
  );
}

/// What the clock box shows, and how full the time bar under it is (0 to 1)
({String label, String value, bool finishWindow, double bar}) matchClock(
    Room room, int now) {
  final onTable = room.status == RoomStatus.table;
  final finishWindow = onTable && room.deadline < room.hardDeadline;

  var label = 'Status';
  var value = room.status == RoomStatus.finished ? 'Over' : '';
  if (onTable && now < room.startsAt) {
    label = 'Starts in';
    value = clock(room.startsAt - now);
  } else if (onTable) {
    label = finishWindow ? 'Finish window' : 'Time left';
    value = clock(room.deadline - now);
  } else if (room.status == RoomStatus.results) {
    label = 'Next table in';
    value = clock(room.nextTableAt - now);
  }

  final bar = onTable && now >= room.startsAt
      ? ((room.deadline - now) / max(1, room.hardDeadline - room.startsAt))
          .clamp(0.0, 1.0)
      : 0.0;
  return (label: label, value: value, finishWindow: finishWindow, bar: bar);
}
