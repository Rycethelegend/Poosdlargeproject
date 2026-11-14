import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/utils/after_transition.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/login_expired.dart';
import 'package:poosdalatro/utils/multiplayer_api.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

const _refreshEvery = Duration(seconds: 3);

/// Create a room, join one by code, or pick an open one. If this player is
/// already in a room (say, after closing the app), it goes straight back to it.
/// Laid out like singleplayer's first screen: the list on the left, the
/// buttons on the right.
class RoomBrowser extends StatefulWidget {
  final void Function(RoomResponse entered) onEnter;

  const RoomBrowser({super.key, required this.onEnter});

  @override
  State<RoomBrowser> createState() => _RoomBrowserState();
}

class _RoomBrowserState extends State<RoomBrowser> {
  List<OpenRoom>? _rooms;
  bool _private = false;
  bool _busy = false;
  String _error = ''; // from creating or joining
  String _listError = ''; // from loading the list; clears when it loads again
  bool _checkCurrentRoom = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    Connection.online.addListener(_onConnectionChange);
    afterTransition(context, _load);
  }

  @override
  void dispose() {
    Connection.online.removeListener(_onConnectionChange);
    _timer?.cancel();
    super.dispose();
  }

  // reload when the connection comes back
  void _onConnectionChange() {
    if (Connection.online.value) _load();
  }

  Future<void> _load() async {
    _timer?.cancel();
    try {
      final list = await MultiplayerApi.listRooms();
      if (!mounted) return;
      final current = list.currentRoomId;
      if (_checkCurrentRoom && current != null) {
        final res = await MultiplayerApi.fetchRoom(current);
        if (!mounted) return;
        if (res.room != null) return widget.onEnter(res);
      }
      _checkCurrentRoom = false;
      setState(() {
        _rooms = list.rooms;
        _listError = '';
      });
    } catch (e) {
      if (!mounted) return;
      if (loginExpired(context, e)) return;
      setState(() => _listError = MultiplayerApi.errorText(e));
    }
    _timer?.cancel();
    _timer = Timer(_refreshEvery, _load);
  }

  Future<void> _enter(Future<RoomResponse> Function() request) async {
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final res = await request();
      if (!mounted) return;
      if (res.room != null) return widget.onEnter(res);
      setState(() => _busy = false);
    } catch (e) {
      if (!mounted) return;
      if (loginExpired(context, e)) return;
      setState(() {
        _error = MultiplayerApi.errorText(e);
        _busy = false;
      });
    }
  }

  Future<void> _askForCode() async {
    final code = await showDialog<String>(
        context: context, builder: (context) => const _JoinCodeDialog());
    if (code != null && mounted) _enter(() => MultiplayerApi.joinRoom(code));
  }

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final error = _error.isNotEmpty ? _error : _listError;

    const description = Text(
      'A score tournament: everyone plays the same tables at once, and the '
      'lowest scores drop out until one player is left.',
      style: TextStyle(fontSize: 16),
    );

    final start = Column(
      mainAxisSize: MainAxisSize.min,
      spacing: 10,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          spacing: 6,
          children: [
            Transform.rotate(
              angle: -0.1,
              child: const CardFace(card: PlayingCard('a', Suit.spades, 14), width: 48),
            ),
            const CardFace(card: PlayingCard('k', Suit.hearts, 13), width: 48),
            const ChipStack(color: ChipColor.blue, height: 3, width: 32),
            const ChipStack(color: ChipColor.red, height: 2, width: 32),
          ],
        ),
        const Text('Multiplayer',
            style: TextStyle(fontSize: 34, fontWeight: FontWeight.w600)),
        ElevatedButton(
          onPressed: _busy ? null : () => _enter(() => MultiplayerApi.createRoom(_private)),
          child: const Text('Create room'),
        ),
        // cream box like the score on the table, so it stands out
        Material(
          color: c.cream.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(12),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => setState(() => _private = !_private),
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Checkbox(
                    value: _private,
                    activeColor: c.feltEdge,
                    checkColor: c.cream,
                    onChanged: (value) => setState(() => _private = value ?? false),
                  ),
                  const Text('Private (join by code only)'),
                ],
              ),
            ),
          ),
        ),
        ElevatedButton(
          onPressed: _busy ? null : _askForCode,
          child: const Text('Join with a code'),
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
                spacing: 14,
                children: [
                  start,
                  description,
                  if (error.isNotEmpty) FormMessage(error: error),
                  _openRooms(c),
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
                    description,
                    if (error.isNotEmpty) FormMessage(error: error),
                    Expanded(child: SingleChildScrollView(child: _openRooms(c))),
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

  // Rooms anyone can join, each with a Join button
  Widget _openRooms(GameColors c) {
    final rooms = _rooms;
    return CreamList(
      children: [
        const Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text('Open rooms',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          ),
        ),
        Divider(height: 2, thickness: 2, color: c.feltEdge.withValues(alpha: 0.4)),
        if (rooms == null || rooms.isEmpty)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              rooms == null
                  ? 'Looking for rooms…'
                  : 'No open rooms right now. Create one and invite your friends!',
              textAlign: TextAlign.center,
            ),
          )
        else
          for (int i = 0; i < rooms.length; i++)
            Container(
              color: i.isEven ? Colors.black.withValues(alpha: 0.05) : null,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                spacing: 12,
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(children: [
                        TextSpan(
                            text: "${rooms[i].hostName}'s room",
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                        TextSpan(
                            text: '  ${rooms[i].code}',
                            style: const TextStyle(fontSize: 12, letterSpacing: 2)),
                      ]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text('${rooms[i].players}/${rooms[i].maxPlayers}'),
                  ElevatedButton(
                    style: smallButton(),
                    onPressed: _busy
                        ? null
                        : () => _enter(() => MultiplayerApi.joinRoom(rooms[i].code)),
                    child: const Text('Join'),
                  ),
                ],
              ),
            ),
      ],
    );
  }
}

class _UpperCase extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
          TextEditingValue oldValue, TextEditingValue newValue) =>
      newValue.copyWith(text: newValue.text.toUpperCase());
}

/// Popup for typing a room's 6-character code. Pops with the code.
class _JoinCodeDialog extends StatefulWidget {
  const _JoinCodeDialog();

  @override
  State<_JoinCodeDialog> createState() => _JoinCodeDialogState();
}

class _JoinCodeDialogState extends State<_JoinCodeDialog> {
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  bool get _ready => _code.text.trim().length >= 6;

  void _join() {
    if (_ready) Navigator.pop(context, _code.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        // scrolls so the box stays reachable above the keyboard
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Join with a code',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                spacing: 8,
                children: [
                  Expanded(
                    // looks like the web: ABC123 placeholder, letters spaced out
                    child: TextField(
                      controller: _code,
                      autofocus: true,
                      textAlign: TextAlign.center,
                      autocorrect: false,
                      enableSuggestions: false,
                      textCapitalization: TextCapitalization.characters,
                      maxLength: 6,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp('[a-zA-Z0-9]')),
                        _UpperCase(),
                      ],
                      style: const TextStyle(fontSize: 22, letterSpacing: 8),
                      decoration: InputDecoration(
                        hintText: 'ABC123',
                        hintStyle: TextStyle(
                            fontSize: 22,
                            letterSpacing: 8,
                            color: Theme.of(context).hintColor),
                        counterText: '',
                      ),
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _join(),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _ready ? _join : null,
                    child: const Text('Join'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
