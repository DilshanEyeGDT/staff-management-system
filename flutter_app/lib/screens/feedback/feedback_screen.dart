// lib/screens/feedback/feedback_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_app/screens/feedback/feedback_tab.dart';

class FeedbackScreen extends StatelessWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: const Key('feedback_screen'),

      appBar: AppBar(
        key: const Key('feedback_app_bar'),
        title: const Text('Feedback', key: Key('feedback_app_bar_title')),
      ),

      body: const FeedbackTab(key: Key('feedback_tab')),
    );
  }
}
