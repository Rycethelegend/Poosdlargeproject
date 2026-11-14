import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/scores_api.dart';

// Talks to the multiplayer routes in multiplayer/api.js on the server, the
// same way the leaderboard does (ScoresApi.postWithLogin).

class MultiplayerApi {
  // Minutes behind UTC, like the website sends (and RunStorage for savescore)
  static int get _tzOffset => -DateTime.now().timeZoneOffset.inMinutes;

  static Future<RoomResponse> _room(
      String route, Map<String, dynamic> body) async {
    return RoomResponse.fromJson(await ScoresApi.postWithLogin(route, body));
  }

  /// Open rooms anyone can join, and the id of the room this player is
  /// already in (if any)
  static Future<({List<OpenRoom> rooms, String? currentRoomId})>
      listRooms() async {
    final data = await ScoresApi.postWithLogin('mp/rooms', {});
    return (
      rooms: [
        for (final r in data['rooms'] as List? ?? [])
          OpenRoom.fromJson(Map<String, dynamic>.from(r)),
      ],
      currentRoomId: data['currentRoom']?['id'] as String?,
    );
  }

  static Future<RoomResponse> createRoom(bool isPrivate) =>
      _room('mp/create', {'isPrivate': isPrivate, 'tzOffset': _tzOffset});

  static Future<RoomResponse> joinRoom(String code) =>
      _room('mp/join', {'code': code, 'tzOffset': _tzOffset});

  static Future<RoomResponse> fetchRoom(String roomId) =>
      _room('mp/room', {'roomId': roomId});

  static Future<RoomResponse> startRoom(String roomId) =>
      _room('mp/start', {'roomId': roomId});

  static Future<RoomResponse> reportRun(
    String roomId, {
    required int table,
    required int round,
    required int totalScore,
    required ReportEvent event,
  }) =>
      _room('mp/report', {
        'roomId': roomId,
        'table': table,
        'round': round,
        'totalScore': totalScore,
        'event': event.name,
      });

  static Future<void> leaveRoom(String roomId) =>
      ScoresApi.postWithLogin('mp/leave', {'roomId': roomId});

  /// The message to show for a failed request, worded like the other screens
  static String errorText(Object error) => error is ApiException
      ? error.message
      : "Can't reach the server. Check your connection and try again.";
}
