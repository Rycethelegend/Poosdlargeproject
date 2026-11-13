import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poosdalatro/game/run.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';

/// The run in progress is kept on the phone, so leaving the game or closing
/// the app doesn't lose it. Finished scores wait in a queue until they reach
/// the server (the server ignores a runId it already has).
class RunStorage {
  static String get _runKey => 'run_${Session.username}';
  static String get _pendingKey => 'pending_scores_${Session.username}';

  static Future<RunState?> loadRun() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_runKey);
      return json == null ? null : RunState.fromJson(jsonDecode(json));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveRun(RunState? run) async {
    final prefs = await SharedPreferences.getInstance();
    if (run == null) {
      await prefs.remove(_runKey);
    } else {
      await prefs.setString(_runKey, jsonEncode(run.toJson()));
    }
  }

  static Future<List<Map<String, dynamic>>> _pending() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = jsonDecode(prefs.getString(_pendingKey) ?? '[]') as List;
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> _setPending(List<Map<String, dynamic>> list) async {
    final prefs = await SharedPreferences.getInstance();
    if (list.isEmpty) {
      await prefs.remove(_pendingKey);
    } else {
      await prefs.setString(_pendingKey, jsonEncode(list));
    }
  }

  static Future<void> queueScore(RunState run) async {
    final list = await _pending();
    if (list.any((p) => p['runId'] == run.runId)) return;
    list.add({
      'runId': run.runId,
      'score': run.totalScore,
      'table': run.table,
      'endedAt': run.endedAt ?? DateTime.now().toUtc().toIso8601String(),
    });
    await _setPending(list);
  }

  static Future<void>? _flushing;

  /// Sends queued scores oldest first and stops at the first failure
  static Future<void> flush(void Function(String runId, SavedScore saved) onSaved) {
    final running = _flushing;
    if (running != null) return running.then((_) => flush(onSaved));

    final work = () async {
      for (final entry in await _pending()) {
        final data = await ScoresApi.postWithLogin('savescore', {
          ...entry,
          'tzOffset': -DateTime.now().timeZoneOffset.inMinutes,
        });
        final rest = await _pending();
        await _setPending(rest.where((p) => p['runId'] != entry['runId']).toList());
        onSaved(entry['runId'],
            SavedScore((data['bestScore'] as num).toInt(), (data['rank'] as num).toInt()));
      }
    }();
    _flushing = work.whenComplete(() => _flushing = null);
    return _flushing!;
  }
}
