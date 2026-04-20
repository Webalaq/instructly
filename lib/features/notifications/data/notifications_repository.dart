import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/app_notification.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return NotificationsRepository(
      firestore: FirebaseFirestore.instance,
      userId: uid,
    );
  },
);

final notificationsStreamProvider =
    StreamProvider<List<AppNotification>>((ref) {
  final repo = ref.watch(notificationsRepositoryProvider);
  return repo.watchNotifications();
});

final unreadCountProvider = StreamProvider<int>((ref) {
  final repo = ref.watch(notificationsRepositoryProvider);
  return repo.watchUnreadCount();
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

class NotificationsRepository {
  NotificationsRepository({
    required FirebaseFirestore firestore,
    required String userId,
  })  : _firestore = firestore,
        _userId = userId;

  final FirebaseFirestore _firestore;
  final String _userId;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('users').doc(_userId).collection('notifications');

  /// Returns a stream of the most recent 50 notifications, newest first.
  Stream<List<AppNotification>> watchNotifications() {
    return _collection
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map(
          (snap) => snap.docs
              .map((doc) => AppNotification.fromMap(doc.data(), doc.id))
              .toList(),
        );
  }

  /// Marks a single notification as read.
  Future<void> markAsRead(String id) {
    return _collection.doc(id).update({'read': true});
  }

  /// Marks all unread notifications as read in a single batch.
  Future<void> markAllAsRead() async {
    final snap =
        await _collection.where('read', isEqualTo: false).limit(500).get();

    if (snap.docs.isEmpty) return;

    final batch = _firestore.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  /// Returns a stream that emits the number of unread notifications.
  Stream<int> watchUnreadCount() {
    return _collection
        .where('read', isEqualTo: false)
        .snapshots()
        .map((snap) => snap.docs.length);
  }
}
