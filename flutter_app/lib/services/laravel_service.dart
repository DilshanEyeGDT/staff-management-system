// laravel_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class LaravelService {
  final String baseUrl = "http://10.0.2.2:8000/api/v1"; // Laravel API base
  final String authBaseUrl = "http://10.0.2.2:8080/api/v1"; // Auth endpoints

  // --------------------------------------------------
  // GET CURRENT USER (from Auth)
  // --------------------------------------------------
  Future<int?> getCurrentUserId(String idToken) async {
    final url = Uri.parse("$authBaseUrl/me");
    final response = await http.get(
      url,
      headers: {"Authorization": "Bearer $idToken"},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data["id"]; // assumes Laravel /me returns { "id": ..., "name": ... }
    }
    return null;
  }

  // --------------------------------------------------
  // GET ALL USERS (to resolve createdByUserId)
  // --------------------------------------------------
  Future<Map<int, String>> getAllUsers() async {
    final url = Uri.parse("$baseUrl/users");
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final Map<String, dynamic> responseData = jsonDecode(response.body);

      // Check if success is true and data exists
      if (responseData['success'] == true && responseData['data'] != null) {
        final List<dynamic> users = responseData['data'];
        final Map<int, String> userMap = {};

        for (var u in users) {
          userMap[u["id"]] = u["display_name"]; // snake_case from Laravel
        }

        return userMap;
      }
    }

    return {};
  }

  // ------------------------------
  // FETCH FEEDBACK
  // ------------------------------
  Future<List<Map<String, dynamic>>> getAllFeedback(String idToken) async {
    final url = Uri.parse("$baseUrl/feedback");
    final response = await http.get(
      url,
      headers: {"Authorization": "Bearer $idToken"},
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> responseData = jsonDecode(response.body);

      // Make sure we have data
      if (responseData['data'] != null) {
        final List<dynamic> feedbackList = responseData['data'];

        // Get user mapping
        final Map<int, String> userMap = await getAllUsers();

        // Map user_id and assignee_id to display names
        final List<Map<String, dynamic>> mappedFeedback = feedbackList.map((f) {
          return {
            "feedback_id": f["feedback_id"],
            "title": f["title"],
            "category": f["category"],
            "priority": f["priority"],
            "status": f["status"],
            "user_name": userMap[f["user_id"]] ?? "Unknown",
            "assignee_name": userMap[f["assignee_id"]] ?? "Unassigned",
          };
        }).toList();

        return mappedFeedback;
      }
    }

    return [];
  }

  // --------------------------------------------------
  // FETCH SINGLE FEEDBACK BY ID
  // --------------------------------------------------
  Future<Map<String, dynamic>?> getFeedbackById(
    String idToken,
    int feedbackId,
  ) async {
    final url = Uri.parse("$baseUrl/feedback/$feedbackId");
    final response = await http.get(
      url,
      headers: {"Authorization": "Bearer $idToken"},
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(response.body);

      // Get user mapping for display names
      final Map<int, String> userMap = await getAllUsers();

      return {
        "feedback_id": data["feedback_id"],
        "title": data["title"],
        "category": data["category"],
        "priority": data["priority"],
        "status": data["status"],
        "user_id": data["user_id"],
        "assignee_id": data["assignee_id"],
        "user_name": userMap[data["user_id"]] ?? "Unknown",
        "assignee_name": userMap[data["assignee_id"]] ?? "Unassigned",
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
        "attachments": data["attachments"] ?? [],
        "messages": data["messages"] ?? [],
      };
    }

    return null;
  }
}
