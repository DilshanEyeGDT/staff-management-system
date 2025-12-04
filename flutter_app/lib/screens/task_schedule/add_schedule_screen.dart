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
        const SnackBar(content: Text("Please select start & end times")),
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
        const SnackBar(content: Text("Schedule created successfully")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to create schedule")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (createdByUserId == null || users.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Create Schedule")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: "Title"),
                validator: (v) => v!.isEmpty ? "Required" : null,
              ),

              TextFormField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: "Description"),
              ),

              const SizedBox(height: 16),
              DropdownButtonFormField<int>(
                value: assigneeUserId,
                items: users
                    .map<DropdownMenuItem<int>>(
                      (u) => DropdownMenuItem<int>(
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
                title: Text(
                  startAt == null
                      ? "Select Start Time"
                      : startAt!.toLocal().toString(),
                ),
                trailing: const Icon(Icons.calendar_today),
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
                title: Text(
                  endAt == null
                      ? "Select End Time"
                      : endAt!.toLocal().toString(),
                ),
                trailing: const Icon(Icons.calendar_month),
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
                value: recurrenceRule,
                items: const [
                  DropdownMenuItem(value: "NONE", child: Text("None")),
                  DropdownMenuItem(value: "FREQ=DAILY", child: Text("Daily")),
                  DropdownMenuItem(
                    value: "FREQ=WEEKLY;BYDAY=MO",
                    child: Text("Weekly"),
                  ),
                  DropdownMenuItem(
                    value: "FREQ=MONTHLY",
                    child: Text("Monthly"),
                  ),
                ],
                onChanged: (v) => setState(() => recurrenceRule = v!),
                decoration: const InputDecoration(labelText: "Recurrence Rule"),
              ),

              TextFormField(
                controller: locationCtrl,
                decoration: const InputDecoration(labelText: "Location"),
              ),

              TextFormField(
                controller: importanceCtrl,
                decoration: const InputDecoration(labelText: "Importance"),
              ),

              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _create,
                child: const Text("Create Schedule"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
