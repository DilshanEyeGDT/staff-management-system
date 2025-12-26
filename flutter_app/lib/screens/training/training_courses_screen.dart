import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';
import 'package:flutter_app/screens/training/training_notifications_screen.dart';
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

  int _notificationCount = 0;
  bool _loadingNotifications = false;

  @override
  void initState() {
    super.initState();
    _fetchAssignments();
    _loadNotificationCount();
  }

  //load notification count
  Future<void> _loadNotificationCount() async {
    try {
      setState(() => _loadingNotifications = true);

      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final data = await _syncService.getTrainingNotifications(idToken);

      if (!mounted) return;

      setState(() {
        _notificationCount = data.length;
        _loadingNotifications = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingNotifications = false);
    }
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
        SnackBar(
          key: const Key('training_assignments_error_snackbar'),
          content: Text("Error loading training courses: $e"),
        ),
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
              key: const Key('edit_assignment_dialog'),
              title: const Text(
                "Edit Training Assignment",
                key: Key('edit_assignment_title'),
              ),
              content: SizedBox(
                key: const Key('edit_assignment_content'),
                width: 300,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Progress Dropdown
                    DropdownButton<int>(
                      key: const Key('assignment_progress_dropdown'),
                      isExpanded: true,
                      value: currentProgress,
                      items: List.generate(
                        11,
                        (i) => DropdownMenuItem(
                          key: Key('progress_option_${i * 10}'),
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
                      key: const Key('assignment_status_dropdown'),
                      isExpanded: true,
                      value: currentStatus,
                      items: const [
                        DropdownMenuItem(
                          key: Key('status_pending'),
                          value: "pending",
                          child: Text("Pending"),
                        ),
                        DropdownMenuItem(
                          key: Key('status_in_progress'),
                          value: "in_progress",
                          child: Text("In Progress"),
                        ),
                        DropdownMenuItem(
                          key: Key('status_completed'),
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
                      key: const Key('assignment_due_date_row'),
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          selectedDate != null
                              ? DateTimeUtils.formatDateTime(
                                  selectedDate!.toIso8601String(),
                                )
                              : "Select Date",
                          key: const Key('assignment_due_date_text'),
                        ),
                        TextButton(
                          key: const Key('assignment_due_date_pick_button'),
                          child: const Text(
                            "Pick",
                            key: Key('assignment_due_date_pick_text'),
                          ),
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
                  key: const Key('edit_assignment_cancel_button'),
                  child: const Text(
                    "Cancel",
                    key: Key('edit_assignment_cancel_text'),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                ElevatedButton(
                  key: const Key('edit_assignment_save_button'),
                  child: const Text(
                    "Save",
                    key: Key('edit_assignment_save_text'),
                  ),
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
                        const SnackBar(
                          key: Key('edit_assignment_success_snackbar'),
                          content: Text("Updated successfully!"),
                        ),
                      );
                      _fetchAssignments();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          key: Key('edit_assignment_failed_snackbar'),
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
      key: const Key('training_courses_screen'),
      appBar: AppBar(
        key: const Key('training_courses_appbar'),
        title: const Text(
          "Training Courses",
          key: Key('training_courses_title'),
        ),
        actions: [
          Stack(
            key: const Key('training_notifications_stack'),
            children: [
              IconButton(
                key: const Key('training_notifications_button'),
                icon: const Icon(
                  Icons.notifications,
                  key: Key('training_notifications_icon'),
                ),
                onPressed: () async {
                  // Open bottom sheet
                  await showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(20),
                      ),
                    ),
                    builder: (context) => const TrainingNotificationsSheet(
                      key: Key('training_notifications_sheet'),
                    ),
                  );

                  // Reset notification count after reading
                  if (!mounted) return;
                  setState(() {
                    _notificationCount = 0;
                  });
                },
              ),

              // ----------- RED BADGE -----------
              if (_notificationCount > 0)
                Positioned(
                  key: const Key('training_notifications_badge_positioned'),
                  right: 8,
                  top: 8,
                  child: Container(
                    key: const Key('training_notifications_badge'),
                    padding: const EdgeInsets.all(5),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      _notificationCount.toString(),
                      key: const Key('training_notifications_badge_text'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(
              key: Key('training_assignments_loading'),
              child: CircularProgressIndicator(
                key: Key('training_assignments_loading_indicator'),
              ),
            )
          : _assignments.isEmpty
          ? const Center(
              key: Key('training_assignments_empty'),
              child: Text(
                "No training courses found.",
                key: Key('training_assignments_empty_text'),
              ),
            )
          : ListView.builder(
              key: const Key('training_assignments_list'),
              itemCount: _assignments.length,
              itemBuilder: (context, index) {
                final a = _assignments[index];

                return GestureDetector(
                  key: Key(
                    'training_assignment_gesture_${a["trainingAssignmentId"]}',
                  ),
                  onTap: () => _openEditDialog(a),
                  child: Card(
                    key: Key(
                      'training_assignment_card_${a["trainingAssignmentId"]}',
                    ),
                    margin: const EdgeInsets.all(12),
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        key: Key(
                          'training_assignment_card_content_${a["trainingAssignmentId"]}',
                        ),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            a["courseTitle"] ?? "Untitled Course",
                            key: Key(
                              'training_assignment_course_title_${a["trainingAssignmentId"]}',
                            ),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Status: ${a["status"]}",
                            key: Key(
                              'training_assignment_status_${a["trainingAssignmentId"]}',
                            ),
                          ),
                          Text(
                            "Progress: ${a["progress"]}%",
                            key: Key(
                              'training_assignment_progress_${a["trainingAssignmentId"]}',
                            ),
                          ),
                          Text(
                            "Due Date: ${DateTimeUtils.formatDateTime(a["dueDate"])}",
                            key: Key(
                              'training_assignment_due_date_${a["trainingAssignmentId"]}',
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            "Tap to edit",
                            key: Key('training_assignment_tap_to_edit'),
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
