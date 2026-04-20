import 'package:instructly/features/onboarding/domain/instructor_profile.dart';

import 'booking.dart';

class AvailabilityCalculator {
  AvailabilityCalculator({
    required Map<String, List<TimeSlot>> weeklyAvailability,
    required int bufferMinutes,
  })  : _weeklyAvailability = weeklyAvailability,
        _bufferMinutes = bufferMinutes;

  final Map<String, List<TimeSlot>> _weeklyAvailability;
  final int _bufferMinutes;

  /// Index matches DateTime.weekday (1=mon, 2=tue, ..., 7=sun).
  static const _dayKeys = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  /// Returns available start times for the given [date] that fit a lesson of
  /// [duration] minutes and do not overlap [existingBookings].
  List<DateTime> getAvailableSlots({
    required DateTime date,
    required List<Booking> existingBookings,
    required int duration,
  }) {
    final dayKey = _dayKeys[date.weekday];
    final slots = _weeklyAvailability[dayKey];
    if (slots == null || slots.isEmpty) return [];

    final results = <DateTime>[];

    for (final slot in slots) {
      final slotStart = _parseTime(date, slot.start);
      final slotEnd = _parseTime(date, slot.end);

      var candidate = slotStart;
      while (true) {
        final candidateEnd = candidate.add(Duration(minutes: duration));
        if (candidateEnd.isAfter(slotEnd)) break;

        final hasConflict = existingBookings
            .where((b) => b.status != BookingStatus.cancelled)
            .any((b) => _overlaps(candidate, candidateEnd, b.startTime, b.endTime));

        if (!hasConflict) {
          results.add(candidate);
        }

        candidate = candidate.add(Duration(minutes: duration + _bufferMinutes));
      }
    }

    return results;
  }

  /// Returns true if [date]'s weekday has any availability defined.
  bool isDayAvailable(DateTime date) {
    final dayKey = _dayKeys[date.weekday];
    final slots = _weeklyAvailability[dayKey];
    return slots != null && slots.isNotEmpty;
  }

  DateTime _parseTime(DateTime date, String time) {
    final parts = time.split(':');
    return DateTime(
      date.year,
      date.month,
      date.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }

  bool _overlaps(
    DateTime startA,
    DateTime endA,
    DateTime startB,
    DateTime endB,
  ) {
    return startA.isBefore(endB) && endA.isAfter(startB);
  }
}
