// lib/screens/feedback/feedback_tab.dart

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/laravel_service.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchFeedback();
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
          title: Text(feedback['title'] ?? ''),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Category: ${feedback['category']}'),
                Text('Priority: ${feedback['priority']}'),
                Text('Status: ${feedback['status']}'),
                Text('Created by: ${feedback['user_name']}'),
                Text('Assignee: ${feedback['assignee_name']}'),
                const SizedBox(height: 8),
                Text(
                  'Attachments:',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                ...List<Widget>.from(
                  (feedback['attachments'] ?? []).map(
                    (a) => Text(a['file_name'] ?? ''),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Messages:',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                ...List<Widget>.from(
                  (feedback['messages'] ?? []).map((m) {
                    final senderName = _userMap[m['sender_id']] ?? 'Unknown';
                    return Text("${m['message']} (by $senderName)");
                  }),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
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
              title: const Text('Add Comment'),
              content: TextField(
                controller: _commentController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Enter your comment...',
                  border: OutlineInputBorder(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: submitting ? null : () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          final message = _commentController.text.trim();

                          if (message.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
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
                              senderId: senderId, // ✅ now int (not int?)
                              message: message,
                            );

                            if (!mounted) return;

                            Navigator.pop(context);

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
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
                                content: Text('Failed to add comment: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit'),
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
              title: const Text('Edit Feedback'),
              content: SingleChildScrollView(
                child: Column(
                  children: [
                    /// STATUS
                    DropdownButtonFormField<String>(
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

                    const SizedBox(height: 12),

                    /// PRIORITY
                    DropdownButtonFormField<String>(
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

                    const SizedBox(height: 12),

                    /// ASSIGNEE
                    DropdownButtonFormField<int>(
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
              actions: [
                TextButton(
                  onPressed: submitting ? null : () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (assigneeId == null || assigneeId == -1) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
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
                                content: Text('Feedback updated successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );

                            _fetchFeedback();
                          } catch (e) {
                            setDialogState(() => submitting = false);

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Update failed: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Update'),
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
      return const Center(child: CircularProgressIndicator());
    }

    if (_feedbacks.isEmpty) {
      return const Center(child: Text('No feedback available.'));
    }

    return ListView.builder(
      itemCount: _feedbacks.length,
      itemBuilder: (context, index) {
        final feedback = _feedbacks[index];

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: InkWell(
            onTap: () => _showFeedbackDetails(feedback['feedback_id']),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    feedback['title'] ?? '',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Category: ${feedback['category']}'),
                  Text('Priority: ${feedback['priority']}'),
                  Text('Status: ${feedback['status']}'),
                  Text('Created by: ${feedback['user_name']}'),
                  Text('Assignee: ${feedback['assignee_name']}'),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => _showEditFeedbackDialog(feedback),
                        child: const Text('Edit'),
                      ),

                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () =>
                            _showAddCommentDialog(feedback['feedback_id']),
                        child: const Text('Add Comment'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
