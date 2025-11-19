import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter_app/services/lambda_sync_service.dart';
import 'package:flutter_app/screens/leave_attendance/models/attendance_log.dart';
import 'package:intl/intl.dart';

class AttendanceTab extends StatefulWidget {
  const AttendanceTab({super.key});

  @override
  State<AttendanceTab> createState() => _AttendanceTabState();
}

class _AttendanceTabState extends State<AttendanceTab> {
  bool isLoading = false;
  bool isLogsLoading = true;
  bool showAllLogs = false;
  final LambdaSyncService _lambdaService = LambdaSyncService();
  List<AttendanceLog> attendanceLogs = [];

  @override
  void initState() {
    super.initState();
    _fetchAttendanceLogs();
  }

  // ----------- Get ID Token ------------
  Future<String?> _getIdToken() async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      return session.userPoolTokensResult.value.idToken.raw;
    } catch (e) {
      safePrint("Error getting token: $e");
      return null;
    }
  }

  // ----------- Clock In ------------
  Future<void> _clockIn() async {
    setState(() => isLoading = true);
    final token = await _getIdToken();
    if (token == null) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to get ID token")));
      return;
    }

    final response = await _lambdaService.clockIn(token);
    setState(() => isLoading = false);

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Clock In Successful ✔")));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Clock In Failed (${response.statusCode})")),
      );
    }
  }

  // ----------- Clock Out ------------
  Future<void> _clockOut() async {
    setState(() => isLoading = true);
    final token = await _getIdToken();
    if (token == null) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to get ID token")));
      return;
    }

    final response = await _lambdaService.clockOut(token);
    setState(() => isLoading = false);

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Clock Out Successful ✔")));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Clock Out Failed (${response.statusCode})")),
      );
    }
  }

  Future<void> _fetchAttendanceLogs() async {
    if (!mounted) return;
    setState(() => isLogsLoading = true);

    final token = await _getIdToken();
    if (token == null) {
      if (!mounted) return;
      setState(() => isLogsLoading = false);
      return;
    }

    final response = await _lambdaService.getAttendanceLogs(token);

    if (!mounted) return; // <--- IMPORTANT

    if (response.statusCode == 200) {
      final data = Map<String, dynamic>.from(jsonDecode(response.body)['data']);

      final logs = (data['attendanceLogs'] as List)
          .map((e) => AttendanceLog.fromJson(e))
          .toList()
          .reversed
          .toList();

      if (!mounted) return;

      setState(() {
        attendanceLogs = logs;
        isLogsLoading = false;
      });
    } else {
      if (!mounted) return;

      setState(() => isLogsLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Failed to fetch logs (${response.statusCode})"),
        ),
      );
    }
  }

  String formatTime(String? time) {
    if (time == null) return '-';
    final dt = DateTime.parse(time).toLocal();
    return DateFormat.jm().format(dt); // e.g., 11:32 AM
  }

  @override
  Widget build(BuildContext context) {
    final displayLogs = showAllLogs
        ? attendanceLogs
        : attendanceLogs.take(5).toList(); // show only last 5

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // --------- BUTTON ROW TOP ---------
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _clockIn,
                  child: const Text(
                    "Clock In",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _clockOut,
                  child: const Text(
                    "Clock Out",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),

          // --------- SPACING BELOW BUTTONS ---------
          const SizedBox(height: 24),

          // --------- PLACEHOLDER FOR LATER CONTENT ---------
          // ---------------- ATTENDANCE LOGS ----------------
          Expanded(
            child: isLogsLoading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          itemCount: displayLogs.length,
                          itemBuilder: (context, index) {
                            final log = displayLogs[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                title: Text(
                                  "Date: ${log.date.split('T')[0]}  Status: ${log.status}",
                                ),
                                subtitle: Text(
                                  "Clock In: ${formatTime(log.clockIn)}\nClock Out: ${formatTime(log.clockOut)}",
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      // SEE MORE BUTTON
                      if (attendanceLogs.length > 5 && !showAllLogs)
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              showAllLogs = true;
                            });
                          },
                          child: const Text("See More"),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
