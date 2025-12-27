import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/dotnet_sync_service.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';

class TrainingNotificationsSheet extends StatefulWidget {
  const TrainingNotificationsSheet({super.key});

  @override
  State<TrainingNotificationsSheet> createState() =>
      _TrainingNotificationsSheetState();
}

class _TrainingNotificationsSheetState
    extends State<TrainingNotificationsSheet> {
  final DotNetSyncService _syncService = DotNetSyncService();

  bool _loading = true;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final data = await _syncService.getTrainingNotifications(idToken);

      if (!mounted) return;

      setState(() {
        _items = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('training_notifications_error_snackbar'),
          content: Text("Error: $e"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      key: const Key('training_notifications_sheet_root'),
      expand: false,
      initialChildSize: 0.55,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      builder: (context, scrollController) {
        return Container(
          key: const Key('training_notifications_container'),
          padding: const EdgeInsets.all(16),
          child: _loading
              ? const Center(
                  key: Key('training_notifications_loading'),
                  child: CircularProgressIndicator(
                    key: Key('training_notifications_loading_indicator'),
                  ),
                )
              : _items.isEmpty
              ? const Center(
                  key: Key('training_notifications_empty'),
                  child: Text(
                    "No notifications",
                    key: Key('training_notifications_empty_text'),
                  ),
                )
              : ListView.builder(
                  key: const Key('training_notifications_list'),
                  controller: scrollController,
                  itemCount: _items.length,
                  itemBuilder: (context, index) {
                    final n = _items[index];

                    return Card(
                      key: Key(
                        'training_notification_card_${n["trainingNotificationId"] ?? index}',
                      ),
                      margin: const EdgeInsets.all(12),
                      child: ListTile(
                        key: Key(
                          'training_notification_tile_${n["trainingNotificationId"] ?? index}',
                        ),
                        title: Text(
                          n["courseTitle"],
                          key: Key(
                            'training_notification_course_title_${n["trainingNotificationId"] ?? index}',
                          ),
                        ),
                        subtitle: Column(
                          key: Key(
                            'training_notification_subtitle_${n["trainingNotificationId"] ?? index}',
                          ),
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Due: ${DateTimeUtils.formatDateTime(n["dueDate"])}",
                              key: Key(
                                'training_notification_due_date_${n["trainingNotificationId"] ?? index}',
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}
