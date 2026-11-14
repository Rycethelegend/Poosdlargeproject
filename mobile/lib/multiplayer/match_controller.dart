import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/multiplayer/room_controller.dart';
import 'package:poosdalatro/utils/multiplayer_api.dart';
import 'package:poosdalatro/utils/scores_api.dart';

/// What the server should hear about a run: 'busted' after missing a target,
/// 'finished' after clearing the High Roller, otherwise 'progress'
ReportEvent eventFor(RunState run) {
  if (run.phase == Phase.gameOver) return ReportEvent.busted;
  if (run.round == highRoller &&
      (run.phase == Phase.roundWon || run.phase == Phase.shop)) {
    return ReportEvent.finished;
  }
  return ReportEvent.progress;
}

/// One player's side of a tournament. Each player's run is the normal
/// singleplayer game (RunState), played on this phone. This starts it when
/// Table 1 begins, moves it on to the next Table when the server starts one,
/// and reports every hand to the server. The web's MatchView does the same.
class MatchController extends ChangeNotifier {
  final RoomController rooms;
  final String userId;

  RunState? run;
  bool loaded = false; // false until the saved run has been read
  String error = ''; // why forfeiting failed, or empty

  /// The server's time, updated a few times a second (for countdowns)
  final ValueNotifier<int> now;

  /// Called when the server says the login has expired
  VoidCallback? onLoginExpired;

  Timer? _ticker;
  String _lastReport = '';
  int _retryReportAt = 0;
  String _tickState = '';
  bool _disposed = false;

  MatchController(this.rooms, this.userId)
      : now = ValueNotifier(rooms.serverTime()) {
    rooms.addListener(_roomChanged);
    _load();
  }

  Room? get room => rooms.room;
  RoomPlayer? get me => room?.player(userId);

  /// The Table's clock has run out
  bool get timeUp {
    final r = room;
    return r != null &&
        r.status == RoomStatus.table &&
        rooms.serverTime() >= r.deadline;
  }

  /// True when the run can't be played right now: knocked out, busted, or out of time
  bool get frozen {
    final m = me;
    return m == null ||
        m.status != PlayerStatus.alive ||
        m.tableStatus == TableStatus.busted ||
        (m.tableStatus == TableStatus.playing && timeUp);
  }

  // Kept on this phone so leaving the screen or closing the app doesn't lose the run
  String get _key => 'mp_run_${rooms.roomId}_$userId';

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_key);
      run = json == null ? null : RunState.fromJson(jsonDecode(json));
    } catch (_) {
      run = null;
    }
    if (_disposed) return;
    loaded = true;
    // Start or move on the run when a Table begins (checked a few times a second)
    _ticker = Timer.periodic(const Duration(milliseconds: 250), (_) => _tick());
    _roomChanged();
  }

  void _tick() {
    final time = rooms.serverTime();
    now.value = time;
    final moved = _syncRun(time);
    if (moved) _save();
    _report();
    final state = _tickKey(time);
    if (moved || state != _tickState) {
      _tickState = state;
      notifyListeners();
    }
  }

  void _roomChanged() {
    if (!loaded || _disposed) return;
    final time = rooms.serverTime();
    now.value = time;
    if (_syncRun(time)) _save();
    _forgetIfOut();
    _report();
    _tickState = _tickKey(time);
    notifyListeners();
  }

  // Changes whenever the clock means the screen should show something else:
  // each second of a countdown, and when a Table starts or runs out of time
  String _tickKey(int time) {
    final r = room;
    if (r == null) return '';
    if (r.status == RoomStatus.table) {
      if (time < r.startsAt) return 'start ${((r.startsAt - time) / 1000).ceil()}';
      return time >= r.deadline ? 'time up' : 'playing';
    }
    if (r.status == RoomStatus.results) {
      return 'next ${((r.nextTableAt - time) / 1000).ceil()}';
    }
    return '';
  }

  // Where the run should be, given the room: a new run when Table 1 starts, or
  // on to the next Table once the server has started it. True if it changed.
  bool _syncRun(int time) {
    final r = room;
    final m = me;
    if (r == null || m == null) return false;
    if (r.status != RoomStatus.table || time < r.startsAt) return false;
    if (m.status != PlayerStatus.alive || m.tableStatus != TableStatus.playing) {
      return false;
    }

    final current = run;
    if (current == null) {
      if (r.table != 1) return false;
      run = RunState.newRun();
      return true;
    }

    final clearedLastTable = current.table == r.table - 1 &&
        current.round == highRoller &&
        (current.phase == Phase.roundWon || current.phase == Phase.shop);
    if (!clearedLastTable) return false;

    if (current.phase == Phase.roundWon) current.collectReward();
    current.nextRound();
    return true;
  }

  Future<void> _save() async {
    final current = run;
    if (current == null || me?.status != PlayerStatus.alive) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(current.toJson()));
    } catch (_) {
      // the run still works, it just won't survive closing the app
    }
  }

  // Once knocked out, the saved run isn't needed any more
  Future<void> _forgetIfOut() async {
    final m = me;
    if (m == null || m.status == PlayerStatus.alive) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {
      // nothing to do
    }
  }

  // Tells the server about every hand, the finish, or a bust. A failed report
  // is sent again a second later.
  void _report() {
    final r = room;
    final m = me;
    final current = run;
    if (r == null || m == null || current == null) return;
    if (r.status != RoomStatus.table || current.table != r.table) return;
    if (m.status != PlayerStatus.alive || m.tableStatus != TableStatus.playing) {
      return;
    }

    final event = eventFor(current);
    final id =
        '${current.table}|${current.round}|${current.totalScore}|${event.name}';
    if (id == _lastReport) return;
    if (DateTime.now().millisecondsSinceEpoch < _retryReportAt) return;
    _lastReport = id;

    // nothing the server doesn't already know
    if (event == ReportEvent.progress &&
        current.totalScore == m.chips &&
        current.round == m.round) {
      return;
    }

    rooms
        .send(() => MultiplayerApi.reportRun(
              r.id,
              table: current.table,
              round: current.round,
              totalScore: current.totalScore,
              event: event,
            ))
        .then<void>((_) {}, onError: (Object e) {
      if (_disposed) return;
      if (ScoresApi.isLoginExpired(e)) {
        onLoginExpired?.call();
        return;
      }
      _lastReport = '';
      _retryReportAt = DateTime.now().millisecondsSinceEpoch + 1000;
    });
  }

  /// Every move goes through here so it gets saved and reported
  void act(void Function(RunState run) action) {
    final current = run;
    if (current == null || frozen) return;
    action(current);
    _save();
    _report();
    notifyListeners();
  }

  /// Leaves the tournament. The score so far still goes on the leaderboard.
  Future<void> forfeit() async {
    _setError('');
    try {
      await MultiplayerApi.leaveRoom(rooms.roomId);
      await rooms.send(() => MultiplayerApi.fetchRoom(rooms.roomId));
    } catch (e) {
      if (_disposed) return;
      if (ScoresApi.isLoginExpired(e)) {
        onLoginExpired?.call();
        return;
      }
      _setError(MultiplayerApi.errorText(e));
    }
  }

  void _setError(String message) {
    if (message == error) return;
    error = message;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _ticker?.cancel();
    rooms.removeListener(_roomChanged);
    now.dispose();
    super.dispose();
  }
}
