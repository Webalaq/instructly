import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ---------------------------------------------------------------------------
// Background message handler (must be a top-level function)
// ---------------------------------------------------------------------------

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is already initialised in main.dart before this runs.
  debugPrint('FCM background: ${message.messageId}');
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final fcmServiceProvider = Provider<FcmService>((ref) => FcmService());

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Call once from main.dart (or from an app-level widget) after Firebase
  /// has been initialised. Registers the background handler, requests
  /// permissions, saves the token and wires up message listeners.
  Future<void> initialize({
    void Function(RemoteMessage)? onForegroundMessage,
    void Function(RemoteMessage?)? onNotificationTap,
  }) async {
    // Register background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (iOS / macOS / Web)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint(
      'FCM permission: ${settings.authorizationStatus}',
    );

    // Fetch and save current token
    await _saveToken();

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) {
      _persistToken(token);
    });

    // Foreground messages
    FirebaseMessaging.onMessage.listen((message) {
      debugPrint('FCM foreground: ${message.notification?.title}');
      onForegroundMessage?.call(message);
    });

    // App opened from a notification (background → foreground)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('FCM tap (background): ${message.notification?.title}');
      onNotificationTap?.call(message);
    });

    // App was terminated and opened via notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint(
        'FCM tap (terminated): ${initialMessage.notification?.title}',
      );
      onNotificationTap?.call(initialMessage);
    }
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  Future<void> _saveToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) await _persistToken(token);
    } catch (e) {
      debugPrint('FCM getToken error: $e');
    }
  }

  Future<void> _persistToken(String token) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    await _firestore.collection('users').doc(uid).set(
      {'fcmToken': token, 'fcmTokenUpdatedAt': FieldValue.serverTimestamp()},
      SetOptions(merge: true),
    );
    debugPrint('FCM token saved for uid=$uid');
  }

  /// Removes the stored FCM token (call on logout).
  Future<void> clearToken() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    await _messaging.deleteToken();
    await _firestore.collection('users').doc(uid).update({
      'fcmToken': FieldValue.delete(),
    });
  }
}
