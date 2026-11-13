import 'package:flutter/material.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  // Placeholder hand until the game engine exists
  final List<String> _hand = const [
    'A Spade', 'K Heart', 'K Club', '10 Diamond',
    '7 Spade', '7 Heart', '4 Club', '2 Diamond',
  ];
  final Set<int> _selected = {};

  void _toggle(int index) {
    setState(() {
      if (_selected.contains(index)) {
        _selected.remove(index);
      } else if (_selected.length < 5) {
        _selected.add(index);
      }
    });
  }

  void _notReady(String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("$action isn't hooked up yet"),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  Future<void> _confirmQuit() async {
    final quit = await showDialog<bool>(
      context: context,
      builder: (context) =>
          AlertDialog(
            title: const Text('Quit game?'),
            content: const Text('Your progress in this game will be lost.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Keep playing'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Quit'),
              ),
            ],
          ),
    );
    if (quit == true && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _confirmQuit();
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: FeltPanel(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  _infoPanel(),
                  const SizedBox(width: 12),
                  Expanded(child: _tableArea()),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoPanel() {
    return SizedBox(
      width: 150,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 6,
          children: [
            ElevatedButton(
              onPressed: _confirmQuit,
              style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              child: const Text('Quit'),
            ),
            _stat('Round', '1'),
            _stat('Target', '300'),
            _stat('Score', '0'),
            _stat('Hands', '4'),
            _stat('Discards', '3'),
            _stat('Chips × Mult', '0 × 0'),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value) {
    final c = GameColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.cream.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: TextStyle(fontSize: 11, letterSpacing: 1, color: c.ink.withValues(alpha: 0.7))),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  /// Right side: the selection message, the hand, and the action buttons
  Widget _tableArea() {
    final c = GameColors.of(context);
    return Column(
      children: [
        Expanded(
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _selected.isEmpty
                    ? 'Pick up to 5 cards to make a poker hand.'
                    : '${_selected.length} selected',
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ),
        ),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (int i = 0; i < _hand.length; i++) _card(i),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 12,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: c.chips,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: c.chips.withValues(alpha: 0.5),
                  disabledForegroundColor: Colors.white70),
              onPressed:
                  _selected.isEmpty ? null : () => _notReady('Play hand'),
              child: const Text('Play hand'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: c.mult,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: c.mult.withValues(alpha: 0.5),
                  disabledForegroundColor: Colors.white70),
              onPressed:
                  _selected.isEmpty ? null : () => _notReady('Discard'),
              child: const Text('Discard'),
            ),
          ],
        ),
      ],
    );
  }

  /// One card, selected cards move up and get a gold border
  Widget _card(int index) {
    final selected = _selected.contains(index);
    return GestureDetector(
      onTap: () => _toggle(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 70,
        height: 96,
        margin: EdgeInsets.fromLTRB(4, selected ? 0 : 16, 4, selected ? 16 : 0),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFFF2F2EC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              width: selected ? 4 : 2,
              color: selected ? const Color(0xFFD99A1E) : Colors.black87),
          boxShadow: const [BoxShadow(blurRadius: 4, color: Colors.black26, offset: Offset(0, 2))],
        ),
        child: Text(_hand[index],
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
