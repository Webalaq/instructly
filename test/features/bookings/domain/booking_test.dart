import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/domain/booking.dart';

void main() {
  group('Booking', () {
    final baseStart = DateTime(2025, 6, 15, 10, 0);
    final baseEnd = DateTime(2025, 6, 15, 11, 0);

    final baseMap = {
      'studentId': 'student-1',
      'studentName': 'Alice Smith',
      'startTime': baseStart,
      'endTime': baseEnd,
      'duration': 60,
      'pickupLocation': '10 Main St',
      'status': 'confirmed',
      'recurring': false,
      'recurringGroupId': null,
      'cancellationReason': null,
      'lateCancellation': false,
      'notes': 'Bring logbook',
    };

    group('fromMap', () {
      test('creates Booking correctly from map with all fields', () {
        final booking = Booking.fromMap(baseMap, 'booking-id-1');

        expect(booking.id, 'booking-id-1');
        expect(booking.studentId, 'student-1');
        expect(booking.studentName, 'Alice Smith');
        expect(booking.startTime, baseStart);
        expect(booking.endTime, baseEnd);
        expect(booking.duration, 60);
        expect(booking.pickupLocation, '10 Main St');
        expect(booking.status, BookingStatus.confirmed);
        expect(booking.recurring, false);
        expect(booking.recurringGroupId, isNull);
        expect(booking.cancellationReason, isNull);
        expect(booking.lateCancellation, false);
        expect(booking.notes, 'Bring logbook');
      });

      test('handles Timestamp for startTime and endTime', () {
        final mapWithTimestamps = {
          ...baseMap,
          'startTime': Timestamp.fromDate(baseStart),
          'endTime': Timestamp.fromDate(baseEnd),
        };

        final booking = Booking.fromMap(mapWithTimestamps, 'booking-id-2');

        expect(booking.startTime, baseStart);
        expect(booking.endTime, baseEnd);
      });

      test('parses cancelled status', () {
        final booking = Booking.fromMap({...baseMap, 'status': 'cancelled'}, 'id');
        expect(booking.status, BookingStatus.cancelled);
      });

      test('parses completed status', () {
        final booking = Booking.fromMap({...baseMap, 'status': 'completed'}, 'id');
        expect(booking.status, BookingStatus.completed);
      });

      test('handles optional null fields', () {
        final minimalMap = {
          'studentId': 'student-1',
          'studentName': 'Alice Smith',
          'startTime': baseStart,
          'endTime': baseEnd,
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        };

        final booking = Booking.fromMap(minimalMap, 'booking-id-3');

        expect(booking.pickupLocation, isNull);
        expect(booking.recurringGroupId, isNull);
        expect(booking.cancellationReason, isNull);
        expect(booking.notes, isNull);
      });

      test('creates Booking with recurring group id', () {
        final booking = Booking.fromMap(
          {...baseMap, 'recurring': true, 'recurringGroupId': 'group-abc'},
          'booking-id-4',
        );

        expect(booking.recurring, true);
        expect(booking.recurringGroupId, 'group-abc');
      });
    });

    group('toMap', () {
      test('serializes correctly with all fields', () {
        final booking = Booking(
          id: 'booking-id-1',
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          endTime: baseEnd,
          duration: 60,
          pickupLocation: '10 Main St',
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
          notes: 'Bring logbook',
        );

        final map = booking.toMap();

        expect(map['studentId'], 'student-1');
        expect(map['studentName'], 'Alice Smith');
        expect(map['startTime'], baseStart);
        expect(map['endTime'], baseEnd);
        expect(map['duration'], 60);
        expect(map['pickupLocation'], '10 Main St');
        expect(map['status'], 'confirmed');
        expect(map['recurring'], false);
        expect(map['lateCancellation'], false);
        expect(map['notes'], 'Bring logbook');
        // id should NOT be in toMap
        expect(map.containsKey('id'), isFalse);
      });

      test('omits null optional fields from map', () {
        final booking = Booking(
          id: 'booking-id-2',
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          endTime: baseEnd,
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        final map = booking.toMap();

        expect(map.containsKey('pickupLocation'), isFalse);
        expect(map.containsKey('recurringGroupId'), isFalse);
        expect(map.containsKey('cancellationReason'), isFalse);
        expect(map.containsKey('notes'), isFalse);
      });
    });

    group('isUpcoming getter', () {
      test('returns true when status is confirmed and startTime is in the future', () {
        final futureBooking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().add(const Duration(hours: 2)),
          endTime: DateTime.now().add(const Duration(hours: 3)),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        expect(futureBooking.isUpcoming, isTrue);
      });

      test('returns false when status is confirmed but startTime is in the past', () {
        final pastBooking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().subtract(const Duration(hours: 2)),
          endTime: DateTime.now().subtract(const Duration(hours: 1)),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        expect(pastBooking.isUpcoming, isFalse);
      });

      test('returns false when status is cancelled even if in the future', () {
        final cancelledBooking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().add(const Duration(hours: 2)),
          endTime: DateTime.now().add(const Duration(hours: 3)),
          duration: 60,
          status: BookingStatus.cancelled,
          recurring: false,
          lateCancellation: false,
        );

        expect(cancelledBooking.isUpcoming, isFalse);
      });

      test('returns false when status is completed', () {
        final completedBooking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().add(const Duration(hours: 2)),
          endTime: DateTime.now().add(const Duration(hours: 3)),
          duration: 60,
          status: BookingStatus.completed,
          recurring: false,
          lateCancellation: false,
        );

        expect(completedBooking.isUpcoming, isFalse);
      });
    });

    group('wouldBeLateCancellation getter', () {
      test('returns true when startTime is less than 24 hours from now', () {
        final booking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().add(const Duration(hours: 12)),
          endTime: DateTime.now().add(const Duration(hours: 13)),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        expect(booking.wouldBeLateCancellation, isTrue);
      });

      test('returns false when startTime is more than 24 hours from now', () {
        final booking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().add(const Duration(hours: 25)),
          endTime: DateTime.now().add(const Duration(hours: 26)),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        expect(booking.wouldBeLateCancellation, isFalse);
      });

      test('returns true when startTime is in the past', () {
        final booking = Booking(
          id: 'id',
          studentId: 'student-1',
          studentName: 'Alice',
          startTime: DateTime.now().subtract(const Duration(hours: 1)),
          endTime: DateTime.now(),
          duration: 60,
          status: BookingStatus.confirmed,
          recurring: false,
          lateCancellation: false,
        );

        expect(booking.wouldBeLateCancellation, isTrue);
      });
    });
  });
}
