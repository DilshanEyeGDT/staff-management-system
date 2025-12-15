// lib/screens/feedback/assigned_tab.dart

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/laravel_service.dart';

class AssignedTab extends StatefulWidget {
  const AssignedTab({super.key});

  @override
  State<AssignedTab> createState() => _AssignedTabState();
}

class _AssignedTabState extends State<AssignedTab> {
  final LaravelService _laravelService = LaravelService();

  bool _loading = false;
  List<Map<String, dynamic>> _feedbacks = [];

  @override
  void initState() {
    super.initState();
    _fetchAssignedFeedback();
  }

  Future<void> _fetchAssignedFeedback() async {
    try {
      setState(() => _loading = true);

      // Get current user's id token
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      // Get current user ID
      final currentUserId = await _laravelService.getCurrentUserId(idToken);
      if (currentUserId == null) {
        safePrint("Could not get current user ID");
        setState(() => _loading = false);
        return;
      }

      // Fetch all feedbacks (includes numeric assignee_id)
      final allFeedbacks = await _laravelService.getAllFeedback(idToken);

      // Filter feedbacks assigned to the current user
      final assignedFeedbacks = allFeedbacks
          .where((f) => f['assignee_id'] != null)
          .where((f) => f['assignee_id'] == currentUserId)
          .toList();

      if (!mounted) return;

      setState(() {
        _feedbacks = assignedFeedbacks;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      safePrint("Error fetching assigned feedback: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_feedbacks.isEmpty) {
      return const Center(child: Text('No assigned feedback available.'));
    }

    return ListView.builder(
      itemCount: _feedbacks.length,
      itemBuilder: (context, index) {
        final feedback = _feedbacks[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              ],
            ),
          ),
        );
      },
    );
  }
}
