import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/onboarding/data/onboarding_repository.dart';
import 'package:instructly/features/onboarding/domain/instructor_profile.dart';

void main() {
  group('OnboardingRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late OnboardingRepository repository;

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = OnboardingRepository(fakeFirestore);
    });

    test('saveProfile writes instructor document with profile data', () async {
      const uid = 'test-uid-123';
      const profile = InstructorProfile(
        name: 'John Smith',
        phone: '07700123456',
        lessonDurations: [60, 90],
        bufferMinutes: 15,
        teachingAreas: ['London', 'Surrey'],
        preferredTestCentres: ['Croydon', 'Sutton'],
        weeklyAvailability: {
          'mon': [TimeSlot(start: '09:00', end: '17:00')],
        },
      );

      await repository.saveProfile(uid: uid, profile: profile);

      final instructorDoc =
          await fakeFirestore.collection('instructors').doc(uid).get();

      expect(instructorDoc.exists, isTrue);
      final data = instructorDoc.data()!;
      expect(data['name'], equals('John Smith'));
      expect(data['phone'], equals('07700123456'));
      expect(data['lessonDurations'], equals([60, 90]));
      expect(data['bufferMinutes'], equals(15));
      expect(data['teachingAreas'], equals(['London', 'Surrey']));
      expect(data['preferredTestCentres'], equals(['Croydon', 'Sutton']));
      expect(data['weeklyAvailability']['mon'], isA<List>());
      expect(
        (data['weeklyAvailability']['mon'] as List).first['start'],
        equals('09:00'),
      );
    });

    test('saveProfile marks user as onboarded with displayName and phone',
        () async {
      const uid = 'test-uid-456';
      const profile = InstructorProfile(
        name: 'Jane Doe',
        phone: '+447911123456',
      );

      await repository.saveProfile(uid: uid, profile: profile);

      final userDoc =
          await fakeFirestore.collection('users').doc(uid).get();

      expect(userDoc.exists, isTrue);
      final data = userDoc.data()!;
      expect(data['onboarded'], isTrue);
      expect(data['displayName'], equals('Jane Doe'));
      expect(data['phone'], equals('+447911123456'));
    });

    test('saveProfile uses batch write — both documents saved atomically',
        () async {
      const uid = 'test-uid-789';
      const profile = InstructorProfile(
        name: 'Bob Builder',
        phone: '07123456789',
        lessonDurations: [60],
        bufferMinutes: 0,
      );

      await repository.saveProfile(uid: uid, profile: profile);

      final instructorSnapshot =
          await fakeFirestore.collection('instructors').doc(uid).get();
      final userSnapshot =
          await fakeFirestore.collection('users').doc(uid).get();

      // Both should exist after the batch commit
      expect(instructorSnapshot.exists, isTrue);
      expect(userSnapshot.exists, isTrue);
      expect(userSnapshot.data()!['onboarded'], isTrue);
      expect(instructorSnapshot.data()!['bufferMinutes'], equals(0));
    });

    test('saveProfile handles profile with no optional fields', () async {
      const uid = 'test-uid-minimal';
      const profile = InstructorProfile(
        name: 'Minimal User',
        phone: '07000000000',
      );

      await repository.saveProfile(uid: uid, profile: profile);

      final instructorDoc =
          await fakeFirestore.collection('instructors').doc(uid).get();
      final data = instructorDoc.data()!;

      expect(data['name'], equals('Minimal User'));
      expect(data['photoUrl'], isNull);
      expect(data['teachingAreas'], equals([]));
      expect(data['preferredTestCentres'], equals([]));
      expect(data['weeklyAvailability'], equals({}));
    });
  });
}
