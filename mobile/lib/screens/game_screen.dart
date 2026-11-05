import 'package:flutter/material.dart';

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
          child: Row(
            children: [
              _infoPanel(),
              Expanded(child: _tableArea()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoPanel() {
    return SizedBox(
      width: 160,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextButton(
              onPressed: _confirmQuit,
              child: const Text('< Quit'),
            ),
            _stat('Round', '1'),
            _stat('Target', '300'),
            _stat('Score', '0'),
            const SizedBox(height: 12),
            _stat('Hands', '4'),
            _stat('Discards', '3'),
            const Spacer(),
            _stat('Chips × Mult', '0 × 0'),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _tableArea() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Expanded(
            child: Center(
              child: Text(
                _selected.isEmpty
                    ? 'Select up to 5 cards'
                    : '${_selected.length} selected',
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
            children: [
              ElevatedButton(
                onPressed:
                _selected.isEmpty ? null : () => _notReady('Play hand'),
                child: const Text('Play hand'),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed:
                _selected.isEmpty ? null : () => _notReady('Discard'),
                child: const Text('Discard'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _card(int index) {
    final selected = _selected.contains(index);
    return GestureDetector(
      onTap: () => _toggle(index),
      child: Container(
        margin: EdgeInsets.fromLTRB(4, selected ? 0 : 16, 4, selected ? 16 : 0),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          border: Border.all(width: selected ? 3 : 1),
        ),
        child: Text(_hand[index]),
      ),
    );
  }
}