import 'dart:io';

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/go_sync_service.dart';

class EventAnnouncementScreen extends StatefulWidget {
  const EventAnnouncementScreen({Key? key}) : super(key: key);

  @override
  State<EventAnnouncementScreen> createState() =>
      _EventAnnouncementScreenState();
}

class _EventAnnouncementScreenState extends State<EventAnnouncementScreen> {
  final GoSyncService goService = GoSyncService();

  final titleController = TextEditingController();
  final summaryController = TextEditingController();
  final contentController = TextEditingController();
  final scheduledAtController = TextEditingController();
  final tagController = TextEditingController();

  List<String> attachments = [];
  List<String> tags = [];

  Future<void> pickAttachment() async {
    final result = await FilePicker.platform.pickFiles();

    if (result != null && result.files.isNotEmpty) {
      final fileName = result.files.single.name;

      setState(() {
        attachments.add(fileName);
      });
    }
  }

  Future<void> pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );

    if (date == null) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (time == null) return;

    final dt = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    scheduledAtController.text = dt.toUtc().toIso8601String();

    setState(() {});
  }

  Future<void> createEvent() async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final success = await goService.createEvent(
        idToken: idToken,
        title: titleController.text.trim(),
        summary: summaryController.text.trim(),
        content: contentController.text.trim(),
        attachments: attachments,
        scheduledAt: scheduledAtController.text.trim(),
        tags: tags,
      );

      if (!mounted) return;

      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Event created successfully")),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Failed to create event")));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  void openCreateEventDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: const Text("Create Event"),
              content: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(labelText: "Title"),
                    ),
                    TextField(
                      controller: summaryController,
                      decoration: const InputDecoration(labelText: "Summary"),
                    ),
                    TextField(
                      controller: contentController,
                      decoration: const InputDecoration(labelText: "Content"),
                    ),

                    TextField(
                      controller: scheduledAtController,
                      readOnly: true,
                      decoration: const InputDecoration(
                        labelText: "Scheduled At",
                      ),
                      onTap: () async {
                        await pickDateTime();
                        setStateDialog(() {}); // update inside dialog
                      },
                    ),
                    const SizedBox(height: 10),

                    /// TAG INPUT
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: tagController,
                            decoration: const InputDecoration(
                              labelText: "Add Tag",
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () {
                            if (tagController.text.trim().isNotEmpty) {
                              setStateDialog(() {
                                tags.add(tagController.text.trim());
                              });
                              tagController.clear();
                            }
                          },
                        ),
                      ],
                    ),

                    Wrap(
                      spacing: 8,
                      children: tags
                          .map(
                            (tag) => Chip(
                              label: Text(tag),
                              onDeleted: () {
                                setStateDialog(() {
                                  tags.remove(tag);
                                });
                              },
                            ),
                          )
                          .toList(),
                    ),

                    const SizedBox(height: 10),

                    /// ATTACHMENT PICKER
                    ElevatedButton(
                      onPressed: () async {
                        final result = await FilePicker.platform.pickFiles();

                        if (result != null && result.files.isNotEmpty) {
                          final fileName = result.files.single.name;

                          setStateDialog(() {
                            attachments.add(fileName);
                          });
                        }
                      },
                      child: const Text("Add Attachment"),
                    ),

                    Wrap(
                      spacing: 8,
                      children: attachments
                          .map(
                            (file) => Chip(
                              label: Text(file),
                              onDeleted: () {
                                setStateDialog(() {
                                  attachments.remove(file);
                                });
                              },
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: createEvent,
                  child: const Text("Create"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Events & Announcements')),
      floatingActionButton: FloatingActionButton(
        onPressed: openCreateEventDialog,
        child: const Icon(Icons.add),
      ),
      body: const Center(
        child: Text(
          'This is the Events & Announcements screen',
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
