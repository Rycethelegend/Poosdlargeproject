import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/utils/multiplayer_api.dart';
import 'package:poosdalatro/utils/scores_api.dart';

// How often to ask the server for the room
const Map<RoomStatus, int> _pollMs = {
  RoomStatus.lobby: 2000,
  RoomStatus.table: 1000,
  RoomStatus.results: 1000,
  RoomStatus.finished: 5000,
};

/// Keeps a room up to date by polling the server, and keeps a clock in step
/// with the server's so every player sees the same countdown. The web's
/// useRoom hook does the same job.
///
/// room - latest room (null once it's gone)
/// gone - the room was deleted, or this player is no longer in it
/// error - why the last poll failed, or empty
class RoomController extends ChangeNotifier {
  final String roomId;
  Room? room;
  bool gone = false;
  String error = '';

  /// Called when the server says the login has expired
  VoidCallback? onLoginExpired;

  int _offset = 0; // server clock minus this phone's clock
  int _latestRev; // answers can arrive out of order; keep the newest
  String _signature;
  Timer? _timer;
  bool _stopped = false;
  bool _disposed = false;

  /// [entered] is the server's answer from creating, joining or finding the room
  RoomController(RoomResponse entered)
      : roomId = entered.room!.id,
        room = entered.room,
        _latestRev = entered.room!.rev,
        _signature = entered.signature {
    _offset = entered.serverNow - _phoneTime();
    _poll();
  }

  static int _phoneTime() => DateTime.now().millisecondsSinceEpoch;

  /// The server's current time in milliseconds
  int serverTime() => _phoneTime() + _offset;

  /// Wraps any request that answers with a room (start, report...) so its
  /// answer updates the room straight away
  Future<RoomResponse> send(Future<RoomResponse> Function() request) async {
    final sentAt = _phoneTime();
    final res = await request();
    _apply(res, sentAt);
    return res;
  }

  void _apply(RoomResponse res, int sentAt) {
    if (_disposed) return;
    // Halfway between sending and receiving is the best guess for "serverNow"
    _offset = res.serverNow - (sentAt + _phoneTime()) ~/ 2;

    final next = res.room;
    if (next == null) {
      _stopped = true;
      _timer?.cancel();
      gone = true;
      room = null;
      notifyListeners();
      return;
    }
    if (next.rev < _latestRev) return;
    _latestRev = next.rev;

    // most polls bring back the same room; don't redraw the game for those
    if (res.signature == _signature) return;
    _signature = res.signature;
    room = next;
    notifyListeners();
  }

  Future<void> _poll() async {
    try {
      await send(() => MultiplayerApi.fetchRoom(roomId));
      if (_disposed) return;
      _setError('');
    } catch (e) {
      if (_disposed) return;
      if (ScoresApi.isLoginExpired(e)) {
        _stopped = true;
        onLoginExpired?.call();
        return;
      }
      _setError(MultiplayerApi.errorText(e));
    }
    if (!_stopped) {
      final wait = _pollMs[room?.status ?? RoomStatus.lobby]!;
      _timer = Timer(Duration(milliseconds: wait), _poll);
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
    _timer?.cancel();
    super.dispose();
  }
}
