import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter_app/services/lambda_sync_service.dart';

class BookRoomTab extends StatefulWidget {
  const BookRoomTab({super.key});

  @override
  State<BookRoomTab> createState() => _BookRoomTabState();
}

class _BookRoomTabState extends State<BookRoomTab> {
  final LambdaSyncService _lambdaService = LambdaSyncService();
  bool _isLoading = true;
  List<dynamic> _rooms = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  Future<void> _fetchRooms() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // 1. Get user id token
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      // 2. Fetch rooms from LambdaSyncService
      final rooms = await _lambdaService.getAvailableRooms(idToken);

      if (rooms != null) {
        setState(() {
          _rooms = rooms;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to fetch rooms';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        key: Key('book_room_loading'),
        child: CircularProgressIndicator(),
      );
    }

    if (_errorMessage.isNotEmpty) {
      return Center(
        key: const Key('book_room_error'),
        child: Text(_errorMessage),
      );
    }

    return ListView.builder(
      key: const Key('book_room_list'),
      padding: const EdgeInsets.all(16),
      itemCount: _rooms.length,
      itemBuilder: (context, index) {
        final room = _rooms[index];
        return Card(
          key: Key('room_card_${room['room_id']}'),
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
                  room['room_name'] ?? 'Unnamed Room',
                  key: Key('room_name_${room['room_id']}'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  room['description'] ?? '',
                  key: Key('room_description_${room['room_id']}'),
                ),
                const SizedBox(height: 8),
                Text(
                  'Capacity: ${room['capacity'] ?? 0}',
                  key: Key('room_capacity_${room['room_id']}'),
                ),
                const SizedBox(height: 4),
                Text(
                  'Location: ${room['location'] ?? '-'}',
                  key: Key('room_location_${room['room_id']}'),
                ),
                const SizedBox(height: 4),
                Text(
                  'Equipments: ${(room['equipments'] as List<dynamic>?)?.join(", ") ?? '-'}',
                  key: Key('room_equipments_${room['room_id']}'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
