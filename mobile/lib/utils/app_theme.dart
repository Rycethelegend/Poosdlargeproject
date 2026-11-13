import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The web app's table colors (frontend/src/index.css), light and dark
class GameColors extends ThemeExtension<GameColors> {
  final Color cream;
  final Color felt;
  final Color feltEdge;
  final Color wood;
  final Color woodLight;
  final Color ink;
  final Color danger;
  final Color chips;
  final Color mult;

  const GameColors({
    required this.cream,
    required this.felt,
    required this.feltEdge,
    required this.wood,
    required this.woodLight,
    required this.ink,
    required this.danger,
    required this.chips,
    required this.mult,
  });

  static const light = GameColors(
    cream: Color(0xFFF2E8CF),
    felt: Color(0xFF6A994E),
    feltEdge: Color(0xFF386641),
    wood: Color(0xFFBC6C25),
    woodLight: Color(0xFFDDA15E),
    ink: Color(0xFF1A1A1A),
    danger: Color(0xFFBC4749),
    chips: Color(0xFF2F6FB5),
    mult: Color(0xFFC8383C),
  );

  static const dark = GameColors(
    cream: Color(0xFF1E1B16),
    felt: Color(0xFF2F4A2A),
    feltEdge: Color(0xFF1B2E19),
    wood: Color(0xFF6E3F18),
    woodLight: Color(0xFF8F5A2C),
    ink: Color(0xFFF2E8CF),
    danger: Color(0xFFA33A3C),
    chips: Color(0xFF4D8FD6),
    mult: Color(0xFFE0575B),
  );

  static GameColors of(BuildContext context) =>
      Theme.of(context).extension<GameColors>()!;

  @override
  GameColors copyWith() => this;

  @override
  GameColors lerp(ThemeExtension<GameColors>? other, double t) =>
      t < 0.5 || other is! GameColors ? this : other;
}

/// Light or dark mode, saved on the phone. Light is the default
class AppTheme {
  static const String _key = 'dark_mode';
  static final ValueNotifier<ThemeMode> mode = ValueNotifier(ThemeMode.light);

  static bool get isDark => mode.value == ThemeMode.dark;

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    mode.value = prefs.getBool(_key) == true ? ThemeMode.dark : ThemeMode.light;
  }

  static Future<void> setDark(bool dark) async {
    mode.value = dark ? ThemeMode.dark : ThemeMode.light;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, dark);
  }

  // Same font the web title falls back to
  static const TextStyle titleFont = TextStyle(fontFamily: 'serif');

  static ThemeData build(Brightness brightness) {
    final c = brightness == Brightness.dark ? GameColors.dark : GameColors.light;
    final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(16));
    final base = ThemeData(brightness: brightness);

    return base.copyWith(
      extensions: [c],
      scaffoldBackgroundColor: c.cream,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: c.woodLight,
        onPrimary: c.ink,
        secondary: c.wood,
        onSecondary: c.ink,
        surface: c.cream,
        onSurface: c.ink,
        error: c.danger,
        onError: const Color(0xFFF2E8CF),
      ),
      textTheme: base.textTheme.apply(bodyColor: c.ink, displayColor: c.ink),
      appBarTheme: AppBarTheme(
        backgroundColor: c.cream,
        foregroundColor: c.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      drawerTheme: DrawerThemeData(backgroundColor: c.wood),
      dialogTheme: DialogThemeData(backgroundColor: c.cream, shape: rounded),
      dividerTheme: DividerThemeData(color: c.feltEdge.withValues(alpha: 0.4)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.cream,
        labelStyle: TextStyle(color: c.ink.withValues(alpha: 0.6)),
        floatingLabelStyle: TextStyle(color: c.ink),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: c.feltEdge, width: 4),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: c.wood, width: 4),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.woodLight,
          foregroundColor: c.ink,
          disabledBackgroundColor: c.woodLight.withValues(alpha: 0.5),
          disabledForegroundColor: c.ink.withValues(alpha: 0.5),
          elevation: 0,
          shape: rounded,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.ink,
          textStyle: const TextStyle(
              fontSize: 16, decoration: TextDecoration.underline),
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((states) =>
              states.contains(WidgetState.selected) ? c.wood : c.woodLight),
          foregroundColor: WidgetStatePropertyAll(c.ink),
          side: const WidgetStatePropertyAll(BorderSide.none),
          textStyle: const WidgetStatePropertyAll(
              TextStyle(fontWeight: FontWeight.w600)),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStatePropertyAll(c.ink),
        trackColor: WidgetStateProperty.resolveWith((states) =>
            states.contains(WidgetState.selected) ? c.feltEdge : c.cream),
        trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: c.wood),
    );
  }
}
