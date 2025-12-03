import 'package:flutter/material.dart';

class TasksTab extends StatelessWidget {
  const TasksTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        "Tasks View",
        key: Key('tasks_tab_text'),
        style: TextStyle(fontSize: 18),
      ),
    );
  }
}
