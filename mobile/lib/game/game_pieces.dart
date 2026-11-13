import 'package:flutter/material.dart';
import 'package:poosdalatro/game/data/jokers.dart';
import 'package:poosdalatro/game/jokers.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/utils/app_theme.dart';

String withCommas(num n) => n
    .toInt()
    .toString()
    .replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

String formatMult(double mult) =>
    mult == mult.roundToDouble() ? '${mult.toInt()}' : mult.toStringAsFixed(1);

String stepText(ScoreStep step) {
  final parts = <String>[
    if (step.chips != 0) '+${step.chips} chips',
    if (step.mult != 0) '+${formatMult(step.mult)} mult',
    if (step.xmult != 0) '×${formatMult(step.xmult)} mult',
  ];
  return parts.isEmpty ? 'no effect' : parts.join(', ');
}

/// Smaller wood button for the game
ButtonStyle smallButton({Color? background, Color? foreground}) =>
    ElevatedButton.styleFrom(
      backgroundColor: background,
      foregroundColor: foreground,
      disabledBackgroundColor: background?.withValues(alpha: 0.5),
      disabledForegroundColor: foreground?.withValues(alpha: 0.7),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      minimumSize: const Size(0, 36),
      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    );

/// Scales in when it first appears, like the web's popIn
class PopIn extends StatelessWidget {
  final Widget child;
  const PopIn({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.85, end: 1),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutBack,
      builder: (context, value, child) => Transform.scale(
        scale: value,
        child: Opacity(opacity: ((value - 0.85) / 0.15).clamp(0, 1), child: child),
      ),
      child: child,
    );
  }
}

/// Cream box with a label and a value, with an optional chip next to it
class Stat extends StatelessWidget {
  final String label;
  final String value;
  final ChipColor? chip;

  const Stat({super.key, required this.label, required this.value, this.chip});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          if (chip != null) ...[
            ChipStack(color: chip!, height: 1, width: 16),
            const SizedBox(width: 6),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 0.8,
                        color: c.ink.withValues(alpha: 0.7))),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(value,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The blue chips × red mult display
class ChipsTimesMult extends StatelessWidget {
  final int chips;
  final double mult;
  final bool big;

  const ChipsTimesMult(
      {super.key, required this.chips, required this.mult, this.big = false});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    Widget box(String text, Color color) => Container(
          padding: EdgeInsets.symmetric(horizontal: big ? 14 : 10, vertical: 2),
          decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(12)),
          child: Text(text,
              style: TextStyle(
                  color: Colors.white,
                  fontSize: big ? 22 : 16,
                  fontWeight: FontWeight.w600)),
        );
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 8,
      children: [
        box(withCommas(chips), c.chips),
        const Text('×', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
        box(formatMult(mult), c.mult),
      ],
    );
  }
}

class JokerCard extends StatelessWidget {
  final JokerInfo joker;
  final Widget? footer;

  const JokerCard({super.key, required this.joker, this.footer});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      width: 150,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: c.cream,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(blurRadius: 4, color: Colors.black26, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 6,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 8,
            children: [
              PixelImage(joker.image, width: 36),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(joker.name,
                        style: const TextStyle(fontWeight: FontWeight.w600, height: 1.1)),
                    const SizedBox(height: 2),
                    Text(joker.description,
                        style: const TextStyle(fontSize: 12, height: 1.2)),
                  ],
                ),
              ),
            ],
          ),
          ?footer,
        ],
      ),
    );
  }
}

/// A Boss's picture, name and description
class BossLabel extends StatelessWidget {
  final String bossId;
  final String prefix;
  final Color? color;

  const BossLabel(
      {super.key, required this.bossId, required this.prefix, this.color});

  @override
  Widget build(BuildContext context) {
    final boss = bossesById[bossId];
    if (boss == null) return const SizedBox.shrink();
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 8,
      children: [
        PixelImage(boss.image, width: 22),
        Flexible(
          child: Text.rich(
            TextSpan(children: [
              TextSpan(text: '$prefix '),
              TextSpan(
                  text: boss.name,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              TextSpan(text: ': ${boss.description}'),
            ]),
            style: TextStyle(color: color),
          ),
        ),
      ],
    );
  }
}

/// The jokers the player owns, in a row that scrolls sideways
class JokerRow extends StatelessWidget {
  final List<OwnedJoker> owned;
  final Widget Function(OwnedJoker joker)? footer;
  final bool compact; // small tiles, tap one to see what it does

  const JokerRow(
      {super.key, required this.owned, this.footer, this.compact = false});

  Widget _tile(BuildContext context, JokerInfo joker) {
    final c = GameColors.of(context);
    return Tooltip(
      message: joker.description,
      triggerMode: TooltipTriggerMode.tap,
      showDuration: const Duration(seconds: 3),
      child: Container(
        padding: const EdgeInsets.fromLTRB(4, 4, 10, 4),
        decoration: BoxDecoration(
          color: c.cream,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [BoxShadow(blurRadius: 3, color: Colors.black26, offset: Offset(0, 1))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 6,
          children: [
            PixelImage(joker.image, width: 24),
            Text(joker.name,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final label = Text('Jokers ${owned.length}/$maxJokers',
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600));
    // one line: the count, then the tiles
    if (compact) {
      return Row(
        spacing: 8,
        children: [
          label,
          Expanded(
            child: owned.isEmpty
                ? const Text('No jokers yet. Buy them in the shop after a round.',
                    style: TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(spacing: 8, children: [
                      for (final j in owned) _tile(context, jokersById[j.id]!),
                    ]),
                  ),
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 4,
      children: [
        label,
        if (owned.isEmpty)
          const Text('No jokers yet. Buy them in the shop after a round.',
              style: TextStyle(fontSize: 13))
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8,
              children: [
                for (final j in owned)
                  JokerCard(joker: jokersById[j.id]!, footer: footer?.call(j)),
              ],
            ),
          ),
      ],
    );
  }
}
