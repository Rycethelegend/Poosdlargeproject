import 'package:flutter/material.dart';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/hands_dialog.dart';
import 'package:poosdalatro/game/round_view.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/run_storage.dart';
import 'package:poosdalatro/game/shop_view.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

enum _SaveStatus { idle, saving, saved, error, waiting }

/// Singleplayer: shows the rules first, then the run. The run is saved on the
/// phone after every move, so leaving and coming back picks up where it was.
class SingleplayerScreen extends StatefulWidget {
  const SingleplayerScreen({super.key});

  @override
  State<SingleplayerScreen> createState() => _SingleplayerScreenState();
}

class _SingleplayerScreenState extends State<SingleplayerScreen> {
  RunState? _run;
  bool _loading = true;
  bool _showIntro = true;
  String _saveError = '';

  @override
  void initState() {
    super.initState();
    Connection.online.addListener(_onConnectionChange);
    _load();
  }

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
    Connection.online.removeListener(_onConnectionChange);
    super.dispose();
  }

  Future<void> _load() async {
    final run = await RunStorage.loadRun();
    if (!mounted) return;
    setState(() {
      _run = run;
      _loading = false;
    });
    // a run that ended but never got its score sent (e.g. the app was closed)
    if (run != null && run.phase == Phase.gameOver && run.saved == null) {
      await RunStorage.queueScore(run);
    }
    _sendQueued();
  }

  void _onConnectionChange() {
    if (Connection.online.value) _sendQueued();
  }

  _SaveStatus get _saveStatus {
    final run = _run;
    if (run == null || run.phase != Phase.gameOver) return _SaveStatus.idle;
    if (run.saved != null) return _SaveStatus.saved;
    if (!Connection.online.value) return _SaveStatus.waiting;
    if (_saveError.isNotEmpty) return _SaveStatus.error;
    return _SaveStatus.saving;
  }

  // Sends any queued scores, including ones from earlier runs
  Future<void> _sendQueued() async {
    try {
      await RunStorage.flush((runId, saved) {
        if (!mounted || _run?.runId != runId) return;
        setState(() => _run!.saved = saved);
        RunStorage.saveRun(_run);
      });
      if (mounted) setState(() => _saveError = '');
    } catch (e) {
      if (!mounted) return;
      if (ScoresApi.isLoginExpired(e)) {
        Session.clear();
        Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
        return;
      }
      setState(() => _saveError = e is ApiException
          ? e.message
          : "Can't reach the server. Check your connection and try again.");
    }
  }

  /// Every move goes through here so it gets saved
  void _act(void Function(RunState run) action) {
    final run = _run;
    if (run == null) return;
    final wasOver = run.phase == Phase.gameOver;
    setState(() => action(run));
    RunStorage.saveRun(run);
    if (!wasOver && run.phase == Phase.gameOver) {
      RunStorage.queueScore(run).then((_) => _sendQueued());
    }
  }

  void _startRun() {
    setState(() {
      _saveError = '';
      _run = RunState.newRun();
      _showIntro = false;
    });
    RunStorage.saveRun(_run);
  }

  Future<void> _confirmGiveUp() async {
    final end = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End run?'),
        content: Text('End this run and save ${withCommas(_run!.totalScore)} chips?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep playing'),
          ),
          ElevatedButton(
            style: smallButton(),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('End run'),
          ),
        ],
      ),
    );
    if (end == true) _act((r) => r.giveUp());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _showIntro || _run == null
                  ? _intro()
                  : _game(_run!),
        ),
      ),
    );
  }

  // The rules, then Start or Continue run
  Widget _intro() {
    final c = GameColors.of(context);
    final run = _run;
    final unfinished = run != null && run.phase != Phase.gameOver ? run : null;

    final rules = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 6,
        children: [
          _bullet([
            const TextSpan(text: 'Play poker hands from your 8 cards. Each hand scores '),
            _b('chips × mult'),
            const TextSpan(text: '.'),
          ]),
          _bullet([
            const TextSpan(
                text: "Reach the round's target within 4 hands. You can discard up to 3 times to redraw."),
          ]),
          _bullet([
            const TextSpan(text: 'A '),
            _b('Table'),
            const TextSpan(text: ' is how far into the run you are. Each Table has three rounds: '),
            _b('Warm-up'),
            const TextSpan(text: ', '),
            _b('Main Event'),
            const TextSpan(text: ' and '),
            _b('High Roller'),
            const TextSpan(text: ', each with a bigger target. The High Roller also has a '),
            _b('Boss'),
            const TextSpan(text: ' that changes the rules.'),
          ]),
          _bullet([
            const TextSpan(
                text: 'Beat the High Roller to move on to the next Table, where every target is higher.'),
          ]),
          _bullet([
            const TextSpan(text: 'Spend your winnings in the shop on '),
            _b('Jokers'),
            const TextSpan(text: ' and '),
            _b('Study Guides'),
            const TextSpan(text: '.'),
          ]),
          _bullet([
            const TextSpan(
                text: 'The run ends when you miss a target. Every chip you scored goes on the leaderboard.'),
          ]),
        ],
      ),
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
        const Text('Poosdalatro',
            style: TextStyle(fontSize: 34, fontWeight: FontWeight.w600)),
        if (unfinished != null) ...[
          ElevatedButton(
            onPressed: () => setState(() => _showIntro = false),
            child: const Text('Continue run'),
          ),
          Text(
            'Table ${unfinished.table}, ${rounds[unfinished.round].name} · '
            '${withCommas(unfinished.totalScore)} chips so far',
            textAlign: TextAlign.center,
          ),
        ] else
          ElevatedButton(onPressed: _startRun, child: const Text('Start')),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Back to menu'),
        ),
      ],
    );

    return FeltPanel(
      padding: const EdgeInsets.all(14),
      child: LayoutBuilder(
        builder: (context, box) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Center(
              child: box.maxWidth >= 640
                  ? Row(
                      spacing: 20,
                      children: [
                        Expanded(child: rules),
                        SizedBox(width: 260, child: start),
                      ],
                    )
                  : Column(spacing: 14, children: [start, rules]),
            ),
          ),
        ),
      ),
    );
  }

  TextSpan _b(String text) =>
      TextSpan(text: text, style: const TextStyle(fontWeight: FontWeight.bold));

  Widget _bullet(List<InlineSpan> spans) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('•  ', style: TextStyle(fontSize: 15)),
          Expanded(
              child: Text.rich(TextSpan(children: spans),
                  style: const TextStyle(fontSize: 15))),
        ],
      );

  Widget _game(RunState run) {
    return FeltPanel(
      padding: const EdgeInsets.all(10),
      border: 8,
      child: LayoutBuilder(builder: (context, box) {
        final content = _phaseContent(run);
        if (box.maxWidth >= 640) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              SizedBox(width: 200, child: _centered(_hud(run, columns: 2))),
              // the round fills the height itself; the other phases are centered
              Expanded(
                  child: run.phase == Phase.playing ? content : _centered(content)),
            ],
          );
        }
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [_hud(run, columns: 3), content],
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

  // Vertically centered when it fits, scrolls when it doesn't
  Widget _centered(Widget child) => LayoutBuilder(
        builder: (context, box) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Center(child: child),
          ),
        ),
      );

  // Stats, progress bar and the run buttons
  Widget _hud(RunState run, {required int columns}) {
    final c = GameColors.of(context);
    final active = run.phase == Phase.playing || run.phase == Phase.shop;
    final stats = [
      Stat(label: 'Target', value: withCommas(run.target), chip: ChipColor.red),
      Stat(label: 'Score', value: withCommas(run.roundScore), chip: ChipColor.blue),
      Stat(label: 'Hands', value: '${run.handsLeft}'),
      Stat(label: 'Discards', value: '${run.discardsLeft}'),
      Stat(label: 'Money', value: '\$${run.money}', chip: ChipColor.orange),
      Stat(label: 'Run total', value: withCommas(run.totalScore), chip: ChipColor.black),
    ];
    final progress = (run.roundScore / run.target).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 6,
      children: [
        Stat(label: 'Table ${run.table}', value: rounds[run.round].name),
        for (int i = 0; i < stats.length; i += columns)
          Row(
            spacing: 6,
            children: [
              for (int j = i; j < i + columns; j++)
                Expanded(child: j < stats.length ? stats[j] : const SizedBox()),
            ],
          ),
        if (run.phase == Phase.playing)
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
        if (active)
          ElevatedButton(
            style: smallButton(),
            onPressed: () => showHandsDialog(context, run.handLevels),
            child: const Text('Poker hands'),
          ),
        Row(
          spacing: 6,
          children: [
            // Leaves the game but keeps the run for later
            Expanded(child: _hudButton(active ? 'Save & exit' : 'Back to menu',
                () => Navigator.pop(context))),
            if (active) Expanded(child: _hudButton('End run', _confirmGiveUp)),
          ],
        ),
      ],
    );
  }

  Widget _phaseContent(RunState run) {
    switch (run.phase) {
      case Phase.playing:
        return RoundView(run: run, onAction: _act);
      case Phase.shop:
        return ShopView(run: run, onAction: _act);
      case Phase.roundWon:
        return _roundWon(run);
      case Phase.gameOver:
        return _gameOver(run);
    }
  }

  Widget _creamCard(List<Widget> children) {
    final c = GameColors.of(context);
    return Center(
      child: PopIn(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 440),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: c.cream.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 6,
            children: children,
          ),
        ),
      ),
    );
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
    return _creamCard([
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
        onPressed: () => _act((r) => r.collectReward()),
        child: Text('Collect \$${reward.total} and go to the shop', textAlign: TextAlign.center),
      ),
    ]);
  }

  Widget _gameOver(RunState run) {
    final status = _saveStatus;
    final last = run.lastPlay;
    return _creamCard([
      const Text('Run over',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w600)),
      Text(
        run.gaveUp
            ? 'You ended the run.'
            : 'You needed ${withCommas(run.target)} chips and scored ${withCommas(run.roundScore)}.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 4),
      const Text('FINAL SCORE',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, letterSpacing: 1)),
      Text(withCommas(run.totalScore),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w600)),
      Text('Reached Table ${run.table}, ${rounds[run.round].name}',
          textAlign: TextAlign.center),
      if (last != null)
        Text(
          'Best hand: ${withCommas(run.bestHand)} chips · Last hand: ${hands[last.handType]!.name}',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13),
        ),
      const SizedBox(height: 4),
      if (status == _SaveStatus.saving)
        const Text('Saving your score…', textAlign: TextAlign.center),
      if (run.saved != null)
        Text(
          'Saved! Leaderboard rank #${withCommas(run.saved!.rank)} · Your best: ${withCommas(run.saved!.bestScore)}',
          textAlign: TextAlign.center,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      if (status == _SaveStatus.waiting)
        const FormMessage(
            info: "You're offline. Your score is kept on this phone and goes on "
                "the leaderboard once you're back online."),
      if (status == _SaveStatus.error) ...[
        FormMessage(error: '$_saveError\nYour score is kept on this phone and will be sent again.'),
        TextButton(onPressed: _sendQueued, child: const Text('Try again')),
      ],
      const SizedBox(height: 4),
      ElevatedButton(
        onPressed: status == _SaveStatus.saving ? null : _startRun,
        child: const Text('New run'),
      ),
    ]);
  }
}
