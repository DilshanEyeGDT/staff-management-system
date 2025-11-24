import 'package:flutter/material.dart';
import 'package:flutter_app/screens/leave_attendance/attendance_tab.dart';
import 'package:flutter_app/screens/leave_attendance/leave_tab.dart';

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
          title: const Text(
            "Leave & Attendance",
            key: Key('appbar_title'), // key for AppBar title
          ),
          bottom: const TabBar(
            tabs: [
              Tab(
                key: Key('tab_leave'), // key for Leave tab
                text: "Leave",
              ),
              Tab(
                key: Key('tab_attendance'), // key for Attendance tab
                text: "Attendance",
              ),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            LeaveTab(key: Key('leave_tab')), // key for LeaveTab
            AttendanceTab(key: Key('attendance_tab')), // key for AttendanceTab
          ],
        ),
      ),
    );
  }
}
