import 'package:flutter/widgets.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/scores_api.dart';
import 'package:poosdalatro/utils/session.dart';

/// When the server says the login has expired, logs out and opens the login
/// screen, like Leaderboard and Singleplayer do. True if that happened.
bool loginExpired(BuildContext context, Object error) {
  if (!ScoresApi.isLoginExpired(error)) return false;
  Session.clear();
  Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  return true;
}
