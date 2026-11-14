import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/multiplayer/match_format.dart';
import 'package:poosdalatro/multiplayer/room.dart';
import 'package:poosdalatro/multiplayer/room_controller.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

// The pieces of the multiplayer screens, styled like singleplayer: cream boxes
// on the felt, the same stats, and cards that pop in. The web's MatchPanels.tsx
// has the same pieces.

const Color _lightText = Color(0xFFF2E8CF);
const Color _connected = Color(0xFF03A688);

/// Cream card that pops in, like singleplayer's "Round cleared!" and "Run over"
class PanelCard extends StatelessWidget {
  final List<Widget> children;
  final double maxWidth;
  final bool centered; // center the text, for cards that are a short message

  const PanelCard({
    super.key,
    required this.children,
    this.maxWidth = 440,
    this.centered = true,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Center(
      child: PopIn(
        child: Container(
          constraints: BoxConstraints(maxWidth: maxWidth),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: c.cream.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(16),
          ),
          child: DefaultTextStyle.merge(
            textAlign: centered ? TextAlign.center : null,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 6,
              children: children,
            ),
          ),
        ),
      ),
    );
  }
}

const TextStyle panelTitle = TextStyle(fontSize: 26, fontWeight: FontWeight.w600);
const TextStyle _smallCaps = TextStyle(fontSize: 12, letterSpacing: 1);

TextSpan _b(String text) =>
    TextSpan(text: text, style: const TextStyle(fontWeight: FontWeight.bold));

/// The tournament rules, with this room's numbers
List<List<InlineSpan>> tournamentRules(Room room) {
  final s = room.settings;
  double place(int i) => i < room.placeBonus.length ? room.placeBonus[i] : 0;
  return [
    [
      const TextSpan(text: 'Everyone plays the same '),
      _b('Table'),
      const TextSpan(
          text: ' at the same time, each on their own run. Clear all three rounds to finish it.'),
    ],
    [
      const TextSpan(text: 'Each Table has a '),
      _b(clock(s.tableTimeLimitSec * 1000)),
      const TextSpan(text: ' clock. Once the first player finishes, everyone else has '),
      _b('${s.finishWindowSec} seconds'),
      const TextSpan(text: ' left.'),
    ],
    [
      const TextSpan(text: 'The 1st and 2nd to finish get '),
      _b('+${percent(place(0))}'),
      const TextSpan(text: ' and '),
      _b('+${percent(place(1))}'),
      const TextSpan(text: ' of the required score. Finishers also get '),
      _b('+${percent(room.bonusPerSecondLeft)}'),
      const TextSpan(text: ' for every second left on the clock.'),
    ],
    [
      const TextSpan(
          text: 'When the Table ends, the chips you scored on it plus your bonuses must reach its '),
      _b('required score'),
      const TextSpan(
          text: ". Didn't finish, missed a round's target or fell short? You're out."),
    ],
    [
      const TextSpan(
          text: 'Last player standing wins. If everyone left fails the same Table, the highest score wins.'),
    ],
    [
      const TextSpan(text: 'Your final score (chips + bonuses) goes on the leaderboard.'),
    ],
  ];
}

/// Bulleted rules, like the ones on singleplayer's first screen
class RuleList extends StatelessWidget {
  final List<List<InlineSpan>> rules;
  final double fontSize;

  const RuleList({super.key, required this.rules, this.fontSize = 15});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 6,
      children: [
        for (final spans in rules)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                  width: fontSize * 1.2,
                  child: Text('•', style: TextStyle(fontSize: fontSize))),
              Expanded(
                  child: Text.rich(TextSpan(children: spans),
                      style: TextStyle(fontSize: fontSize))),
            ],
          ),
      ],
    );
  }
}

/// Green dot for players the server has heard from lately
class ConnectedDot extends StatelessWidget {
  final bool connected;
  const ConnectedDot({super.key, required this.connected});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: connected ? 'Connected' : 'Not connected',
      child: Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: connected ? _connected : Colors.black.withValues(alpha: 0.3),
        ),
      ),
    );
  }
}

/// The match clock in a stat box. Turns red once someone has finished and
/// everyone else is on the finish window.
class ClockStat extends StatelessWidget {
  final Room room;
  final ValueListenable<int> now;

  const ClockStat({super.key, required this.room, required this.now});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return ValueListenableBuilder<int>(
      valueListenable: now,
      builder: (context, time, _) {
        final clock = matchClock(room, time);
        final ink = clock.finishWindow ? _lightText : c.ink;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: clock.finishWindow ? c.danger : c.cream.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                clock.label.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 0.8,
                  color: ink.withValues(alpha: clock.finishWindow ? 0.85 : 0.7),
                ),
              ),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  clock.value,
                  style: TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w600, color: ink),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// How much of the Table's time is left, as a bar
class TimeBar extends StatelessWidget {
  final Room room;
  final ValueListenable<int> now;

  const TimeBar({super.key, required this.room, required this.now});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: ValueListenableBuilder<int>(
        valueListenable: now,
        builder: (context, time, _) {
          final clock = matchClock(room, time);
          return TweenAnimationBuilder<double>(
            tween: Tween(end: clock.bar),
            duration: const Duration(milliseconds: 300),
            builder: (context, value, _) => LinearProgressIndicator(
              value: value,
              minHeight: 10,
              color: clock.finishWindow ? c.danger : c.money,
              backgroundColor: Colors.black.withValues(alpha: 0.2),
            ),
          );
        },
      ),
    );
  }
}

/// Under the game stats: how this player is doing against the required score
class TableBanner extends StatelessWidget {
  final Room room;
  final RoomPlayer me;
  final int tableChips;
  final ValueListenable<int> now;

  const TableBanner({
    super.key,
    required this.room,
    required this.me,
    required this.tableChips,
    required this.now,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final required = room.requiredScore;
    final fill = required <= 0 ? 0.0 : (tableChips / required).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 4,
        children: [
          Text.rich(
            TextSpan(children: [
              const TextSpan(text: 'This table: '),
              _b(withCommas(tableChips)),
              TextSpan(text: ' / ${withCommas(required)} required'),
            ]),
            style: const TextStyle(fontSize: 13),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: TweenAnimationBuilder<double>(
              tween: Tween(end: fill),
              duration: const Duration(milliseconds: 500),
              builder: (context, value, _) => LinearProgressIndicator(
                value: value,
                minHeight: 8,
                color: c.chips,
                backgroundColor: Colors.black.withValues(alpha: 0.15),
              ),
            ),
          ),
          if (me.tableStatus == TableStatus.finished)
            Text.rich(
              TextSpan(children: [
                const TextSpan(text: 'You finished '),
                _b(numberEnding(me.place ?? 1)),
                const TextSpan(
                    text: '! Shop while the others finish. Bonuses are added when the table ends.'),
              ]),
              style: const TextStyle(fontSize: 12),
            )
          else
            // the time bonus drops every second
            ValueListenableBuilder<int>(
              valueListenable: now,
              builder: (context, time, _) {
                final bonus = bonusIfFinishedNow(room, time);
                final withBonuses = tableChips + bonus.placeBonus + bonus.timeBonus;
                return Text.rich(
                  TextSpan(children: [
                    TextSpan(text: 'Finish now (${numberEnding(bonus.place)}): '),
                    if (bonus.placeBonus > 0)
                      TextSpan(text: '+${withCommas(bonus.placeBonus)} place, '),
                    TextSpan(text: '+${withCommas(bonus.timeBonus)} time → '),
                    _b(withCommas(withBonuses)),
                    TextSpan(
                        text: withBonuses >= required
                            ? ', enough to stay in'
                            : ', ${withCommas(required - withBonuses)} short'),
                  ]),
                  style: const TextStyle(fontSize: 12),
                );
              },
            ),
        ],
      ),
    );
  }
}

/// Everyone in the tournament, best first
class Scoreboard extends StatelessWidget {
  final Room room;
  final String myId;

  const Scoreboard({super.key, required this.room, required this.myId});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return LayoutBuilder(builder: (context, box) {
      // on a narrow list the status goes under the name instead of beside it
      final wide = box.maxWidth >= 480;

      Widget row(String rank, Widget player, String status, String table,
          String score, TextStyle? style) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: DefaultTextStyle.merge(
            style: style,
            child: Row(
              children: [
                SizedBox(width: 28, child: Text(rank)),
                Expanded(child: player),
                if (wide)
                  SizedBox(
                    width: 150,
                    child: Text(status, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                SizedBox(
                    width: wide ? 90 : 70,
                    child: Text(table, textAlign: TextAlign.right)),
                SizedBox(
                    width: wide ? 90 : 76,
                    child: Text(score, textAlign: TextAlign.right)),
              ],
            ),
          ),
        );
      }

      return CreamList(
        children: [
          row('#', const Text('Player'), 'Status', wide ? 'This table' : 'Table',
              'Score', const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          Divider(height: 2, thickness: 2, color: c.feltEdge.withValues(alpha: 0.4)),
          for (int i = 0; i < room.players.length; i++)
            Builder(builder: (context) {
              final p = room.players[i];
              final mine = p.userId == myId;
              final status = playerStatusText(room, p);
              return Opacity(
                opacity: p.status == PlayerStatus.eliminated ? 0.6 : 1,
                child: Container(
                  // your own row stands out, like on the leaderboard
                  color: mine
                      ? c.woodLight.withValues(alpha: 0.5)
                      : i.isEven
                          ? Colors.black.withValues(alpha: 0.05)
                          : null,
                  child: row(
                    '${p.finalRank ?? i + 1}',
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          spacing: 8,
                          children: [
                            ConnectedDot(connected: p.connected),
                            Flexible(
                              child: Text(
                                mine ? '${p.username} (you)' : p.username,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        if (!wide)
                          Text(
                            status,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.normal),
                          ),
                      ],
                    ),
                    status,
                    p.status == PlayerStatus.alive ? withCommas(p.tableChips) : '–',
                    withCommas(p.score),
                    mine ? const TextStyle(fontWeight: FontWeight.w600) : null,
                  ),
                ),
              );
            }),
        ],
      );
    });
  }
}

/// Popup with the live scoreboard, for when the game is taking up the screen
void showStandingsDialog(BuildContext context, RoomController rooms, String myId) {
  showDialog(
    context: context,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 640),
        child: Padding(
          padding: const EdgeInsets.all(14),
          // keeps up with the room while it's open
          child: ListenableBuilder(
            listenable: rooms,
            builder: (context, _) {
              final room = rooms.room;
              final stillIn = room?.players
                      .where((p) =>
                          p.status == PlayerStatus.alive ||
                          p.status == PlayerStatus.winner)
                      .length ??
                  0;
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                            room == null ? 'Standings' : 'Standings · Room ${room.code}',
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.w600)),
                      ),
                      ElevatedButton(
                        style: smallButton(),
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (room == null)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('This room is closed', textAlign: TextAlign.center),
                    )
                  else ...[
                    Text(
                      'Required this table: ${withCommas(room.requiredScore)} · '
                      'Players left: $stillIn / ${room.players.length}',
                    ),
                    const SizedBox(height: 6),
                    Flexible(
                      child: SingleChildScrollView(
                        child: Scoreboard(room: room, myId: myId),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    ),
  );
}

/// Who made it through a Table and who didn't, with the bonuses
class TableResultsCard extends StatelessWidget {
  final TableResult result;
  final String myId;
  final String? footer;

  const TableResultsCard({
    super.key,
    required this.result,
    required this.myId,
    this.footer,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);

    Widget cell(String text,
            {bool right = false, bool bold = false, Color? color, double? size}) =>
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          child: Text(
            text,
            textAlign: right ? TextAlign.right : TextAlign.left,
            style: TextStyle(
                fontWeight: bold ? FontWeight.w600 : null,
                color: color,
                fontSize: size),
          ),
        );
    String bonus(int amount) => amount > 0 ? '+${withCommas(amount)}' : '–';

    return PanelCard(
      maxWidth: 640,
      centered: false,
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Table ${result.table} results',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
            ),
            Text.rich(TextSpan(children: [
              const TextSpan(text: 'Required: '),
              _b(withCommas(result.requiredScore)),
            ])),
          ],
        ),
        // scrolls sideways when the card is too narrow for every column
        LayoutBuilder(
          builder: (context, box) => SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: max(box.maxWidth, 470),
              child: Table(
                columnWidths: const {
                  0: FlexColumnWidth(3),
                  1: IntrinsicColumnWidth(),
                  2: IntrinsicColumnWidth(),
                  3: IntrinsicColumnWidth(),
                  4: IntrinsicColumnWidth(),
                  5: FlexColumnWidth(4),
                },
                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                children: [
                  TableRow(
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                            color: c.feltEdge.withValues(alpha: 0.4), width: 2),
                      ),
                    ),
                    children: [
                      cell('Player', bold: true, size: 13),
                      cell('Chips', right: true, bold: true, size: 13),
                      cell('Place', right: true, bold: true, size: 13),
                      cell('Time', right: true, bold: true, size: 13),
                      cell('Total', right: true, bold: true, size: 13),
                      cell('Result', bold: true, size: 13),
                    ],
                  ),
                  for (int i = 0; i < result.entries.length; i++)
                    TableRow(
                      decoration: BoxDecoration(
                        color: i.isEven ? Colors.black.withValues(alpha: 0.05) : null,
                      ),
                      children: () {
                        final e = result.entries[i];
                        final mine = e.userId == myId;
                        return [
                          cell(
                              e.place != null
                                  ? '${e.username} (${numberEnding(e.place!)})'
                                  : e.username,
                              bold: mine),
                          cell(withCommas(e.tableChips), right: true, bold: mine),
                          cell(bonus(e.placeBonus), right: true, bold: mine),
                          cell(bonus(e.timeBonus), right: true, bold: mine),
                          cell(withCommas(e.tableScore), right: true, bold: true),
                          cell(outcomeText[e.outcome] ?? '',
                              bold: mine,
                              color: e.outcome == Outcome.passed ? null : c.danger),
                        ];
                      }(),
                    ),
                ],
              ),
            ),
          ),
        ),
        if (footer != null) ...[
          const SizedBox(height: 4),
          Text(footer!,
              textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
        ],
      ],
    );
  }
}

String _savedText(RoomPlayer me) => me.leaderboardRank != null
    ? 'Saved! Leaderboard rank #${withCommas(me.leaderboardRank!)}'
    : 'Saving your score…';

/// The end of the tournament: who won and where this player placed
class FinalStandings extends StatelessWidget {
  final Room room;
  final RoomPlayer me;
  final VoidCallback onExit;

  const FinalStandings({
    super.key,
    required this.room,
    required this.me,
    required this.onExit,
  });

  @override
  Widget build(BuildContext context) {
    RoomPlayer? winner;
    for (final p in room.players) {
      if (p.status == PlayerStatus.winner) winner = p;
    }
    final headline = winner == null
        ? 'No winner'
        : winner.userId == me.userId
            ? 'You won!'
            : '${winner.username} wins!';

    return PanelCard(
      children: [
        const Text('TOURNAMENT OVER', style: _smallCaps),
        Text(headline,
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w600)),
        Text.rich(TextSpan(children: [
          const TextSpan(text: 'You placed '),
          _b(numberEnding(me.finalRank ?? room.players.length)),
          const TextSpan(text: ' with '),
          _b(withCommas(me.score)),
          TextSpan(
              text: ' (${withCommas(me.chips)} chips + ${withCommas(me.bonus)} bonus).'),
        ])),
        Text(_savedText(me), style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        ElevatedButton(onPressed: onExit, child: const Text('Back to rooms')),
      ],
    );
  }
}

/// Shown to a player who has been knocked out while the others play on
class OutPanel extends StatelessWidget {
  final RoomPlayer me;
  final VoidCallback onExit;

  const OutPanel({super.key, required this.me, required this.onExit});

  @override
  Widget build(BuildContext context) {
    final outcome = me.outcome;
    return PanelCard(
      children: [
        Text(outcome == Outcome.left ? 'You left the game' : "You're out",
            style: panelTitle),
        if (outcome != null && outcome != Outcome.left)
          Text('${outcomeText[outcome]} at Table ${me.eliminatedAtTable}.'),
        const SizedBox(height: 4),
        const Text('FINAL SCORE', style: _smallCaps),
        Text(withCommas(me.score),
            style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w600)),
        Text('${withCommas(me.chips)} chips + ${withCommas(me.bonus)} bonus',
            style: const TextStyle(fontSize: 13)),
        Text(_savedText(me), style: const TextStyle(fontWeight: FontWeight.w600)),
        const Text('You can keep watching the others, or leave.',
            style: TextStyle(fontSize: 13)),
        const SizedBox(height: 4),
        ElevatedButton(onPressed: onExit, child: const Text('Leave room')),
      ],
    );
  }
}

/// A short message while there's nothing to play: a countdown, time's up...
class WaitPanel extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const WaitPanel({super.key, required this.title, this.children = const []});

  @override
  Widget build(BuildContext context) {
    return PanelCard(children: [Text(title, style: panelTitle), ...children]);
  }
}
