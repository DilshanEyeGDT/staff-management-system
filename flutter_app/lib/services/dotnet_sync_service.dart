// dotnet_sync_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class DotNetSyncService {
  final String baseUrl = "http://10.0.2.2:5083/api/v1";
  final String authBaseUrl = "http://10.0.2.2:8080/api/v1";

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
      return data["id"];
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
      final List<dynamic> users = jsonDecode(response.body);
      final Map<int, String> userMap = {};

      for (var u in users) {
        userMap[u["id"]] = u["displayName"];
      }
      return userMap;
    }

    return {};
  }

  // --------------------------------------------------
  // GET SCHEDULES FOR CURRENT USER
  // --------------------------------------------------
  Future<List<dynamic>> getSchedulesForUser(String idToken) async {
    final currentUserId = await getCurrentUserId(idToken);
    if (currentUserId == null) {
      throw Exception("Failed to fetch current user ID");
    }

    // Fetch schedules
    final url = Uri.parse("$baseUrl/schedules?user_id=$currentUserId");

    final response = await http.get(
      url,
      headers: {"Content-Type": "application/json", "Authorization": idToken},
    );

    if (response.statusCode != 200) {
      throw Exception(
        "Failed to load schedules: ${response.statusCode} ${response.body}",
      );
    }

    final decoded = jsonDecode(response.body);

    // Extract schedules list
    List<dynamic> schedules = decoded["schedules"] ?? [];

    // Fetch users map for resolving createdByUserId
    final usersMap = await getAllUsers();

    // Attach createdByUserName
    for (var s in schedules) {
      final creatorId = s["createdByUserId"];
      s["createdByUserName"] = usersMap[creatorId] ?? "Unknown User";
    }

    return schedules;
  }
}
