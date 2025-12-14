// lib/screens/feedback/feedback_screen.dart

import 'package:flutter/material.dart';

class FeedbackScreen extends StatelessWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feedback')),
      body: const Center(
        child: Text(
          'This is the Feedback page',
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
