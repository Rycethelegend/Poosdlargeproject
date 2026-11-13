import 'package:flutter/material.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/jokers.dart';
import 'package:poosdalatro/game/rounds.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/utils/app_theme.dart';

/// Between rounds: buy jokers and Study Guides (hand level-ups), sell jokers, reroll
class ShopView extends StatelessWidget {
  final RunState run;
  final void Function(void Function(RunState run) action) onAction;

  const ShopView({super.key, required this.run, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final shop = run.shop!;
    final jokersFull = run.jokers.length >= maxJokers;

    // What comes after the shop
    final nextIsNewTable = run.round == highRoller;
    final nextTable = nextIsNewTable ? run.table + 1 : run.table;
    final nextRound = nextIsNewTable ? 0 : run.round + 1;

    Widget sold(double width) => Container(
      width: width,
      height: 96,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.feltEdge, width: 3),
      ),
      child: const Text('Sold'),
    );

    const heading = TextStyle(fontSize: 17, fontWeight: FontWeight.w600);

    // light cream backing so each shop section stands out on the felt
    Widget section(Widget child) => Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 14,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Shop',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600),
              ),
            ),
            ElevatedButton(
              style: smallButton(),
              onPressed: run.money < shop.rerollCost
                  ? null
                  : () => onAction((r) => r.reroll()),
              child: Text('Reroll jokers (\$${shop.rerollCost})'),
            ),
          ],
        ),

        // Jokers and Study Guides side by side when there's room
        Wrap(
          spacing: 24,
          runSpacing: 14,
          children: [
            section(
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 6,
                children: [
                  const Text('Jokers for sale', style: heading),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 10,
                    children: [
                      for (int slot = 0; slot < shop.jokerOffers.length; slot++)
                        if (shop.jokerOffers[slot] == null)
                          sold(150)
                        else
                          _jokerOffer(slot, jokersFull),
                    ],
                  ),
                ],
              ),
            ),
            section(
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 6,
                children: [
                  const Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: 'Study Guides ', style: heading),
                        TextSpan(text: '(level up a poker hand)'),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 10,
                    children: [
                      for (int slot = 0; slot < shop.studyOffers.length; slot++)
                        if (shop.studyOffers[slot] == null)
                          sold(160)
                        else
                          _studyOffer(context, slot),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: JokerRow(
            owned: run.jokers,
            footer: (owned) => ElevatedButton(
              style: smallButton(),
              onPressed: () => onAction((r) => r.sellJoker(owned.uid)),
              child: Text('Sell \$${sellPrice(jokersById[owned.id]!)}'),
            ),
          ),
        ),

        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: c.cream.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Next: Table $nextTable, ${rounds[nextRound].name}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    'Target ${withCommas(roundTarget(nextTable, nextRound))} chips',
                  ),
                  if (nextRound == highRoller)
                    BossLabel(
                      bossId: run.boss,
                      prefix: 'Boss',
                      color: c.danger,
                    ),
                  if (nextIsNewTable)
                    const Text(
                      "The new table's High Roller boss is revealed when you reach it.",
                      style: TextStyle(fontSize: 13),
                    ),
                ],
              ),
              ElevatedButton(
                onPressed: () => onAction((r) => r.nextRound()),
                child: const Text('Next round'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _jokerOffer(int slot, bool jokersFull) {
    final joker = jokersById[run.shop!.jokerOffers[slot]]!;
    final button = ElevatedButton(
      style: smallButton(),
      onPressed: run.money < joker.price || jokersFull
          ? null
          : () => onAction((r) => r.buyJoker(slot)),
      child: Text('Buy \$${joker.price}'),
    );
    return JokerCard(
      joker: joker,
      footer: jokersFull
          ? Tooltip(
              message: 'You can hold $maxJokers jokers. Sell one first.',
              child: button,
            )
          : button,
    );
  }

  Widget _studyOffer(BuildContext context, int slot) {
    final c = GameColors.of(context);
    final type = run.shop!.studyOffers[slot]!;
    final level = run.handLevels[type]!;
    final now = handValues(type, level);
    final next = handValues(type, level + 1);
    return Container(
      width: 160,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: c.cream,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(blurRadius: 4, color: Colors.black26, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 2,
        children: [
          Text(
            hands[type]!.name,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          Text(
            'Level $level → ${level + 1}',
            style: const TextStyle(fontSize: 13),
          ),
          Text(
            '${now.chips} × ${now.mult} → ${next.chips} × ${next.mult}',
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 4),
          ElevatedButton(
            style: smallButton(),
            onPressed: run.money < studyPrice
                ? null
                : () => onAction((r) => r.buyStudy(slot)),
            child: const Text('Buy \$$studyPrice'),
          ),
        ],
      ),
    );
  }
}
