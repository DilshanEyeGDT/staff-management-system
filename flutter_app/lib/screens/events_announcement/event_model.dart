class EventModel {
  final int id;
  final String title;
  final String summary;
  final int createdBy;
  final String status;
  final String scheduledAt;

  EventModel({
    required this.id,
    required this.title,
    required this.summary,
    required this.createdBy,
    required this.status,
    required this.scheduledAt,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json["id"],
      title: json["title"] ?? "",
      summary: json["summary"] ?? "",
      createdBy: json["created_by"],
      status: json["status"] ?? "",
      scheduledAt: json["scheduled_at"] ?? "",
    );
  }
}
