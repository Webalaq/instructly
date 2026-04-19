import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/students/domain/student.dart';

void main() {
  group('Student', () {
    final baseDateTime = DateTime(2024, 1, 15, 10, 30);

    final baseMap = {
      'name': 'Alice Smith',
      'email': 'alice@example.com',
      'phone': '07700123456',
      'status': 'active',
      'joinedAt': baseDateTime,
      'inviteCode': 'ABC123',
      'notes': 'First lesson booked',
    };

    group('fromMap', () {
      test('creates Student correctly from map with all fields', () {
        final student = Student.fromMap(baseMap, 'student-id-1');

        expect(student.id, 'student-id-1');
        expect(student.name, 'Alice Smith');
        expect(student.email, 'alice@example.com');
        expect(student.phone, '07700123456');
        expect(student.status, StudentStatus.active);
        expect(student.joinedAt, baseDateTime);
        expect(student.inviteCode, 'ABC123');
        expect(student.notes, 'First lesson booked');
      });

      test('creates Student with null optional fields', () {
        final minimalMap = {
          'name': 'Bob Jones',
          'status': 'active',
          'joinedAt': baseDateTime,
        };

        final student = Student.fromMap(minimalMap, 'student-id-2');

        expect(student.id, 'student-id-2');
        expect(student.name, 'Bob Jones');
        expect(student.email, isNull);
        expect(student.phone, isNull);
        expect(student.inviteCode, isNull);
        expect(student.notes, isNull);
      });

      test('handles Timestamp for joinedAt', () {
        final timestamp = Timestamp.fromDate(baseDateTime);
        final mapWithTimestamp = {
          ...baseMap,
          'joinedAt': timestamp,
        };

        final student = Student.fromMap(mapWithTimestamp, 'student-id-3');

        expect(student.joinedAt, baseDateTime);
      });

      test('handles DateTime for joinedAt', () {
        final student = Student.fromMap(baseMap, 'student-id-4');

        expect(student.joinedAt, isA<DateTime>());
        expect(student.joinedAt, baseDateTime);
      });
    });

    group('toMap', () {
      test('serializes correctly with all fields', () {
        final student = Student(
          id: 'student-id-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          phone: '07700123456',
          status: StudentStatus.active,
          joinedAt: baseDateTime,
          inviteCode: 'ABC123',
          notes: 'First lesson booked',
        );

        final map = student.toMap();

        expect(map['name'], 'Alice Smith');
        expect(map['email'], 'alice@example.com');
        expect(map['phone'], '07700123456');
        expect(map['status'], 'active');
        expect(map['joinedAt'], baseDateTime);
        expect(map['inviteCode'], 'ABC123');
        expect(map['notes'], 'First lesson booked');
        // id should NOT be in toMap
        expect(map.containsKey('id'), isFalse);
      });

      test('omits null optional fields from map', () {
        final student = Student(
          id: 'student-id-2',
          name: 'Bob Jones',
          status: StudentStatus.inactive,
          joinedAt: baseDateTime,
        );

        final map = student.toMap();

        expect(map['name'], 'Bob Jones');
        expect(map['status'], 'inactive');
        expect(map.containsKey('email'), isFalse);
        expect(map.containsKey('phone'), isFalse);
        expect(map.containsKey('inviteCode'), isFalse);
        expect(map.containsKey('notes'), isFalse);
      });
    });

    group('status parsing', () {
      test('parses active status', () {
        final student = Student.fromMap({...baseMap, 'status': 'active'}, 'id');
        expect(student.status, StudentStatus.active);
      });

      test('parses inactive status', () {
        final student =
            Student.fromMap({...baseMap, 'status': 'inactive'}, 'id');
        expect(student.status, StudentStatus.inactive);
      });

      test('parses passed status', () {
        final student = Student.fromMap({...baseMap, 'status': 'passed'}, 'id');
        expect(student.status, StudentStatus.passed);
      });

      test('falls back to active for unknown status', () {
        final student =
            Student.fromMap({...baseMap, 'status': 'unknown_value'}, 'id');
        expect(student.status, StudentStatus.active);
      });

      test('falls back to active when status is missing', () {
        final mapWithoutStatus = Map<String, dynamic>.from(baseMap)
          ..remove('status');
        final student = Student.fromMap(mapWithoutStatus, 'id');
        expect(student.status, StudentStatus.active);
      });
    });

    group('isActive getter', () {
      test('returns true when status is active', () {
        final student = Student(
          id: 'id',
          name: 'Test',
          status: StudentStatus.active,
          joinedAt: baseDateTime,
        );
        expect(student.isActive, isTrue);
      });

      test('returns false when status is inactive', () {
        final student = Student(
          id: 'id',
          name: 'Test',
          status: StudentStatus.inactive,
          joinedAt: baseDateTime,
        );
        expect(student.isActive, isFalse);
      });

      test('returns false when status is passed', () {
        final student = Student(
          id: 'id',
          name: 'Test',
          status: StudentStatus.passed,
          joinedAt: baseDateTime,
        );
        expect(student.isActive, isFalse);
      });
    });

    group('copyWith', () {
      test('returns updated Student with specified fields changed', () {
        final original = Student(
          id: 'id-1',
          name: 'Original Name',
          email: 'original@example.com',
          status: StudentStatus.active,
          joinedAt: baseDateTime,
        );

        final updated = original.copyWith(
          name: 'Updated Name',
          status: StudentStatus.passed,
          notes: 'Passed test!',
        );

        expect(updated.id, 'id-1'); // unchanged
        expect(updated.name, 'Updated Name');
        expect(updated.email, 'original@example.com'); // unchanged
        expect(updated.status, StudentStatus.passed);
        expect(updated.notes, 'Passed test!');
      });
    });
  });
}
