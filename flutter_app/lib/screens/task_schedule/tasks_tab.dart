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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('tasks_initialize_error_snackbar'),
          content: Text("Error initializing data: $e"),
        ),
      );
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('tasks_fetch_error_snackbar'),
          content: Text("Error fetching tasks: $e"),
        ),
      );
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
        key: const Key('task_comment_bottom_sheet'),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          key: const Key('task_comment_content'),
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Add Comment",
              key: Key('task_comment_title'),
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 12),
            TextField(
              key: const Key('task_comment_text_field'),
              controller: commentCtrl,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: "Comment",
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              key: const Key('task_comment_submit_button'),
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
                    key: const Key('task_comment_result_snackbar'),
                    content: Text(
                      success ? "Comment added!" : "Failed to add comment",
                    ),
                  ),
                );
              },
              child: const Text("Submit", key: Key('task_comment_submit_text')),
            ),
            const SizedBox(height: 20),
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
      key: const Key('tasks_tab_controller'),
      length: 4,
      child: Scaffold(
        key: const Key('tasks_screen'),
        appBar: const TabBar(
          key: Key('tasks_tab_bar'),
          tabs: [
            Tab(key: Key('tasks_tab_open'), text: "Open"),
            Tab(key: Key('tasks_tab_inprogress'), text: "InProgress"),
            Tab(key: Key('tasks_tab_done'), text: "Done"),
            Tab(key: Key('tasks_tab_cancelled'), text: "Cancelled"),
          ],
        ),
        body: _loading
            ? const Center(
                key: Key('tasks_loading'),
                child: CircularProgressIndicator(
                  key: Key('tasks_loading_indicator'),
                ),
              )
            : TabBarView(
                key: const Key('tasks_tab_view'),
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
      return const Center(
        key: Key('tasks_empty_state'),
        child: Text("No tasks available", key: Key('tasks_empty_text')),
      );
    }

    return ListView.builder(
      key: Key('tasks_list_$status'),
      itemCount: list.length,
      itemBuilder: (_, index) {
        final t = list[index];
        final taskId = t["taskId"] ?? index;

        return Card(
          key: Key('task_card_${status}_$taskId'),
          margin: const EdgeInsets.all(12),
          child: ListTile(
            key: Key('task_tile_${status}_$taskId'),
            onTap: () => _openCommentPopup(t),
            title: Text(
              t["title"],
              key: Key('task_title_${status}_$taskId'),
              style: const TextStyle(fontSize: 16),
            ),
            subtitle: Column(
              key: Key('task_subtitle_${status}_$taskId'),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t["description"],
                  key: Key('task_description_${status}_$taskId'),
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  "Due: ${DateTimeUtils.formatDateTime(t["dueAt"])}",
                  key: Key('task_due_date_${status}_$taskId'),
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
                Text(
                  "Created by: ${t["createdByUserName"]}",
                  key: Key('task_created_by_${status}_$taskId'),
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
              ],
            ),
            trailing: Container(
              key: Key('task_priority_badge_${status}_$taskId'),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _priorityColor(t["priority"]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                ["Low", "Medium", "High"][t["priority"] - 1],
                key: Key('task_priority_text_${status}_$taskId'),
                style: const TextStyle(color: Colors.black),
              ),
            ),
          ),
        );
      },
    );
  }
}
