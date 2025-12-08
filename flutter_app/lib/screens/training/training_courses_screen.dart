import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';
import 'package:flutter_app/services/dotnet_sync_service.dart';

class TrainingCoursesScreen extends StatefulWidget {
  const TrainingCoursesScreen({super.key});

  @override
  State<TrainingCoursesScreen> createState() => _TrainingCoursesScreenState();
}

class _TrainingCoursesScreenState extends State<TrainingCoursesScreen> {
  final DotNetSyncService _syncService = DotNetSyncService();

  bool _loading = false;
  List<dynamic> _assignments = [];

  @override
  void initState() {
    super.initState();
    _fetchAssignments();
  }

  Future<void> _fetchAssignments() async {
    if (!mounted) return;

    setState(() => _loading = true);

    try {
      // --------------------------
      // Fetch Amplify session
      // --------------------------
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      // --------------------------
      // Call backend
      // --------------------------
      final items = await _syncService.getTrainingAssignmentsForUser(idToken);

      if (!mounted) return;

      setState(() => _assignments = items);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error loading training courses: $e")),
      );
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Training Courses")),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _assignments.isEmpty
          ? const Center(child: Text("No training courses found."))
          : ListView.builder(
              itemCount: _assignments.length,
              itemBuilder: (context, index) {
                final a = _assignments[index];

                return Card(
                  margin: const EdgeInsets.all(12),
                  elevation: 4,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a["courseTitle"] ?? "Untitled Course",
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text("Status: ${a["status"]}"),
                        Text("Progress: ${a["progress"]}%"),
                        Text(
                          "Due Date: ${DateTimeUtils.formatDateTime(a["dueDate"])}",
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
