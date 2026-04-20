import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../domain/booking.dart';

class BookingsRepository {
  BookingsRepository({
    required FirebaseFirestore firestore,
    required String instructorId,
  })  : _firestore = firestore,
        _instructorId = instructorId;

  final FirebaseFirestore _firestore;
  final String _instructorId;
  final _uuid = const Uuid();

  CollectionReference<Map<String, dynamic>> get _bookingsCollection =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('bookings');

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  static final bookingsRepositoryProvider = Provider<BookingsRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return BookingsRepository(
      firestore: FirebaseFirestore.instance,
      instructorId: uid,
    );
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /// Returns a stream of bookings where startTime >= [start] AND startTime < [end],
  /// ordered by startTime ascending.
  Stream<List<Booking>> getBookingsForRange(DateTime start, DateTime end) {
    return _bookingsCollection
        .where('startTime', isGreaterThanOrEqualTo: start)
        .where('startTime', isLessThan: end)
        .orderBy('startTime')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Booking.fromMap(doc.data(), doc.id))
              .toList(),
        );
  }

  /// Returns a stream of all bookings for [studentId], ordered by startTime desc.
  Stream<List<Booking>> getBookingsForStudent(String studentId) {
    return _bookingsCollection
        .where('studentId', isEqualTo: studentId)
        .orderBy('startTime', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Booking.fromMap(doc.data(), doc.id))
              .toList(),
        );
  }

  /// Creates a single confirmed booking.
  Future<void> createBooking({
    required String studentId,
    required String studentName,
    required DateTime startTime,
    required DateTime endTime,
    required int duration,
    String? pickupLocation,
    String? notes,
  }) async {
    await _bookingsCollection.add({
      'studentId': studentId,
      'studentName': studentName,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      if (pickupLocation != null) 'pickupLocation': pickupLocation,
      'status': BookingStatus.confirmed.name,
      'recurring': false,
      'lateCancellation': false,
      if (notes != null) 'notes': notes,
    });
  }

  /// Creates [weeks] weekly recurring bookings starting at [startTime],
  /// all sharing the same recurringGroupId.
  Future<void> createRecurringBookings({
    required String studentId,
    required String studentName,
    required DateTime startTime,
    required int duration,
    String? pickupLocation,
    required int weeks,
    String? notes,
  }) async {
    final groupId = _uuid.v4();
    final batch = _firestore.batch();

    for (int i = 0; i < weeks; i++) {
      final weekStart = startTime.add(Duration(days: 7 * i));
      final weekEnd = weekStart.add(Duration(minutes: duration));
      final docRef = _bookingsCollection.doc();

      batch.set(docRef, {
        'studentId': studentId,
        'studentName': studentName,
        'startTime': weekStart,
        'endTime': weekEnd,
        'duration': duration,
        if (pickupLocation != null) 'pickupLocation': pickupLocation,
        'status': BookingStatus.confirmed.name,
        'recurring': true,
        'recurringGroupId': groupId,
        'lateCancellation': false,
        if (notes != null) 'notes': notes,
      });
    }

    await batch.commit();
  }

  /// Cancels a single booking, marking lateCancellation if within 24 hours.
  Future<void> cancelBooking(String bookingId, {String? reason}) async {
    final doc = await _bookingsCollection.doc(bookingId).get();
    final data = doc.data()!;

    final startRaw = data['startTime'];
    final DateTime startTime;
    if (startRaw is Timestamp) {
      startTime = startRaw.toDate();
    } else {
      startTime = startRaw as DateTime;
    }

    final isLate =
        startTime.difference(DateTime.now()) < const Duration(hours: 24);

    await _bookingsCollection.doc(bookingId).update({
      'status': BookingStatus.cancelled.name,
      'lateCancellation': isLate,
      if (reason != null) 'cancellationReason': reason,
    });
  }

  /// Cancels all future confirmed bookings in a recurring group.
  Future<void> cancelRecurringFuture(String recurringGroupId) async {
    final snapshot = await _bookingsCollection
        .where('recurringGroupId', isEqualTo: recurringGroupId)
        .where('status', isEqualTo: BookingStatus.confirmed.name)
        .get();

    final now = DateTime.now();
    final batch = _firestore.batch();

    for (final doc in snapshot.docs) {
      final startRaw = doc.data()['startTime'];
      final DateTime startTime;
      if (startRaw is Timestamp) {
        startTime = startRaw.toDate();
      } else {
        startTime = startRaw as DateTime;
      }

      if (startTime.isAfter(now)) {
        batch.update(doc.reference, {
          'status': BookingStatus.cancelled.name,
        });
      }
    }

    await batch.commit();
  }

  /// Marks a booking as completed.
  Future<void> completeBooking(String bookingId) async {
    await _bookingsCollection.doc(bookingId).update({
      'status': BookingStatus.completed.name,
    });
  }
}
