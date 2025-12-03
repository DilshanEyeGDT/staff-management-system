import 'package:flutter/material.dart';

class SchedulesTab extends StatelessWidget {
  const SchedulesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        "Schedules View",
        key: Key('schedules_tab_text'),
        style: TextStyle(fontSize: 18),
      ),
    );
  }
}
