import 'package:flutter/material.dart';
import 'package:poosdalatro/screens/home_screen.dart';
import 'package:poosdalatro/screens/login_screen.dart';

class Routes {
  static const String login = '/login';
  static const String home = '/home';

  static Map<String, WidgetBuilder> get getRoutes => {
    '/': (context) => const HomeScreen(), //Temporarily points to home screen first since login doesn't work without domain
    //'/': (context) => const LoginScreen(),
    login: (context) => const LoginScreen(),
    home: (context) => const HomeScreen(),
  };
}