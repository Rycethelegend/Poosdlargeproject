import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/screens/auth_layout.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/utils/session.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Step 1 collects the account details and emails a code.
  // Step 2 checks the code; only then is the account created.
  bool _codeStep = false;

  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _code = TextEditingController();

  String _error = '';
  String _info = '';
  String? _devCode;
  bool _loading = false;

  int _cooldown = 0;
  Timer? _timer;

  static const String _offline =
      "Can't reach the server. Check your connection and try again.";

  void _showError(String message) => setState(() => _error = message);

  // Asks the server to email a 6-digit code
  Future<void> _sendCode() async {
    String url = 'https://poosdbasecontactmanager.casa/api/sendcode';
    final data = await Api.post(url, {
      'email': _email.text.trim(),
      'purpose': 'register',
      'username': _username.text.trim(),
    });
    _devCode = data['devCode']; // only sent while the server is in testing mode
    _startCooldown();
  }

  // Counts down 60 seconds before "Resend code" can be used again
  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldown <= 1) timer.cancel();
      setState(() => _cooldown--);
    });
  }

  Future<void> _submitDetails() async {
    setState(() => _error = '');
    final username = _username.text.trim();

    if (username.isEmpty ||
        _email.text.trim().isEmpty ||
        _password.text.isEmpty ||
        _confirmPassword.text.isEmpty) {
      return _showError('Please fill in every field');
    }
    if (!RegExp(r'^[A-Za-z0-9_]{3,20}$').hasMatch(username)) {
      return _showError(
          'Username must be 3-20 letters, numbers or underscores');
    }
    if (_password.text.length < 8) {
      return _showError('Password must be at least 8 characters');
    }
    if (_password.text != _confirmPassword.text) {
      return _showError('Passwords do not match');
    }

    setState(() => _loading = true);
    try {
      await _sendCode();
      setState(() {
        _codeStep = true;
        _info = 'We sent a 6-digit code to ${_email.text.trim()}. '
            'It expires in 10 minutes.';
      });
    } on ApiException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError(_offline);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() => _error = '');
    if (!RegExp(r'^\d{6}$').hasMatch(_code.text)) {
      return _showError('Enter the 6-digit code from the email');
    }

    setState(() => _loading = true);
    try {
      String url = 'https://poosdbasecontactmanager.casa/api/register';
      final data = await Api.post(url, {
        'username': _username.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        'code': _code.text,
      });
      Session.saveToken(data['accessToken']);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, Routes.home);
    } on ApiException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError(_offline);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _error = '';
      _info = '';
    });
    try {
      await _sendCode();
      setState(() {
        _code.clear();
        _info = 'A new code is on its way to ${_email.text.trim()}.';
      });
    } on ApiException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError(_offline);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_codeStep) {
      return AuthLayout(
        heading: 'Verify Your Email',
        children: [
          if (_error.isNotEmpty)
            Text(_error, textAlign: TextAlign.center)
          else if (_info.isNotEmpty)
            Text(_info, textAlign: TextAlign.center),
          TextField(
            controller: _code,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
                labelText: 'Verification code', counterText: ''),
          ),
          ElevatedButton(
            onPressed: _loading ? null : _verify,
            child: Text(_loading ? '...' : 'Create Account'),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: () => setState(() {
                  _codeStep = false;
                  _error = '';
                }),
                child: const Text('Back'),
              ),
              TextButton(
                onPressed: _cooldown > 0 ? null : _resend,
                child: Text(_cooldown > 0
                    ? 'Resend code (${_cooldown}s)'
                    : 'Resend code'),
              ),
            ],
          ),
          if (_devCode != null) ...[
            const Text(
                "Testing mode: email isn't set up yet, so here's your code",
                textAlign: TextAlign.center),
            Text(_devCode!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium),
            TextButton(
              onPressed: () => _code.text = _devCode!,
              child: const Text('Fill it in'),
            ),
          ],
        ],
      );
    }

    return AuthLayout(
      heading: 'Register',
      children: [
        if (_error.isNotEmpty) Text(_error, textAlign: TextAlign.center),
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
          decoration:
          const InputDecoration(labelText: 'Password (8+ characters)'),
        ),
        TextField(
          controller: _confirmPassword,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'Confirm password'),
        ),
        ElevatedButton(
          onPressed: _loading ? null : _submitDetails,
          child: Text(_loading ? '...' : 'Send Verification Code'),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Have an account?'),
            TextButton(
              onPressed: () =>
                  Navigator.pushReplacementNamed(context, Routes.login),
              child: const Text('Log in'),
            ),
          ],
        ),
      ],
    );
  }
}