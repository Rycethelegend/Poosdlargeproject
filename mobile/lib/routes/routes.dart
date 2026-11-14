import 'package:flutter/material.dart';
import 'package:poosdalatro/screens/forgot_password_screen.dart';
import 'package:poosdalatro/screens/singleplayer_screen.dart';
import 'package:poosdalatro/screens/home_screen.dart';
import 'package:poosdalatro/screens/leaderboard_screen.dart';
import 'package:poosdalatro/screens/login_screen.dart';
import 'package:poosdalatro/screens/multiplayer_screen.dart';
import 'package:poosdalatro/screens/profile_screen.dart';
import 'package:poosdalatro/screens/register_screen.dart';
import 'package:poosdalatro/utils/session.dart';

/// Every screen's route name, and which screen each one opens.
/// Navigate with these constants
class Routes {
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String home = '/home';
  static const String game = '/play';
  static const String multiplayer = '/multiplayer';
  static const String leaderboard = '/leaderboard';
  static const String profile = '/profile';

  static Map<String, WidgetBuilder> get getRoutes => {
    '/': (context) => _guestOnly(const LoginScreen()),
    login: (context) => _guestOnly(const LoginScreen()),
    register: (context) => _guestOnly(const RegisterScreen()),
    forgotPassword: (context) => _guestOnly(const ForgotPasswordScreen()),
    home: (context) => _requireLogin(const HomeScreen()),
    game: (context) => _requireLogin(const SingleplayerScreen()),
    multiplayer: (context) => _requireLogin(const MultiplayerScreen()),
    leaderboard: (context) => _requireLogin(const LeaderboardScreen()),
    profile: (context) => _requireLogin(const ProfileScreen()),
  };

  // Logged-out or expired players get the login screen instead
  static Widget _requireLogin(Widget screen) =>
      Session.isValid
          ? screen
          : const LoginScreen();

  // Logged-in players skip login and register and land on home
  static Widget _guestOnly(Widget screen) =>
      Session.isValid ? const HomeScreen() : screen;
}