import 'package:cloud_firestore/cloud_firestore.dart';

enum StudentStatus { active, inactive, passed }

class Student {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final StudentStatus status;
  final DateTime joinedAt;
  final String? inviteCode;
  final String? notes;

  const Student({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.status = StudentStatus.active,
    required this.joinedAt,
    this.inviteCode,
    this.notes,
  });

  bool get isActive => status == StudentStatus.active;

  factory Student.fromMap(Map<String, dynamic> map, String id) {
    // Parse joinedAt from Timestamp or DateTime
    final joinedAtRaw = map['joinedAt'];
    final DateTime joinedAt;
    if (joinedAtRaw is Timestamp) {
      joinedAt = joinedAtRaw.toDate();
    } else if (joinedAtRaw is DateTime) {
      joinedAt = joinedAtRaw;
    } else {
      joinedAt = DateTime.now();
    }

    // Parse status with fallback to active
    final statusStr = map['status'] as String? ?? '';
    final status = StudentStatus.values.firstWhere(
      (s) => s.name == statusStr,
      orElse: () => StudentStatus.active,
    );

    return Student(
      id: id,
      name: map['name'] as String,
      email: map['email'] as String?,
      phone: map['phone'] as String?,
      status: status,
      joinedAt: joinedAt,
      inviteCode: map['inviteCode'] as String?,
      notes: map['notes'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      'status': status.name,
      'joinedAt': joinedAt,
      if (inviteCode != null) 'inviteCode': inviteCode,
      if (notes != null) 'notes': notes,
    };
  }

  Student copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    StudentStatus? status,
    DateTime? joinedAt,
    String? inviteCode,
    String? notes,
  }) {
    return Student(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      status: status ?? this.status,
      joinedAt: joinedAt ?? this.joinedAt,
      inviteCode: inviteCode ?? this.inviteCode,
      notes: notes ?? this.notes,
    );
  }
}
