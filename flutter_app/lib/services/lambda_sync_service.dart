import 'dart:convert';
import 'package:http/http.dart' as http;

class LambdaSyncService {
  final String baseUrl =
      "https://37w8g0zg3k.execute-api.ap-southeast-2.amazonaws.com/dev";

  // ---------------- CLOCK IN ----------------
  Future<http.Response> clockIn(String idToken) async {
    final url = Uri.parse("$baseUrl/api/v1/attendance/clock-in");

    return await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": idToken, // <-- PASS ID TOKEN
      },
    );
  }

  // ---------------- CLOCK OUT ----------------
  Future<http.Response> clockOut(String idToken) async {
    final url = Uri.parse("$baseUrl/api/v1/attendance/clock-out");

    return await http.post(
      url,
      headers: {"Content-Type": "application/json", "Authorization": idToken},
    );
  }

  // ------------------ GET CURRENT USER ------------------
  Future<int?> getCurrentUserId(String idToken) async {
    final url = Uri.parse("$baseUrl/api/v1/users/me");
    final response = await http.get(url, headers: {"Authorization": idToken});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body)['user'];
      return data['user_id'];
    } else {
      return null;
    }
  }

  // ------------------ GET ATTENDANCE LOGS ------------------
  Future<http.Response> getAttendanceLogs(String idToken) async {
    final userId = await getCurrentUserId(idToken);
    if (userId == null) throw Exception("Failed to fetch current user ID");

    final url = Uri.parse("$baseUrl/api/v1/attendance?user_id=$userId");
    return await http.get(
      url,
      headers: {"Content-Type": "application/json", "Authorization": idToken},
    );
  }
}
