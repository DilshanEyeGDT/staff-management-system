import 'dart:convert';

import 'package:http/http.dart' as http;

class BackendSyncService {
  // Audit login/logout events with backend
  final String baseUrl =
      "http://10.0.2.2:8080/api/sync"; // 🔁 replace with your backend URL if needed

  Future<void> syncLogin(String accessToken) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {"Authorization": "Bearer $accessToken"},
      );
      print("✅ Login synced with backend");
      print('Access Token: $accessToken');
    } catch (e) {
      print("❌ Login sync failed: $e");
    }
  }

  Future<void> syncLogout(String accessToken) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {"Authorization": "Bearer $accessToken"},
      );
      print("✅ Logout synced with backend");
    } catch (e) {
      print("❌ Logout sync failed: $e");
    }
  }

  // PATCH /api/v1/me  with {"displayName": "..."}
  // replace with your backend host (use 10.0.2.2 on android emulator)
  static const String baseUrl1 = 'http://10.0.2.2:8080/api/v1';

  Future<http.Response> updateDisplayName(
    String accessToken,
    String displayName,
  ) {
    final uri = Uri.parse('$baseUrl1/me');
    return http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({'displayName': displayName}),
    );
  }
}
