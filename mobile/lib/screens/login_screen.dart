import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/screens/auth_layout.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/session.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginName = TextEditingController();
  final _password = TextEditingController();
  String _error = '';
  bool _loading = false;

  Future<void> _submit() async {
    setState(() => _error = '');
    if (_loginName.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() =>
      _error = 'Please enter your username or email and your password');
      return;
    }

    setState(() => _loading = true);
    try {
      String url = 'https://poosdbasecontactmanager.casa/api/login';
      final data = await Api.post(url, {
        'login': _loginName.text.trim(),
        'password': _password.text,
      });
      Session.saveToken(data['accessToken']);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, Routes.home);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error =
      "Can't reach the server. Check your connection and try again.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _loginName.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      heading: 'Log In',
      children: [
        FormMessage(error: _error),
        TextField(
          controller: _loginName,
          decoration: const InputDecoration(labelText: 'Username or email'),
        ),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'Password'),
          onSubmitted: (_) => _submit(),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () =>
                Navigator.pushNamed(context, Routes.forgotPassword),
            child: const Text('Forgot password?'),
          ),
        ),
        ElevatedButton(
          onPressed: _loading ? null : _submit,
          child: Text(_loading ? '...' : 'Log In'),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('New here?'),
            TextButton(
              onPressed: () =>
                  Navigator.pushReplacementNamed(context, Routes.register),
              child: const Text('Create an account'),
            ),
          ],
        ),
        if (kDebugMode)
          TextButton(
            onPressed: () {
              Session.skippedLogin = true;
              Session.username = 'tester';
              Navigator.pushReplacementNamed(context, Routes.home);
            },
            child: const Text('Skip login (debug only)'),
          ),
      ],
    );
  }
}