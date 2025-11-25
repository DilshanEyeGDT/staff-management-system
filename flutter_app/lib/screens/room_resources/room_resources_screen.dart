import 'package:flutter/material.dart';
import 'package:flutter_app/screens/room_resources/my_booking_tab.dart';
import 'package:flutter_app/screens/room_resources/book_room_tab.dart'; // import the BookRoomTab

class RoomResourcesScreen extends StatelessWidget {
  const RoomResourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2, // two tabs
      child: Scaffold(
        key: const Key('room_resources_screen'),
        appBar: AppBar(
          title: const Text(
            'Room & Resources',
            key: Key('room_resources_title'),
          ),
          bottom: const TabBar(
            key: Key('room_resources_tabbar'),
            tabs: [
              Tab(key: Key('tab_book_room'), text: 'Book a Room'),
              Tab(key: Key('tab_my_bookings'), text: 'My Bookings'),
            ],
          ),
        ),
        body: const TabBarView(
          key: Key('room_resources_tabbar_view'),
          children: [
            // Book a Room Tab
            BookRoomTab(key: Key('book_room_tab')),

            // My Bookings Tab
            MyBookingsTab(key: Key('my_bookings_tab')),
          ],
        ),
      ),
    );
  }
}
