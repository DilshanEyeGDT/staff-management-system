import 'package:flutter/material.dart';
import 'package:flutter_app/screens/leave_attendance/attendance_tab.dart';

class LeaveAttendanceScreen extends StatefulWidget {
  const LeaveAttendanceScreen({super.key});

  @override
  State<LeaveAttendanceScreen> createState() => _LeaveAttendanceScreenState();
}

class _LeaveAttendanceScreenState extends State<LeaveAttendanceScreen> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Leave & Attendance"),
          bottom: const TabBar(
            tabs: [
              Tab(text: "Leave"),
              Tab(text: "Attendance"),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            Center(child: Text("Leave Page", style: TextStyle(fontSize: 18))),
            AttendanceTab(), // <-- SEPARATE FILE
          ],
        ),
      ),
    );
  }
}
