import 'dart:convert';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

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

  // ------------------ GET LEAVE REQUESTS ------------------
  Future<List<dynamic>?> getLeaveRequests(
    String idToken, {
    String status = "all",
  }) async {
    try {
      // get current user_id first
      final userId = await getCurrentUserId(idToken);
      if (userId == null) {
        safePrint("Error: User ID not found");
        return null;
      }

      // build URL with optional status filter
      final String urlStr = (status == "all")
          ? "$baseUrl/api/v1/leave/requests?user_id=$userId"
          : "$baseUrl/api/v1/leave/requests?user_id=$userId&status=$status";

      final url = Uri.parse(urlStr);

      final response = await http.get(url, headers: {"Authorization": idToken});

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body["data"]["leaveRequests"];
      } else {
        safePrint("Failed fetching leave requests: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      safePrint("Error in getLeaveRequests: $e");
      return null;
    }
  }

  // ------------------ GET LEAVE BALANCE ------------------
  Future<List<dynamic>?> getLeaveBalance(String idToken, int userId) async {
    final url = Uri.parse("$baseUrl/api/v1/leave/balance?user_id=$userId");
    final response = await http.get(url, headers: {"Authorization": idToken});
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['leave_balance'];
    }
    return null;
  }

  // ------------------ CREATE LEAVE REQUEST ------------------
  Future<Map<String, dynamic>> createLeaveRequest({
    required String token,
    required int userId,
    required int leavePolicyId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
  }) async {
    final url = Uri.parse("$baseUrl/api/v1/leave/requests");
    final body = jsonEncode({
      "user_id": userId,
      "leave_policy_id": leavePolicyId,
      "start_date": DateFormat("yyyy-MM-dd").format(startDate),
      "end_date": DateFormat("yyyy-MM-dd").format(endDate),
      "reason": reason,
    });

    final response = await http.post(
      url,
      headers: {"Authorization": token, "Content-Type": "application/json"},
      body: body,
    );

    return jsonDecode(response.body);
  }

  // ------------------ GET AVAILABLE ROOMS ------------------
  Future<List<dynamic>?> getAvailableRooms(String idToken) async {
    try {
      final url = Uri.parse("$baseUrl/api/v1/rooms");
      final response = await http.get(
        url,
        headers: {"Authorization": idToken, "Content-Type": "application/json"},
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body["rooms"]; // matches your API response
      } else {
        safePrint("Failed fetching rooms: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      safePrint("Error in getAvailableRooms: $e");
      return null;
    }
  }

  // ------------------ GET ROOM AVAILABILITY ------------------
  Future<List<dynamic>?> getRoomAvailability(String idToken, int roomId) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/v1/rooms/availability?room_id=$roomId",
      );
      final response = await http.get(
        url,
        headers: {"Authorization": idToken, "Content-Type": "application/json"},
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['timeline']; // array of time slots
      } else {
        safePrint("Failed fetching room availability: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      safePrint("Error in getRoomAvailability: $e");
      return null;
    }
  }

  // ------------------ CREATE ROOM BOOKING ------------------
  Future<http.Response> bookRoom({
    required String idToken,
    required int roomId,
    required int userId,
    required DateTime startTime,
    required DateTime endTime,
  }) async {
    final url = Uri.parse("$baseUrl/api/v1/bookings");

    final body = jsonEncode({
      "room_id": roomId,
      "user_id": userId,
      "start_time": startTime.toIso8601String(),
      "end_time": endTime.toIso8601String(),
    });

    return await http.post(
      url,
      headers: {"Authorization": idToken, "Content-Type": "application/json"},
      body: body,
    );
  }

  // ------------------ GET USER BOOKINGS ------------------
  Future<List<dynamic>?> getUserBookings(String idToken) async {
    try {
      // get current user ID first
      final userId = await getCurrentUserId(idToken);
      if (userId == null) {
        safePrint("Error: User ID not found");
        return null;
      }

      final url = Uri.parse("$baseUrl/api/v1/bookings?user_id=$userId");

      final response = await http.get(
        url,
        headers: {"Authorization": idToken, "Content-Type": "application/json"},
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'] as List<dynamic>?;
      } else {
        safePrint("Failed fetching bookings: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      safePrint("Error in getUserBookings: $e");
      return null;
    }
  }

  // ------------------ CANCEL BOOKING ------------------
  Future<bool> cancelBooking(
    String idToken,
    String bookingId,
    int userId,
  ) async {
    final url = Uri.parse("$baseUrl/api/v1/bookings?booking_id=$bookingId");
    final response = await http.delete(
      url,
      headers: {"Authorization": idToken, "Content-Type": "application/json"},
      body: jsonEncode({"user_id": userId}),
    );
    return response.statusCode == 200;
  }
}
