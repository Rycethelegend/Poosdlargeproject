import 'package:flutter/material.dart';
import 'package:poosdalatro/utils/app_theme.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

// Shared frame for the login and register screens, like the web app's AuthLayout:
// the game title on top, then the felt table with a heading and the form.
class AuthLayout extends StatelessWidget {
  final String heading;
  final List<Widget> children;

  const AuthLayout({super.key, required this.heading, required this.children});

  @override
  Widget build(BuildContext context) {
    final short = MediaQuery.sizeOf(context).height < 500;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Poosdalatro',
                    style: AppTheme.titleFont.copyWith(fontSize: short ? 40 : 56)),
                SizedBox(height: short ? 8 : 24),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: FeltPanel(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: 12,
                      children: [
                        Text(heading,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 28, fontWeight: FontWeight.w600)),
                        ...children,
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
