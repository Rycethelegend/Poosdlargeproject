import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/session.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class Api {
  // One client for the whole app, so requests reuse the same connection
  // instead of setting up a new secure connection every time
  static final http.Client client = http.Client();

  static Future<Map<String, dynamic>> post(
      String url, Map<String, dynamic> body) async {
    final http.Response response;
    try {
      response = await client
          .post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (Session.token != null)
            'Authorization': 'Bearer ${Session.token}',
        },
        body: jsonEncode(body),
      )
          .timeout(const Duration(seconds: 10));
    } on http.ClientException {
      Connection.markOffline();
      throw ApiException(Connection.offlineMessage);
    }
    Connection.markOnline();

    final data = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw ApiException(
          data['error'] ?? 'Something went wrong, please try again');
    }
    return data;
  }
}