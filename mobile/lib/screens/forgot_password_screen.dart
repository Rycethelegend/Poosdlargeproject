import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/routes/routes.dart';
import 'package:poosdalatro/screens/auth_layout.dart';
import 'package:poosdalatro/utils/api.dart';
import 'package:poosdalatro/widgets/table_widgets.dart';

enum _Step { email, code, newPassword }

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  _Step _step = _Step.email;

  final _email = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();

  String _error = '';
  String _info = '';
  String? _devCode;
  String? _resetToken;
  bool _loading = false;

  int _cooldown = 0;
  Timer? _timer;

  static const String _offline =
      "Can't reach the server. Check your connection and try again.";
  static const String _api = 'https://poosdbasecontactmanager.casa/api';

  void _showError(String message) => setState(() => _error = message);

  Future<void> _sendCode() async {
    final data = await Api.post('$_api/sendcode', {
      'email': _email.text.trim(),
      'purpose': 'reset',
    });
    _devCode = data['devCode']; // only sent in testing mode
    _startCooldown();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldown <= 1) timer.cancel();
      setState(() => _cooldown--);
    });
  }

  // Runs a request and shows its error if it fails
  Future<void> _run(Future<void> Function() request) async {
    setState(() {
      _error = '';
      _loading = true;
    });
    try {
      await request();
    } on ApiException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError(_offline);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitEmail() async {
    if (_email.text.trim().isEmpty) return _showError('Please enter your email');
    await _run(() async {
      await _sendCode();
      setState(() {
        _step = _Step.code;
        _info = 'If ${_email.text.trim()} has an account, we sent it a 6-digit code. '
            'It expires in 10 minutes.';
      });
    });
  }

  Future<void> _verifyCode() async {
    if (!RegExp(r'^\d{6}$').hasMatch(_code.text)) {
      return _showError('Enter the 6-digit code from the email');
    }
    await _run(() async {
      final data = await Api.post('$_api/verifyresetcode', {
        'email': _email.text.trim(),
        'code': _code.text,
      });
      setState(() {
        _resetToken = data['resetToken'];
        _step = _Step.newPassword;
      });
    });
  }

  Future<void> _setPassword() async {
    if (_password.text.length < 8) {
      return _showError('Password must be at least 8 characters');
    }
    if (_password.text != _confirmPassword.text) {
      return _showError('Passwords do not match');
    }
    await _run(() async {
      await Api.post('$_api/resetpassword', {
        'resetToken': _resetToken,
        'newPassword': _password.text,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Your password has been reset. Log in with your new password.')));
      Navigator.pushReplacementNamed(context, Routes.login);
    });
  }

  Future<void> _resend() async {
    setState(() => _info = '');
    await _run(() async {
      await _sendCode();
      setState(() {
        _code.clear();
        _info = 'A new code is on its way to ${_email.text.trim()}.';
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    _code.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Widget _message() => FormMessage(error: _error, info: _info);

  Widget _backToLogin() => TextButton(
        onPressed: () => Navigator.pushReplacementNamed(context, Routes.login),
        child: const Text('Back to log in'),
      );

  @override
  Widget build(BuildContext context) {
    switch (_step) {
      case _Step.email:
        return AuthLayout(
          heading: 'Forgot Password',
          children: [
            const Text(
                "Enter the email on your account and we'll send you a code to reset your password.",
                textAlign: TextAlign.center),
            _message(),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              onSubmitted: (_) => _submitEmail(),
            ),
            ElevatedButton(
              onPressed: _loading ? null : _submitEmail,
              child: Text(_loading ? '...' : 'Send Code'),
            ),
            _backToLogin(),
          ],
        );

      case _Step.code:
        return AuthLayout(
          heading: 'Check Your Email',
          children: [
            _message(),
            TextField(
              controller: _code,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 6,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                  labelText: 'Verification code', counterText: ''),
              onSubmitted: (_) => _verifyCode(),
            ),
            ElevatedButton(
              onPressed: _loading ? null : _verifyCode,
              child: Text(_loading ? '...' : 'Continue'),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () => setState(() {
                    _step = _Step.email;
                    _error = '';
                  }),
                  child: const Text('Back'),
                ),
                TextButton(
                  onPressed: _cooldown > 0 || _loading ? null : _resend,
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

      case _Step.newPassword:
        return AuthLayout(
          heading: 'Set New Password',
          children: [
            _message(),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(
                  labelText: 'New password (8+ characters)'),
            ),
            TextField(
              controller: _confirmPassword,
              obscureText: true,
              decoration:
                  const InputDecoration(labelText: 'Confirm new password'),
              onSubmitted: (_) => _setPassword(),
            ),
            ElevatedButton(
              onPressed: _loading ? null : _setPassword,
              child: Text(_loading ? '...' : 'Set Password'),
            ),
            _backToLogin(),
          ],
        );
    }
  }
}
