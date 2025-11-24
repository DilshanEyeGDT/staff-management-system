class AttendanceLog {
  final int id;
  final String? clockIn;
  final String? clockOut;
  final String status;
  final String date;

  AttendanceLog({
    required this.id,
    this.clockIn,
    this.clockOut,
    required this.status,
    required this.date,
  });

  factory AttendanceLog.fromJson(Map<String, dynamic> json) {
    return AttendanceLog(
      id: json['attendance_log_id'],
      clockIn: json['clock_in_time'],
      clockOut: json['clock_out_time'],
      status: json['attendance_status'],
      date: json['date'],
    );
  }
}
