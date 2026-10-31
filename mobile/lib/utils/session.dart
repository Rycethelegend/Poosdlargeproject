class Session {
  static String? token;
  static String username = '';

  static void clear() {
    token = null;
    username = '';
  }
}