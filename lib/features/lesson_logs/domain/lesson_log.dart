import 'package:cloud_firestore/cloud_firestore.dart';

class LessonLog {
  final String id;
  final String? bookingId;
  final DateTime date;
  final int duration; // minutes
  final List<String> skillsCovered; // skill IDs
  final String? notes;
  final String? areasToImprove;

  const LessonLog({
    required this.id,
    this.bookingId,
    required this.date,
    required this.duration,
    required this.skillsCovered,
    this.notes,
    this.areasToImprove,
  });

  factory LessonLog.fromMap(Map<String, dynamic> map, String id) {
    // Handle DateTime / Timestamp for date
    final dateRaw = map['date'];
    final DateTime date;
    if (dateRaw is Timestamp) {
      date = dateRaw.toDate();
    } else if (dateRaw is DateTime) {
      date = dateRaw;
    } else {
      date = DateTime.now();
    }

    // Handle skills list
    final skillsRaw = map['skillsCovered'];
    final List<String> skillsCovered;
    if (skillsRaw is List) {
      skillsCovered = skillsRaw.cast<String>();
    } else {
      skillsCovered = [];
    }

    return LessonLog(
      id: id,
      bookingId: map['bookingId'] as String?,
      date: date,
      duration: map['duration'] as int? ?? 60,
      skillsCovered: skillsCovered,
      notes: map['notes'] as String?,
      areasToImprove: map['areasToImprove'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (bookingId != null) 'bookingId': bookingId,
      'date': date,
      'duration': duration,
      'skillsCovered': skillsCovered,
      if (notes != null) 'notes': notes,
      if (areasToImprove != null) 'areasToImprove': areasToImprove,
    };
  }
}
