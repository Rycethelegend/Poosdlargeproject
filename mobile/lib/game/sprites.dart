import 'package:flutter/material.dart';
import 'package:poosdalatro/game/cards.dart';

/// Shows one sprite cut out of a sprite sheet, scaled to [width]
class Sprite extends StatelessWidget {
  final String asset;
  final double sheetW, sheetH, x, y, w, h;
  final double width;

  const Sprite({
    super.key,
    required this.asset,
    required this.sheetW,
    required this.sheetH,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
    required this.width,
  });

  @override
  Widget build(BuildContext context) {
    final scale = width / w;
    return SizedBox(
      width: width,
      height: h * scale,
      child: ClipRect(
        child: OverflowBox(
          alignment: Alignment.topLeft,
          minWidth: 0,
          minHeight: 0,
          maxWidth: double.infinity,
          maxHeight: double.infinity,
          child: Transform.translate(
            offset: Offset(-x * scale, -y * scale),
            child: Image.asset(
              asset,
              width: sheetW * scale,
              height: sheetH * scale,
              fit: BoxFit.fill,
              filterQuality: FilterQuality.none,
              gaplessPlayback: true,
            ),
          ),
        ),
      ),
    );
  }
}

// assets/poker-cards.png: 48×64 cards. Rows are hearts, diamonds, spades, clubs.
// Columns go A, 2 ... 10, J, Q, K.
class CardFace extends StatelessWidget {
  final PlayingCard card;
  final double width;

  const CardFace({super.key, required this.card, required this.width});

  @override
  Widget build(BuildContext context) {
    final col = card.rank == 14 ? 0 : card.rank - 1;
    return Semantics(
      label: cardName(card),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(width * 0.08),
          boxShadow: const [
            BoxShadow(blurRadius: 4, color: Colors.black26, offset: Offset(0, 2)),
          ],
        ),
        child: Sprite(
          asset: 'assets/poker-cards.png',
          sheetW: 944,
          sheetH: 385,
          x: col * 48,
          y: card.suit.index * 64.0,
          w: 48,
          h: 64,
          width: width,
        ),
      ),
    );
  }
}

// assets/sprites/poker-chips.png: 32×48 chip stacks on a 48px grid. Left half
// rows are red, white, green, black; right half rows are blue, purple, pink,
// orange. Columns within each half go from 1 chip to the tallest stack.
enum ChipColor { red, white, green, black, blue, purple, pink, orange }

class ChipStack extends StatelessWidget {
  final ChipColor color;
  final int height; // 0-3
  final double width;

  const ChipStack(
      {super.key, required this.color, this.height = 0, required this.width});

  @override
  Widget build(BuildContext context) {
    final half = color.index ~/ 4;
    final row = color.index % 4;
    return Sprite(
      asset: 'assets/sprites/poker-chips.png',
      sheetW: 368,
      sheetH: 192,
      x: (half * 4 + height) * 48.0,
      y: row * 48.0,
      w: 32,
      h: 48,
      width: width,
    );
  }
}

// assets/sprites/card-decks.png: boxed decks. This is the red one in the top-left.
class DeckBox extends StatelessWidget {
  final double width;
  const DeckBox({super.key, required this.width});

  @override
  Widget build(BuildContext context) {
    return Sprite(
      asset: 'assets/sprites/card-decks.png',
      sheetW: 480,
      sheetH: 480,
      x: 48,
      y: 71,
      w: 51,
      h: 73,
      width: width,
    );
  }
}

/// A plain image (jokers, bosses) drawn with sharp pixels
class PixelImage extends StatelessWidget {
  final String asset;
  final double width;
  const PixelImage(this.asset, {super.key, required this.width});

  @override
  Widget build(BuildContext context) => Image.asset(asset,
      width: width, filterQuality: FilterQuality.none, gaplessPlayback: true);
}
