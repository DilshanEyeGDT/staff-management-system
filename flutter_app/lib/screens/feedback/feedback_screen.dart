// lib/screens/feedback/feedback_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_app/screens/feedback/feedback_tab.dart';

class FeedbackScreen extends StatelessWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feedback')),
      body: const FeedbackTab(),
    );
  }
}
