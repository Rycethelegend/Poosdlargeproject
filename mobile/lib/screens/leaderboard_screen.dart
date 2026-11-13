import 'dart:async';
import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';

/// The top 100 scores of all time, with a search by username or date
class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  static const _bold = TextStyle(fontWeight: FontWeight.bold);

  final _search = TextEditingController();

  List<dynamic>? _rows;
  String _error = '';
  bool _loading = true;

  Timer? _debounce;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    Connection.online.addListener(_onConnectionChange);
    _load();
  }

  // reload when the connection comes back
  void _onConnectionChange() {
    if (Connection.online.value) _load();
  }

  Future<void> _load() async {
    final id = ++_requestId;
    if (!_loading) setState(() => _loading = true);
    try {
      final rows = await ScoresApi.fetchLeaderboard(_search.text.trim());
      if (!mounted || id != _requestId) return;
      setState(() {
        _rows = rows;
        _error = '';
      });
    } catch (e) {
      if (!mounted || id != _requestId) return;
      if (ScoresApi.isLoginExpired(e)) {
        Session.clear();
        Navigator.pushNamedAndRemoveUntil(
            context, Routes.login, (route) => false);
        return;
      }
      setState(() => _error = e is ApiException
          ? e.message
          : "Can't reach the server. Check your connection and try again.");
    } finally {
      if (mounted && id == _requestId) setState(() => _loading = false);
    }
  }

  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), _load);
  }

  @override
  void dispose() {
    Connection.online.removeListener(_onConnectionChange);
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  static String _withCommas(int n) => n.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

  @override
  Widget build(BuildContext context) {
    final List rows = _rows ?? [];
    final String searchText = _search.text.trim();
    final String me = Session.username.toLowerCase();

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 700),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  searchText.isNotEmpty
                      ? 'Top scores matching "$searchText"'
                      : 'Top 100 scores of all time',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _search,
                  decoration: const InputDecoration(
                      labelText: 'Search a username or a date, e.g. 2026-11-05'),
                  onChanged: _onSearchChanged,
                ),
                const SizedBox(height: 12),
                if (_error.isNotEmpty) Text(_error),
                _row('#', 'Player', 'Score', 'Table', 'Date', bold: true),
                const Divider(height: 1),
                // Dimmed while a new search loads, as on the web
                Opacity(
                  opacity: _loading ? 0.6 : 1,
                  child: Column(
                    children: [
                      for (int i = 0; i < rows.length; i++)
                        _row(
                          '${i + 1}',
                          '${rows[i]['username'] ?? ''}',
                          _withCommas((rows[i]['score'] as num? ?? 0).toInt()),
                          '${rows[i]['table'] ?? ''}',
                          '${rows[i]['day'] ?? ''}',
                          // Your own scores stand out, as on the web
                          bold: '${rows[i]['username'] ?? ''}'.toLowerCase() ==
                              me,
                        ),
                    ],
                  ),
                ),
                if (_rows != null && rows.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      searchText.isNotEmpty
                          ? 'No scores matching "$searchText".'
                          : 'No scores yet. Be the first!',
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String rank, String player, String score, String table,
      String date,
      {bool bold = false}) {
    final style = bold ? _bold : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(width: 48, child: Text(rank, style: style)),
          Expanded(
            child: Text(player, style: style, overflow: TextOverflow.ellipsis),
          ),
          SizedBox(
            width: 100,
            child: Text(score, textAlign: TextAlign.right, style: _bold),
          ),
          SizedBox(
            width: 60,
            child: Text(table, textAlign: TextAlign.right, style: style),
          ),
          const SizedBox(width: 16),
          SizedBox(width: 100, child: Text(date, style: style)),
        ],
      ),
    );
  }
}