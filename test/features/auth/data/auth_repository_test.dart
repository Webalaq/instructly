import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/auth/data/auth_repository.dart';
import 'package:instructly/features/auth/domain/app_user.dart';

void main() {
  group('AuthRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late MockFirebaseAuth mockAuth;
    late AuthRepository repo;

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      mockAuth = MockFirebaseAuth();
      repo = AuthRepository(auth: mockAuth, firestore: fakeFirestore);
    });

    group('registerInstructor', () {
      test('creates auth user and Firestore docs (users + instructors)',
          () async {
        final appUser = await repo.registerInstructor(
          email: 'instructor@example.com',
          password: 'password123',
        );

        expect(appUser, isNotNull);
        expect(appUser!.email, 'instructor@example.com');
        expect(appUser.role, 'instructor');
        expect(appUser.isInstructor, isTrue);
        expect(appUser.isStudent, isFalse);
        expect(appUser.onboarded, isFalse);

        // Verify auth user was created
        expect(mockAuth.currentUser, isNotNull);

        final uid = appUser.uid;

        // Verify /users/{uid} document was created
        final userDoc =
            await fakeFirestore.collection('users').doc(uid).get();
        expect(userDoc.exists, isTrue);
        expect(userDoc.data()!['role'], 'instructor');
        expect(userDoc.data()!['email'], 'instructor@example.com');

        // Verify /instructors/{uid} document was created
        final instructorDoc =
            await fakeFirestore.collection('instructors').doc(uid).get();
        expect(instructorDoc.exists, isTrue);
      });
    });

    group('registerStudent', () {
      test('creates auth user linked to instructor and marks invite claimed',
          () async {
        // Set up instructor with invite code in Firestore
        const instructorId = 'instructor-uid-123';
        const inviteCode = 'INVITE001';

        await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .set({'name': 'Test Instructor'});
        await fakeFirestore
            .collection('invites')
            .doc(inviteCode)
            .set({'instructorId': instructorId, 'claimed': false});

        final appUser = await repo.registerStudent(
          email: 'student@example.com',
          password: 'password123',
          inviteCode: inviteCode,
          instructorId: instructorId,
        );

        expect(appUser, isNotNull);
        expect(appUser!.email, 'student@example.com');
        expect(appUser.role, 'student');
        expect(appUser.isStudent, isTrue);
        expect(appUser.isInstructor, isFalse);
        expect(appUser.linkedInstructorId, instructorId);

        final uid = appUser.uid;

        // Verify /users/{uid} document was created
        final userDoc =
            await fakeFirestore.collection('users').doc(uid).get();
        expect(userDoc.exists, isTrue);
        expect(userDoc.data()!['role'], 'student');
        expect(userDoc.data()!['linkedInstructorId'], instructorId);

        // Verify invite was marked as claimed
        final inviteDoc =
            await fakeFirestore.collection('invites').doc(inviteCode).get();
        expect(inviteDoc.data()!['claimed'], isTrue);

        // Verify student record under instructor
        final studentDoc = await fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .doc(uid)
            .get();
        expect(studentDoc.exists, isTrue);
      });
    });

    group('signIn', () {
      test('returns AppUser for existing user', () async {
        // Pre-populate Firestore with user data
        const uid = 'existing-user-uid';
        const email = 'existing@example.com';

        // Create a mock auth with existing user
        final authWithUser = MockFirebaseAuth(
          mockUser: MockUser(uid: uid, email: email),
        );
        final repoWithUser =
            AuthRepository(auth: authWithUser, firestore: fakeFirestore);

        await fakeFirestore.collection('users').doc(uid).set({
          'email': email,
          'role': 'instructor',
          'onboarded': true,
          'createdAt': Timestamp.now(),
        });

        final appUser = await repoWithUser.signIn(
          email: email,
          password: 'password123',
        );

        expect(appUser, isNotNull);
        expect(appUser!.uid, uid);
        expect(appUser.email, email);
        expect(appUser.role, 'instructor');
        expect(appUser.onboarded, isTrue);
      });
    });

    group('signOut', () {
      test('signs out auth user', () async {
        // First sign in
        await repo.registerInstructor(
          email: 'test@example.com',
          password: 'password123',
        );
        expect(mockAuth.currentUser, isNotNull);

        await repo.signOut();
        expect(mockAuth.currentUser, isNull);
      });
    });

    group('getCurrentUser', () {
      test('returns AppUser from Firestore by uid', () async {
        const uid = 'test-uid';
        await fakeFirestore.collection('users').doc(uid).set({
          'email': 'user@example.com',
          'role': 'student',
          'onboarded': false,
          'createdAt': Timestamp.now(),
        });

        final appUser = await repo.getCurrentUser(uid: uid);

        expect(appUser, isNotNull);
        expect(appUser!.uid, uid);
        expect(appUser.email, 'user@example.com');
        expect(appUser.role, 'student');
      });

      test('returns null when user does not exist', () async {
        final appUser = await repo.getCurrentUser(uid: 'nonexistent-uid');
        expect(appUser, isNull);
      });
    });
  });

  group('AppUser', () {
    test('fromMap / toMap round-trip', () {
      final now = DateTime.now();
      final user = AppUser(
        uid: 'uid1',
        email: 'a@b.com',
        role: 'instructor',
        onboarded: true,
        createdAt: now,
      );

      final map = user.toMap();
      // Simulate what Firestore would store - use DateTime directly for simplicity
      final restored = AppUser.fromMap({...map, 'createdAt': now}, 'uid1');

      expect(restored.uid, 'uid1');
      expect(restored.email, 'a@b.com');
      expect(restored.role, 'instructor');
      expect(restored.onboarded, isTrue);
      expect(restored.isInstructor, isTrue);
      expect(restored.isStudent, isFalse);
    });

    test('copyWith updates specified fields', () {
      final user = AppUser(
        uid: 'uid1',
        email: 'a@b.com',
        role: 'student',
        onboarded: false,
        createdAt: DateTime.now(),
      );

      final updated = user.copyWith(
        displayName: 'John Doe',
        onboarded: true,
        phone: '555-1234',
        linkedInstructorId: 'inst-001',
      );

      expect(updated.displayName, 'John Doe');
      expect(updated.onboarded, isTrue);
      expect(updated.phone, '555-1234');
      expect(updated.linkedInstructorId, 'inst-001');
      expect(updated.uid, 'uid1'); // unchanged
      expect(updated.email, 'a@b.com'); // unchanged
    });
  });
}
