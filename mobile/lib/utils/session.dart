import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Who is logged in. The token is saved on the phone, so the player stays
/// logged in after closing the app, until the token expires
class Session {
  static const String _tokenKey = 'token_data';
  static SharedPreferences? _prefs;
  static String? token;
  static String username = '';
  static DateTime? _expires;

  /// Loads the saved token when the app starts
  static Future<void> load() async {
    _prefs = await SharedPreferences.getInstance();
    final saved = _prefs!.getString(_tokenKey);
    if (saved != null) _readToken(saved);
  }

  /// Saves a new token after logging in or registering, and whenever the
  /// server sends back a refresh
  static void saveToken(String accessToken) {
    _readToken(accessToken);
    _prefs?.setString(_tokenKey, accessToken);
  }

  static void clear() {
    token = null;
    username = '';
    _expires = null;
    _prefs?.remove(_tokenKey);
  }

  /// True when there's a token that hasn't expired
  static bool get isValid =>
      token != null && _expires != null && _expires!.isAfter(DateTime.now());

  // Keeps the token and reads the username and expiry out of it
  static void _readToken(String accessToken) {
    token = accessToken;
    try {
      final payload = accessToken.split('.')[1];
      final data = jsonDecode(
          utf8.decode(base64Url.decode(base64Url.normalize(payload))));
      username = data['username'] ?? '';
      _expires = DateTime.fromMillisecondsSinceEpoch(
          (data['exp'] as num).toInt() * 1000);
    } catch (_) {
      username = '';
      _expires = null;
    }
  }
}