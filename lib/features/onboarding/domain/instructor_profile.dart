class TimeSlot {
  final String start; // "09:00"
  final String end; // "17:00"

  const TimeSlot({required this.start, required this.end});

  Map<String, dynamic> toMap() => {'start': start, 'end': end};

  factory TimeSlot.fromMap(Map<String, dynamic> map) =>
      TimeSlot(start: map['start'] as String, end: map['end'] as String);
}

class InstructorProfile {
  final String name;
  final String phone;
  final String? photoUrl;
  final List<int> lessonDurations; // in minutes
  final int bufferMinutes;
  final List<String> teachingAreas;
  final List<String> preferredTestCentres;
  final Map<String, List<TimeSlot>> weeklyAvailability;

  const InstructorProfile({
    required this.name,
    required this.phone,
    this.photoUrl,
    this.lessonDurations = const [60],
    this.bufferMinutes = 15,
    this.teachingAreas = const [],
    this.preferredTestCentres = const [],
    this.weeklyAvailability = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'phone': phone,
      if (photoUrl != null) 'photoUrl': photoUrl,
      'lessonDurations': lessonDurations,
      'bufferMinutes': bufferMinutes,
      'teachingAreas': teachingAreas,
      'preferredTestCentres': preferredTestCentres,
      'weeklyAvailability': weeklyAvailability.map(
        (day, slots) => MapEntry(day, slots.map((s) => s.toMap()).toList()),
      ),
    };
  }
}
