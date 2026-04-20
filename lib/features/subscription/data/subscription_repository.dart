import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/subscription.dart';

class SubscriptionRepository {
  SubscriptionRepository({
    required FirebaseFirestore firestore,
    required String uid,
  })  : _firestore = firestore,
        _uid = uid;

  final FirebaseFirestore _firestore;
  final String _uid;

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  static final subscriptionRepositoryProvider =
      Provider<SubscriptionRepository>((ref) {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    return SubscriptionRepository(
      firestore: FirebaseFirestore.instance,
      uid: uid,
    );
  });

  static final subscriptionProvider = StreamProvider<AppSubscription>((ref) {
    final repo = ref.watch(subscriptionRepositoryProvider);
    return repo.watchSubscription();
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /// Watches the active/trialing subscription for the current user.
  /// Reads from `/customers/{uid}/subscriptions` where status in
  /// [active, trialing, past_due].
  Stream<AppSubscription> watchSubscription() {
    return _firestore
        .collection('customers')
        .doc(_uid)
        .collection('subscriptions')
        .where('status', whereIn: ['active', 'trialing', 'past_due'])
        .limit(1)
        .snapshots()
        .map((snapshot) {
          if (snapshot.docs.isEmpty) return AppSubscription.none;
          return AppSubscription.fromMap(snapshot.docs.first.data());
        });
  }

  /// Creates a Stripe checkout session and returns the checkout URL.
  ///
  /// Writes a doc to `/customers/{uid}/checkout_sessions` and polls for the
  /// `url` field to be populated by the Stripe Firebase Extension.
  Future<String> createCheckoutSession({
    required String priceId,
    required String successUrl,
    required String cancelUrl,
  }) async {
    final docRef = await _firestore
        .collection('customers')
        .doc(_uid)
        .collection('checkout_sessions')
        .add({
      'price': priceId,
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'mode': 'subscription',
    });

    // Wait for the Stripe extension to populate the `url` field
    final completer = Completer<String>();
    StreamSubscription<DocumentSnapshot>? sub;

    sub = docRef.snapshots().listen((snapshot) {
      final data = snapshot.data();
      if (data == null) return;

      final url = data['url'] as String?;
      final error = data['error'] as Map<String, dynamic>?;

      if (error != null) {
        sub?.cancel();
        completer.completeError(error['message'] ?? 'Checkout session error');
      } else if (url != null) {
        sub?.cancel();
        completer.complete(url);
      }
    });

    return completer.future;
  }
}
