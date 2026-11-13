import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/screens/credits_dialog.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/session.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Lets the Settings button open the drawer
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  // Clears the login and removes every screen, so Back can't return into the app
  void _logout() {
    Session.clear();
    Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: _settings(),
      body: SafeArea(
        child: Row(
          children: [
            TextButton(
              onPressed: () => _scaffoldKey.currentState!.openDrawer(),
              child: const RotatedBox(
                quarterTurns: 3,
                child: Text('Settings'),
              ),
            ),
            Expanded(child: _menu()),
          ],
        ),
      ),
    );
  }

  Widget _menu() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Poosdalatro',
                style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 16),
            Card(
              child: SizedBox(
                width: 460,
                height: 200,
                child: Column(
                  children: [
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _sectionButton('SINGLEPLAYER',
                                  () => Navigator.pushNamed(context, Routes.game)),
                          // TODO: no multiplayer screen yet
                          _sectionButton('MULTIPLAYER', null),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _sectionButton('PROFILE',
                                  () => Navigator.pushNamed(context, Routes.profile)),
                          _sectionButton(
                              'LEADERBOARD',
                                  () => Navigator.pushNamed(
                                  context, Routes.leaderboard)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// One quarter of the grid. A null onPressed shows the button greyed out.
  Widget _sectionButton(String label, VoidCallback? onPressed) {
    return Expanded(
      child: TextButton(
        style: TextButton.styleFrom(
            textStyle: Theme.of(context).textTheme.titleLarge),
        onPressed: onPressed,
        child: Text(label),
      ),
    );
  }

  /// Slide-out Settings, like the web's Settings panel
  Widget _settings() {
    return Drawer(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Settings',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(AppTheme.isDark ? 'Dark mode' : 'Light mode'),
                value: AppTheme.isDark,
                onChanged: (value) async {
                  await AppTheme.setDark(value);
                  setState(() {});
                },
              ),
              TextButton(
                onPressed: () => showDialog(
                    context: context, builder: (_) => const CreditsDialog()),
                child: const Text('Credits'),
              ),
              const Spacer(),
              TextButton(onPressed: _logout, child: const Text('Log out')),
            ],
          ),
        ),
      ),
    );
  }
}