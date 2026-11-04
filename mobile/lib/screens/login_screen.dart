import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/session.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _username = TextEditingController();
  final _password = TextEditingController();
  String _message = '';
  bool _loading = false;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _message = '';
    });
    try {
      String url = 'http://poosdbasecontactmanager.casa/api/login';
      final data = await Api.post(url, {
        'username': _username.text.trim(),
        'password': _password.text,
      });
      Session.token = data['token'];
      Session.username = data['username'];
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, Routes.home);
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } catch (_) {
      setState(() => _message = 'Could not reach the server.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Poosdalatro',
                      style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _username,
                    decoration: const InputDecoration(labelText: 'Username'),
                  ),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password'),
                  ),
                  const SizedBox(height: 12),
                  if (_message.isNotEmpty) Text(_message),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        onPressed: _loading ? null : _login,
                        child: Text(_loading ? 'Logging in...' : 'Log in'),
                      ),
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: () => Navigator.pushReplacementNamed(
                            context, Routes.register),
                        child: const Text('Register'),
                      ),
                    ],
                  ),
                  if (kDebugMode)
                    TextButton(
                      onPressed: () {
                        Session.username = 'tester';
                        Navigator.pushReplacementNamed(context, Routes.home);
                      },
                      child: const Text('Skip login (debug only)'),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}