import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/session.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Main menu')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Welcome, ${Session.username}!'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Session.clear();
                Navigator.pushReplacementNamed(context, Routes.login);
              },
              child: const Text('Log out'),
            ),
          ],
        ),
      ),
    );
  }
}