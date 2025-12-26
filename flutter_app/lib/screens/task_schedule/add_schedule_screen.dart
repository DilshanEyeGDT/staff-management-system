import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter_app/services/dotnet_sync_service.dart';

class AddScheduleScreen extends StatefulWidget {
  const AddScheduleScreen({super.key});

  @override
  State<AddScheduleScreen> createState() => _AddScheduleScreenState();
}

class _AddScheduleScreenState extends State<AddScheduleScreen> {
  final DotNetSyncService _dotNet = DotNetSyncService();

  final _formKey = GlobalKey<FormState>();

  List<dynamic> users = [];
  int? createdByUserId;
  int? assigneeUserId;

  final titleCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final locationCtrl = TextEditingController();
  final importanceCtrl = TextEditingController(text: "high");

  DateTime? startAt;
  DateTime? endAt;

  String recurrenceRule = "NONE";

  @override
  void initState() {
    super.initState();
    _loadUsersAndCurrentUser();
  }

  Future<void> _loadUsersAndCurrentUser() async {
    final session = await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
    final idToken = session.userPoolTokensResult.value.idToken.raw;

    final me = await _dotNet.getCurrentUserId(idToken);
    final allUsers = await _dotNet.getAllUsers();

    setState(() {
      createdByUserId = me;
      users = allUsers.entries
          .map((e) => {"id": e.key, "displayName": e.value})
          .toList();
    });
  }

  Future<void> _create() async {
    if (!_formKey.currentState!.validate()) return;
    if (startAt == null || endAt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('schedule_time_validation_snackbar'),
          content: Text("Please select start & end times"),
        ),
      );
      return;
    }

    final body = {
      "createdByUserId": createdByUserId,
      "assigneeUserId": assigneeUserId,
      "teamId": "7f5a9f14-1c2a-4d3e-a9c3-9b8b2f1a2c3d",
      "title": titleCtrl.text,
      "description": descCtrl.text,
      "startAt": startAt!.toUtc().toIso8601String(),
      "endAt": endAt!.toUtc().toIso8601String(),
      "recurrenceRule": recurrenceRule,
      "metadata": {
        "location": locationCtrl.text,
        "importance": importanceCtrl.text,
      },
    };

    final success = await _dotNet.createSchedule(body);

    if (!mounted) return;

    if (success) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('schedule_create_success_snackbar'),
          content: Text("Schedule created successfully"),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          key: Key('schedule_create_failed_snackbar'),
          content: Text("Failed to create schedule"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (createdByUserId == null || users.isEmpty) {
      return const Scaffold(
        key: Key('create_schedule_loading_screen'),
        body: Center(
          child: CircularProgressIndicator(
            key: Key('create_schedule_loading_indicator'),
          ),
        ),
      );
    }

    return Scaffold(
      key: const Key('create_schedule_screen'),
      appBar: AppBar(
        key: const Key('create_schedule_appbar'),
        title: const Text("Create Schedule", key: Key('create_schedule_title')),
      ),
      body: Padding(
        key: const Key('create_schedule_body'),
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            key: const Key('create_schedule_form_list'),
            children: [
              TextFormField(
                key: const Key('schedule_title_field'),
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: "Title"),
                validator: (v) => v!.isEmpty ? "Required" : null,
              ),

              TextFormField(
                key: const Key('schedule_description_field'),
                controller: descCtrl,
                decoration: const InputDecoration(labelText: "Description"),
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<int>(
                key: const Key('schedule_assignee_dropdown'),
                value: assigneeUserId,
                items: users
                    .map<DropdownMenuItem<int>>(
                      (u) => DropdownMenuItem<int>(
                        key: Key('assignee_option_${u["id"]}'),
                        value: u["id"] as int,
                        child: Text(u["displayName"] as String),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setState(() => assigneeUserId = v),
                decoration: const InputDecoration(labelText: "Assign To User"),
                validator: (v) => v == null ? "Required" : null,
              ),

              const SizedBox(height: 16),

              ListTile(
                key: const Key('schedule_start_time_tile'),
                title: Text(
                  startAt == null
                      ? "Select Start Time"
                      : startAt!.toLocal().toString(),
                  key: const Key('schedule_start_time_text'),
                ),
                trailing: const Icon(
                  Icons.calendar_today,
                  key: Key('schedule_start_time_icon'),
                ),
                onTap: () async {
                  final dt = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2024),
                    lastDate: DateTime(2030),
                  );
                  if (dt != null) {
                    final tm = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (tm != null) {
                      setState(
                        () => startAt = DateTime(
                          dt.year,
                          dt.month,
                          dt.day,
                          tm.hour,
                          tm.minute,
                        ),
                      );
                    }
                  }
                },
              ),

              ListTile(
                key: const Key('schedule_end_time_tile'),
                title: Text(
                  endAt == null
                      ? "Select End Time"
                      : endAt!.toLocal().toString(),
                  key: const Key('schedule_end_time_text'),
                ),
                trailing: const Icon(
                  Icons.calendar_month,
                  key: Key('schedule_end_time_icon'),
                ),
                onTap: () async {
                  final dt = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2024),
                    lastDate: DateTime(2030),
                  );
                  if (dt != null) {
                    final tm = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (tm != null) {
                      setState(
                        () => endAt = DateTime(
                          dt.year,
                          dt.month,
                          dt.day,
                          tm.hour,
                          tm.minute,
                        ),
                      );
                    }
                  }
                },
              ),

              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                key: const Key('schedule_recurrence_dropdown'),
                value: recurrenceRule,
                items: const [
                  DropdownMenuItem(
                    key: Key('recurrence_none'),
                    value: "NONE",
                    child: Text("None"),
                  ),
                  DropdownMenuItem(
                    key: Key('recurrence_daily'),
                    value: "FREQ=DAILY",
                    child: Text("Daily"),
                  ),
                  DropdownMenuItem(
                    key: Key('recurrence_weekly'),
                    value: "FREQ=WEEKLY;BYDAY=MO",
                    child: Text("Weekly"),
                  ),
                  DropdownMenuItem(
                    key: Key('recurrence_monthly'),
                    value: "FREQ=MONTHLY",
                    child: Text("Monthly"),
                  ),
                ],
                onChanged: (v) => setState(() => recurrenceRule = v!),
                decoration: const InputDecoration(labelText: "Recurrence Rule"),
              ),

              TextFormField(
                key: const Key('schedule_location_field'),
                controller: locationCtrl,
                decoration: const InputDecoration(labelText: "Location"),
              ),

              TextFormField(
                key: const Key('schedule_importance_field'),
                controller: importanceCtrl,
                decoration: const InputDecoration(labelText: "Importance"),
              ),

              const SizedBox(height: 20),

              ElevatedButton(
                key: const Key('create_schedule_submit_button'),
                onPressed: _create,
                child: const Text(
                  "Create Schedule",
                  key: Key('create_schedule_submit_text'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
