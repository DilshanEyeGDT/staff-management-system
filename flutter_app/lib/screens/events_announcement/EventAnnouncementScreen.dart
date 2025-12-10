import 'package:flutter/material.dart';

class EventAnnouncementScreen extends StatelessWidget {
  const EventAnnouncementScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Events & Announcements')),
      body: const Center(
        child: Text(
          'This is the Events & Announcements screen',
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
