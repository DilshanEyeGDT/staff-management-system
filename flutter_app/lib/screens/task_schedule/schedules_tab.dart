import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter_app/screens/task_schedule/add_schedule_screen.dart';
import 'package:flutter_app/screens/task_schedule/models/date_time_utils.dart';
import 'package:flutter_app/services/dotnet_sync_service.dart';

class SchedulesTab extends StatefulWidget {
  const SchedulesTab({super.key});

  @override
  State<SchedulesTab> createState() => _SchedulesTabState();
}

class _SchedulesTabState extends State<SchedulesTab> {
  final DotNetSyncService _dotNetService = DotNetSyncService();

  bool _loading = false;
  List<dynamic> _schedules = [];

  @override
  void initState() {
    super.initState();
    _fetchSchedules();
  }

  Future<void> _fetchSchedules() async {
    if (!mounted) return;
    setState(() => _loading = true);

    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;

      final idToken = session.userPoolTokensResult.value.idToken.raw;

      final schedules = await _dotNetService.getSchedulesForUser(idToken);

      if (!mounted) return;
      setState(() {
        _schedules = schedules;
      });
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          key: const Key('schedules_fetch_error_snackbar'),
          content: Text("Error fetching schedules: $e"),
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: const Key('schedules_screen'),
      floatingActionButton: FloatingActionButton(
        key: const Key('add_schedule_fab'),
        child: const Icon(Icons.add, key: Key('add_schedule_fab_icon')),
        onPressed: () async {
          final created = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) =>
                  const AddScheduleScreen(key: Key('add_schedule_screen')),
            ),
          );

          if (created == true) {
            _fetchSchedules(); // refresh after creation
          }
        },
      ),
      body: _loading
          ? const Center(
              key: Key('schedules_loading'),
              child: CircularProgressIndicator(
                key: Key('schedules_loading_indicator'),
              ),
            )
          : _schedules.isEmpty
          ? const Center(
              key: Key('schedules_empty_state'),
              child: Text(
                "No schedules found",
                key: Key('schedules_empty_text'),
              ),
            )
          : ListView.builder(
              key: const Key('schedules_list'),
              itemCount: _schedules.length,
              itemBuilder: (context, index) {
                final s = _schedules[index];
                final scheduleId = s["scheduleId"] ?? index;

                return Card(
                  key: Key('schedule_card_$scheduleId'),
                  margin: const EdgeInsets.all(12),
                  child: ListTile(
                    key: Key('schedule_tile_$scheduleId'),
                    title: Text(
                      s["title"],
                      key: Key('schedule_title_$scheduleId'),
                    ),
                    subtitle: Text(
                      "Created by: ${s["createdByUserName"]}\n"
                      "Starts: ${DateTimeUtils.formatDateTime(s["startAt"])}\n"
                      "Ends: ${DateTimeUtils.formatDateTime(s["endAt"])}",
                      key: Key('schedule_subtitle_$scheduleId'),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
