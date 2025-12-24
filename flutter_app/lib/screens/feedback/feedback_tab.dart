// lib/screens/feedback/feedback_tab.dart

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/laravel_service.dart';
import 'package:file_picker/file_picker.dart';

class FeedbackTab extends StatefulWidget {
  const FeedbackTab({super.key});

  @override
  State<FeedbackTab> createState() => _FeedbackTabState();
}

class _FeedbackTabState extends State<FeedbackTab> {
  final LaravelService _laravelService = LaravelService();

  bool _loading = false;
  List<Map<String, dynamic>> _feedbacks = [];
  Map<int, String> _userMap = {}; // Store user id -> display_name mapping

  int? _selectedAssigneeId;

  @override
  void initState() {
    super.initState();
    _fetchFeedback();
  }

  List<Map<String, dynamic>> get _filteredFeedbacks {
    if (_selectedAssigneeId == null) {
      return _feedbacks; // no filter
    }

    final selectedUserName = _userMap[_selectedAssigneeId];

    return _feedbacks.where((f) {
      return f['assignee_name'] == selectedUserName;
    }).toList();
  }

  Future<void> _fetchFeedback() async {
    try {
      setState(() => _loading = true);

      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      // Fetch feedbacks
      final data = await _laravelService.getAllFeedback(idToken);

      // Fetch user map
      final users = await _laravelService.getAllUsers();

      if (!mounted) return;
      setState(() {
        _feedbacks = data;
        _userMap = users;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      safePrint("Error fetching feedback: $e");
    }
  }

  Future<void> _showFeedbackDetails(int feedbackId) async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final feedback = await _laravelService.getFeedbackById(
        idToken,
        feedbackId,
      );

      if (feedback == null) return;
      if (!mounted) return;

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          key: const Key('feedback_details_dialog'),

          // ================= TITLE =================
          title: Text(
            feedback['title'] ?? '',
            key: const Key('feedback_details_title'),
          ),

          // ================= CONTENT =================
          content: SingleChildScrollView(
            key: const Key('feedback_details_scroll_view'),
            child: Column(
              key: const Key('feedback_details_column'),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Category: ${feedback['category']}',
                  key: const Key('feedback_details_category'),
                ),
                Text(
                  'Priority: ${feedback['priority']}',
                  key: const Key('feedback_details_priority'),
                ),
                Text(
                  'Status: ${feedback['status']}',
                  key: const Key('feedback_details_status'),
                ),
                Text(
                  'Created by: ${feedback['user_name']}',
                  key: const Key('feedback_details_created_by'),
                ),
                Text(
                  'Assignee: ${feedback['assignee_name']}',
                  key: const Key('feedback_details_assignee'),
                ),

                const SizedBox(
                  height: 8,
                  key: Key('feedback_details_spacing_1'),
                ),

                // ================= ATTACHMENTS =================
                const Text(
                  'Attachments:',
                  key: Key('feedback_details_attachments_label'),
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),

                ...List<Widget>.from(
                  (feedback['attachments'] ?? []).asMap().entries.map((entry) {
                    final index = entry.key;
                    final a = entry.value;
                    return Text(
                      a['file_name'] ?? '',
                      key: Key('feedback_attachment_item_$index'),
                    );
                  }),
                ),

                const SizedBox(
                  height: 8,
                  key: Key('feedback_details_spacing_2'),
                ),

                // ================= MESSAGES =================
                const Text(
                  'Messages:',
                  key: Key('feedback_details_messages_label'),
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),

                ...List<Widget>.from(
                  (feedback['messages'] ?? []).asMap().entries.map((entry) {
                    final index = entry.key;
                    final m = entry.value;
                    final senderName = _userMap[m['sender_id']] ?? 'Unknown';

                    return Text(
                      "${m['message']} (by $senderName)",
                      key: Key('feedback_message_item_$index'),
                    );
                  }),
                ),
              ],
            ),
          ),

          // ================= ACTIONS =================
          actions: [
            TextButton(
              key: const Key('feedback_details_close_button'),
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Close',
                key: Key('feedback_details_close_button_text'),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      safePrint("Error fetching feedback details: $e");
    }
  }

  //add a message to a feedback
  Future<void> _showAddCommentDialog(int feedbackId) async {
    final TextEditingController _commentController = TextEditingController();
    bool submitting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              key: const Key('add_comment_dialog'),

              // ================= TITLE =================
              title: const Text(
                'Add Comment',
                key: Key('add_comment_dialog_title'),
              ),

              // ================= CONTENT =================
              content: TextField(
                key: const Key('add_comment_text_field'),
                controller: _commentController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Enter your comment...',
                  border: OutlineInputBorder(),
                ),
              ),

              // ================= ACTIONS =================
              actions: [
                // -------- Cancel Button --------
                TextButton(
                  key: const Key('add_comment_cancel_button'),
                  onPressed: submitting ? null : () => Navigator.pop(context),
                  child: const Text(
                    'Cancel',
                    key: Key('add_comment_cancel_button_text'),
                  ),
                ),

                // -------- Submit Button --------
                TextButton(
                  key: const Key('add_comment_submit_button'),
                  onPressed: submitting
                      ? null
                      : () async {
                          final message = _commentController.text.trim();

                          if (message.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key('add_comment_empty_snackbar'),
                                content: Text('Comment cannot be empty'),
                              ),
                            );
                            return;
                          }

                          setDialogState(() => submitting = true);

                          try {
                            final session =
                                await Amplify.Auth.fetchAuthSession()
                                    as CognitoAuthSession;
                            final idToken =
                                session.userPoolTokensResult.value.idToken.raw;

                            final senderId = await _laravelService
                                .getCurrentUserId(idToken);

                            if (senderId == null) {
                              setDialogState(() => submitting = false);

                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  key: Key(
                                    'add_comment_user_identify_error_snackbar',
                                  ),
                                  content: Text(
                                    'Unable to identify current user',
                                  ),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }

                            await _laravelService.addFeedbackMessage(
                              feedbackId: feedbackId,
                              senderId: senderId,
                              message: message,
                            );

                            if (!mounted) return;

                            Navigator.pop(context);

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key('add_comment_success_snackbar'),
                                content: Text('Comment added successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );

                            // Refresh feedback list
                            _fetchFeedback();
                          } catch (e) {
                            setDialogState(() => submitting = false);

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                key: const Key('add_comment_failure_snackbar'),
                                content: Text('Failed to add comment: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },

                  // -------- Loading / Text --------
                  child: submitting
                      ? const SizedBox(
                          key: Key('add_comment_submit_loading_indicator'),
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Submit',
                          key: Key('add_comment_submit_button_text'),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // edit a feedback
  Future<void> _showEditFeedbackDialog(Map<String, dynamic> feedback) async {
    final session = await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
    final idToken = session.userPoolTokensResult.value.idToken.raw;

    // Dropdown values
    String status = feedback['status'];
    String priority = feedback['priority'];

    int? assigneeId = _userMap.entries
        .firstWhere(
          (e) => e.value == feedback['assignee_name'],
          orElse: () => const MapEntry(-1, ''),
        )
        .key;

    bool submitting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              key: const Key('edit_feedback_dialog'),

              // ================= TITLE =================
              title: const Text(
                'Edit Feedback',
                key: Key('edit_feedback_dialog_title'),
              ),

              // ================= CONTENT =================
              content: SingleChildScrollView(
                key: const Key('edit_feedback_scroll_view'),
                child: Column(
                  key: const Key('edit_feedback_form_column'),
                  children: [
                    /// ================= STATUS =================
                    DropdownButtonFormField<String>(
                      key: const Key('edit_feedback_status_dropdown'),
                      value: status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'open', child: Text('Open')),
                        DropdownMenuItem(
                          value: 'in_progress',
                          child: Text('In Progress'),
                        ),
                        DropdownMenuItem(
                          value: 'closed',
                          child: Text('Closed'),
                        ),
                      ],
                      onChanged: (v) => setDialogState(() => status = v!),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('edit_feedback_spacing_1'),
                    ),

                    /// ================= PRIORITY =================
                    DropdownButtonFormField<String>(
                      key: const Key('edit_feedback_priority_dropdown'),
                      value: priority,
                      decoration: const InputDecoration(labelText: 'Priority'),
                      items: const [
                        DropdownMenuItem(value: 'low', child: Text('Low')),
                        DropdownMenuItem(
                          value: 'medium',
                          child: Text('Medium'),
                        ),
                        DropdownMenuItem(value: 'high', child: Text('High')),
                      ],
                      onChanged: (v) => setDialogState(() => priority = v!),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('edit_feedback_spacing_2'),
                    ),

                    /// ================= ASSIGNEE =================
                    DropdownButtonFormField<int>(
                      key: const Key('edit_feedback_assignee_dropdown'),
                      value: assigneeId,
                      decoration: const InputDecoration(labelText: 'Assignee'),
                      items: _userMap.entries
                          .map(
                            (e) => DropdownMenuItem(
                              value: e.key,
                              child: Text(e.value),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setDialogState(() => assigneeId = v),
                    ),
                  ],
                ),
              ),

              // ================= ACTIONS =================
              actions: [
                // -------- Cancel --------
                TextButton(
                  key: const Key('edit_feedback_cancel_button'),
                  onPressed: submitting ? null : () => Navigator.pop(context),
                  child: const Text(
                    'Cancel',
                    key: Key('edit_feedback_cancel_button_text'),
                  ),
                ),

                // -------- Update --------
                TextButton(
                  key: const Key('edit_feedback_update_button'),
                  onPressed: submitting
                      ? null
                      : () async {
                          if (assigneeId == null || assigneeId == -1) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key(
                                  'edit_feedback_assignee_required_snackbar',
                                ),
                                content: Text('Please select an assignee'),
                              ),
                            );
                            return;
                          }

                          setDialogState(() => submitting = true);

                          try {
                            await _laravelService.updateFeedback(
                              idToken: idToken,
                              feedbackId: feedback['feedback_id'],
                              status: status,
                              assigneeId: assigneeId!,
                              priority: priority,
                            );

                            if (!mounted) return;

                            Navigator.pop(context);

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key(
                                  'edit_feedback_update_success_snackbar',
                                ),
                                content: Text('Feedback updated successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );

                            _fetchFeedback();
                          } catch (e) {
                            setDialogState(() => submitting = false);

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                key: const Key(
                                  'edit_feedback_update_failure_snackbar',
                                ),
                                content: Text('Update failed: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },

                  // -------- Loading / Text --------
                  child: submitting
                      ? const SizedBox(
                          key: Key('edit_feedback_update_loading_indicator'),
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Update',
                          key: Key('edit_feedback_update_button_text'),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showCreateFeedbackDialog() async {
    final titleController = TextEditingController();

    String category = 'bug';
    String priority = 'medium';
    int? assigneeId;

    List<Map<String, String>> attachments = [];
    bool submitting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              key: const Key('create_feedback_dialog'),

              // ================= TITLE =================
              title: const Text(
                'Create Feedback',
                key: Key('create_feedback_dialog_title'),
              ),

              // ================= CONTENT =================
              content: SingleChildScrollView(
                key: const Key('create_feedback_scroll_view'),
                child: Column(
                  key: const Key('create_feedback_form_column'),
                  children: [
                    /// ================= TITLE =================
                    TextField(
                      key: const Key('create_feedback_title_field'),
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        border: OutlineInputBorder(),
                      ),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('create_feedback_spacing_1'),
                    ),

                    /// ================= CATEGORY =================
                    DropdownButtonFormField<String>(
                      key: const Key('create_feedback_category_dropdown'),
                      value: category,
                      decoration: const InputDecoration(labelText: 'Category'),
                      items: const [
                        DropdownMenuItem(value: 'bug', child: Text('Bug')),
                        DropdownMenuItem(
                          value: 'feature',
                          child: Text('Feature'),
                        ),
                        DropdownMenuItem(
                          value: 'improvement',
                          child: Text('Improvement'),
                        ),
                      ],
                      onChanged: (v) => setDialogState(() => category = v!),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('create_feedback_spacing_2'),
                    ),

                    /// ================= PRIORITY =================
                    DropdownButtonFormField<String>(
                      key: const Key('create_feedback_priority_dropdown'),
                      value: priority,
                      decoration: const InputDecoration(labelText: 'Priority'),
                      items: const [
                        DropdownMenuItem(value: 'low', child: Text('Low')),
                        DropdownMenuItem(
                          value: 'medium',
                          child: Text('Medium'),
                        ),
                        DropdownMenuItem(value: 'high', child: Text('High')),
                      ],
                      onChanged: (v) => setDialogState(() => priority = v!),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('create_feedback_spacing_3'),
                    ),

                    /// ================= ASSIGNEE =================
                    DropdownButtonFormField<int>(
                      key: const Key('create_feedback_assignee_dropdown'),
                      value: assigneeId,
                      decoration: const InputDecoration(labelText: 'Assignee'),
                      items: _userMap.entries
                          .map(
                            (e) => DropdownMenuItem(
                              value: e.key,
                              child: Text(e.value),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setDialogState(() => assigneeId = v),
                    ),

                    const SizedBox(
                      height: 12,
                      key: Key('create_feedback_spacing_4'),
                    ),

                    /// ================= ATTACHMENTS =================
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton.icon(
                        key: const Key('create_feedback_add_attachment_button'),
                        icon: const Icon(Icons.attach_file),
                        label: const Text(
                          'Add Attachment',
                          key: Key(
                            'create_feedback_add_attachment_button_text',
                          ),
                        ),
                        onPressed: () async {
                          final result = await FilePicker.platform.pickFiles(
                            allowMultiple: true,
                            withData: false,
                          );

                          if (result == null) return;

                          setDialogState(() {
                            for (final file in result.files) {
                              attachments.add({
                                'file_name': file.name,
                                'file_type': file.extension != null
                                    ? 'application/${file.extension}'
                                    : 'unknown',
                              });
                            }
                          });
                        },
                      ),
                    ),

                    // -------- Attachment List --------
                    ...attachments.asMap().entries.map((entry) {
                      final index = entry.key;
                      final a = entry.value;

                      return ListTile(
                        key: Key('create_feedback_attachment_item_$index'),
                        dense: true,
                        leading: const Icon(Icons.insert_drive_file, size: 18),
                        title: Text(
                          a['file_name'] ?? '',
                          key: Key('create_feedback_attachment_name_$index'),
                        ),
                        subtitle: Text(
                          a['file_type'] ?? '',
                          key: Key('create_feedback_attachment_type_$index'),
                        ),
                        trailing: IconButton(
                          key: Key('create_feedback_attachment_remove_$index'),
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () {
                            setDialogState(() {
                              attachments.remove(a);
                            });
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),

              // ================= ACTIONS =================
              actions: [
                // -------- Cancel --------
                TextButton(
                  key: const Key('create_feedback_cancel_button'),
                  onPressed: submitting ? null : () => Navigator.pop(context),
                  child: const Text(
                    'Cancel',
                    key: Key('create_feedback_cancel_button_text'),
                  ),
                ),

                // -------- Create --------
                TextButton(
                  key: const Key('create_feedback_submit_button'),
                  onPressed: submitting
                      ? null
                      : () async {
                          if (titleController.text.trim().isEmpty ||
                              assigneeId == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key('create_feedback_validation_snackbar'),
                                content: Text('Title & assignee are required'),
                              ),
                            );
                            return;
                          }

                          setDialogState(() => submitting = true);

                          try {
                            final session =
                                await Amplify.Auth.fetchAuthSession()
                                    as CognitoAuthSession;
                            final idToken =
                                session.userPoolTokensResult.value.idToken.raw;

                            final userId = await _laravelService
                                .getCurrentUserId(idToken);

                            if (userId == null) {
                              throw Exception(
                                'Unable to identify current user',
                              );
                            }

                            await _laravelService.createFeedback(
                              idToken: idToken,
                              userId: userId,
                              assigneeId: assigneeId!,
                              title: titleController.text.trim(),
                              category: category,
                              priority: priority,
                              attachments: attachments,
                            );

                            if (!mounted) return;

                            Navigator.pop(context);

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                key: Key('create_feedback_success_snackbar'),
                                content: Text('Feedback created successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );

                            _fetchFeedback();
                          } catch (e) {
                            setDialogState(() => submitting = false);

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                key: const Key(
                                  'create_feedback_failure_snackbar',
                                ),
                                content: Text('Failed to create feedback: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },

                  // -------- Loading / Text --------
                  child: submitting
                      ? const SizedBox(
                          key: Key('create_feedback_submit_loading_indicator'),
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Create',
                          key: Key('create_feedback_submit_button_text'),
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
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(
          key: Key('feedback_loading_indicator'),
        ),
      );
    }

    if (_feedbacks.isEmpty) {
      return const Center(
        child: Text('No feedback available.', key: Key('feedback_empty_text')),
      );
    }

    // 🔍 DEBUG: inspect feedback structure
    safePrint(_feedbacks.first);

    return Scaffold(
      key: const Key('feedback_screen'),

      // ================= FAB =================
      floatingActionButton: FloatingActionButton(
        key: const Key('feedback_create_fab'),
        onPressed: _showCreateFeedbackDialog,
        child: const Icon(Icons.add, key: Key('feedback_create_fab_icon')),
      ),

      // ================= BODY =================
      body: Column(
        key: const Key('feedback_body_column'),
        children: [
          /// ================= ASSIGNEE FILTER =================
          Padding(
            key: const Key('feedback_filter_container'),
            padding: const EdgeInsets.all(16),
            child: DropdownButtonFormField<int>(
              key: const Key('feedback_filter_assignee_dropdown'),
              value: _selectedAssigneeId,
              decoration: const InputDecoration(
                labelText: 'Filter by Assignee',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<int>(
                  value: null,
                  child: Text(
                    'All',
                    key: Key('feedback_filter_assignee_all_option'),
                  ),
                ),
                ..._userMap.entries.map(
                  (e) => DropdownMenuItem<int>(
                    value: e.key,
                    child: Text(
                      e.value,
                      key: Key('feedback_filter_assignee_option_${e.key}'),
                    ),
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedAssigneeId = value;
                });
              },
            ),
          ),

          /// ================= FEEDBACK LIST =================
          Expanded(
            key: const Key('feedback_list_expanded'),
            child: _filteredFeedbacks.isEmpty
                ? const Center(
                    child: Text(
                      'No feedback for selected assignee',
                      key: Key('feedback_filtered_empty_text'),
                    ),
                  )
                : ListView.builder(
                    key: const Key('feedback_list_view'),
                    itemCount: _filteredFeedbacks.length,
                    itemBuilder: (context, index) {
                      final feedback = _filteredFeedbacks[index];
                      final feedbackId = feedback['feedback_id'];

                      return Card(
                        key: Key('feedback_card_$feedbackId'),
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: InkWell(
                          key: Key('feedback_tile_$feedbackId'),
                          onTap: () => _showFeedbackDetails(feedbackId),
                          child: Padding(
                            key: Key('feedback_tile_padding_$feedbackId'),
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              key: Key('feedback_tile_column_$feedbackId'),
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // -------- Title --------
                                Text(
                                  feedback['title'] ?? '',
                                  key: Key('feedback_title_$feedbackId'),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(
                                  height: 4,
                                  key: Key('feedback_tile_spacing_1'),
                                ),

                                // -------- Metadata --------
                                Text(
                                  'Category: ${feedback['category']}',
                                  key: Key('feedback_category_$feedbackId'),
                                ),
                                Text(
                                  'Priority: ${feedback['priority']}',
                                  key: Key('feedback_priority_$feedbackId'),
                                ),
                                Text(
                                  'Status: ${feedback['status']}',
                                  key: Key('feedback_status_$feedbackId'),
                                ),
                                Text(
                                  'Created by: ${feedback['user_name']}',
                                  key: Key('feedback_created_by_$feedbackId'),
                                ),
                                Text(
                                  'Assignee: ${feedback['assignee_name']}',
                                  key: Key('feedback_assignee_$feedbackId'),
                                ),

                                const SizedBox(
                                  height: 8,
                                  key: Key('feedback_tile_spacing_2'),
                                ),

                                // -------- ACTIONS --------
                                Row(
                                  key: Key('feedback_actions_row_$feedbackId'),
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton(
                                      key: Key(
                                        'feedback_edit_button_$feedbackId',
                                      ),
                                      onPressed: () =>
                                          _showEditFeedbackDialog(feedback),
                                      child: const Text(
                                        'Edit',
                                        key: Key('feedback_edit_button_text'),
                                      ),
                                    ),
                                    const SizedBox(
                                      width: 8,
                                      key: Key('feedback_actions_spacing'),
                                    ),
                                    TextButton(
                                      key: Key(
                                        'feedback_add_comment_button_$feedbackId',
                                      ),
                                      onPressed: () =>
                                          _showAddCommentDialog(feedbackId),
                                      child: const Text(
                                        'Add Comment',
                                        key: Key(
                                          'feedback_add_comment_button_text',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
