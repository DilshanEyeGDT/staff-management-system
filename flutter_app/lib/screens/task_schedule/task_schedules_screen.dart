import 'package:flutter/material.dart';
import 'package:flutter_app/screens/task_schedule/schedules_tab.dart';
import 'package:flutter_app/screens/task_schedule/tasks_tab.dart';

class TaskSchedulesScreen extends StatelessWidget {
  const TaskSchedulesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2, // Schedules & Tasks
      child: Scaffold(
        key: const Key('task_schedules_screen'),
        appBar: AppBar(
          title: const Text(
            'Task & Schedules',
            key: Key('task_schedules_title'),
          ),
          bottom: const TabBar(
            key: Key('task_schedules_tabbar'),
            tabs: [
              Tab(key: Key('tab_schedules'), text: 'Schedules'),
              Tab(key: Key('tab_tasks'), text: 'Tasks'),
            ],
          ),
        ),
        body: const TabBarView(
          key: Key('task_schedules_tabbar_view'),
          children: [
            SchedulesTab(key: Key('schedules_tab')),
            TasksTab(key: Key('tasks_tab')),
          ],
        ),
      ),
    );
  }
}
