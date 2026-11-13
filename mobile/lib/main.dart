import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/utils/connection.dart';
import 'package:poosdalatro/utils/session.dart';

/// App entry point: locks the app to landscape, then starts it.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // all three at once instead of one after another
  await Future.wait([
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]),
    Session.load(),
    AppTheme.load(),
  ]);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: AppTheme.mode,
      builder: (context, mode, _) => MaterialApp(
        title: 'Poosdalatro',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(Brightness.light),
        darkTheme: AppTheme.build(Brightness.dark),
        themeMode: mode,
        routes: Routes.getRoutes,
        builder: (context, child) => Column(
          children: [
            const OfflineBanner(),
            Expanded(child: child!),
          ],
        ),
      ),
    );
  }
}

/// Shown at the top of every screen while offline
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: Connection.online,
      builder: (context, online, _) {
        if (online) return const SizedBox.shrink();
        final colors = Theme.of(context).colorScheme;
        return Material(
          color: colors.error,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Text(
                "You're offline. Profile, Leaderboard and logging in need a connection.",
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.onError),
              ),
            ),
          ),
        );
      },
    );
  }
}
