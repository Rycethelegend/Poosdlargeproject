import 'dart:math';

import 'package:flutter/material.dart';
import 'package:poosdalatro/game/data/jokers.dart';
import 'package:poosdalatro/game/jokers.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/utils/app_theme.dart';

String withCommas(num n) => n.toInt().toString().replaceAllMapped(
  RegExp(r'\B(?=(\d{3})+(?!\d))'),
  (m) => ',',
);

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
        child: Opacity(
          opacity: ((value - 0.85) / 0.15).clamp(0, 1),
          child: child,
        ),
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
                Text(
                  label.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 0.8,
                    color: c.ink.withValues(alpha: 0.7),
                  ),
                ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
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

  const ChipsTimesMult({
    super.key,
    required this.chips,
    required this.mult,
    this.big = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    Widget box(String text, Color color) => Container(
      padding: EdgeInsets.symmetric(horizontal: big ? 14 : 10, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white,
          fontSize: big ? 22 : 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 8,
      children: [
        box(withCommas(chips), c.chips),
        const Text(
          '×',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        box(formatMult(mult), c.mult),
      ],
    );
  }
}

class JokerCard extends StatelessWidget {
  final JokerInfo joker;
  final Widget? footer;
  final double width;
  final bool large; // bigger picture and text, for the popup

  const JokerCard({
    super.key,
    required this.joker,
    this.footer,
    this.width = 150,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      width: width,
      padding: EdgeInsets.all(large ? 18 : 8),
      decoration: BoxDecoration(
        color: c.cream,
        borderRadius: BorderRadius.circular(large ? 24 : 16),
        boxShadow: const [
          BoxShadow(blurRadius: 4, color: Colors.black26, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 6,
        children: [
          Row(
            crossAxisAlignment: large ? CrossAxisAlignment.center : CrossAxisAlignment.start,
            spacing: large ? 16 : 8,
            children: [
              PixelImage(joker.image, width: large ? 120 : 36),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      joker.name,
                      style: TextStyle(
                        fontSize: large ? 24 : 14,
                        fontWeight: FontWeight.w600,
                        height: 1.1,
                      ),
                    ),
                    SizedBox(height: large ? 8 : 2),
                    Text(
                      joker.description,
                      style: TextStyle(fontSize: large ? 18 : 12, height: 1.25),
                    ),
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

  const BossLabel({
    super.key,
    required this.bossId,
    required this.prefix,
    this.color,
  });

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
            TextSpan(
              children: [
                TextSpan(text: '$prefix '),
                TextSpan(
                  text: boss.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: ': ${boss.description}'),
              ],
            ),
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
  final bool compact; // count on the left instead of above
  final Widget? extra; // shown under the count in compact mode

  const JokerRow({
    super.key,
    required this.owned,
    this.footer,
    this.compact = false,
    this.extra,
  });

  @override
  Widget build(BuildContext context) {
    final label = Text(
      'Jokers ${owned.length}/$maxJokers',
      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
    );
    // the count, then the cards beside it
    if (compact) {
      return Row(
        spacing: 8,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 6,
            children: [
              CreamPill(child: label),
              ?extra,
            ],
          ),
          Expanded(
            child: owned.isEmpty
                ? const Align(
                    alignment: Alignment.centerLeft,
                    child: CreamPill(
                      child: Text(
                        'No jokers yet. Buy them in the shop after a round.',
                        style: TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                // full cards share the width when they fit at a readable size;
                // otherwise small tiles that open the full card when tapped
                : LayoutBuilder(
                    builder: (context, box) {
                      const gap = 8.0;
                      final n = owned.length;
                      final each = (box.maxWidth - gap * (n - 1)) / n;
                      return Row(
                        spacing: gap,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          for (final j in owned)
                            each >= 140
                                ? GestureDetector(
                                    onTap: () => showJokerPopup(
                                      context,
                                      jokersById[j.id]!,
                                      heroTag: 'joker-${j.uid}',
                                    ),
                                    child: Hero(
                                      tag: 'joker-${j.uid}',
                                      flightShuttleBuilder: jokerFlight,
                                      child: Material(
                                        type: MaterialType.transparency,
                                        child: JokerCard(
                                          joker: jokersById[j.id]!,
                                          width: min(230.0, each),
                                        ),
                                      ),
                                    ),
                                  )
                                : SizedBox(
                                    width: each,
                                    child: _JokerTile(
                                      joker: jokersById[j.id]!,
                                      heroTag: 'joker-${j.uid}',
                                    ),
                                  ),
                        ],
                      );
                    },
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
          const Text(
            'No jokers yet. Buy them in the shop after a round.',
            style: TextStyle(fontSize: 13),
          )
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

/// Light cream backing so small text stands out on the felt
class CreamPill extends StatelessWidget {
  final Widget child;
  const CreamPill({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

/// The boss in play (red) or the one coming at this table's High Roller
class BossBanner extends StatelessWidget {
  final RunState run;
  final bool small; // smaller text for the narrow stats column
  const BossBanner({super.key, required this.run, this.small = false});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final activeBoss = run.rules.activeBoss;
    final Widget banner;
    if (activeBoss != null) {
      banner = Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: c.danger,
          borderRadius: BorderRadius.circular(14),
        ),
        child: BossLabel(
          bossId: activeBoss,
          prefix: 'Boss',
          color: const Color(0xFFF2E8CF),
        ),
      );
    } else {
      banner = CreamPill(
        child: BossLabel(
          bossId: run.boss,
          prefix: small
              ? 'High Roller boss:'
              : "This table's High Roller boss:",
        ),
      );
    }
    return small
        ? DefaultTextStyle.merge(
            style: const TextStyle(fontSize: 13),
            child: banner,
          )
        : banner;
  }
}

/// Small joker for tight screens: picture and name, tap for the full card
class _JokerTile extends StatelessWidget {
  final JokerInfo joker;
  final Object heroTag;
  const _JokerTile({required this.joker, required this.heroTag});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Hero(
      tag: heroTag,
      flightShuttleBuilder: jokerFlight,
      child: Material(
        color: c.cream,
        borderRadius: BorderRadius.circular(12),
        elevation: 2,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => showJokerPopup(context, joker, heroTag: heroTag),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(4, 4, 6, 4),
            child: Row(
              spacing: 4,
              children: [
                PixelImage(joker.image, width: 22),
                Expanded(
                  child: Text(
                    joker.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.1,
                    ),
                  ),
                ),
                Icon(
                  Icons.info_outline,
                  size: 14,
                  color: c.ink.withValues(alpha: 0.6),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A big version of a joker card, in case the small one is hard to read.
/// With a heroTag the card grows out of the one that was tapped.
void showJokerPopup(BuildContext context, JokerInfo joker, {Object? heroTag}) {
  Navigator.of(context).push(
    PageRouteBuilder(
      opaque: false,
      barrierDismissible: true,
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      reverseTransitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, _, _) =>
          _JokerPopup(joker: joker, heroTag: heroTag),
      transitionsBuilder: (context, animation, _, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOut,
        );
        // the hero flies on its own; this fades in the close button (and
        // scales the card when there's no hero to fly from)
        return FadeTransition(
          opacity: curved,
          child: heroTag == null
              ? ScaleTransition(
                  scale: Tween(begin: 0.85, end: 1.0).animate(curved),
                  child: child,
                )
              : child,
        );
      },
    ),
  );
}

class _JokerPopup extends StatelessWidget {
  final JokerInfo joker;
  final Object? heroTag;
  const _JokerPopup({required this.joker, this.heroTag});

  @override
  Widget build(BuildContext context) {
    final card = Material(
      type: MaterialType.transparency,
      child: JokerCard(
        joker: joker,
        width: min(480.0, MediaQuery.sizeOf(context).width - 48),
        large: true,
      ),
    );
    // tapping outside the card closes it too
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => Navigator.pop(context),
      child: Center(
        child: GestureDetector(
          onTap: () {},
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 14,
            children: [
              heroTag == null
                  ? card
                  : Hero(tag: heroTag!, flightShuttleBuilder: jokerFlight, child: card),
              ElevatedButton(
                style: smallButton(),
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// While a joker flies to or from the popup, show the big card scaled to the
/// flying size, so its text grows smoothly instead of squeezing
Widget jokerFlight(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromContext,
  BuildContext toContext,
) {
  final big = (direction == HeroFlightDirection.push ? toContext : fromContext).widget as Hero;
  return FittedBox(fit: BoxFit.contain, child: big.child);
}
