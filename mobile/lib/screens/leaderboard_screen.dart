import 'dart:async';
import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/after_transition.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

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

  // Last results for each search, shown right away while they refresh
  static final Map<String, List<dynamic>> _cache = {};
  String get _cacheKey => '${Session.username}|${_search.text.trim()}';

  @override
  void initState() {
    super.initState();
    Connection.online.addListener(_onConnectionChange);
    _rows = _cache[_cacheKey];
    _loading = _rows == null;
    afterTransition(context, _load);
  }

  // reload when the connection comes back
  void _onConnectionChange() {
    if (Connection.online.value) _load();
  }

  Future<void> _load() async {
    final id = ++_requestId;
    final key = _cacheKey;
    final cached = _cache[key];
    setState(() {
      if (cached != null) _rows = cached;
      _loading = cached == null;
    });
    try {
      final rows = await ScoresApi.fetchLeaderboard(_search.text.trim());
      _cache[key] = rows;
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
    final c = GameColors.of(context);
    final List rows = _rows ?? [];
    final String searchText = _search.text.trim();
    final String me = Session.username.toLowerCase();

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
              children: [
                FeltPanel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 12,
                    children: [
                      Text(
                        searchText.isNotEmpty
                            ? 'Top scores matching "$searchText"'
                            : 'Top 100 scores of all time',
                        style: const TextStyle(fontSize: 18),
                      ),
                      TextField(
                        controller: _search,
                        decoration: const InputDecoration(
                            labelText: 'Search a username or a date, e.g. 2026-11-05'),
                        onChanged: _onSearchChanged,
                      ),
                      FormMessage(error: _error),
                      // Dimmed while a new search loads, as on the web
                      Opacity(
                        opacity: _loading ? 0.6 : 1,
                        child: CreamList(
                          children: [
                            _row('#', 'Player', 'Score', 'Table', 'Date', bold: true),
                            Divider(height: 2, thickness: 2, color: c.feltEdge.withValues(alpha: 0.4)),
                            for (int i = 0; i < rows.length; i++)
                              Container(
                                // Your own scores stand out, as on the web
                                color: '${rows[i]['username'] ?? ''}'.toLowerCase() == me
                                    ? c.woodLight.withValues(alpha: 0.5)
                                    : i.isEven
                                        ? Colors.black.withValues(alpha: 0.05)
                                        : null,
                                child: _row(
                                  '${i + 1}',
                                  '${rows[i]['username'] ?? ''}',
                                  _withCommas((rows[i]['score'] as num? ?? 0).toInt()),
                                  '${rows[i]['table'] ?? ''}',
                                  '${rows[i]['day'] ?? ''}',
                                  time: ScoresApi.formatTime(rows[i]['date']),
                                  bold: '${rows[i]['username'] ?? ''}'.toLowerCase() == me,
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
                    ],
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
      {bool bold = false, String time = ''}) {
    final style = bold ? _bold : null;
    final showDate = MediaQuery.sizeOf(context).width >= 560;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          SizedBox(width: 40, child: Text(rank, style: style)),
          Expanded(
            child: Text(player, style: style, overflow: TextOverflow.ellipsis),
          ),
          SizedBox(
            width: 90,
            child: Text(score, textAlign: TextAlign.right, style: _bold),
          ),
          SizedBox(
            width: 56,
            child: Text(table, textAlign: TextAlign.right, style: style),
          ),
          if (showDate) ...[
            const SizedBox(width: 16),
            // the time sits beside the date, dimmed, like on the profile
            SizedBox(
              width: 160,
              child: Text.rich(
                TextSpan(children: [
                  TextSpan(text: date),
                  if (time.isNotEmpty)
                    TextSpan(
                        text: '  $time',
                        style: TextStyle(
                            fontWeight: FontWeight.normal,
                            color: GameColors.of(context).ink.withValues(alpha: 0.6))),
                ]),
                style: style,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
