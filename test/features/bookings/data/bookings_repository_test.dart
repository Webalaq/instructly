import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/data/bookings_repository.dart';
import 'package:instructly/features/bookings/domain/booking.dart';

void main() {
  group('BookingsRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late BookingsRepository repository;
    const instructorId = 'instructor-123';

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = BookingsRepository(
        firestore: fakeFirestore,
        instructorId: instructorId,
      );
    });

    final baseStart = DateTime(2025, 6, 16, 10, 0);
    final baseEnd = DateTime(2025, 6, 16, 11, 0);

    group('createBooking', () {
      test('creates document with correct fields', () async {
        await repository.createBooking(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          endTime: baseEnd,
          duration: 60,
          pickupLocation: '10 Main St',
          notes: 'Bring logbook',
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['studentId'], 'student-1');
        expect(data['studentName'], 'Alice Smith');
        expect(data['duration'], 60);
        expect(data['pickupLocation'], '10 Main St');
        expect(data['notes'], 'Bring logbook');
        expect(data['status'], 'confirmed');
        expect(data['recurring'], false);
        expect(data['lateCancellation'], false);
        expect(data['startTime'], isNotNull);
        expect(data['endTime'], isNotNull);
      });

      test('creates booking without optional fields', () async {
        await repository.createBooking(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          endTime: baseEnd,
          duration: 60,
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data.containsKey('pickupLocation'), isFalse);
        expect(data.containsKey('notes'), isFalse);
      });
    });

    group('getBookingsForRange', () {
      test('returns bookings within the date range', () async {
        final bookingsRef = fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings');

        // Booking within range
        await bookingsRef.add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime(2025, 6, 16, 10, 0),
          'endTime': DateTime(2025, 6, 16, 11, 0),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        // Booking outside range (before)
        await bookingsRef.add({
          'studentId': 'student-2',
          'studentName': 'Bob',
          'startTime': DateTime(2025, 6, 14, 10, 0),
          'endTime': DateTime(2025, 6, 14, 11, 0),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        final rangeStart = DateTime(2025, 6, 15);
        final rangeEnd = DateTime(2025, 6, 18);

        final stream = repository.getBookingsForRange(rangeStart, rangeEnd);
        final bookings = await stream.first;

        expect(bookings.length, 1);
        expect(bookings.first.studentName, 'Alice');
      });

      test('returns empty list when no bookings in range', () async {
        final rangeStart = DateTime(2025, 6, 15);
        final rangeEnd = DateTime(2025, 6, 18);

        final stream = repository.getBookingsForRange(rangeStart, rangeEnd);
        final bookings = await stream.first;

        expect(bookings, isEmpty);
      });

      test('returns bookings as list of Booking objects', () async {
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime(2025, 6, 16, 10, 0),
          'endTime': DateTime(2025, 6, 16, 11, 0),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        final rangeStart = DateTime(2025, 6, 15);
        final rangeEnd = DateTime(2025, 6, 18);

        final stream = repository.getBookingsForRange(rangeStart, rangeEnd);
        final bookings = await stream.first;

        expect(bookings, isA<List<Booking>>());
      });
    });

    group('getBookingsForStudent', () {
      test('returns bookings for specified student', () async {
        final bookingsRef = fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings');

        await bookingsRef.add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime(2025, 6, 16, 10, 0),
          'endTime': DateTime(2025, 6, 16, 11, 0),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        await bookingsRef.add({
          'studentId': 'student-2',
          'studentName': 'Bob',
          'startTime': DateTime(2025, 6, 17, 10, 0),
          'endTime': DateTime(2025, 6, 17, 11, 0),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        final stream = repository.getBookingsForStudent('student-1');
        final bookings = await stream.first;

        expect(bookings.length, 1);
        expect(bookings.first.studentId, 'student-1');
        expect(bookings.first.studentName, 'Alice');
      });

      test('returns empty list when student has no bookings', () async {
        final stream = repository.getBookingsForStudent('nonexistent-student');
        final bookings = await stream.first;

        expect(bookings, isEmpty);
      });
    });

    group('cancelBooking', () {
      test('sets status to cancelled and records reason', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().add(const Duration(hours: 48)),
          'endTime': DateTime.now().add(const Duration(hours: 49)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        await repository.cancelBooking(docRef.id, reason: 'Student unavailable');

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['status'], 'cancelled');
        expect(updatedDoc.data()!['cancellationReason'], 'Student unavailable');
      });

      test('sets lateCancellation to true when within 24 hours', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().add(const Duration(hours: 12)), // < 24h
          'endTime': DateTime.now().add(const Duration(hours: 13)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        await repository.cancelBooking(docRef.id);

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['status'], 'cancelled');
        expect(updatedDoc.data()!['lateCancellation'], isTrue);
      });

      test('sets lateCancellation to false when more than 24 hours away', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().add(const Duration(hours: 48)), // > 24h
          'endTime': DateTime.now().add(const Duration(hours: 49)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        await repository.cancelBooking(docRef.id);

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['lateCancellation'], isFalse);
      });
    });

    group('createRecurringBookings', () {
      test('creates correct number of weekly bookings', () async {
        await repository.createRecurringBookings(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          duration: 60,
          weeks: 4,
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        expect(snapshot.docs.length, 4);
      });

      test('all recurring bookings share the same recurringGroupId', () async {
        await repository.createRecurringBookings(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          duration: 60,
          weeks: 3,
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        final groupIds = snapshot.docs
            .map((doc) => doc.data()['recurringGroupId'] as String)
            .toSet();

        // All should share the same group ID
        expect(groupIds.length, 1);
        expect(groupIds.first, isNotEmpty);
      });

      test('creates bookings at weekly intervals', () async {
        await repository.createRecurringBookings(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          duration: 60,
          weeks: 3,
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        final startTimes = snapshot.docs
            .map((doc) {
              final raw = doc.data()['startTime'];
              if (raw is DateTime) return raw;
              return (raw as dynamic).toDate() as DateTime;
            })
            .toList()
          ..sort();

        // Each booking should be 7 days apart
        for (int i = 1; i < startTimes.length; i++) {
          final diff = startTimes[i].difference(startTimes[i - 1]);
          expect(diff.inDays, 7);
        }
      });

      test('all recurring bookings have recurring=true', () async {
        await repository.createRecurringBookings(
          studentId: 'student-1',
          studentName: 'Alice Smith',
          startTime: baseStart,
          duration: 60,
          weeks: 2,
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .get();

        for (final doc in snapshot.docs) {
          expect(doc.data()['recurring'], isTrue);
          expect(doc.data()['status'], 'confirmed');
        }
      });
    });

    group('cancelRecurringFuture', () {
      test('cancels all future confirmed bookings in a recurring group', () async {
        const groupId = 'group-abc';
        final bookingsRef = fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings');

        // Future booking in group
        await bookingsRef.add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().add(const Duration(days: 7)),
          'endTime': DateTime.now().add(const Duration(days: 7, hours: 1)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': true,
          'recurringGroupId': groupId,
          'lateCancellation': false,
        });

        // Another future booking in group
        await bookingsRef.add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().add(const Duration(days: 14)),
          'endTime': DateTime.now().add(const Duration(days: 14, hours: 1)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': true,
          'recurringGroupId': groupId,
          'lateCancellation': false,
        });

        await repository.cancelRecurringFuture(groupId);

        final snapshot = await bookingsRef.get();

        for (final doc in snapshot.docs) {
          if (doc.data()['recurringGroupId'] == groupId) {
            expect(doc.data()['status'], 'cancelled');
          }
        }
      });
    });

    group('completeBooking', () {
      test('sets status to completed', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .add({
          'studentId': 'student-1',
          'studentName': 'Alice',
          'startTime': DateTime.now().subtract(const Duration(hours: 2)),
          'endTime': DateTime.now().subtract(const Duration(hours: 1)),
          'duration': 60,
          'status': 'confirmed',
          'recurring': false,
          'lateCancellation': false,
        });

        await repository.completeBooking(docRef.id);

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('bookings')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['status'], 'completed');
      });
    });
  });
}
