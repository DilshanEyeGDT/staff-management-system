class LeaveRequest {
  final int id;
  final String displayName;
  final String leaveType;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String reason;
  final String status;
  final String? approverName;
  final String? approvedAt;

  LeaveRequest({
    required this.id,
    required this.displayName,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.reason,
    required this.status,
    this.approverName,
    this.approvedAt,
  });

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['leave_request_id'],
      displayName: json['display_name'],
      leaveType: json['leave_type'],
      startDate: json['start_date'],
      endDate: json['end_date'],
      totalDays: json['total_days'],
      reason: json['reason'],
      status: json['status'],
      approverName: json['approver_name'],
      approvedAt: json['approved_at'],
    );
  }
}
