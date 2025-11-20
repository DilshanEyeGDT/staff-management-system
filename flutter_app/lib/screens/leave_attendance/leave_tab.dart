import 'package:flutter/material.dart';
import 'package:flutter_app/screens/leave_attendance/models/leave_request.dart';
import 'package:flutter_app/services/lambda_sync_service.dart';
import 'package:intl/intl.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';

class LeaveTab extends StatefulWidget {
  const LeaveTab({super.key});

  @override
  State<LeaveTab> createState() => _LeaveTabState();
}

class _LeaveTabState extends State<LeaveTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final LambdaSyncService _lambdaService = LambdaSyncService();

  List<LeaveRequest> all = [];
  List<LeaveRequest> pending = [];
  List<LeaveRequest> approved = [];
  List<LeaveRequest> rejected = [];

  bool loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
  }

  Future<String?> _getIdToken() async {
    try {
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      return session.userPoolTokensResult.value.idToken.raw;
    } catch (_) {
      return null;
    }
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => loading = true);

    final token = await _getIdToken();
    if (!mounted) return;
    if (token == null) {
      if (mounted) setState(() => loading = false);
      return;
    }

    final data = await _lambdaService.getLeaveRequests(token, status: "all");
    if (!mounted) return;

    if (data != null) {
      all = data.map((e) => LeaveRequest.fromJson(e)).toList();
      pending = all.where((e) => e.status == "pending").toList();
      approved = all.where((e) => e.status == "approved").toList();
      rejected = all.where((e) => e.status == "rejected").toList();
    }

    if (mounted) {
      setState(() => loading = false);
    }
  }

  Future<void> _openLeaveRequestDialog() async {
    final token = await _getIdToken();
    if (token == null) return;

    final userId = await _lambdaService.getCurrentUserId(token);
    if (userId == null) return;

    final leaveBalance = await _lambdaService.getLeaveBalance(token, userId);
    if (leaveBalance == null || leaveBalance.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("No leave balance found.")));
      return;
    }

    DateTime? startDate;
    DateTime? endDate;
    int totalDays = 0;
    int? selectedLeavePolicyId;

    final reasonController = TextEditingController();

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            reasonController.removeListener(() {});
            reasonController.addListener(() {
              setDialogState(() {});
            });

            bool isSubmitEnabled() {
              return selectedLeavePolicyId != null &&
                  startDate != null &&
                  endDate != null &&
                  reasonController.text.trim().isNotEmpty;
            }

            return AlertDialog(
              key: const Key('leave_request_dialog'),
              title: const Text(
                "Create Leave Request",
                key: Key('dialog_title'),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<int>(
                      key: const Key('dropdown_leave_type'),
                      decoration: const InputDecoration(
                        labelText: "Leave Type",
                      ),
                      items: leaveBalance.map((e) {
                        return DropdownMenuItem<int>(
                          value: e['leave_type_id'],
                          enabled: e['remaining_days'] > 0,
                          child: Text(
                            "${e['leave_type']} (${e['remaining_days']} remaining)",
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setDialogState(() {
                          selectedLeavePolicyId = value;
                        });
                      },
                      initialValue: selectedLeavePolicyId,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            key: const Key('button_pick_start_date'),
                            child: Text(
                              startDate == null
                                  ? "Pick Start Date"
                                  : "Start: ${DateFormat("yyyy-MM-dd").format(startDate!)}",
                            ),
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: dialogContext,
                                initialDate: DateTime.now(),
                                firstDate: DateTime(2000),
                                lastDate: DateTime(2100),
                              );
                              if (picked != null) {
                                setDialogState(() {
                                  startDate = picked;
                                  if (endDate != null) {
                                    totalDays =
                                        endDate!.difference(startDate!).inDays +
                                        1;
                                  }
                                });
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextButton(
                            key: const Key('button_pick_end_date'),
                            child: Text(
                              endDate == null
                                  ? "Pick End Date"
                                  : "End: ${DateFormat("yyyy-MM-dd").format(endDate!)}",
                            ),
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: dialogContext,
                                initialDate: startDate ?? DateTime.now(),
                                firstDate: startDate ?? DateTime.now(),
                                lastDate: DateTime(2100),
                              );
                              if (picked != null) {
                                setDialogState(() {
                                  endDate = picked;
                                  if (startDate != null) {
                                    totalDays =
                                        endDate!.difference(startDate!).inDays +
                                        1;
                                  }
                                });
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    if (totalDays > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          "Total Days: $totalDays",
                          key: const Key('text_total_days'),
                        ),
                      ),
                    const SizedBox(height: 12),
                    TextField(
                      key: const Key('textfield_reason'),
                      controller: reasonController,
                      decoration: const InputDecoration(labelText: "Reason"),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  key: const Key('button_cancel'),
                  onPressed: () {
                    Navigator.pop(dialogContext);
                  },
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  key: const Key('button_submit'),
                  onPressed: isSubmitEnabled()
                      ? () async {
                          final resp = await _lambdaService.createLeaveRequest(
                            token: token,
                            userId: userId,
                            leavePolicyId: selectedLeavePolicyId!,
                            startDate: startDate!,
                            endDate: endDate!,
                            reason: reasonController.text.trim(),
                          );

                          if (!mounted) return;
                          Navigator.pop(dialogContext);

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(resp['message'] ?? "Unknown error"),
                            ),
                          );

                          _loadData();
                        }
                      : null,
                  child: const Text("Submit"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        key: const Key('fab_add_leave_request'),
        onPressed: _openLeaveRequestDialog,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          TabBar(
            key: const Key('tabbar_leave_requests'),
            controller: _tabController,
            tabs: const [
              Tab(text: "All", key: Key('tab_all')),
              Tab(text: "Pending", key: Key('tab_pending')),
              Tab(text: "Approved", key: Key('tab_approved')),
              Tab(text: "Rejected", key: Key('tab_rejected')),
            ],
          ),
          Expanded(
            child: loading
                ? const Center(
                    child: CircularProgressIndicator(
                      key: Key('loading_indicator'),
                    ),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(all, 'all'),
                      _buildList(pending, 'pending'),
                      _buildList(approved, 'approved'),
                      _buildList(rejected, 'rejected'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(List<LeaveRequest> list, String listKey) {
    if (list.isEmpty) {
      return Center(
        child: Text("No leave requests", key: Key('empty_$listKey')),
      );
    }

    return ListView.builder(
      key: Key('list_$listKey'),
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final r = list[index];
        return Card(
          key: Key('card_${listKey}_$index'),
          child: ListTile(
            title: Text(
              "${r.leaveType} Leave (${r.totalDays} days)",
              key: Key('card_title_${listKey}_$index'),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "From: ${_fmt(r.startDate)}   To: ${_fmt(r.endDate)}",
                  key: Key('card_dates_${listKey}_$index'),
                ),
                Text(
                  "Reason: ${r.reason}",
                  key: Key('card_reason_${listKey}_$index'),
                ),
                Text(
                  "Status: ${r.status}",
                  key: Key('card_status_${listKey}_$index'),
                ),
                if (r.approvedAt != null)
                  Text(
                    "Approved: ${_fmt(r.approvedAt!)} by ${r.approverName}",
                    key: Key('card_approved_${listKey}_$index'),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _fmt(String isoDate) {
    final dt = DateTime.parse(isoDate).toLocal();
    return DateFormat("dd MMM yyyy").format(dt);
  }
}
