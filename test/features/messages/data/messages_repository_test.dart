import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/messages/data/messages_repository.dart';
import 'package:instructly/features/messages/domain/message.dart';

void main() {
  group('MessagesRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late MessagesRepository repository;
    const instructorId = 'instructor-123';
    const studentId = 'student-456';

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = MessagesRepository(
        firestore: fakeFirestore,
        instructorId: instructorId,
        currentUserId: instructorId,
      );
    });

    group('sendMessage', () {
      test('creates a message document with correct fields', () async {
        await repository.sendMessage(
          toId: studentId,
          text: 'Hello, how are you?',
          fromRole: 'instructor',
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .get();

        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['fromId'], instructorId);
        expect(data['toId'], studentId);
        expect(data['fromRole'], 'instructor');
        expect(data['text'], 'Hello, how are you?');
        expect(data['read'], isFalse);
      });

      test('creates multiple messages independently', () async {
        await repository.sendMessage(
          toId: studentId,
          text: 'First message',
          fromRole: 'instructor',
        );
        await repository.sendMessage(
          toId: studentId,
          text: 'Second message',
          fromRole: 'instructor',
        );

        final snapshot = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .get();

        expect(snapshot.docs.length, 2);
      });
    });

    group('getConversation', () {
      test('returns only messages between two participants', () async {
        const otherStudentId = 'student-789';

        // Message between instructor and student
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': studentId,
          'fromRole': 'instructor',
          'text': 'Hi there!',
          'createdAt': DateTime.now(),
          'read': false,
        });

        // Message from student to instructor
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': studentId,
          'toId': instructorId,
          'fromRole': 'student',
          'text': 'Hello instructor!',
          'createdAt': DateTime.now(),
          'read': false,
        });

        // Message with a different student (should be excluded)
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': otherStudentId,
          'fromRole': 'instructor',
          'text': 'Different conversation',
          'createdAt': DateTime.now(),
          'read': false,
        });

        final stream = repository.getConversation(studentId);
        final messages = await stream.first;

        expect(messages.length, 2);
        expect(messages, isA<List<Message>>());
        expect(
          messages.every(
            (m) =>
                (m.fromId == instructorId && m.toId == studentId) ||
                (m.fromId == studentId && m.toId == instructorId),
          ),
          isTrue,
        );
      });

      test('returns empty list when no messages exist', () async {
        final stream = repository.getConversation(studentId);
        final messages = await stream.first;

        expect(messages, isEmpty);
      });

      test('returns messages as Message objects', () async {
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': studentId,
          'fromRole': 'instructor',
          'text': 'Test message',
          'createdAt': DateTime.now(),
          'read': false,
        });

        final stream = repository.getConversation(studentId);
        final messages = await stream.first;

        expect(messages.first, isA<Message>());
        expect(messages.first.text, 'Test message');
        expect(messages.first.fromRole, 'instructor');
        expect(messages.first.read, isFalse);
      });
    });

    group('markAsRead', () {
      test('updates read field to true', () async {
        final docRef = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': studentId,
          'toId': instructorId,
          'fromRole': 'student',
          'text': 'Hello',
          'createdAt': DateTime.now(),
          'read': false,
        });

        await repository.markAsRead(docRef.id);

        final updatedDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .doc(docRef.id)
            .get();

        expect(updatedDoc.data()!['read'], isTrue);
      });
    });

    group('getLatestMessages', () {
      test('returns latest message per conversation partner', () async {
        const student2Id = 'student-789';
        final now = DateTime.now();

        // Two messages with student, one with student2
        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': studentId,
          'fromRole': 'instructor',
          'text': 'Old message',
          'createdAt': now.subtract(const Duration(minutes: 10)),
          'read': true,
        });

        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': studentId,
          'fromRole': 'instructor',
          'text': 'Latest message',
          'createdAt': now,
          'read': false,
        });

        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('messages')
            .add({
          'fromId': instructorId,
          'toId': student2Id,
          'fromRole': 'instructor',
          'text': 'Hello student 2',
          'createdAt': now,
          'read': false,
        });

        final stream = repository.getLatestMessages();
        final latest = await stream.first;

        expect(latest.keys.length, 2);
        expect(latest.containsKey(studentId), isTrue);
        expect(latest.containsKey(student2Id), isTrue);
        expect(latest[studentId]!.text, 'Latest message');
      });
    });
  });
}
