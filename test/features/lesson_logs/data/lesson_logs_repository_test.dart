import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/lesson_logs/data/lesson_logs_repository.dart';
import 'package:instructly/features/lesson_logs/domain/lesson_log.dart';

void main() {
  group('LessonLogsRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late LessonLogsRepository repository;
    const instructorId = 'instructor-123';
    const studentId = 'student-456';

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = LessonLogsRepository(
        firestore: fakeFirestore,
        instructorId: instructorId,
      );
    });

    CollectionReference<Map<String, dynamic>> logsCol() =>
        fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .doc(studentId)
            .collection('lessonLogs');

    // -------------------------------------------------------------------------
    // addLog
    // -------------------------------------------------------------------------
    group('addLog', () {
      test('creates document with all required fields', () async {
        final date = DateTime(2025, 6, 16, 10, 0);

        await repository.addLog(
          studentId: studentId,
          date: date,
          duration: 60,
          skillsCovered: ['junctions', 'roundabouts'],
          notes: 'Great session',
          areasToImprove: 'Mirror checks',
          bookingId: 'booking-abc',
        );

        final snapshot = await logsCol().get();
        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['duration'], 60);
        expect(data['skillsCovered'], ['junctions', 'roundabouts']);
        expect(data['notes'], 'Great session');
        expect(data['areasToImprove'], 'Mirror checks');
        expect(data['bookingId'], 'booking-abc');
        expect(data['date'], isNotNull);
      });

      test('creates document without optional fields', () async {
        await repository.addLog(
          studentId: studentId,
          date: DateTime(2025, 6, 16),
          duration: 90,
          skillsCovered: ['parallel_parking'],
        );

        final snapshot = await logsCol().get();
        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data.containsKey('notes'), isFalse);
        expect(data.containsKey('areasToImprove'), isFalse);
        expect(data.containsKey('bookingId'), isFalse);
      });

      test('can add multiple logs for the same student', () async {
        await repository.addLog(
          studentId: studentId,
          date: DateTime(2025, 6, 10),
          duration: 60,
          skillsCovered: ['junctions'],
        );
        await repository.addLog(
          studentId: studentId,
          date: DateTime(2025, 6, 17),
          duration: 60,
          skillsCovered: ['roundabouts'],
        );

        final snapshot = await logsCol().get();
        expect(snapshot.docs.length, 2);
      });
    });

    // -------------------------------------------------------------------------
    // getLogs
    // -------------------------------------------------------------------------
    group('getLogs', () {
      test('returns empty list when no logs exist', () async {
        final stream = repository.getLogs(studentId);
        final logs = await stream.first;
        expect(logs, isEmpty);
      });

      test('returns list of LessonLog objects', () async {
        await logsCol().add({
          'date': DateTime(2025, 6, 16),
          'duration': 60,
          'skillsCovered': ['junctions'],
        });

        final stream = repository.getLogs(studentId);
        final logs = await stream.first;

        expect(logs, isA<List<LessonLog>>());
        expect(logs.length, 1);
        expect(logs.first.duration, 60);
        expect(logs.first.skillsCovered, ['junctions']);
      });

      test('returns logs sorted by date descending', () async {
        final earlier = DateTime(2025, 6, 10);
        final later = DateTime(2025, 6, 17);

        await logsCol().add({
          'date': earlier,
          'duration': 60,
          'skillsCovered': ['junctions'],
        });
        await logsCol().add({
          'date': later,
          'duration': 90,
          'skillsCovered': ['roundabouts'],
        });

        final stream = repository.getLogs(studentId);
        final logs = await stream.first;

        expect(logs.length, 2);
        // Most recent first
        expect(logs[0].date.isAfter(logs[1].date), isTrue);
        expect(logs[0].skillsCovered, ['roundabouts']);
        expect(logs[1].skillsCovered, ['junctions']);
      });

      test('parses optional fields correctly', () async {
        await logsCol().add({
          'date': DateTime(2025, 6, 16),
          'duration': 60,
          'skillsCovered': ['junctions'],
          'notes': 'Good lesson',
          'areasToImprove': 'Speed control',
          'bookingId': 'booking-xyz',
        });

        final stream = repository.getLogs(studentId);
        final logs = await stream.first;

        final log = logs.first;
        expect(log.notes, 'Good lesson');
        expect(log.areasToImprove, 'Speed control');
        expect(log.bookingId, 'booking-xyz');
      });
    });
  });
}
