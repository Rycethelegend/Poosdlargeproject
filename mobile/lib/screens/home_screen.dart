import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/session.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  void _logout(BuildContext context) {
    Session.clear();
    Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Poosdalatro',
                    style: Theme.of(context).textTheme.headlineLarge),
                Text(Session.username),
                const SizedBox(height: 24),
                SizedBox(
                  width: 200,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, Routes.game),
                    child: const Text('Start', style: TextStyle(fontSize: 18)),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton(
                      onPressed: () =>
                          Navigator.pushNamed(context, Routes.profile),
                      child: const Text('Your Profile'),
                    ),
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed: () =>
                          Navigator.pushNamed(context, Routes.leaderboard),
                      child: const Text('Leaderboard'),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => _logout(context),
                  child: const Text('Log out'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}