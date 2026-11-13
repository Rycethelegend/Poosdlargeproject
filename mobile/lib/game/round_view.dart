import 'dart:math';
import 'package:flutter/material.dart';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/utils/app_theme.dart';

/// The playing phase: hand of cards, Play / Discard, and what the last hand scored.
/// With a fixed height it fills it, sizing the cards to fit; otherwise it scrolls.
class RoundView extends StatefulWidget {
  final RunState run;
  final void Function(void Function(RunState run) action) onAction;

  const RoundView({super.key, required this.run, required this.onAction});

  @override
  State<RoundView> createState() => _RoundViewState();
}

class _RoundViewState extends State<RoundView> {
  bool _showSteps = false;

  RunState get run => widget.run;

  void _toggle(String id) => widget.onAction((r) => r.toggleSelect(id));

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, box) {
      final fill = box.hasBoundedHeight && box.maxHeight >= 260;
      final maxForWidth = min(110.0, box.maxWidth / 8.6);
      double cardWidth;
      if (fill) {
        // everything that isn't a card row, then two rows of cards share the rest
        final fixed = 22 + 36 + 44 + 56 + 32 +
            (run.selected.length >= run.rules.maxSelect ? 18 : 0);
        cardWidth = ((box.maxHeight - fixed) / (8 / 3)).clamp(34.0, maxForWidth);
      } else {
        final size = MediaQuery.sizeOf(context);
        cardWidth = min(size.width * 0.08, size.height * 0.15).clamp(34.0, maxForWidth);
      }
      return _layout(context, cardWidth, fill);
    });
  }

  Widget _layout(BuildContext context, double cardWidth, bool fill) {
    final c = GameColors.of(context);
    final rules = run.rules;
    final selected = run.selectedCards;
    final preview = run.scorePlay(selected);
    // Selected cards move up to the middle; the rest stay in the hand
    final hand = sortCards(
        run.hand.where((card) => !run.selected.contains(card.id)).toList(),
        run.sortMode);
    final inPlay = sortCards(selected, run.sortMode);
    final partOfHand =
        evaluateHand(selected)?.scoring.map((card) => card.id).toSet() ?? {};

    Widget middle;
    if (preview != null) {
      Widget cards(double width) => Row(
            mainAxisSize: MainAxisSize.min,
            spacing: 6,
            children: [
              for (final card in inPlay) _selectedCard(card, partOfHand, preview, width),
            ],
          );
      final info = Column(
        mainAxisSize: MainAxisSize.min,
        spacing: 4,
        children: [
          Text.rich(TextSpan(children: [
            TextSpan(
                text: hands[preview.handType]!.name,
                style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600)),
            TextSpan(
                text: '  level ${preview.level}',
                style: TextStyle(fontSize: 14, color: c.ink.withValues(alpha: 0.7))),
          ])),
          ChipsTimesMult(chips: preview.chips, mult: preview.mult, big: true),
          Text.rich(TextSpan(
            style: const TextStyle(fontSize: 17),
            children: [
              const TextSpan(text: '= '),
              TextSpan(
                  text: withCommas(preview.score),
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const TextSpan(text: ' chips'),
            ],
          )),
        ],
      );
      middle = fill
          // the selected cards get as big as the box allows, up to the hand's size
          ? LayoutBuilder(
              builder: (context, box) => FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(mainAxisSize: MainAxisSize.min, spacing: 24, children: [
                  cards(((box.maxHeight - 40) * 0.75).clamp(24.0, cardWidth)),
                  info,
                ]),
              ),
            )
          : Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 20,
              runSpacing: 8,
              children: [cards(cardWidth), info],
            );
    } else if (run.lastPlay != null) {
      middle = PopIn(key: ValueKey(run.handsPlayedRun), child: _lastHand(run.lastPlay!));
      if (fill) middle = SingleChildScrollView(child: middle);
    } else {
      middle = Text('Pick up to ${rules.maxSelect} cards to make a poker hand.',
          textAlign: TextAlign.center, style: const TextStyle(fontSize: 17));
    }

    final previewBox = Container(
      constraints: fill ? null : BoxConstraints(minHeight: cardWidth * 4 / 3 + 50),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: Alignment.center,
      child: middle,
    );

    final handRow = SizedBox(
      height: cardWidth * 4 / 3,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 6,
          children: [
            for (final card in hand)
              GestureDetector(
                onTap: () => _toggle(card.id),
                child: CardFace(card: card, width: cardWidth),
              ),
          ],
        ),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: fill ? MainAxisSize.max : MainAxisSize.min,
      spacing: 8,
      children: [
        if (rules.activeBoss != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: c.danger, borderRadius: BorderRadius.circular(16)),
            child: Center(
              child: BossLabel(
                  bossId: rules.activeBoss!, prefix: 'Boss', color: const Color(0xFFF2E8CF)),
            ),
          )
        else
          Center(child: BossLabel(bossId: run.boss, prefix: "This table's High Roller boss:")),
        JokerRow(owned: run.jokers, compact: true),
        if (fill) Expanded(child: previewBox) else previewBox,
        handRow,
        if (run.selected.length >= rules.maxSelect)
          const Text("That's the most cards you can play at once.",
              textAlign: TextAlign.center, style: TextStyle(fontSize: 13)),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            ElevatedButton(
              style: smallButton(background: c.chips, foreground: Colors.white),
              onPressed: selected.isEmpty ? null : () => widget.onAction((r) => r.play()),
              child: const Text('Play Hand'),
            ),
            ElevatedButton(
              style: smallButton(background: c.mult, foreground: Colors.white),
              onPressed: selected.isEmpty || run.discardsLeft == 0
                  ? null
                  : () => widget.onAction((r) => r.discard()),
              child: Text('Discard (${run.discardsLeft})'),
            ),
            Row(mainAxisSize: MainAxisSize.min, spacing: 6, children: [
            const Text('Sort', style: TextStyle(fontWeight: FontWeight.w600)),
            SegmentedButton<SortMode>(
              showSelectedIcon: false,
              style: const ButtonStyle(visualDensity: VisualDensity.compact),
              segments: const [
                ButtonSegment(value: SortMode.rank, label: Text('Rank')),
                ButtonSegment(value: SortMode.suit, label: Text('Suit')),
              ],
              selected: {run.sortMode},
              onSelectionChanged: (s) => widget.onAction((r) => r.sort(s.first)),
            ),
            ]),
            Tooltip(
              message: 'Cards left in the deck',
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: 4,
                children: [
                  const DeckBox(width: 28),
                  Text('${run.drawPile.length}',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  // A selected card with what it adds above it. Tap it to put it back.
  Widget _selectedCard(PlayingCard card, Set<String> partOfHand,
      PlayResult preview, double width) {
    final c = GameColors.of(context);
    final String text;
    final Color color;
    if (preview.scoringIds.contains(card.id)) {
      text = '+${cardChips(card)}';
      color = c.chips;
    } else if (partOfHand.contains(card.id)) {
      text = 'Blocked';
      color = c.danger;
    } else {
      text = 'No chips';
      color = Colors.black.withValues(alpha: 0.4);
    }

    return GestureDetector(
      onTap: () => _toggle(card.id),
      child: PopIn(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 4,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8)),
              child: Column(
                children: [
                  Text(text,
                      style: const TextStyle(
                          color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  Text('${suitSymbol[card.suit]} ${suitName(card.suit)}',
                      style: const TextStyle(color: Colors.white, fontSize: 10)),
                ],
              ),
            ),
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(width * 0.1),
                border: Border.all(color: c.money, width: 3),
              ),
              child: CardFace(card: card, width: width),
            ),
          ],
        ),
      ),
    );
  }

  Widget _lastHand(PlayResult last) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      spacing: 6,
      children: [
        Text.rich(
          TextSpan(children: [
            const TextSpan(text: 'Last hand: '),
            TextSpan(
                text: hands[last.handType]!.name,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const TextSpan(text: ' scored '),
            TextSpan(
                text: withCommas(last.score),
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ]),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 17),
        ),
        TextButton(
          style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          onPressed: () => setState(() => _showSteps = !_showSteps),
          child: Text(_showSteps ? 'Hide how it scored' : 'How it scored'),
        ),
        if (_showSteps)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              children: [
                for (final step in last.steps) _stepRow(step.source, stepText(step)),
                const Divider(height: 6),
                _stepRow('Total', '${withCommas(last.chips)} × ${formatMult(last.mult)}',
                    bold: true),
              ],
            ),
          ),
      ],
    );
  }

  Widget _stepRow(String left, String right, {bool bold = false}) {
    final style = TextStyle(fontSize: 13, fontWeight: bold ? FontWeight.w600 : null);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        children: [
          Expanded(child: Text(left, style: style)),
          Text(right, style: style),
        ],
      ),
    );
  }
}
