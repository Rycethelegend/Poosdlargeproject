import 'package:flutter/material.dart';
import 'package:poosdalatro/game/hands.dart';
import 'package:poosdalatro/game/game_pieces.dart';
import 'package:poosdalatro/utils/app_theme.dart';

/// Popup listing every poker hand with its level and chips × mult
void showHandsDialog(BuildContext context, Map<HandType, int> levels) {
  showDialog(
    context: context,
    builder: (context) {
      final c = GameColors.of(context);
      final strongestFirst = HandType.values.reversed.toList();
      Widget box(String text, Color color) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
            decoration: BoxDecoration(
                color: color, borderRadius: BorderRadius.circular(8)),
            child: Text(text, style: const TextStyle(color: Colors.white)),
          );

      return Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('Poker hands',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                    ),
                    ElevatedButton(
                      style: smallButton(),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        for (int i = 0; i < strongestFirst.length; i++)
                          Builder(builder: (context) {
                            final type = strongestFirst[i];
                            final level = levels[type] ?? 1;
                            final v = handValues(type, level);
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: i.isEven ? Colors.black.withValues(alpha: 0.05) : null,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                spacing: 10,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(hands[type]!.name,
                                            style: const TextStyle(fontWeight: FontWeight.w600)),
                                        Text(hands[type]!.howToMake,
                                            style: TextStyle(
                                                fontSize: 12,
                                                color: c.ink.withValues(alpha: 0.8))),
                                      ],
                                    ),
                                  ),
                                  Text(level > 1 ? 'Lv $level ↑' : 'Lv $level',
                                      style: TextStyle(
                                          fontWeight: level > 1 ? FontWeight.w600 : null)),
                                  box('${v.chips}', c.chips),
                                  const Text('×'),
                                  box('${v.mult}', c.mult),
                                ],
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Each scoring card also adds its own chips: 2-10 their number, J/Q/K 10, A 11. '
                  'Buy Study Guides in the shop to level a hand up.',
                  style: TextStyle(fontSize: 12, color: c.ink.withValues(alpha: 0.8)),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}
