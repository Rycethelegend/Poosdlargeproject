import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/multiplayer/match_panels.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/multiplayer/room_controller.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/login_expired.dart';
import 'package:poosdalatro/utils/multiplayer_api.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

/// The waiting room before the host starts the tournament. Laid out like
/// singleplayer's first screen: who's here and the rules on the left, the room
/// code and Start on the right.
class RoomLobby extends StatefulWidget {
  final RoomController rooms;
  final Room room;
  final RoomPlayer me;
  final VoidCallback onExit; // back to the list of rooms

  const RoomLobby({
    super.key,
    required this.rooms,
    required this.room,
    required this.me,
    required this.onExit,
  });

  @override
  State<RoomLobby> createState() => _RoomLobbyState();
}

class _RoomLobbyState extends State<RoomLobby> {
  bool _busy = false;
  String _error = '';
  bool _codeShown = false;
  bool _copied = false;
  Timer? _copiedTimer;

  @override
  void dispose() {
    _copiedTimer?.cancel();
    super.dispose();
  }

  Future<void> _act(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await action();
    } catch (e) {
      if (!mounted) return;
      if (loginExpired(context, e)) return;
      setState(() => _error = MultiplayerApi.errorText(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _start() => _act(
      () => widget.rooms.send(() => MultiplayerApi.startRoom(widget.room.id)));

  void _leave() => _act(() async {
        await MultiplayerApi.leaveRoom(widget.room.id);
        widget.onExit();
      });

  // The code stays hidden until it's tapped (the web shows it on hover).
  // Showing it also copies it.
  void _tapCode() {
    if (_codeShown) {
      setState(() => _codeShown = false);
      return;
    }
    Clipboard.setData(ClipboardData(text: widget.room.code));
    _copiedTimer?.cancel();
    _copiedTimer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) setState(() => _copied = false);
    });
    setState(() {
      _codeShown = true;
      _copied = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final room = widget.room;
    final me = widget.me;
    final isHost = room.hostId == me.userId;
    final host = room.player(room.hostId);
    final enoughPlayers = room.players.length >= room.settings.minPlayers;
    // a failed button press, or the room not updating
    final error = _error.isNotEmpty ? _error : widget.rooms.error;

    Widget pill(String text) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: c.cream.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(text, textAlign: TextAlign.center),
        );

    final header = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(host != null ? "${host.username}'s room" : 'Room',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w600)),
        Text(
            room.isPrivate
                ? 'Private: share the code to invite people.'
                : 'Open: anyone can join from the rooms list.',
            style: const TextStyle(fontSize: 16)),
      ],
    );

    final players = CreamList(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text('Players ${room.players.length}/${room.settings.maxPlayers}',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          ),
        ),
        Divider(height: 2, thickness: 2, color: c.feltEdge.withValues(alpha: 0.4)),
        for (int i = 0; i < room.players.length; i++)
          Container(
            color: i.isEven ? Colors.black.withValues(alpha: 0.05) : null,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              spacing: 8,
              children: [
                ConnectedDot(connected: room.players[i].connected),
                Flexible(
                  child: Text(
                    room.players[i].userId == me.userId
                        ? '${room.players[i].username} (you)'
                        : room.players[i].username,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: room.players[i].userId == me.userId
                        ? const TextStyle(fontWeight: FontWeight.w600)
                        : null,
                  ),
                ),
                if (room.players[i].userId == room.hostId)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: BoxDecoration(
                      color: c.woodLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Host', style: TextStyle(fontSize: 13)),
                  ),
              ],
            ),
          ),
      ],
    );

    final rules = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          const Text('How the tournament works',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          RuleList(rules: tournamentRules(room)),
        ],
      ),
    );

    final start = Column(
      mainAxisSize: MainAxisSize.min,
      spacing: 10,
      children: [
        Material(
          color: c.cream.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(16),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: _tapCode,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_copied ? 'COPIED!' : 'ROOM CODE',
                      style: const TextStyle(fontSize: 12, letterSpacing: 1)),
                  Text(_codeShown ? room.code : '--- ---',
                      style: const TextStyle(
                          fontSize: 30, fontWeight: FontWeight.w600, letterSpacing: 4)),
                  Text(_codeShown ? 'Tap to hide' : 'Tap to show and copy',
                      style: TextStyle(
                          fontSize: 12, color: c.ink.withValues(alpha: 0.7))),
                ],
              ),
            ),
          ),
        ),
        if (isHost) ...[
          ElevatedButton(
            onPressed: _busy || !enoughPlayers ? null : _start,
            child: const Text('Start'),
          ),
          if (!enoughPlayers)
            pill('Waiting for at least ${room.settings.minPlayers} players…'),
        ] else
          pill('Waiting for ${host?.username ?? 'the host'} to start…'),
        TextButton(
          onPressed: _busy ? null : _leave,
          child: const Text('Leave room'),
        ),
      ],
    );

    return FeltPanel(
      padding: const EdgeInsets.all(14),
      child: LayoutBuilder(
        builder: (context, box) {
          if (box.maxWidth < 640) {
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 14,
                children: [
                  header,
                  Center(child: start),
                  if (error.isNotEmpty) FormMessage(error: error),
                  players,
                  rules,
                ],
              ),
            );
          }
          return Row(
            spacing: 20,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 10,
                  children: [
                    header,
                    if (error.isNotEmpty) FormMessage(error: error),
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          spacing: 12,
                          children: [players, rules],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: (box.maxWidth * 0.28).clamp(200.0, 320.0),
                child: FittedBox(fit: BoxFit.scaleDown, child: start),
              ),
            ],
          );
        },
      ),
    );
  }
}
