import 'package:flutter/material.dart';
import 'package:poosdalatro/multiplayer/match_panels.dart';
import 'package:poosdalatro/multiplayer/match_view.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/multiplayer/room_browser.dart';
import 'package:poosdalatro/multiplayer/room_controller.dart';
import 'package:poosdalatro/multiplayer/room_lobby.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

/// Multiplayer: pick a room, wait in its lobby, then play the tournament.
/// The rooms themselves live on the server; see multiplayer/api.js there.
class MultiplayerScreen extends StatefulWidget {
  const MultiplayerScreen({super.key});

  @override
  State<MultiplayerScreen> createState() => _MultiplayerScreenState();
}

class _MultiplayerScreenState extends State<MultiplayerScreen> {
  // The room we're in, kept up to date. Null while choosing a room.
  RoomController? _rooms;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    for (final asset in [
      'assets/poker-cards.png',
      'assets/sprites/poker-chips.png',
      'assets/sprites/card-decks.png',
    ]) {
      precacheImage(AssetImage(asset), context);
    }
  }

  @override
  void dispose() {
    _rooms?.dispose();
    super.dispose();
  }

  void _enter(RoomResponse entered) {
    _rooms?.dispose();
    final rooms = RoomController(entered)
      ..onLoginExpired = _loginExpired
      ..addListener(_roomChanged);
    setState(() => _rooms = rooms);
  }

  // Back to the list of rooms
  void _exit() {
    final rooms = _rooms;
    setState(() => _rooms = null);
    rooms?.dispose();
  }

  void _roomChanged() {
    if (mounted) setState(() {});
  }

  void _loginExpired() {
    if (!mounted) return;
    Session.clear();
    Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final rooms = _rooms;
    final room = rooms?.room;
    final me = room?.player(Session.userId);
    final inMatch = room != null && me != null && room.status != RoomStatus.lobby;

    return Scaffold(
      // the only typing is in the room code popup, which moves above the
      // keyboard by itself; the table underneath shouldn't get squashed
      resizeToAvoidBottomInset: false,
      // same back bar as Profile and Leaderboard; in a match the way back is in the stats
      appBar: inMatch ? null : AppBar(title: const Text('Multiplayer')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: _body(rooms, room, me),
        ),
      ),
    );
  }

  Widget _body(RoomController? rooms, Room? room, RoomPlayer? me) {
    if (rooms == null) return RoomBrowser(onEnter: _enter);

    if (rooms.gone || room == null || me == null) {
      return FeltPanel(
        padding: const EdgeInsets.all(14),
        child: Center(
          child: SingleChildScrollView(
            child: PanelCard(
              children: [
                const Text('This room is closed', style: panelTitle),
                const Text(
                    'It was deleted, or you were removed after being away from the lobby.'),
                const SizedBox(height: 4),
                ElevatedButton(
                    onPressed: _exit, child: const Text('Back to rooms')),
              ],
            ),
          ),
        ),
      );
    }

    if (room.status == RoomStatus.lobby) {
      return RoomLobby(
        key: ValueKey('lobby ${room.id}'),
        rooms: rooms,
        room: room,
        me: me,
        onExit: _exit,
      );
    }
    return MatchView(
        key: ValueKey('match ${room.id}'), rooms: rooms, onExit: _exit);
  }
}
