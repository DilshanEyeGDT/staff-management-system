import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/dotnet_sync_service.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';

class TasksTab extends StatefulWidget {
  const TasksTab({super.key});

  @override
  State<TasksTab> createState() => _TasksTabState();
}

class _TasksTabState extends State<TasksTab> {
  final DotNetSyncService _dotNetService = DotNetSyncService();

  bool _loading = false;
  List<dynamic> _tasks = [];
  Map<int, String> _usersMap = {}; // Map for userId -> displayName

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    setState(() => _loading = true);

    try {
      // Fetch users first
      _usersMap = await _dotNetService.getAllUsers();

      // Fetch tasks for current user
      await _fetchTasks();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error initializing data: $e")));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchTasks() async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final tasks = await _dotNetService.getTasksForUser(idToken);

      // Attach createdByUserName
      for (var t in tasks) {
        final creatorId = t["createdByUserId"];
        t["createdByUserName"] = _usersMap[creatorId] ?? "Unknown User";
      }

      setState(() => _tasks = tasks);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error fetching tasks: $e")));
    }
  }

  // ------------------ PRIORITY COLOR ------------------
  Color _priorityColor(int priority) {
    switch (priority) {
      case 1:
        return Colors.yellow; // Low
      case 2:
        return Colors.orange; // Medium
      case 3:
        return Colors.red; // High
      default:
        return Colors.grey;
    }
  }

  // ------------------ COMMENT POPUP ------------------
  void _openCommentPopup(dynamic task) async {
    final session = await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
    final idToken = session.userPoolTokensResult.value.idToken.raw;

    final currentUserId = await _dotNetService.getCurrentUserId(idToken) ?? 0;

    TextEditingController commentCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Add Comment", style: TextStyle(fontSize: 18)),
            SizedBox(height: 12),
            TextField(
              controller: commentCtrl,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: "Comment",
              ),
              maxLines: 4,
            ),
            SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                final content = commentCtrl.text.trim();
                if (content.isEmpty) return;

                final success = await _dotNetService.addTaskComment(
                  task["taskId"],
                  currentUserId,
                  content,
                );

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? "Comment added!" : "Failed to add comment",
                    ),
                  ),
                );
              },
              child: const Text("Submit"),
            ),
            SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // ------------------ STATUS FILTER ------------------
  List<dynamic> _filterByStatus(String status) {
    return _tasks
        .where(
          (t) => t["status"].toString().toLowerCase() == status.toLowerCase(),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: const TabBar(
          tabs: [
            Tab(text: "Open"),
            Tab(text: "InProgress"),
            Tab(text: "Done"),
            Tab(text: "Cancelled"),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  _buildTaskList("open"),
                  _buildTaskList("inprogress"),
                  _buildTaskList("done"),
                  _buildTaskList("cancelled"),
                ],
              ),
      ),
    );
  }

  // ------------------ TASK LIST ------------------
  Widget _buildTaskList(String status) {
    final list = _filterByStatus(status);

    if (list.isEmpty) {
      return const Center(child: Text("No tasks available"));
    }

    return ListView.builder(
      itemCount: list.length,
      itemBuilder: (_, index) {
        final t = list[index];
        return Card(
          margin: const EdgeInsets.all(12),
          child: ListTile(
            onTap: () => _openCommentPopup(t),
            title: Text(t["title"], style: TextStyle(fontSize: 16)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t["description"], style: TextStyle(fontSize: 13)),
                SizedBox(height: 4),
                Text(
                  "Due: ${DateTimeUtils.formatDateTime(t["dueAt"])}",
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
                Text(
                  "Created by: ${t["createdByUserName"]}",
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
              ],
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _priorityColor(t["priority"]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                ["Low", "Medium", "High"][t["priority"] - 1],
                style: const TextStyle(color: Colors.black),
              ),
            ),
          ),
        );
      },
    );
  }
}
