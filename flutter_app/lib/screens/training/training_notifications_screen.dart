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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.55,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      builder: (context, scrollController) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _items.isEmpty
              ? const Center(child: Text("No notifications"))
              : ListView.builder(
                  controller: scrollController,
                  itemCount: _items.length,
                  itemBuilder: (context, index) {
                    final n = _items[index];

                    return Card(
                      margin: const EdgeInsets.all(12),
                      child: ListTile(
                        title: Text(n["courseTitle"]),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Text("Status: ${n["status"]}"),
                            // Text("Progress: ${n["progress"]}%"),
                            Text(
                              "Due: ${DateTimeUtils.formatDateTime(n["dueDate"])}",
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
