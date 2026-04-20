import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/lesson_log.dart';

class LessonLogsRepository {
  LessonLogsRepository({
    required FirebaseFirestore firestore,
    required String instructorId,
  })  : _firestore = firestore,
        _instructorId = instructorId;

  final FirebaseFirestore _firestore;
  final String _instructorId;

  static final lessonLogsRepositoryProvider =
      Provider<LessonLogsRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return LessonLogsRepository(
      firestore: FirebaseFirestore.instance,
      instructorId: uid,
    );
  });

  CollectionReference<Map<String, dynamic>> _logsCollection(
          String studentId) =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('students')
          .doc(studentId)
          .collection('lessonLogs');

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /// Streams all lesson logs for [studentId], ordered by date descending.
  Stream<List<LessonLog>> getLogs(String studentId) {
    return _logsCollection(studentId)
        .orderBy('date', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => LessonLog.fromMap(doc.data(), doc.id))
              .toList(),
        );
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /// Creates a new lesson log entry.
  Future<void> addLog({
    required String studentId,
    String? bookingId,
    required DateTime date,
    required int duration,
    required List<String> skillsCovered,
    String? notes,
    String? areasToImprove,
  }) async {
    await _logsCollection(studentId).add({
      if (bookingId != null) 'bookingId': bookingId,
      'date': date,
      'duration': duration,
      'skillsCovered': skillsCovered,
      if (notes != null) 'notes': notes,
      if (areasToImprove != null) 'areasToImprove': areasToImprove,
    });
  }
}
