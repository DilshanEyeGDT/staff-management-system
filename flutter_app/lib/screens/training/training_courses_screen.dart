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
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

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

  // ---------------------------------------------------
  // SHOW EDIT POPUP DIALOG
  // ---------------------------------------------------
  Future<void> _openEditDialog(dynamic assignment) async {
    final session = await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

    final idToken = session.userPoolTokensResult.value.idToken.raw;

    int currentProgress = assignment["progress"];
    String currentStatus = assignment["status"];
    DateTime? selectedDate = DateTime.parse(assignment["dueDate"]).toLocal();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setPopupState) {
            return AlertDialog(
              title: Text("Edit Training Assignment"),
              content: SizedBox(
                width: 300,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Progress Dropdown
                    DropdownButton<int>(
                      isExpanded: true,
                      value: currentProgress,
                      items: List.generate(
                        11,
                        (i) => DropdownMenuItem(
                          value: i * 10,
                          child: Text("${i * 10}%"),
                        ),
                      ),
                      onChanged: (val) {
                        setPopupState(() {
                          currentProgress = val!;
                        });
                      },
                    ),

                    const SizedBox(height: 10),

                    // Status Dropdown
                    DropdownButton<String>(
                      isExpanded: true,
                      value: currentStatus,
                      items: const [
                        DropdownMenuItem(
                          value: "pending",
                          child: Text("Pending"),
                        ),
                        DropdownMenuItem(
                          value: "in_progress",
                          child: Text("In Progress"),
                        ),
                        DropdownMenuItem(
                          value: "completed",
                          child: Text("Completed"),
                        ),
                      ],
                      onChanged: (val) {
                        setPopupState(() {
                          currentStatus = val!;
                        });
                      },
                    ),

                    const SizedBox(height: 10),

                    // Due Date Selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          selectedDate != null
                              ? DateTimeUtils.formatDateTime(
                                  selectedDate!.toIso8601String(),
                                )
                              : "Select Date",
                        ),
                        TextButton(
                          child: const Text("Pick"),
                          onPressed: () async {
                            DateTime now = DateTime.now();
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedDate ?? now,
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );

                            if (picked != null) {
                              setPopupState(() {
                                selectedDate = picked;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  child: const Text("Cancel"),
                  onPressed: () => Navigator.pop(context),
                ),
                ElevatedButton(
                  child: const Text("Save"),
                  onPressed: () async {
                    final body = {
                      "progress": currentProgress,
                      "status": currentStatus,
                      "dueDate": selectedDate!.toIso8601String().substring(
                        0,
                        10,
                      ),
                    };

                    final success = await _syncService.updateTrainingAssignment(
                      idToken,
                      assignment["trainingAssignmentId"],
                      body,
                    );

                    Navigator.pop(context);

                    if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Updated successfully!")),
                      );
                      _fetchAssignments();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("Failed to update assignment"),
                        ),
                      );
                    }
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }

  // ---------------------------------------------------

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

                return GestureDetector(
                  onTap: () => _openEditDialog(a),
                  child: Card(
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
                          const SizedBox(height: 8),
                          const Text(
                            "Tap to edit",
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blueGrey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
