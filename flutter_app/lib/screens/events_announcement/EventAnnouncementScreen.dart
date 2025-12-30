import 'dart:convert';
import 'dart:io';

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/screens/events_announcement/event_fetch_service.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';
import 'package:flutter_app/services/go_sync_service.dart';
import 'package:http/http.dart' as http;

class EventAnnouncementScreen extends StatefulWidget {
  const EventAnnouncementScreen({Key? key}) : super(key: key);

  @override
  State<EventAnnouncementScreen> createState() =>
      _EventAnnouncementScreenState();
}

class _EventAnnouncementScreenState extends State<EventAnnouncementScreen> {
  List<Map<String, dynamic>> myEvents = [];

  final EventFetchService eventFetchService = EventFetchService();

  @override
  void initState() {
    super.initState();
    loadMyEvents();
  }

  Future<void> loadMyEvents() async {
    final events = await eventFetchService.fetchMyEvents();
    setState(() {
      myEvents = events;
    });
  }

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
          const SnackBar(
            key: Key('create_event_success_snackbar'),
            content: Text('Event created successfully'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            key: Key('create_event_failure_snackbar'),
            content: Text('Failed to create event'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('create_event_error_snackbar'),
          content: Text('Error: $e'),
        ),
      );
    }
  }

  Future<void> openEventDetailsDialog(int eventId) async {
    final eventData = await goService.getEventDetails(eventId);

    if (eventData == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('event_details_fetch_failure_snackbar'),
          content: Text("Failed to fetch event details"),
        ),
      );
      return;
    }

    final event = eventData['event'];
    final announcement = eventData['announcement'];
    final tags = eventData['tags'] as List<dynamic>;
    final attachments = announcement['attachments'] as List<dynamic>;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          key: const Key('event_details_dialog'),

          // ================= TITLE =================
          title: Text(
            event['title'] ?? '',
            key: const Key('event_details_title'),
          ),

          // ================= CONTENT =================
          content: SingleChildScrollView(
            key: const Key('event_details_scroll_view'),
            child: Column(
              key: const Key('event_details_column'),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Summary: ${event['summary'] ?? ''}",
                  key: const Key('event_details_summary'),
                ),
                const SizedBox(height: 8, key: Key('event_details_spacing_1')),
                Text(
                  "Content: ${announcement['content'] ?? ''}",
                  key: const Key('event_details_content'),
                ),
                const SizedBox(height: 8, key: Key('event_details_spacing_2')),
                Text(
                  "Scheduled At: ${DateTimeUtils.formatDateTime(event['scheduled_at'] ?? '')}",
                  key: const Key('event_details_scheduled_at'),
                ),

                const SizedBox(height: 8, key: Key('event_details_spacing_3')),

                // ================= TAGS =================
                if (tags.isNotEmpty)
                  Wrap(
                    key: const Key('event_details_tags_wrap'),
                    spacing: 8,
                    children: tags.asMap().entries.map((entry) {
                      final index = entry.key;
                      final tag = entry.value;
                      return Chip(
                        key: Key('event_details_tag_$index'),
                        label: Text(tag['tag']),
                      );
                    }).toList(),
                  ),

                // ================= ATTACHMENTS =================
                if (attachments.isNotEmpty)
                  Column(
                    key: const Key('event_details_attachments_column'),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(
                        height: 8,
                        key: Key('event_details_spacing_4'),
                      ),
                      const Text(
                        "Attachments:",
                        key: Key('event_details_attachments_label'),
                      ),
                      ...attachments.asMap().entries.map((entry) {
                        final index = entry.key;
                        final file = entry.value;
                        return Text(
                          file,
                          key: Key('event_details_attachment_item_$index'),
                        );
                      }).toList(),
                    ],
                  ),
              ],
            ),
          ),

          // ================= ACTIONS =================
          actions: [
            TextButton(
              key: const Key('event_details_close_button'),
              onPressed: () => Navigator.pop(context),
              child: const Text(
                "Close",
                key: Key('event_details_close_button_text'),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> openEditEventDialog(int eventId) async {
    final url = Uri.parse("${goService.baseUrl}/events/$eventId");
    final response = await http.get(url);
    if (response.statusCode != 200) return;

    final data = jsonDecode(response.body);
    final event = data["event"] ?? {};
    final announcement = data["announcement"] ?? {};

    titleController.text = event["title"] ?? "";
    summaryController.text = event["summary"] ?? "";
    contentController.text = announcement["content"] ?? "";
    scheduledAtController.text = event["scheduled_at"] ?? "";

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              key: const Key('edit_event_dialog'),

              // ================= TITLE =================
              title: const Text(
                "Edit Event",
                key: Key('edit_event_dialog_title'),
              ),

              // ================= CONTENT =================
              content: SingleChildScrollView(
                key: const Key('edit_event_scroll_view'),
                child: Column(
                  key: const Key('edit_event_form_column'),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      key: const Key('edit_event_title_field'),
                      controller: titleController,
                      decoration: const InputDecoration(labelText: "Title"),
                    ),
                    TextField(
                      key: const Key('edit_event_summary_field'),
                      controller: summaryController,
                      decoration: const InputDecoration(labelText: "Summary"),
                    ),
                    TextField(
                      key: const Key('edit_event_content_field'),
                      controller: contentController,
                      decoration: const InputDecoration(labelText: "Content"),
                    ),
                    TextField(
                      key: const Key('edit_event_scheduled_at_field'),
                      controller: scheduledAtController,
                      readOnly: true,
                      decoration: const InputDecoration(
                        labelText: "Scheduled At",
                      ),
                      onTap: () async {
                        await pickDateTime();
                        setStateDialog(() {});
                      },
                    ),
                  ],
                ),
              ),

              // ================= ACTIONS =================
              actions: [
                TextButton(
                  key: const Key('edit_event_cancel_button'),
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text(
                    "Cancel",
                    key: Key('edit_event_cancel_button_text'),
                  ),
                ),
                ElevatedButton(
                  key: const Key('edit_event_update_button'),
                  onPressed: () async {
                    final success = await goService.updateEvent(
                      eventId: eventId,
                      title: titleController.text.trim(),
                      summary: summaryController.text.trim(),
                      content: contentController.text.trim(),
                      scheduledAt: scheduledAtController.text.trim(),
                    );

                    if (success) {
                      if (!mounted) return;
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          key: Key('edit_event_success_snackbar'),
                          content: Text("Event updated successfully"),
                        ),
                      );
                      loadMyEvents();
                    } else {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          key: Key('edit_event_failure_snackbar'),
                          content: Text("Failed to update event"),
                        ),
                      );
                    }
                  },
                  child: const Text(
                    "Update",
                    key: Key('edit_event_update_button_text'),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void openCreateEventDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              key: const Key('create_event_dialog'),

              // ================= TITLE =================
              title: const Text(
                "Create Event",
                key: Key('create_event_dialog_title'),
              ),

              // ================= CONTENT =================
              content: SingleChildScrollView(
                key: const Key('create_event_scroll_view'),
                child: Column(
                  key: const Key('create_event_form_column'),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    /// ================= TITLE =================
                    TextField(
                      key: const Key('create_event_title_field'),
                      controller: titleController,
                      decoration: const InputDecoration(labelText: "Title"),
                    ),

                    /// ================= SUMMARY =================
                    TextField(
                      key: const Key('create_event_summary_field'),
                      controller: summaryController,
                      decoration: const InputDecoration(labelText: "Summary"),
                    ),

                    /// ================= CONTENT =================
                    TextField(
                      key: const Key('create_event_content_field'),
                      controller: contentController,
                      decoration: const InputDecoration(labelText: "Content"),
                    ),

                    /// ================= SCHEDULED AT =================
                    TextField(
                      key: const Key('create_event_scheduled_at_field'),
                      controller: scheduledAtController,
                      readOnly: true,
                      decoration: const InputDecoration(
                        labelText: "Scheduled At",
                      ),
                      onTap: () async {
                        await pickDateTime();
                        setStateDialog(() {});
                      },
                    ),

                    const SizedBox(
                      height: 10,
                      key: Key('create_event_spacing_1'),
                    ),

                    /// ================= TAG INPUT =================
                    Row(
                      key: const Key('create_event_tag_input_row'),
                      children: [
                        Expanded(
                          child: TextField(
                            key: const Key('create_event_tag_text_field'),
                            controller: tagController,
                            decoration: const InputDecoration(
                              labelText: "Add Tag",
                            ),
                          ),
                        ),
                        IconButton(
                          key: const Key('create_event_add_tag_button'),
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

                    /// ================= TAG LIST =================
                    Wrap(
                      key: const Key('create_event_tags_wrap'),
                      spacing: 8,
                      children: tags.asMap().entries.map((entry) {
                        final index = entry.key;
                        final tag = entry.value;
                        return Chip(
                          key: Key('create_event_tag_chip_$index'),
                          label: Text(tag),
                          onDeleted: () {
                            setStateDialog(() {
                              tags.remove(tag);
                            });
                          },
                        );
                      }).toList(),
                    ),

                    const SizedBox(
                      height: 10,
                      key: Key('create_event_spacing_2'),
                    ),

                    /// ================= ATTACHMENT PICKER =================
                    ElevatedButton(
                      key: const Key('create_event_add_attachment_button'),
                      onPressed: () async {
                        final result = await FilePicker.platform.pickFiles();

                        if (result != null && result.files.isNotEmpty) {
                          final fileName = result.files.single.name;

                          setStateDialog(() {
                            attachments.add(fileName);
                          });
                        }
                      },
                      child: const Text(
                        "Add Attachment",
                        key: Key('create_event_add_attachment_button_text'),
                      ),
                    ),

                    /// ================= ATTACHMENT LIST =================
                    Wrap(
                      key: const Key('create_event_attachments_wrap'),
                      spacing: 8,
                      children: attachments.asMap().entries.map((entry) {
                        final index = entry.key;
                        final file = entry.value;
                        return Chip(
                          key: Key('create_event_attachment_chip_$index'),
                          label: Text(file),
                          onDeleted: () {
                            setStateDialog(() {
                              attachments.remove(file);
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              // ================= ACTIONS =================
              actions: [
                TextButton(
                  key: const Key('create_event_cancel_button'),
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text(
                    "Cancel",
                    key: Key('create_event_cancel_button_text'),
                  ),
                ),
                ElevatedButton(
                  key: const Key('create_event_submit_button'),
                  onPressed: createEvent,
                  child: const Text(
                    "Create",
                    key: Key('create_event_submit_button_text'),
                  ),
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
      key: const Key('events_screen'),

      // ================= APP BAR =================
      appBar: AppBar(
        key: const Key('events_app_bar'),
        title: const Text(
          'Events & Announcements',
          key: Key('events_app_bar_title'),
        ),
      ),

      // ================= FAB =================
      floatingActionButton: FloatingActionButton(
        key: const Key('events_create_fab'),
        onPressed: openCreateEventDialog,
        child: const Icon(Icons.add, key: Key('events_create_fab_icon')),
      ),

      // ================= BODY =================
      body: RefreshIndicator(
        key: const Key('events_refresh_indicator'),
        onRefresh: loadMyEvents,
        child: myEvents.isEmpty
            ? const Center(
                child: Text("No events found", key: Key('events_empty_text')),
              )
            : ListView.builder(
                key: const Key('events_list_view'),
                padding: const EdgeInsets.all(16),
                itemCount: myEvents.length,
                itemBuilder: (context, index) {
                  final e = myEvents[index];
                  final eventId = e["id"];
                  final isDraft = (e["status"] == "draft");

                  return Card(
                    key: Key('event_card_$eventId'),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      key: Key('event_tile_$eventId'),

                      // ================= TITLE =================
                      title: Text(
                        e["title"],
                        key: Key('event_title_$eventId'),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),

                      // ================= SUBTITLE =================
                      subtitle: Column(
                        key: Key('event_subtitle_$eventId'),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Status: ${e["status"]}",
                            key: Key('event_status_$eventId'),
                          ),
                          Text(
                            "Scheduled: ${DateTimeUtils.formatDateTime(e["scheduled_at"] ?? "")}",
                            key: Key('event_scheduled_at_$eventId'),
                          ),
                        ],
                      ),

                      // ================= EDIT ACTION =================
                      trailing: IconButton(
                        key: Key('event_edit_button_$eventId'),
                        icon: const Icon(Icons.edit),
                        color: isDraft ? Colors.blue : Colors.grey,
                        onPressed: isDraft
                            ? () {
                                openEditEventDialog(eventId);
                              }
                            : null,
                      ),

                      // ================= TAP =================
                      onTap: () {
                        openEventDetailsDialog(eventId);
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}
