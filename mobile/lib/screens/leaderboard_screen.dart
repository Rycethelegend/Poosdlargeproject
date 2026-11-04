import 'package:flutter/material.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  // Placeholder rows until the leaderboard API is connected
  final List<Map<String, dynamic>> _entries = const [
    {'rank': 1, 'username': 'ace_high', 'score': 4820},
    {'rank': 2, 'username': 'flushqueen', 'score': 3990},
    {'rank': 3, 'username': 'SpaceCadet', 'score': 2110},
    {'rank': 4, 'username': 'lowball', 'score': 1450},
    {'rank': 5, 'username': 'jokerwild', 'score': 980},
  ];
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final results = _entries
        .where((e) => (e['username'] as String)
        .toLowerCase()
        .contains(_search.toLowerCase()))
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    decoration:
                    const InputDecoration(labelText: 'Search players'),
                    onChanged: (text) => setState(() => _search = text),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: results.length,
                    itemBuilder: (context, i) {
                      final e = results[i];
                      return ListTile(
                        leading: Text('#${e['rank']}'),
                        title: Text(e['username']),
                        trailing: Text('${e['score']}'),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}