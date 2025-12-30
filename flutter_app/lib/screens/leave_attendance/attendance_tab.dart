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

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('clock_in_token_failure_snackbar'),
          content: Text("Failed to get ID token"),
        ),
      );
      return;
    }

    final response = await _lambdaService.clockIn(token);
    setState(() => isLoading = false);

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('clock_in_success_snackbar'),
          content: Text("Clock In Successful ✔"),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('clock_in_failure_snackbar'),
          content: Text("Clock In Failed (${response.statusCode})"),
        ),
      );
    }
  }

  // ----------- Clock Out ------------
  Future<void> _clockOut() async {
    setState(() => isLoading = true);

    final token = await _getIdToken();
    if (token == null) {
      setState(() => isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('clock_out_token_failure_snackbar'),
          content: Text("Failed to get ID token"),
        ),
      );
      return;
    }

    final response = await _lambdaService.clockOut(token);
    setState(() => isLoading = false);

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('clock_out_success_snackbar'),
          content: Text("Clock Out Successful ✔"),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('clock_out_failure_snackbar'),
          content: Text("Clock Out Failed (${response.statusCode})"),
        ),
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

    if (!mounted) return;

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
          key: const Key('attendance_logs_fetch_failure_snackbar'),
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
      key: const Key('attendance_root_padding'),
      padding: const EdgeInsets.all(16),
      child: Column(
        key: const Key('attendance_root_column'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ================= CLOCK BUTTON ROW =================
          Row(
            key: const Key('attendance_clock_button_row'),
            children: [
              Expanded(
                child: ElevatedButton(
                  key: const Key('attendance_clock_in_button'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _clockIn,
                  child: const Text(
                    "Clock In",
                    key: Key('attendance_clock_in_button_text'),
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(
                width: 16,
                key: Key('attendance_clock_button_spacing'),
              ),
              Expanded(
                child: ElevatedButton(
                  key: const Key('attendance_clock_out_button'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _clockOut,
                  child: const Text(
                    "Clock Out",
                    key: Key('attendance_clock_out_button_text'),
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),

          // ================= SPACING =================
          const SizedBox(height: 24, key: Key('attendance_section_spacing')),

          // ================= ATTENDANCE LOGS =================
          Expanded(
            key: const Key('attendance_logs_section'),
            child: isLogsLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      key: Key('attendance_logs_loading_indicator'),
                    ),
                  )
                : Column(
                    key: const Key('attendance_logs_column'),
                    children: [
                      Expanded(
                        child: ListView.builder(
                          key: const Key('attendance_log_list'),
                          itemCount: displayLogs.length,
                          itemBuilder: (context, index) {
                            final log = displayLogs[index];

                            return Card(
                              key: Key('attendance_log_card_$index'),
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                key: Key('attendance_log_tile_$index'),
                                title: Text(
                                  "Date: ${log.date.split('T')[0]}  Status: ${log.status}",
                                  key: Key('attendance_log_title_$index'),
                                ),
                                subtitle: Text(
                                  "Clock In: ${formatTime(log.clockIn)}\nClock Out: ${formatTime(log.clockOut)}",
                                  key: Key('attendance_log_subtitle_$index'),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      // ================= SEE MORE =================
                      if (attendanceLogs.length > 5 && !showAllLogs)
                        ElevatedButton(
                          key: const Key('attendance_see_more_button'),
                          onPressed: () {
                            setState(() {
                              showAllLogs = true;
                            });
                          },
                          child: const Text(
                            "See More",
                            key: Key('attendance_see_more_button_text'),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
