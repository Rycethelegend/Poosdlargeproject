import 'package:flutter/material.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/session.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  String _message = '';
  bool _loading = false;

  Future<void> _register() async {
    if (_password.text != _confirmPassword.text) {
      setState(() => _message = 'Passwords do not match');
      return;
    }
    setState(() {
      _loading = true;
      _message = '';
    });
    try {
      String url = 'http://poosdbasecontactmanager.casa/api/register';
      final data = await Api.post(url, {
        'username': _username.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        'confirmPassword': _confirmPassword.text,
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
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
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
                  Text('Create account',
                      style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _username,
                    decoration: const InputDecoration(labelText: 'Username'),
                  ),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password'),
                  ),
                  TextField(
                    controller: _confirmPassword,
                    obscureText: true,
                    decoration:
                    const InputDecoration(labelText: 'Confirm password'),
                  ),
                  const SizedBox(height: 12),
                  if (_message.isNotEmpty) Text(_message),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        onPressed: _loading ? null : _register,
                        child: Text(_loading ? 'Registering...' : 'Register'),
                      ),
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: () => Navigator.pushReplacementNamed(
                            context, Routes.login),
                        child: const Text('Back to log in'),
                      ),
                    ],
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