import 'package:cloud_firestore/cloud_firestore.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? relatedId;
  final DateTime createdAt;
  final bool read;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.relatedId,
    required this.createdAt,
    required this.read,
  });

  factory AppNotification.fromMap(Map<String, dynamic> map, String id) {
    final createdRaw = map['createdAt'];
    final DateTime createdAt;
    if (createdRaw is Timestamp) {
      createdAt = createdRaw.toDate();
    } else if (createdRaw is DateTime) {
      createdAt = createdRaw;
    } else {
      createdAt = DateTime.now();
    }

    return AppNotification(
      id: id,
      type: map['type'] as String? ?? 'message',
      title: map['title'] as String? ?? '',
      body: map['body'] as String? ?? '',
      relatedId: map['relatedId'] as String?,
      createdAt: createdAt,
      read: map['read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'type': type,
        'title': title,
        'body': body,
        if (relatedId != null) 'relatedId': relatedId,
        'createdAt': createdAt,
        'read': read,
      };

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        type: type,
        title: title,
        body: body,
        relatedId: relatedId,
        createdAt: createdAt,
        read: read ?? this.read,
      );
}
