import 'package:flutter/material.dart';
import 'package:poosdalatro/screens/game_screen.dart';
import 'package:poosdalatro/screens/leaderboard_screen.dart';
import 'package:poosdalatro/screens/login_screen.dart';
import 'package:poosdalatro/screens/home_screen.dart';
import 'package:poosdalatro/screens/register_screen.dart';
import 'package:poosdalatro/screens/profile_screen.dart';

/// Every screen's route name, and which screen each one opens.
/// Navigate with constants like Routes.hom) rather than typing the strings
class Routes {
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String game = '/play';
  static const String leaderboard = '/leaderboard';
  static const String profile = '/profile';

  static Map<String, WidgetBuilder> get getRoutes => {
    '/': (context) => const LoginScreen(),
    login: (context) => const LoginScreen(),
    register: (context) => const RegisterScreen(),
    home: (context) => const HomeScreen(),
    game: (context) => const GameScreen(),
    leaderboard: (context) => const LeaderboardScreen(),
    profile: (context) => const ProfileScreen(),
  };
}