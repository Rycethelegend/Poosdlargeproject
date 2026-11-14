import 'package:flutter/material.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/hands_dialog.dart';
import 'package:poosdalatro/game/round_view.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/shop_view.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/multiplayer/match_controller.dart';
import 'package:poosdalatro/multiplayer/match_format.dart';
import 'package:poosdalatro/multiplayer/match_panels.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/multiplayer/room_controller.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

/// The tournament itself, laid out like a singleplayer run: the stats down the
/// left and the round, shop or a message on the right. The run is the normal
/// singleplayer game; MatchController keeps it in step with the room.
class MatchView extends StatefulWidget {
  final RoomController rooms;
  final VoidCallback onExit; // back to the list of rooms

  const MatchView({super.key, required this.rooms, required this.onExit});

  @override
  State<MatchView> createState() => _MatchViewState();
}

class _MatchViewState extends State<MatchView> {
  late final MatchController _match;

  @override
  void initState() {
    super.initState();
    _match = MatchController(widget.rooms, Session.userId)
      ..onLoginExpired = _loginExpired
      ..addListener(_changed);
  }

  @override
  void dispose() {
    _match.removeListener(_changed);
    _match.dispose();
    super.dispose();
  }

  void _changed() {
    if (mounted) setState(() {});
  }

  void _loginExpired() {
    if (!mounted) return;
    Session.clear();
    Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  }

  Future<void> _confirmForfeit() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Forfeit?'),
        content: const Text(
            'Leave the tournament? Your score so far still goes on the leaderboard.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep playing'),
          ),
          ElevatedButton(
            style: smallButton(),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Forfeit'),
          ),
        ],
      ),
    );
    if (leave == true) _match.forfeit();
  }

  @override
  Widget build(BuildContext context) {
    final room = _match.room;
    final me = _match.me;
    if (!_match.loaded || room == null || me == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final now = _match.now.value;
    final run = _match.run;
    final lastResult = room.results.isEmpty ? null : room.results.last;
    final resultsCard = lastResult == null
        ? null
        : TableResultsCard(
            key: ValueKey('results ${lastResult.table}'),
            result: lastResult,
            myId: me.userId,
          );

    // panels are the messages; game is the run when it's on screen
    var panels = <Widget>[];
    RunState? game;
    String? nextLocked;
    var playing = false; // an ordinary moment of the Table: show the banner

    if (room.status == RoomStatus.finished) {
      panels = [
        FinalStandings(
            key: const ValueKey('final'),
            room: room,
            me: me,
            onExit: widget.onExit),
        ?resultsCard,
      ];
    } else if (me.status != PlayerStatus.alive) {
      panels = [
        OutPanel(key: const ValueKey('out'), me: me, onExit: widget.onExit),
        ?resultsCard,
      ];
    } else if (room.status == RoomStatus.results) {
      final startsIn = clock(room.nextTableAt - now);
      if (lastResult != null) {
        panels = [
          TableResultsCard(
            key: ValueKey('results ${lastResult.table}'),
            result: lastResult,
            myId: me.userId,
            footer: 'You made it! Table ${room.table + 1} starts in $startsIn.',
          ),
        ];
      }
      // finished players can keep shopping until the next Table
      if (run != null && run.phase != Phase.gameOver) {
        game = run;
        nextLocked = 'Table ${room.table + 1} starts for everyone in $startsIn';
      }
    } else if (now < room.startsAt) {
      panels = [
        WaitPanel(
          key: const ValueKey('countdown'),
          title: 'Table ${room.table} starts in',
          children: [
            Text('${((room.startsAt - now) / 1000).ceil()}',
                style: const TextStyle(fontSize: 56, fontWeight: FontWeight.w600)),
          ],
        ),
      ];
    } else if (run == null) {
      panels = [
        room.table == 1
            ? const WaitPanel(key: ValueKey('dealing'), title: 'Dealing…')
            : WaitPanel(
                key: const ValueKey('elsewhere'),
                title: "This run isn't on this phone",
                children: [
                  const Text(
                      'Your run for this tournament was started on another device. Open it there to keep playing.'),
                  const SizedBox(height: 4),
                  ElevatedButton(
                      onPressed: _match.forfeit,
                      child: const Text('Forfeit instead')),
                ],
              ),
      ];
    } else if (me.tableStatus == TableStatus.busted ||
        run.phase == Phase.gameOver) {
      panels = [
        WaitPanel(
          key: const ValueKey('busted'),
          title: 'You missed the target',
          children: [
            Text(
                "You needed ${withCommas(run.target)} chips and scored ${withCommas(run.roundScore)}, so you're out after this table."),
            const Text('Waiting for the others to finish…'),
          ],
        ),
      ];
    } else if (_match.timeUp && me.tableStatus == TableStatus.playing) {
      panels = [
        const WaitPanel(
          key: ValueKey('time up'),
          title: "Time's up",
          children: [Text('The table is being scored…')],
        ),
      ];
    } else {
      game = run;
      playing = true;
      if (run.round == highRoller) {
        nextLocked = 'The next table starts for everyone once this one ends';
      }
    }

    // the round fills the height itself; everything else is centered
    final fills = game != null && panels.isEmpty && game.phase == Phase.playing;
    final Widget content = fills
        ? RoundView(run: game, onAction: _match.act)
        : Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              ...panels,
              if (game != null)
                _phaseContent(game, nextLocked)
              else
                // nothing to play, so there's room to see how everyone is doing
                Scoreboard(room: room, myId: me.userId),
            ],
          );

    return FeltPanel(
      padding: const EdgeInsets.all(10),
      border: 8,
      child: LayoutBuilder(builder: (context, box) {
        final top = _hudTop(room, game, wide: box.maxWidth >= 640);
        if (box.maxWidth >= 640) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              SizedBox(
                width: 200,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 6,
                  children: [
                    // the clock stays put while the rest scrolls on a small phone
                    ...top,
                    Expanded(
                      child: _centered(
                          _hud(room, me, game, playing: playing, columns: 2)),
                    ),
                  ],
                ),
              ),
              Expanded(child: fills ? content : _centered(content)),
            ],
          );
        }
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 6,
                children: [
                  ...top,
                  _hud(room, me, game, playing: playing, columns: 3),
                ],
              ),
              content,
            ],
          ),
        );
      }),
    );
  }

  Widget _hudButton(String label, VoidCallback onPressed) => TextButton(
        style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        onPressed: onPressed,
        child: FittedBox(fit: BoxFit.scaleDown, child: Text(label)),
      );

  Widget _smallHudButton(String label, VoidCallback onPressed) => ElevatedButton(
        style: smallButton(),
        onPressed: onPressed,
        child: FittedBox(fit: BoxFit.scaleDown, child: Text(label)),
      );

  // Vertically centered when it fits, scrolls when it doesn't
  Widget _centered(Widget child) => LayoutBuilder(
        builder: (context, box) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Center(child: child),
          ),
        ),
      );

  Stat _requiredStat(Room room) => Stat(
      label: 'Required',
      value: withCommas(room.requiredScore),
      chip: ChipColor.red);

  Stat _playersLeftStat(Room room) {
    final stillIn = room.players
        .where((p) =>
            p.status == PlayerStatus.alive || p.status == PlayerStatus.winner)
        .length;
    return Stat(label: 'Players left', value: '$stillIn / ${room.players.length}');
  }

  // Where the tournament is and the clock, always in view
  List<Widget> _hudTop(Room room, RunState? game, {required bool wide}) {
    return [
      Row(
        spacing: 6,
        children: [
          Expanded(
            child: game != null
                ? Stat(label: 'Table ${game.table}', value: rounds[game.round].name)
                : Stat(
                    label: 'Room ${room.code}',
                    value: room.status == RoomStatus.finished
                        ? 'Final'
                        : 'Table ${room.table}'),
          ),
          // with no run on screen a narrow phone has room for all four in a row
          if (game == null && !wide) ...[
            Expanded(child: _requiredStat(room)),
            Expanded(child: _playersLeftStat(room)),
          ],
          Expanded(child: ClockStat(room: room, now: _match.now)),
        ],
      ),
      if (room.status == RoomStatus.table) TimeBar(room: room, now: _match.now),
    ];
  }

  // Stats, progress bar and the buttons
  Widget _hud(Room room, RoomPlayer me, RunState? game,
      {required bool playing, required int columns}) {
    final c = GameColors.of(context);
    final active =
        game != null && (game.phase == Phase.playing || game.phase == Phase.shop);

    final stats = game == null
        ? const <Stat>[]
        : [
            Stat(label: 'Target', value: withCommas(game.target), chip: ChipColor.red),
            Stat(label: 'Score', value: withCommas(game.roundScore), chip: ChipColor.blue),
            Stat(label: 'Hands', value: '${game.handsLeft}'),
            Stat(label: 'Discards', value: '${game.discardsLeft}'),
            Stat(label: 'Money', value: '\$${game.money}', chip: ChipColor.orange),
            Stat(label: 'Run total', value: withCommas(game.totalScore), chip: ChipColor.black),
          ];
    final progress =
        game == null ? 0.0 : (game.roundScore / game.target).clamp(0.0, 1.0);
    // the run's total when this Table began
    final tableStart = me.chips - me.tableChips;
    // forfeiting failed, or the room isn't updating
    final error = _match.error.isNotEmpty ? _match.error : widget.rooms.error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 6,
      children: [
        if (game != null) ...[
          // the boss sits above the table it belongs to
          if (game.phase == Phase.playing) BossBanner(run: game, small: true),
          for (int i = 0; i < stats.length; i += columns)
            Row(
              spacing: 6,
              children: [
                for (int j = i; j < i + columns; j++)
                  Expanded(child: j < stats.length ? stats[j] : const SizedBox()),
              ],
            ),
          if (game.phase == Phase.playing)
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: TweenAnimationBuilder<double>(
                tween: Tween(end: progress),
                duration: const Duration(milliseconds: 500),
                builder: (context, value, _) => LinearProgressIndicator(
                  value: value,
                  minHeight: 10,
                  color: c.money,
                  backgroundColor: Colors.black.withValues(alpha: 0.2),
                ),
              ),
            ),
          if (playing)
            TableBanner(
              room: room,
              me: me,
              tableChips: game.totalScore - tableStart,
              now: _match.now,
            ),
        ] else if (columns == 2)
          Row(
            spacing: 6,
            children: [
              Expanded(child: _requiredStat(room)),
              Expanded(child: _playersLeftStat(room)),
            ],
          ),
        if (error.isNotEmpty) FormMessage(error: error),
        if (game != null)
          Row(
            spacing: 6,
            children: [
              // during a round this button is up by the jokers instead
              if (game.phase == Phase.shop)
                Expanded(
                  child: _smallHudButton('Poker hands',
                      () => showHandsDialog(context, game.handLevels)),
                ),
              // everyone's scores, since the game has the screen
              Expanded(
                child: _smallHudButton('Standings',
                    () => showStandingsDialog(context, widget.rooms, me.userId)),
              ),
            ],
          ),
        Row(
          spacing: 6,
          children: [
            // Leaves the screen but stays in the tournament: the clock keeps going
            Expanded(
                child: _hudButton('Back to menu', () => Navigator.pop(context))),
            if (active) Expanded(child: _hudButton('Forfeit', _confirmForfeit)),
          ],
        ),
      ],
    );
  }

  Widget _phaseContent(RunState run, String? nextLocked) {
    switch (run.phase) {
      case Phase.playing:
        return RoundView(run: run, onAction: _match.act);
      case Phase.shop:
        return ShopView(run: run, onAction: _match.act, nextLocked: nextLocked);
      case Phase.roundWon:
        return _roundWon(run);
      case Phase.gameOver:
        // multiplayer has its own messages for a run that's over
        return const SizedBox.shrink();
    }
  }

  Widget _rewardRow(String label, int amount, {bool bold = false}) {
    final style = TextStyle(fontSize: 16, fontWeight: bold ? FontWeight.w600 : null);
    return Row(
      children: [
        Expanded(child: Text(label, style: style)),
        Text('\$$amount', style: style),
      ],
    );
  }

  Widget _roundWon(RunState run) {
    final reward = run.reward!;
    return PanelCard(
      key: ValueKey('round won ${run.table} ${run.round}'),
      centered: false,
      children: [
        const Text('Round cleared!',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w600)),
        Text('${withCommas(run.roundScore)} / ${withCommas(run.target)} chips',
            textAlign: TextAlign.center),
        _rewardRow('${rounds[run.round].name} reward', reward.round),
        _rewardRow('\$1 per hand left (${reward.handsLeft})', reward.handsLeft),
        _rewardRow('Savings (\$1 per \$10 held, max \$3)', reward.savings),
        if (reward.jokers > 0) _rewardRow('Jokers', reward.jokers),
        const Divider(height: 4),
        _rewardRow('Total', reward.total, bold: true),
        const SizedBox(height: 6),
        ElevatedButton(
          onPressed: () => _match.act((r) => r.collectReward()),
          child: Text('Collect \$${reward.total} and go to the shop',
              textAlign: TextAlign.center),
        ),
      ],
    );
  }
}
