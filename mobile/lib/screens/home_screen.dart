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

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  // Lets the Settings button open the drawer
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  static const _zoomTime = Duration(milliseconds: 450);
  late final _zoom = AnimationController(vsync: this, duration: _zoomTime);
  final _bodyKey = GlobalKey();
  final Map<String, GlobalKey> _sectionKeys = {};
  Rect? _focus; // the section being zoomed into

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // decode the game's sprite sheets now so Singleplayer doesn't stall opening
    for (final asset in [
      'assets/poker-cards.png',
      'assets/sprites/poker-chips.png',
      'assets/sprites/card-decks.png',
    ]) {
      precacheImage(AssetImage(asset), context);
    }
  }

  @override
  void dispose() {
    _zoom.dispose();
    super.dispose();
  }

  // Clears the login and removes every screen, so Back can't return into the app
  void _logout() {
    Session.clear();
    Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
  }

  // Zooms the menu into the tapped section while the new page fades in over
  // it, then zooms back out when that page is closed
  Future<void> _open(String route, String label) async {
    final body = _bodyKey.currentContext?.findRenderObject() as RenderBox?;
    final section =
        _sectionKeys[label]?.currentContext?.findRenderObject() as RenderBox?;
    if (body != null && section != null) {
      _focus = section.localToGlobal(Offset.zero, ancestor: body) & section.size;
    }
    _zoom.forward(from: 0);
    await Navigator.push(
      context,
      PageRouteBuilder(
        settings: RouteSettings(name: route),
        transitionDuration: _zoomTime,
        reverseTransitionDuration: _zoomTime,
        pageBuilder: (context, _, _) => Routes.getRoutes[route]!(context),
        transitionsBuilder: (context, animation, _, child) => FadeTransition(
          opacity: CurvedAnimation(
              parent: animation,
              curve: const Interval(0.35, 1, curve: Curves.easeOut)),
          child: child,
        ),
      ),
    );
    if (mounted) _zoom.reverse();
  }

  // Moves the focused section toward the middle while scaling it up
  Matrix4 _zoomMatrix(Size size) {
    final focus = _focus;
    if (focus == null || _zoom.value == 0) return Matrix4.identity();
    final t = Curves.easeInOut.transform(_zoom.value);
    final fill = (size.width / focus.width < size.height / focus.height
        ? size.width / focus.width
        : size.height / focus.height);
    final scale = 1 + (fill - 1) * t;
    final to = Offset.lerp(focus.center, size.center(Offset.zero), t)!;
    return Matrix4.translationValues(to.dx, to.dy, 0)
      ..multiply(Matrix4.diagonal3Values(scale, scale, 1))
      ..multiply(Matrix4.translationValues(-focus.center.dx, -focus.center.dy, 0));
  }

  @override
  Widget build(BuildContext context) {
    final c = GameColors.of(context);
    return Scaffold(
      key: _scaffoldKey,
      drawer: _settings(),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, box) => AnimatedBuilder(
            animation: _zoom,
            builder: (context, child) =>
                Transform(transform: _zoomMatrix(box.biggest), child: child),
            // drawn once and reused while it zooms
            child: RepaintBoundary(child: _body(c)),
          ),
        ),
      ),
    );
  }

  Widget _body(GameColors c) {
    return KeyedSubtree(
        key: _bodyKey,
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
                          _sectionButton('SINGLEPLAYER', Routes.game),
                          // TODO: no multiplayer screen yet
                          _sectionButton('MULTIPLAYER', null),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _sectionButton('PROFILE', Routes.profile),
                          _sectionButton('LEADERBOARD', Routes.leaderboard),
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

  /// One quarter of the table. A null route shows the button greyed out.
  Widget _sectionButton(String label, String? route) {
    final c = GameColors.of(context);
    return Expanded(
      child: KeyedSubtree(
        key: _sectionKeys.putIfAbsent(label, () => GlobalKey()),
        // no background, just the label on the felt like the web
        child: TextButton(
          style: TextButton.styleFrom(
            foregroundColor: c.ink,
            backgroundColor: Colors.transparent,
            disabledForegroundColor: c.ink.withValues(alpha: 0.4),
            disabledBackgroundColor: Colors.transparent,
            overlayColor: Colors.white,
            side: BorderSide.none,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
          ),
          onPressed: route == null ? null : () => _open(route, label),
          child: FittedBox(fit: BoxFit.scaleDown, child: Text(label)),
        ),
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
