import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/dvsa_skills.dart';
import '../domain/skill.dart';

class ProgressRepository {
  ProgressRepository({
    required FirebaseFirestore firestore,
    required String instructorId,
  })  : _firestore = firestore,
        _instructorId = instructorId;

  final FirebaseFirestore _firestore;
  final String _instructorId;

  static final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return ProgressRepository(
      firestore: FirebaseFirestore.instance,
      instructorId: uid,
    );
  });

  CollectionReference<Map<String, dynamic>> _progressCollection(
          String studentId) =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('students')
          .doc(studentId)
          .collection('progress');

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /// Streams all skill documents for a student, ordered by name.
  Stream<List<Skill>> getProgress(String studentId) {
    return _progressCollection(studentId).snapshots().map(
          (snapshot) => snapshot.docs
              .map((doc) => Skill.fromMap(doc.data(), doc.id))
              .toList()
            ..sort((a, b) => a.name.compareTo(b.name)),
        );
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /// Creates or updates the rating for a skill.
  Future<void> updateSkillRating({
    required String studentId,
    required String skillId,
    required String skillName,
    required String category,
    required int rating,
    String? notes,
    bool isCustom = false,
  }) async {
    await _progressCollection(studentId).doc(skillId).set(
      {
        'name': skillName,
        'category': category,
        'rating': rating,
        'lastUpdated': FieldValue.serverTimestamp(),
        if (notes != null) 'instructorNotes': notes,
        'isCustom': isCustom,
      },
      SetOptions(merge: true),
    );
  }

  /// Batch-creates all 13 DVSA skills for the student. Uses merge so that
  /// existing rating values are preserved.
  Future<void> initializeDefaultSkills(String studentId) async {
    final collectionRef = _progressCollection(studentId);

    // Read existing docs to avoid overwriting ratings that are already set.
    final existing = await collectionRef.get();
    final existingIds = existing.docs.map((d) => d.id).toSet();

    final batch = _firestore.batch();

    for (final skill in DvsaSkills.allSkills) {
      if (existingIds.contains(skill.id)) continue;
      final docRef = collectionRef.doc(skill.id);
      batch.set(docRef, {
        'name': skill.name,
        'category': skill.category,
        'rating': 0,
        'isCustom': false,
      });
    }

    await batch.commit();
  }

  /// Adds a custom skill for the student.
  Future<void> addCustomSkill({
    required String studentId,
    required String name,
    required String category,
  }) async {
    await _progressCollection(studentId).add({
      'name': name,
      'category': category,
      'rating': 0,
      'isCustom': true,
      'lastUpdated': FieldValue.serverTimestamp(),
    });
  }
}
