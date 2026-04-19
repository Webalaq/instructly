import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/student.dart';

class StudentsRepository {
  StudentsRepository({
    required FirebaseFirestore firestore,
    required String instructorId,
  })  : _firestore = firestore,
        _instructorId = instructorId;

  final FirebaseFirestore _firestore;
  final String _instructorId;

  CollectionReference<Map<String, dynamic>> get _studentsCollection =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('students');

  CollectionReference<Map<String, dynamic>> get _invitesCollection =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('invites');

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  static final studentsRepositoryProvider =
      Provider<StudentsRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return StudentsRepository(
      firestore: FirebaseFirestore.instance,
      instructorId: uid,
    );
  });

  static final studentsStreamProvider = StreamProvider<List<Student>>((ref) {
    final repo = ref.watch(studentsRepositoryProvider);
    return repo.getStudents();
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /// Returns a stream of students ordered by name.
  Stream<List<Student>> getStudents() {
    return _studentsCollection.orderBy('name').snapshots().map(
          (snapshot) => snapshot.docs
              .map((doc) => Student.fromMap(doc.data(), doc.id))
              .toList(),
        );
  }

  /// Returns a single student by id.
  Future<Student> getStudent(String studentId) async {
    final doc = await _studentsCollection.doc(studentId).get();
    if (!doc.exists || doc.data() == null) {
      throw Exception('Student not found: $studentId');
    }
    return Student.fromMap(doc.data()!, doc.id);
  }

  /// Creates a new student with status=active and joinedAt=now.
  Future<void> addStudent({
    required String name,
    String? email,
    String? phone,
  }) async {
    await _studentsCollection.add({
      'name': name,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      'status': StudentStatus.active.name,
      'joinedAt': DateTime.now(),
    });
  }

  /// Updates arbitrary fields on a student document.
  Future<void> updateStudent(String studentId, Map<String, dynamic> data) {
    return _studentsCollection.doc(studentId).update(data);
  }

  /// Convenience method to update only the status field.
  Future<void> updateStudentStatus(String studentId, String status) {
    return _studentsCollection.doc(studentId).update({'status': status});
  }

  /// Generates a 6-character invite code (uppercase letters + digits,
  /// excluding ambiguous characters: 0, O, I, 1, L).
  /// Creates a document in /instructors/{id}/invites/{code} with
  /// claimed=false and expiresAt=7 days from now.
  Future<String> generateInviteCode() async {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    final random = Random.secure();

    String code;
    bool exists;

    do {
      code = List.generate(
        6,
        (_) => chars[random.nextInt(chars.length)],
      ).join();

      final doc = await _invitesCollection.doc(code).get();
      exists = doc.exists;
    } while (exists);

    final expiresAt = DateTime.now().add(const Duration(days: 7));

    await _invitesCollection.doc(code).set({
      'claimed': false,
      'expiresAt': expiresAt,
      'instructorId': _instructorId,
      'createdAt': DateTime.now(),
    });

    return code;
  }
}
