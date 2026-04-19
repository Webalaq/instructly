import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/instructor_profile.dart';

class OnboardingRepository {
  OnboardingRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Future<void> saveProfile({
    required String uid,
    required InstructorProfile profile,
  }) async {
    final batch = _firestore.batch();

    // Write instructor profile to /instructors/{uid}
    final instructorRef = _firestore.collection('instructors').doc(uid);
    batch.set(instructorRef, profile.toMap(), SetOptions(merge: true));

    // Update /users/{uid} with onboarded=true, displayName, phone
    final userRef = _firestore.collection('users').doc(uid);
    batch.set(
      userRef,
      {
        'onboarded': true,
        'displayName': profile.name,
        'phone': profile.phone,
      },
      SetOptions(merge: true),
    );

    await batch.commit();
  }
}

final onboardingRepositoryProvider = Provider<OnboardingRepository>((ref) {
  return OnboardingRepository(FirebaseFirestore.instance);
});
