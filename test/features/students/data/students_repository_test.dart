import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/students/data/students_repository.dart';
import 'package:instructly/features/students/domain/student.dart';

void main() {
  group('StudentsRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late StudentsRepository repository;
    const instructorId = 'instructor-123';

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = StudentsRepository(
        firestore: fakeFirestore,
        instructorId: instructorId,
      );
    });

    group('addStudent', () {
      test('creates document with correct fields', () async {
        await repository.addStudent(
          name: 'Alice Smith',
          email: 'alice@example.com',
          phone: '07700123456',
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .get();

        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['name'], 'Alice Smith');
        expect(data['email'], 'alice@example.com');
        expect(data['phone'], '07700123456');
        expect(data['status'], 'active');
        expect(data['joinedAt'], isNotNull);
      });

      test('creates document with only name when email and phone are null',
          () async {
        await repository.addStudent(name: 'Bob Jones');

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .get();

        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['name'], 'Bob Jones');
        expect(data['status'], 'active');
        expect(data.containsKey('email'), isFalse);
        expect(data.containsKey('phone'), isFalse);
      });
    });

    group('getStudents', () {
      test('returns stream of students list', () async {
        // Add test data
        final studentsRef = fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students');

        await studentsRef.add({
          'name': 'Alice Smith',
          'status': 'active',
          'joinedAt': DateTime.now(),
        });

        await studentsRef.add({
          'name': 'Bob Jones',
          'status': 'inactive',
          'joinedAt': DateTime.now(),
        });

        final stream = repository.getStudents();
        final students = await stream.first;

        expect(students.length, 2);
        expect(students, isA<List<Student>>());
      });

      test('returns empty list when no students exist', () async {
        final stream = repository.getStudents();
        final students = await stream.first;

        expect(students, isEmpty);
      });
    });

    group('getStudent', () {
      test('returns specific student by id', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .add({
          'name': 'Alice Smith',
          'email': 'alice@example.com',
          'status': 'active',
          'joinedAt': DateTime.now(),
        });

        final student = await repository.getStudent(docRef.id);

        expect(student.id, docRef.id);
        expect(student.name, 'Alice Smith');
        expect(student.email, 'alice@example.com');
        expect(student.status, StudentStatus.active);
      });

      test('throws when student does not exist', () async {
        expect(
          () => repository.getStudent('nonexistent-id'),
          throwsException,
        );
      });
    });

    group('updateStudentStatus', () {
      test('updates status field in Firestore', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .add({
          'name': 'Alice Smith',
          'status': 'active',
          'joinedAt': DateTime.now(),
        });

        await repository.updateStudentStatus(docRef.id, 'passed');

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['status'], 'passed');
      });
    });

    group('updateStudent', () {
      test('updates specified fields in Firestore', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .add({
          'name': 'Alice Smith',
          'status': 'active',
          'joinedAt': DateTime.now(),
        });

        await repository.updateStudent(docRef.id, {
          'name': 'Alice Johnson',
          'notes': 'Name changed after marriage',
        });

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['name'], 'Alice Johnson');
        expect(updatedDoc.data()!['notes'], 'Name changed after marriage');
        expect(updatedDoc.data()!['status'], 'active'); // unchanged
      });
    });

    group('generateInviteCode', () {
      test('creates invite document with 6-char code', () async {
        final code = await repository.generateInviteCode();

        expect(code.length, 6);

        // Verify the invite document was created
        final inviteDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('invites')
            .doc(code)
            .get();

        expect(inviteDoc.exists, isTrue);
        expect(inviteDoc.data()!['claimed'], isFalse);
        expect(inviteDoc.data()!['expiresAt'], isNotNull);
      });

      test('code contains only valid characters (uppercase letters and digits, no ambiguous)', () async {
        // Run multiple times to increase confidence
        for (int i = 0; i < 10; i++) {
          final code = await repository.generateInviteCode();
          final ambiguousChars = RegExp(r'[0OI1L]');
          expect(ambiguousChars.hasMatch(code), isFalse,
              reason: 'Code "$code" contains ambiguous character');
          expect(RegExp(r'^[A-Z2-9]+$').hasMatch(code), isTrue,
              reason: 'Code "$code" contains invalid character');
        }
      });

      test('invite document has expiresAt 7 days from now', () async {
        final before = DateTime.now();
        final code = await repository.generateInviteCode();
        final after = DateTime.now();

        final inviteDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('invites')
            .doc(code)
            .get();

        final rawExpires = inviteDoc.data()!['expiresAt'];
        final expiresAt = rawExpires is DateTime
            ? rawExpires
            : (rawExpires as dynamic).toDate() as DateTime;

        final expectedMin = before.add(const Duration(days: 7));
        final expectedMax = after.add(const Duration(days: 7));

        expect(
          expiresAt.isAfter(expectedMin.subtract(const Duration(seconds: 1))),
          isTrue,
        );
        expect(
          expiresAt.isBefore(expectedMax.add(const Duration(seconds: 1))),
          isTrue,
        );
      });
    });
  });
}
