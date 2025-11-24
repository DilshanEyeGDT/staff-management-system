import 'package:flutter/material.dart';

class MyBookingsTab extends StatelessWidget {
  const MyBookingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      key: const Key('my_bookings_tab_placeholder'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.list_alt, size: 80, key: Key('my_bookings_icon')),
          SizedBox(height: 16),
          Text('This is My Bookings page', key: Key('my_bookings_text')),
        ],
      ),
    );
  }
}
