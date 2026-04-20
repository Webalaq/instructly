import 'package:cloud_firestore/cloud_firestore.dart';

class Message {
  final String id;
  final String fromId;
  final String toId;

  /// "instructor" or "student"
  final String fromRole;
  final String text;
  final String? attachmentUrl;
  final DateTime createdAt;
  final bool read;

  const Message({
    required this.id,
    required this.fromId,
    required this.toId,
    required this.fromRole,
    required this.text,
    this.attachmentUrl,
    required this.createdAt,
    required this.read,
  });

  factory Message.fromMap(Map<String, dynamic> map, String id) {
    final createdAtRaw = map['createdAt'];
    final DateTime createdAt;
    if (createdAtRaw is Timestamp) {
      createdAt = createdAtRaw.toDate();
    } else if (createdAtRaw is DateTime) {
      createdAt = createdAtRaw;
    } else {
      createdAt = DateTime.now();
    }

    return Message(
      id: id,
      fromId: map['fromId'] as String,
      toId: map['toId'] as String,
      fromRole: map['fromRole'] as String,
      text: map['text'] as String,
      attachmentUrl: map['attachmentUrl'] as String?,
      createdAt: createdAt,
      read: map['read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'fromId': fromId,
      'toId': toId,
      'fromRole': fromRole,
      'text': text,
      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
      'createdAt': createdAt,
      'read': read,
    };
  }
}
