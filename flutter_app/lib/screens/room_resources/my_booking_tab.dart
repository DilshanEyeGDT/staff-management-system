import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter_app/services/lambda_sync_service.dart';

class MyBookingsTab extends StatefulWidget {
  const MyBookingsTab({super.key});

  @override
  State<MyBookingsTab> createState() => _MyBookingsTabState();
}

class _MyBookingsTabState extends State<MyBookingsTab> {
  final LambdaSyncService _lambdaService = LambdaSyncService();
  List<dynamic> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    if (!mounted) return;
    setState(() => _loading = true);

    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final bookings = await _lambdaService.getUserBookings(idToken);

      if (!mounted) return;
      setState(() {
        _bookings = bookings ?? [];
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('room_bookings_fetch_error_snackbar'),
          content: Text("Error fetching bookings: $e"),
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _cancelBooking(String bookingId) async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final userId = await _lambdaService.getCurrentUserId(idToken);
      if (userId == null) throw Exception("User ID not found");

      final success = await _lambdaService.cancelBooking(
        idToken,
        bookingId,
        userId,
      );

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            key: Key('room_booking_cancel_success_snackbar'),
            content: Text("Booking cancelled successfully"),
          ),
        );
        _fetchBookings(); // refresh list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            key: Key('room_booking_cancel_failure_snackbar'),
            content: Text("Failed to cancel booking"),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('room_booking_cancel_error_snackbar'),
          content: Text("Error cancelling booking: $e"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        key: Key('my_bookings_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (_bookings.isEmpty) {
      return const Center(
        key: Key('my_bookings_empty'),
        child: Text("No bookings found."),
      );
    }

    return ListView.builder(
      key: const Key('my_bookings_list'),
      padding: const EdgeInsets.all(16),
      itemCount: _bookings.length,
      itemBuilder: (context, index) {
        final booking = _bookings[index];
        final startTime = DateTime.parse(booking['start_time']).toLocal();
        final endTime = DateTime.parse(booking['end_time']).toLocal();
        final status = booking['status'];

        return Card(
          key: Key('booking_card_${booking['booking_id']}'),
          elevation: 4,
          margin: const EdgeInsets.symmetric(vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking['room_name'] ?? '-',
                  key: Key('booking_room_name_${booking['booking_id']}'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start: ${startTime.toLocal()}',
                  key: Key('booking_start_${booking['booking_id']}'),
                ),
                Text(
                  'End: ${endTime.toLocal()}',
                  key: Key('booking_end_${booking['booking_id']}'),
                ),
                const SizedBox(height: 4),
                Text(
                  'Status: ${status[0].toUpperCase()}${status.substring(1)}',
                  key: Key('booking_status_${booking['booking_id']}'),
                  style: TextStyle(
                    color: status == 'cancelled' ? Colors.red : Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (status != 'cancelled')
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      key: Key('cancel_booking_${booking['booking_id']}'),
                      onPressed: () => _cancelBooking(booking['booking_id']),
                      child: const Text('Cancel'),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
