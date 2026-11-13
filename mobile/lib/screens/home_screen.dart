import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/screens/credits_dialog.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

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
    final c = GameColors.of(context);
    return Scaffold(
      key: _scaffoldKey,
      drawer: _settings(),
      body: SafeArea(
        child: Row(
          children: [
            // Wood tab on the left edge, like the web's Settings tab
            Center(
              child: Material(
                color: c.woodLight,
                borderRadius:
                    const BorderRadius.horizontal(right: Radius.circular(16)),
                child: InkWell(
                  borderRadius:
                      const BorderRadius.horizontal(right: Radius.circular(16)),
                  onTap: () => _scaffoldKey.currentState!.openDrawer(),
                  child: const SizedBox(
                    width: 32,
                    height: 220,
                    child: Center(
                      child: RotatedBox(
                        quarterTurns: 3,
                        child: Text('Settings', style: TextStyle(fontSize: 18)),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(child: _menu()),
          ],
        ),
      ),
    );
  }

  Widget _menu() {
    final size = MediaQuery.sizeOf(context);
    final short = size.height < 500;
    final width = (size.width - 48).clamp(260.0, 640.0);
    final height = short ? (size.height * 0.6).clamp(160.0, 260.0) : width * 0.62;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Poosdalatro',
                style: AppTheme.titleFont.copyWith(fontSize: short ? 40 : 60)),
            SizedBox(height: short ? 8 : 24),
            SizedBox(
              width: width,
              height: height,
              child: FeltPanel(
                padding: const EdgeInsets.all(8),
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
                          _sectionButton('LEADERBOARD',
                              () => Navigator.pushNamed(context, Routes.leaderboard)),
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

  /// One quarter of the table. A null onPressed shows the button greyed out.
  Widget _sectionButton(String label, VoidCallback? onPressed) {
    final c = GameColors.of(context);
    return Expanded(
      child: TextButton(
        style: TextButton.styleFrom(
          foregroundColor: c.ink,
          disabledForegroundColor: c.ink.withValues(alpha: 0.4),
          overlayColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          textStyle: const TextStyle(
              fontSize: 20, fontWeight: FontWeight.w600, decoration: TextDecoration.none),
        ),
        onPressed: onPressed,
        child: FittedBox(fit: BoxFit.scaleDown, child: Text(label)),
      ),
    );
  }

  /// Wood button for the Settings panel
  Widget _settingsButton({required Widget child, required VoidCallback onTap}) {
    final c = GameColors.of(context);
    return Material(
      color: c.woodLight,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: DefaultTextStyle.merge(
            style: const TextStyle(fontSize: 20),
            child: child,
          ),
        ),
      ),
    );
  }

  /// Slide-out Settings, like the web's Settings panel
  Widget _settings() {
    final c = GameColors.of(context);
    return Drawer(
      width: 300,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.horizontal(right: Radius.circular(16))),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Text('Settings',
                  style: TextStyle(
                      fontSize: 24, fontWeight: FontWeight.w600, color: c.ink)),
              _settingsButton(
                onTap: () async {
                  await AppTheme.setDark(!AppTheme.isDark);
                  setState(() {});
                },
                child: Row(
                  children: [
                    Expanded(
                        child: Text(AppTheme.isDark ? 'Dark mode' : 'Light mode')),
                    Switch(
                      value: AppTheme.isDark,
                      onChanged: (value) async {
                        await AppTheme.setDark(value);
                        setState(() {});
                      },
                    ),
                  ],
                ),
              ),
              _settingsButton(
                onTap: () => showDialog(
                    context: context, builder: (_) => const CreditsDialog()),
                child: const Text('Credits'),
              ),
              const Spacer(),
              _settingsButton(onTap: _logout, child: const Text('Log out')),
            ],
          ),
        ),
      ),
    );
  }
}
