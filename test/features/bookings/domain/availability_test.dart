import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/domain/availability.dart';
import 'package:instructly/features/bookings/domain/booking.dart';
import 'package:instructly/features/onboarding/domain/instructor_profile.dart';

void main() {
  group('AvailabilityCalculator', () {
    // Monday = weekday 1
    // We use a known Monday: 2025-06-16
    final monday = DateTime(2025, 6, 16); // Monday
    final tuesday = DateTime(2025, 6, 17); // Tuesday
    final saturday = DateTime(2025, 6, 21); // Saturday

    final weeklyAvailability = {
      'mon': [TimeSlot(start: '09:00', end: '17:00')],
      'tue': [TimeSlot(start: '10:00', end: '12:00')],
    };

    late AvailabilityCalculator calculator;

    setUp(() {
      calculator = AvailabilityCalculator(
        weeklyAvailability: weeklyAvailability,
        bufferMinutes: 15,
      );
    });

    group('getAvailableSlots', () {
      test('returns slots for a day with availability', () {
        final slots = calculator.getAvailableSlots(
          date: monday,
          existingBookings: [],
          duration: 60,
        );

        // 09:00 to 17:00 with 60min duration + 15min buffer = every 75 min
        // 09:00, 10:15, 11:30, 12:45, 14:00, 15:15 (next would be 16:30 which
        // plus 60 = 17:30 > 17:00, so 15:15 starts at 15:15 ends at 16:15 <= 17:00)
        // Let's verify the first and last
        expect(slots, isNotEmpty);
        expect(slots.first, DateTime(2025, 6, 16, 9, 0));
        // All slots should be on Monday
        for (final slot in slots) {
          expect(slot.day, 16);
          expect(slot.month, 6);
        }
      });

      test('returns empty list for a day with no availability', () {
        final slots = calculator.getAvailableSlots(
          date: saturday,
          existingBookings: [],
          duration: 60,
        );

        expect(slots, isEmpty);
      });

      test('excludes times that conflict with existing confirmed bookings', () {
        // Booking from 09:00 to 10:00 on Monday
        final existingBooking = Booking(
          id: 'booking-1',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime(2025, 6, 16, 9, 0),
          endTime: DateTime(2025, 6, 16, 10, 0),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        final slots = calculator.getAvailableSlots(
          date: monday,
          existingBookings: [existingBooking],
          duration: 60,
        );

        // 09:00 should be excluded because it conflicts
        expect(slots.any((s) => s.hour == 9 && s.minute == 0), isFalse);
        // But later slots should still be available (after buffer)
        expect(slots, isNotEmpty);
      });

      test('does not exclude times for cancelled bookings', () {
        // Cancelled booking from 09:00 to 10:00 on Monday
        final cancelledBooking = Booking(
          id: 'booking-1',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime(2025, 6, 16, 9, 0),
          endTime: DateTime(2025, 6, 16, 10, 0),
          duration: 60,
          status: BookingStatus.cancelled,
          recurring: false,
          lateCancellation: false,
        );

        final slots = calculator.getAvailableSlots(
          date: monday,
          existingBookings: [cancelledBooking],
          duration: 60,
        );

        // 09:00 should be available since the booking is cancelled
        expect(slots.any((s) => s.hour == 9 && s.minute == 0), isTrue);
      });

      test('returns correct slots for tuesday with short availability window', () {
        // Tuesday: 10:00 to 12:00, duration 60min + 15 buffer
        // Should get: 10:00 (ends 11:00), then 11:15 would end at 12:15 > 12:00, so only 10:00
        final slots = calculator.getAvailableSlots(
          date: tuesday,
          existingBookings: [],
          duration: 60,
        );

        expect(slots.length, 1);
        expect(slots.first, DateTime(2025, 6, 17, 10, 0));
      });

      test('handles multiple existing bookings correctly', () {
        final bookings = [
          Booking(
            id: 'booking-1',
            studentId: 'student-1',
            studentName: 'Alice',
            startTime: DateTime(2025, 6, 16, 9, 0),
            endTime: DateTime(2025, 6, 16, 10, 0),
            duration: 60,
            status: BookingStatus.confirmed,
            recurring: false,
            lateCancellation: false,
          ),
          Booking(
            id: 'booking-2',
            studentId: 'student-2',
            studentName: 'Bob',
            startTime: DateTime(2025, 6, 16, 11, 30),
            endTime: DateTime(2025, 6, 16, 12, 30),
            duration: 60,
            status: BookingStatus.confirmed,
            recurring: false,
            lateCancellation: false,
          ),
        ];

        final slots = calculator.getAvailableSlots(
          date: monday,
          existingBookings: bookings,
          duration: 60,
        );

        // Both 09:00 and 11:30 should be excluded
        expect(slots.any((s) => s.hour == 9 && s.minute == 0), isFalse);
        expect(slots.any((s) => s.hour == 11 && s.minute == 30), isFalse);
      });
    });

    group('isDayAvailable', () {
      test('returns true for Monday which has availability', () {
        expect(calculator.isDayAvailable(monday), isTrue);
      });

      test('returns true for Tuesday which has availability', () {
        expect(calculator.isDayAvailable(tuesday), isTrue);
      });

      test('returns false for Saturday which has no availability', () {
        expect(calculator.isDayAvailable(saturday), isFalse);
      });

      test('returns false for Sunday which has no availability', () {
        final sunday = DateTime(2025, 6, 22); // Sunday
        expect(calculator.isDayAvailable(sunday), isFalse);
      });
    });
  });
}
