import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:poosdalatro/utils/api.dart';

/// Tracks whether the app can reach the internet. A failed request marks it
/// offline, then it checks every few seconds until the connection is back
class Connection {
  static final ValueNotifier<bool> online = ValueNotifier(true);
  static Timer? _retry;

  static const String offlineMessage =
      "You're offline. Check your internet connection and try again.";

  static void markOnline() {
    _retry?.cancel();
    _retry = null;
    online.value = true;
  }

  static void markOffline() {
    if (!online.value) return;
    online.value = false;
    _retry = Timer.periodic(const Duration(seconds: 5), (_) => _check());
  }

  static Future<void> _check() async {
    try {
      await Api.client
          .head(Uri.parse('https://poosdbasecontactmanager.casa/'))
          .timeout(const Duration(seconds: 5));
      markOnline();
    } catch (_) {
      // still offline
    }
  }
}
