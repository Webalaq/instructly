import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/message.dart';

class MessagesRepository {
  MessagesRepository({
    required FirebaseFirestore firestore,
    required String instructorId,
    required String currentUserId,
  })  : _firestore = firestore,
        _instructorId = instructorId,
        _currentUserId = currentUserId;

  final FirebaseFirestore _firestore;
  final String _instructorId;
  final String _currentUserId;

  CollectionReference<Map<String, dynamic>> get _messagesCollection =>
      _firestore
          .collection('instructors')
          .doc(_instructorId)
          .collection('messages');

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  static final messagesRepositoryProvider = Provider<MessagesRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return MessagesRepository(
      firestore: FirebaseFirestore.instance,
      instructorId: uid,
      currentUserId: uid,
    );
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /// Returns a stream of messages in the conversation between the current user
  /// and [otherUserId], ordered by createdAt ascending.
  Stream<List<Message>> getConversation(String otherUserId) {
    // Firestore doesn't support OR queries across two fields easily, so we
    // fetch all messages involving either participant and filter client-side.
    return _messagesCollection
        .orderBy('createdAt')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Message.fromMap(doc.data(), doc.id))
          .where(
            (m) =>
                (m.fromId == _currentUserId && m.toId == otherUserId) ||
                (m.fromId == otherUserId && m.toId == _currentUserId),
          )
          .toList();
    });
  }

  /// Sends a message from the current user to [toId].
  Future<void> sendMessage({
    required String toId,
    required String text,
    required String fromRole,
  }) async {
    await _messagesCollection.add({
      'fromId': _currentUserId,
      'toId': toId,
      'fromRole': fromRole,
      'text': text,
      'createdAt': FieldValue.serverTimestamp(),
      'read': false,
    });
  }

  /// Marks a message as read.
  Future<void> markAsRead(String messageId) async {
    await _messagesCollection.doc(messageId).update({'read': true});
  }

  /// Returns a stream of the latest message per conversation partner.
  /// The map key is the other participant's userId.
  Stream<Map<String, Message>> getLatestMessages() {
    return _messagesCollection
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      final messages =
          snapshot.docs.map((doc) => Message.fromMap(doc.data(), doc.id));

      final latest = <String, Message>{};

      for (final message in messages) {
        final otherId = message.fromId == _currentUserId
            ? message.toId
            : (message.toId == _currentUserId ? message.fromId : null);

        if (otherId == null) continue;
        if (!latest.containsKey(otherId)) {
          latest[otherId] = message;
        }
      }

      return latest;
    });
  }
}
