import 'package:flutter/material.dart';

// Shared frame for the login and register screens, like the web app's AuthLayout:
// the game title on top, then a card with a heading and the form.
class AuthLayout extends StatelessWidget {
  final String heading;
  final List<Widget> children;

  const AuthLayout({super.key, required this.heading, required this.children});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Poosdalatro', style: text.headlineLarge),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        spacing: 12,
                        children: [
                          Text(heading,
                              textAlign: TextAlign.center,
                              style: text.headlineSmall),
                          ...children,
                        ],
                      ),
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