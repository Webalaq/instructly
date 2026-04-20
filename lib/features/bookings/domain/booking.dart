import 'package:cloud_firestore/cloud_firestore.dart';

enum BookingStatus { confirmed, cancelled, completed }

class Booking {
  final String id;
  final String studentId;
  final String studentName;
  final DateTime startTime;
  final DateTime endTime;
  final int duration; // minutes
  final String? pickupLocation;
  final BookingStatus status;
  final bool recurring;
  final String? recurringGroupId;
  final String? cancellationReason;
  final bool lateCancellation;
  final String? notes;

  const Booking({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.startTime,
    required this.endTime,
    required this.duration,
    this.pickupLocation,
    this.status = BookingStatus.confirmed,
    this.recurring = false,
    this.recurringGroupId,
    this.cancellationReason,
    this.lateCancellation = false,
    this.notes,
  });

  /// True when this booking is confirmed and its start time is in the future.
  bool get isUpcoming =>
      status == BookingStatus.confirmed && startTime.isAfter(DateTime.now());

  /// True when cancelling now would be within 24 hours of the start time.
  bool get wouldBeLateCancellation =>
      startTime.difference(DateTime.now()) < const Duration(hours: 24);

  factory Booking.fromMap(Map<String, dynamic> map, String id) {
    // Parse startTime from Timestamp or DateTime
    final startRaw = map['startTime'];
    final DateTime startTime;
    if (startRaw is Timestamp) {
      startTime = startRaw.toDate();
    } else if (startRaw is DateTime) {
      startTime = startRaw;
    } else {
      startTime = DateTime.now();
    }

    // Parse endTime from Timestamp or DateTime
    final endRaw = map['endTime'];
    final DateTime endTime;
    if (endRaw is Timestamp) {
      endTime = endRaw.toDate();
    } else if (endRaw is DateTime) {
      endTime = endRaw;
    } else {
      endTime = DateTime.now();
    }

    // Parse status with fallback to confirmed
    final statusStr = map['status'] as String? ?? '';
    final status = BookingStatus.values.firstWhere(
      (s) => s.name == statusStr,
      orElse: () => BookingStatus.confirmed,
    );

    return Booking(
      id: id,
      studentId: map['studentId'] as String,
      studentName: map['studentName'] as String,
      startTime: startTime,
      endTime: endTime,
      duration: map['duration'] as int,
      pickupLocation: map['pickupLocation'] as String?,
      status: status,
      recurring: map['recurring'] as bool? ?? false,
      recurringGroupId: map['recurringGroupId'] as String?,
      cancellationReason: map['cancellationReason'] as String?,
      lateCancellation: map['lateCancellation'] as bool? ?? false,
      notes: map['notes'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      if (pickupLocation != null) 'pickupLocation': pickupLocation,
      'status': status.name,
      'recurring': recurring,
      if (recurringGroupId != null) 'recurringGroupId': recurringGroupId,
      if (cancellationReason != null) 'cancellationReason': cancellationReason,
      'lateCancellation': lateCancellation,
      if (notes != null) 'notes': notes,
    };
  }
}
