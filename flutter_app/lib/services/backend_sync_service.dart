import 'package:http/http.dart' as http;

class BackendSyncService {
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
}
