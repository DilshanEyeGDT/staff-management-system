// go_sync_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class GoSyncService {
  final String baseUrl = "http://10.0.2.2:8088/api/v1";
  final String authBaseUrl = "http://10.0.2.2:8080/api/v1";

  // --------------------------------------------------
  // GET CURRENT USER (from Auth Service)
  // --------------------------------------------------
  Future<int?> getCurrentUserId(String idToken) async {
    final url = Uri.parse("$authBaseUrl/me");
    final response = await http.get(
      url,
      headers: {"Authorization": "Bearer $idToken"},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data["id"];
    }
    return null;
  }

  // --------------------------------------------------
  // CREATE EVENT (Go backend)
  // POST /events
  // --------------------------------------------------
  Future<bool> createEvent({
    required String idToken,
    required String title,
    required String summary,
    required String content,
    required List<String> attachments,
    required String scheduledAt,
    required List<String> tags,
  }) async {
    final currentUserId = await getCurrentUserId(idToken);
    if (currentUserId == null) {
      throw Exception("Failed to get current user ID");
    }

    final url = Uri.parse("$baseUrl/events");

    final body = {
      "title": title,
      "summary": summary,
      "content": content,
      "attachments": attachments, // only names
      "created_by": currentUserId,
      "status": "draft",
      "scheduled_at": scheduledAt,
      "tags": tags,
    };

    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $idToken",
      },
      body: jsonEncode(body),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  // --------------------------------------------------
  // GET ALL EVENTS (Go backend)
  // GET /events
  // --------------------------------------------------
  Future<List<Map<String, dynamic>>> fetchAllEvents() async {
    final url = Uri.parse("$baseUrl/events");

    final response = await http.get(url);

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data);
    }

    return [];
  }

  // --------------------------------------------------
  // GET EVENT DETAILS BY ID
  // --------------------------------------------------
  Future<Map<String, dynamic>?> getEventDetails(int eventId) async {
    final url = Uri.parse("$baseUrl/events/$eventId");

    final response = await http.get(url);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }

    return null;
  }
}
