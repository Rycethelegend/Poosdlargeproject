import 'dart:math';

import 'package:flutter/material.dart';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/hands_dialog.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/game/sprites.dart';
import 'package:poosdalatro/utils/app_theme.dart';

const double _badgeHeight = 36;
const double _selectedScale =
    0.7; // selected cards on the table are a bit smaller

/// The playing phase: jokers across the top, then the table where selected
/// cards go (with what they score), the hand, and Play / Discard.
/// With a fixed height it sizes the cards to fill it; otherwise it scrolls.
class RoundView extends StatelessWidget {
  final RunState run;
  final void Function(void Function(RunState run) action) onAction;

  const RoundView({super.key, required this.run, required this.onAction});

  void _toggle(String id) => onAction((r) => r.toggleSelect(id));

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, box) {
        final jokerRow = JokerRow(
          owned: run.jokers,
          compact: true,
          extra: ElevatedButton(
            style: smallButton(),
            onPressed: () => showHandsDialog(context, run.handLevels),
            child: const Text('Poker hands'),
          ),
        );
        double maxCard(double width) => min(120.0, width / 8.6);

        if (box.hasBoundedHeight && box.maxHeight >= 240) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 8,
            children: [
              jokerRow,
              // the table and hand share whatever height is left after the jokers
              Expanded(
                child: LayoutBuilder(
                  builder: (context, rest) {
                    // table at least 0.7 card + badge + padding, hand = 1 card, then the buttons
                    final cardHeight =
                        (rest.maxHeight - 112) / (1 + _selectedScale);
                    final cardWidth = (cardHeight * 0.75).clamp(
                      34.0,
                      maxCard(rest.maxWidth),
                    );
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: 8,
                      children: [
                        // takes any spare height so nothing is left empty
                        Expanded(child: _table(context, cardWidth, fill: true)),
                        _hand(cardWidth),
                        _buttons(context),
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        }

        final size = MediaQuery.sizeOf(context);
        final cardWidth = min(
          size.width * 0.08,
          size.height * 0.15,
        ).clamp(34.0, maxCard(box.maxWidth));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          spacing: 10,
          children: [
            jokerRow,
            _table(context, cardWidth),
            _hand(cardWidth),
            _buttons(context),
          ],
        );
      },
    );
  }

  // With fill, the table takes all the height it's given and the cards on it
  // grow to match, up to the size of the hand's cards
  Widget _table(BuildContext context, double cardWidth, {bool fill = false}) {
    if (!fill) return _tableBox(context, cardWidth * _selectedScale);
    return LayoutBuilder(
      builder: (context, box) {
        final width = ((box.maxHeight - _badgeHeight - 16) * 0.75).clamp(
          cardWidth * _selectedScale,
          cardWidth,
        );
        return _tableBox(context, width, fixedHeight: false);
      },
    );
  }

  // The selected cards with what each adds and what the hand scores, or the
  // last hand's result, or a hint
  Widget _tableBox(
    BuildContext context,
    double selectedWidth, {
    bool fixedHeight = true,
  }) {
    final c = GameColors.of(context);
    final rules = run.rules;
    final selected = sortCards(run.selectedCards, run.sortMode);
    final preview = run.scorePlay(selected);
    final last = run.lastPlay;

    Widget content;
    if (preview != null) {
      final partOfHand =
          evaluateHand(selected)?.scoring.map((card) => card.id).toSet() ?? {};
      content = Row(
        mainAxisSize: MainAxisSize.min,
        spacing: 20,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            spacing: 6,
            children: [
              for (final card in selected)
                _selectedCard(
                  context,
                  card,
                  selectedWidth,
                  _badge(context, card, partOfHand, preview),
                ),
            ],
          ),
          // cream box so the score stands out on the felt
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: c.cream.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 4,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: hands[preview.handType]!.name,
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextSpan(
                        text: '  level ${preview.level}',
                        style: TextStyle(
                          fontSize: 13,
                          color: c.ink.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                ChipsTimesMult(
                  chips: preview.chips,
                  mult: preview.mult,
                  big: true,
                ),
                Text.rich(
                  TextSpan(
                    style: const TextStyle(fontSize: 17),
                    children: [
                      const TextSpan(text: '= '),
                      TextSpan(
                        text: withCommas(preview.score),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const TextSpan(text: ' chips'),
                    ],
                  ),
                ),
                if (run.selected.length >= rules.maxSelect)
                  const Text(
                    "That's the most cards you can play at once.",
                    style: TextStyle(fontSize: 12),
                  ),
              ],
            ),
          ),
        ],
      );
    } else if (last != null) {
      content = PopIn(
        key: ValueKey(run.handsPlayedRun),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 6,
          children: [
            Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: 'Last hand: '),
                  TextSpan(
                    text: hands[last.handType]!.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const TextSpan(text: ' scored '),
                  TextSpan(
                    text: withCommas(last.score),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              style: const TextStyle(fontSize: 17),
            ),
            TextButton(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                textStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onPressed: () => _showSteps(context, last),
              child: const Text('How it scored'),
            ),
          ],
        ),
      );
    } else {
      content = Text(
        'Pick up to ${rules.maxSelect} cards to make a poker hand.',
        style: const TextStyle(fontSize: 17),
      );
    }

    return Container(
      height: fixedHeight
          ? selectedWidth * 4 / 3 + _badgeHeight + 4 + 12
          : null,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: FittedBox(fit: BoxFit.scaleDown, child: content),
      ),
    );
  }

  // A card on the table with what it adds above it. Tap it to put it back.
  Widget _selectedCard(
    BuildContext context,
    PlayingCard card,
    double width,
    Widget badge,
  ) {
    final c = GameColors.of(context);
    return GestureDetector(
      onTap: () => _toggle(card.id),
      child: PopIn(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 4,
          children: [
            // at least as wide as the card; a bit wider on small cards so the text stays readable
            SizedBox(width: max(width, 62), height: _badgeHeight, child: badge),
            Container(
              foregroundDecoration: BoxDecoration(
                borderRadius: BorderRadius.circular(width * 0.08),
                border: Border.all(color: c.money, width: 3),
              ),
              child: CardFace(card: card, width: width),
            ),
          ],
        ),
      ),
    );
  }

  // What a selected card adds: its chips, or why it adds none
  Widget _badge(
    BuildContext context,
    PlayingCard card,
    Set<String> partOfHand,
    PlayResult preview,
  ) {
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
      color = Colors.black.withValues(alpha: 0.45);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      // shrinks the text only if the card is too narrow for it
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Column(
          children: [
            Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${suitSymbol[card.suit]} ${suitName(card.suit)}',
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  // The cards still in the hand. Tap one to move it to the table.
  Widget _hand(double cardWidth) {
    final hand = sortCards(
      run.hand.where((card) => !run.selected.contains(card.id)).toList(),
      run.sortMode,
    );
    return SizedBox(
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
  }

  Widget _buttons(BuildContext context) {
    final c = GameColors.of(context);
    final nothingSelected = run.selected.isEmpty;
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        ElevatedButton(
          style: smallButton(background: c.chips, foreground: Colors.white),
          onPressed: nothingSelected ? null : () => onAction((r) => r.play()),
          child: const Text('Play Hand'),
        ),
        ElevatedButton(
          style: smallButton(background: c.mult, foreground: Colors.white),
          onPressed: nothingSelected || run.discardsLeft == 0
              ? null
              : () => onAction((r) => r.discard()),
          child: Text('Discard (${run.discardsLeft})'),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 6,
          children: [
            const Text('Sort', style: TextStyle(fontWeight: FontWeight.w600)),
            // wide segments so Rank and Suit are hard to mix up
            SizedBox(
              width: 190,
              child: SegmentedButton<SortMode>(
                showSelectedIcon: false,
                style: const ButtonStyle(visualDensity: VisualDensity.compact),
                segments: const [
                  ButtonSegment(value: SortMode.rank, label: Text('Rank')),
                  ButtonSegment(value: SortMode.suit, label: Text('Suit')),
                ],
                selected: {run.sortMode},
                onSelectionChanged: (s) => onAction((r) => r.sort(s.first)),
              ),
            ),
          ],
        ),
        Tooltip(
          message: 'Cards left in the deck',
          child: Row(
            mainAxisSize: MainAxisSize.min,
            spacing: 4,
            children: [
              const DeckBox(width: 28),
              // bigger count on cream so it's easy to spot
              CreamPill(
                child: Text(
                  '${run.drawPile.length}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Popup with every step of how the last hand scored
  void _showSteps(BuildContext context, PlayResult last) {
    Widget row(String left, String right, {bool bold = false}) {
      final style = TextStyle(
        fontSize: 14,
        fontWeight: bold ? FontWeight.w600 : null,
      );
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            Expanded(child: Text(left, style: style)),
            Text(right, style: style),
          ],
        ),
      );
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          '${hands[last.handType]!.name} scored ${withCommas(last.score)}',
        ),
        content: SizedBox(
          width: 380,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final step in last.steps) row(step.source, stepText(step)),
                const Divider(height: 8),
                row(
                  'Total',
                  '${withCommas(last.chips)} × ${formatMult(last.mult)}',
                  bold: true,
                ),
              ],
            ),
          ),
        ),
        actions: [
          ElevatedButton(
            style: smallButton(),
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
