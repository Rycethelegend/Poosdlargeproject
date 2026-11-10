import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/session.dart';

/// Requests that need a login: the profile's scores and the leaderboard
class ScoresApi {
  static Future<Map<String, dynamic>> postWithLogin(
      String route, Map<String, dynamic> body) async {
    final data = await Api.post(
      'https://poosdbasecontactmanager.casa/api/$route',
      {...body, 'jwtToken': Session.token},
    );
    if (data['jwtToken'] is String) Session.token = data['jwtToken'];
    return data;
  }

  static Future<Map<String, dynamic>> fetchMyScores(
      String search, String sort) {
    return postWithLogin('myscores', {'search': search, 'sort': sort});
  }

  static Future<List<dynamic>> fetchLeaderboard(String search) async {
    final data = await postWithLogin('leaderboard', {'search': search});
    return data['results'] ?? [];
  }

  /// True when the server says the login has expired
  static bool isLoginExpired(Object error) =>
      error is ApiException &&
          error.message.toLowerCase().contains('login has expired');
}