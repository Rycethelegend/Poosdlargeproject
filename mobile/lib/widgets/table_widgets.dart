import 'package:flutter/material.dart';
import 'package:poosdalatro/utils/app_theme.dart';

/// Green felt table with the woven pattern, like the web's feltPanel
class FeltPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double border;

  const FeltPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.border = 12,
  });

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.feltEdge,
        borderRadius: BorderRadius.circular(32),
      ),
      padding: EdgeInsets.all(border),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32 - border / 2),
        child: Stack(
          fit: StackFit.passthrough,
          children: [
            // the pattern is a lot of lines, so keep it in its own cached layer
            Positioned.fill(
              child: RepaintBoundary(
                child: CustomPaint(painter: _WovenPattern(c.felt), isComplex: true),
              ),
            ),
            Padding(padding: padding, child: child),
          ],
        ),
      ),
    );
  }
}

// Alternating blocks of horizontal and vertical lines
class _WovenPattern extends CustomPainter {
  final Color felt;
  _WovenPattern(this.felt);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = felt);
    final line = Paint()
      ..color = Colors.black.withValues(alpha: 0.06)
      ..strokeWidth = 2;
    const cell = 20.0;
    for (double y = 0; y < size.height; y += cell) {
      for (double x = 0; x < size.width; x += cell) {
        final across = ((x + y) / cell).round().isEven;
        for (double i = 4; i < cell; i += 6) {
          if (across) {
            canvas.drawLine(Offset(x, y + i), Offset(x + cell, y + i), line);
          } else {
            canvas.drawLine(Offset(x + i, y), Offset(x + i, y + cell), line);
          }
        }
      }
    }
  }

  @override
  bool shouldRepaint(_WovenPattern old) => old.felt != felt;
}

/// Red box for errors, light box for other messages
class FormMessage extends StatelessWidget {
  final String error;
  final String info;

  const FormMessage({super.key, this.error = '', this.info = ''});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    if (error.isEmpty && info.isEmpty) return const SizedBox.shrink();
    final isError = error.isNotEmpty;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isError ? c.danger : c.cream.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        isError ? error : info,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 16,
          color: isError ? const Color(0xFFF2E8CF) : c.ink,
        ),
      ),
    );
  }
}

/// Small cream box with a label and a value, like the web's stats
class StatBox extends StatelessWidget {
  final String label;
  final String value;

  const StatBox({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, letterSpacing: 1)),
          Text(value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

/// Cream rounded box that holds a list of rows
class CreamList extends StatelessWidget {
  final List<Widget> children;

  const CreamList({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }
}
