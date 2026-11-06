import 'dart:convert';

class Session {
  static String? token;
  static String username = '';

  static void saveToken(String accessToken) {
    token = accessToken;
    try {
      final payload = accessToken.split('.')[1];
      final data = jsonDecode(
          utf8.decode(base64Url.decode(base64Url.normalize(payload))));
      username = data['username'] ?? '';
    } catch (_) {
      username = '';
    }
  }

  static void clear() {
    token = null;
    username = '';
  }
}