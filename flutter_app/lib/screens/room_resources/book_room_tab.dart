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
  // helper method inside _BookRoomTabState
  String formatFloor(String? location) {
    switch (location) {
      case 'G':
        return 'Ground Floor';
      case '1':
        return '1st Floor';
      case '2':
        return '2nd Floor';
      case '3':
        return '3rd Floor';
      case '4':
        return '4th Floor';
      default:
        return location != null ? 'Floor $location' : '-';
    }
  }

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
                // Room Name
                Text(
                  room['room_name'] ?? 'Unnamed Room',
                  key: Key('room_name_${room['room_id']}'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                // Description
                Text(
                  room['description'] ?? '',
                  key: Key('room_description_${room['room_id']}'),
                ),
                const SizedBox(height: 8),
                // Capacity
                Text(
                  'Capacity: ${room['capacity'] ?? 0}',
                  key: Key('room_capacity_${room['room_id']}'),
                ),
                const SizedBox(height: 4),
                // Location
                Text(
                  'Location: ${formatFloor(room['location'])}',
                  key: Key('room_location_${room['room_id']}'),
                ),
                const SizedBox(height: 4),
                // Equipments
                Text(
                  'Equipments: ${(room['equipments'] as List<dynamic>?)?.join(", ") ?? '-'}',
                  key: Key('room_equipments_${room['room_id']}'),
                ),
                const SizedBox(height: 12),
                // Buttons Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Check Availability Button
                    ElevatedButton(
                      key: Key('check_availability_${room['room_id']}'),
                      onPressed: () async {
                        try {
                          final session =
                              await Amplify.Auth.fetchAuthSession()
                                  as CognitoAuthSession;
                          final idToken =
                              session.userPoolTokensResult.value.idToken.raw;

                          final availability = await _lambdaService
                              .getRoomAvailability(
                                idToken,
                                room['room_id'] as int,
                              );

                          if (availability != null && availability.isNotEmpty) {
                            final timelineStr = availability
                                .map((slot) {
                                  final start = DateTime.parse(
                                    slot['start_time'],
                                  ).toLocal();
                                  final end = DateTime.parse(
                                    slot['end_time'],
                                  ).toLocal();
                                  final status = slot['status'];
                                  return "${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')} - "
                                      "${end.hour.toString().padLeft(2, '0')}:${end.minute.toString().padLeft(2, '0')} : $status";
                                })
                                .join("\n");

                            showDialog(
                              context: context,
                              builder: (_) => AlertDialog(
                                key: Key(
                                  'availability_dialog_${room['room_id']}',
                                ),
                                title: Text(
                                  "Availability - ${room['room_name']}",
                                ),
                                content: Text(timelineStr),
                                actions: [
                                  TextButton(
                                    key: Key(
                                      'availability_close_button_${room['room_id']}',
                                    ),
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text("Close"),
                                  ),
                                ],
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("No availability data found"),
                              ),
                            );
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text("Error fetching availability: $e"),
                            ),
                          );
                        }
                      },
                      child: const Text("Check availability"),
                    ),
                    const SizedBox(width: 8),
                    // Book Button
                    ElevatedButton(
                      key: Key('book_room_${room['room_id']}'),
                      onPressed: () async {
                        DateTime? selectedDate;
                        TimeOfDay? startTime;
                        TimeOfDay? endTime;

                        final session =
                            await Amplify.Auth.fetchAuthSession()
                                as CognitoAuthSession;
                        final idToken =
                            session.userPoolTokensResult.value.idToken.raw;
                        final userId = await _lambdaService.getCurrentUserId(
                          idToken,
                        );
                        if (userId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Failed to fetch user ID"),
                            ),
                          );
                          return;
                        }

                        await showDialog(
                          context: context,
                          builder: (_) => StatefulBuilder(
                            builder: (context, setState) => AlertDialog(
                              key: Key('book_dialog_${room['room_id']}'),
                              title: Text("Book Room - ${room['room_name']}"),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Date Picker
                                  TextButton(
                                    key: Key('select_date_${room['room_id']}'),
                                    onPressed: () async {
                                      final date = await showDatePicker(
                                        context: context,
                                        initialDate: DateTime.now(),
                                        firstDate: DateTime.now(),
                                        lastDate: DateTime.now().add(
                                          const Duration(days: 365),
                                        ),
                                      );
                                      if (date != null)
                                        setState(() => selectedDate = date);
                                    },
                                    child: Text(
                                      selectedDate == null
                                          ? "Select Date"
                                          : "Date: ${selectedDate!.toLocal().toString().split(' ')[0]}",
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // Start Time Picker
                                  TextButton(
                                    key: Key(
                                      'select_start_time_${room['room_id']}',
                                    ),
                                    onPressed: () async {
                                      final time = await showTimePicker(
                                        context: context,
                                        initialTime: TimeOfDay.now(),
                                      );
                                      if (time != null)
                                        setState(() => startTime = time);
                                    },
                                    child: Text(
                                      startTime == null
                                          ? "Select Start Time"
                                          : "Start: ${startTime!.format(context)}",
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // End Time Picker
                                  TextButton(
                                    key: Key(
                                      'select_end_time_${room['room_id']}',
                                    ),
                                    onPressed: () async {
                                      final time = await showTimePicker(
                                        context: context,
                                        initialTime: TimeOfDay.now(),
                                      );
                                      if (time != null)
                                        setState(() => endTime = time);
                                    },
                                    child: Text(
                                      endTime == null
                                          ? "Select End Time"
                                          : "End: ${endTime!.format(context)}",
                                    ),
                                  ),
                                ],
                              ),
                              actions: [
                                TextButton(
                                  key: Key('book_cancel_${room['room_id']}'),
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text("Cancel"),
                                ),
                                ElevatedButton(
                                  key: Key('book_submit_${room['room_id']}'),
                                  onPressed: () async {
                                    if (selectedDate == null ||
                                        startTime == null ||
                                        endTime == null) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            "Please select date and times",
                                          ),
                                        ),
                                      );
                                      return;
                                    }

                                    final startDateTime = DateTime(
                                      selectedDate!.year,
                                      selectedDate!.month,
                                      selectedDate!.day,
                                      startTime!.hour,
                                      startTime!.minute,
                                    );
                                    final endDateTime = DateTime(
                                      selectedDate!.year,
                                      selectedDate!.month,
                                      selectedDate!.day,
                                      endTime!.hour,
                                      endTime!.minute,
                                    );

                                    try {
                                      final response = await _lambdaService
                                          .bookRoom(
                                            idToken: idToken,
                                            roomId: room['room_id'] as int,
                                            userId: userId,
                                            startTime: startDateTime,
                                            endTime: endDateTime,
                                          );

                                      if (response.statusCode == 200 ||
                                          response.statusCode == 201) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              "Room booked successfully",
                                            ),
                                          ),
                                        );
                                        Navigator.pop(context);
                                      } else {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              "Booking failed: ${response.statusCode}",
                                            ),
                                          ),
                                        );
                                      }
                                    } catch (e) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(content: Text("Error: $e")),
                                      );
                                    }
                                  },
                                  child: const Text("Submit"),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      child: const Text("Book"),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
