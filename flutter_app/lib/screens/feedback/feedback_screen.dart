// lib/screens/feedback/feedback_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_app/screens/feedback/feedback_tab.dart';

class FeedbackScreen extends StatelessWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2, // number of tabs
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Feedback'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Feedback'),
              Tab(text: 'Assigned'),
            ],
          ),
        ),
        body: const TabBarView(children: [FeedbackTab(), AssignedTab()]),
      ),
    );
  }
}

// ----------------------
// Individual Tab Widgets
// ----------------------

class AssignedTab extends StatelessWidget {
  const AssignedTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('This is the Assigned tab', style: TextStyle(fontSize: 18)),
    );
  }
}
