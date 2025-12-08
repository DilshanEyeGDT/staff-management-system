import 'package:flutter/material.dart';

class TrainingCoursesScreen extends StatelessWidget {
  const TrainingCoursesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Training Courses")),
      body: const Center(
        child: Text(
          "this is the training course page",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
