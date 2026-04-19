class AppUser {
  final String uid;
  final String email;
  final String? displayName;
  final String? phone;
  final String role; // 'instructor' | 'student'
  final bool onboarded;
  final String? linkedInstructorId;
  final DateTime createdAt;

  const AppUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.phone,
    required this.role,
    this.onboarded = false,
    this.linkedInstructorId,
    required this.createdAt,
  });

  bool get isInstructor => role == 'instructor';
  bool get isStudent => role == 'student';

  factory AppUser.fromMap(Map<String, dynamic> map, String uid) {
    final createdAtRaw = map['createdAt'];
    final DateTime createdAt = createdAtRaw is DateTime
        ? createdAtRaw
        : (createdAtRaw as dynamic).toDate();

    return AppUser(
      uid: uid,
      email: map['email'] as String? ?? '',
      displayName: map['displayName'] as String?,
      phone: map['phone'] as String?,
      role: map['role'] as String? ?? 'student',
      onboarded: map['onboarded'] as bool? ?? false,
      linkedInstructorId: map['linkedInstructorId'] as String?,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      if (displayName != null) 'displayName': displayName,
      if (phone != null) 'phone': phone,
      'role': role,
      'onboarded': onboarded,
      if (linkedInstructorId != null) 'linkedInstructorId': linkedInstructorId,
      'createdAt': createdAt,
    };
  }

  AppUser copyWith({
    String? displayName,
    String? phone,
    bool? onboarded,
    String? linkedInstructorId,
  }) {
    return AppUser(
      uid: uid,
      email: email,
      displayName: displayName ?? this.displayName,
      phone: phone ?? this.phone,
      role: role,
      onboarded: onboarded ?? this.onboarded,
      linkedInstructorId: linkedInstructorId ?? this.linkedInstructorId,
      createdAt: createdAt,
    );
  }
}
