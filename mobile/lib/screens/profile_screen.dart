import 'dart:async';
import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const _bold = TextStyle(fontWeight: FontWeight.bold);

  final _search = TextEditingController();
  String _sort = 'date';

  Map<String, dynamic>? _data;
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
      final data = await ScoresApi.fetchMyScores(_search.text.trim(), _sort);
      if (!mounted || id != _requestId) return;
      setState(() {
        _data = data;
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

  static String _formatTime(String iso) {
    final t = DateTime.parse(iso).toLocal();
    final hour = t.hour % 12 == 0 ? 12 : t.hour % 12;
    final minute = t.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${t.hour < 12 ? 'AM' : 'PM'}';
  }

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    final List scores = _data?['scores'] ?? [];
    final String username = _data?['username'] ?? Session.username;
    final String searchText = _search.text.trim();

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
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
                      // Username on the left, the two stats on the right
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.end,
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          Text(username,
                              style: const TextStyle(
                                  fontSize: 30, fontWeight: FontWeight.bold)),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            spacing: 10,
                            children: [
                              StatBox(
                                  label: 'BEST SCORE',
                                  value: _withCommas(
                                      (_data?['bestScore'] ?? 0 as num).toInt())),
                              StatBox(
                                  label: 'GAMES',
                                  value: '${_data?['gamesPlayed'] ?? 0}'),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Text('Sort by', style: _bold),
                          const SizedBox(width: 8),
                          Flexible(
                            child: SegmentedButton<String>(
                              showSelectedIcon: false,
                              segments: const [
                                ButtonSegment(
                                    value: 'date', label: Text('Newest first')),
                                ButtonSegment(
                                    value: 'score', label: Text('Highest score')),
                              ],
                              selected: {_sort},
                              onSelectionChanged: (selection) {
                                setState(() => _sort = selection.first);
                                _load();
                              },
                            ),
                          ),
                        ],
                      ),
                      TextField(
                        controller: _search,
                        decoration: const InputDecoration(
                            labelText: 'Search by date, e.g. 2026-11 or 2026-11-05'),
                        onChanged: _onSearchChanged,
                      ),
                      FormMessage(error: _error),
                      Opacity(
                        opacity: _loading ? 0.6 : 1,
                        child: CreamList(
                          children: [
                            _row(const Text('Date', style: _bold),
                                const Text('Score', style: _bold),
                                const Text('Table', style: _bold)),
                            Divider(height: 2, thickness: 2, color: c.feltEdge.withValues(alpha: 0.4)),
                            for (int i = 0; i < scores.length; i++)
                              Container(
                                color: i.isEven
                                    ? Colors.black.withValues(alpha: 0.05)
                                    : null,
                                child: _row(
                                  Text('${scores[i]['day']}  ${_formatTime(scores[i]['date'])}'),
                                  Text(_withCommas((scores[i]['score'] as num).toInt()),
                                      style: _bold),
                                  Text('${scores[i]['table']}'),
                                ),
                              ),
                            if (_data != null && scores.isEmpty)
                              Padding(
                                padding: const EdgeInsets.all(24),
                                child: Text(
                                  searchText.isNotEmpty
                                      ? 'No scores matching "$searchText".'
                                      : 'No scores yet. Finish a Singleplayer run to see it here.',
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

  Widget _row(Widget date, Widget score, Widget table) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Expanded(child: date),
          SizedBox(
              width: 90,
              child: Align(alignment: Alignment.centerRight, child: score)),
          SizedBox(
              width: 56,
              child: Align(alignment: Alignment.centerRight, child: table)),
        ],
      ),
    );
  }
}
