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
                        onPressed: () {
                          safePrint(
                            "Edit clicked for ${feedback['feedback_id']}",
                          );
                        },
                        child: const Text('Edit'),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {
                          safePrint(
                            "Add Comment clicked for ${feedback['feedback_id']}",
                          );
                        },
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
