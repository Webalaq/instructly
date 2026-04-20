import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_motion.dart';
import '../../data/subscription_repository.dart';
import '../../domain/subscription.dart';

/// Override provider for testing — inject a custom [AppSubscription] to
/// bypass Firestore in tests and widget previews.
final subscriptionOverrideProvider =
    StateProvider<AppSubscription?>((ref) => null);

/// Gates [child] behind a subscription tier check.
///
/// If the user's subscription meets [requiredTier] and is active, [child] is
/// shown.  Otherwise [lockedChild] (or a default greyed-out overlay) is shown.
class FeatureGate extends ConsumerWidget {
  final SubscriptionTier requiredTier;
  final Widget child;
  final Widget? lockedChild;

  const FeatureGate({
    super.key,
    required this.requiredTier,
    required this.child,
    this.lockedChild,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Check override first (for testing / previews)
    final override = ref.watch(subscriptionOverrideProvider);

    if (override != null) {
      return _build(context, override);
    }

    final subAsync = ref.watch(SubscriptionRepository.subscriptionProvider);

    return subAsync.when(
      loading: () => child, // Optimistic: show child while loading
      error: (_, __) => child,
      data: (sub) => _build(context, sub),
    );
  }

  Widget _build(BuildContext context, AppSubscription sub) {
    if (sub.meetsRequirement(requiredTier)) {
      return child;
    }
    return _LockedOverlay(
      requiredTier: requiredTier,
      child: lockedChild ?? child,
    );
  }
}

class _LockedOverlay extends StatelessWidget {
  final SubscriptionTier requiredTier;
  final Widget child;

  const _LockedOverlay({required this.requiredTier, required this.child});

  String get _tierLabel {
    switch (requiredTier) {
      case SubscriptionTier.pro:
        return 'Pro';
      case SubscriptionTier.premium:
        return 'Premium';
      default:
        return 'Upgrade';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Upgrade to $_tierLabel to unlock this feature.',
            ),
            action: SnackBarAction(
              label: 'Upgrade',
              onPressed: () {
                // Navigate to paywall — use Navigator to avoid go_router dep
                // in this widget.  Callers can override via lockedChild if
                // they need a different action.
              },
            ),
          ),
        );
      },
      child: Stack(
        children: [
          // Greyed-out child
          AnimatedOpacity(
            opacity: 0.35,
            duration: AppMotion.normal,
            child: AbsorbPointer(child: child),
          ),

          // Lock badge
          Positioned(
            top: 8,
            right: 8,
            child: _TierBadge(label: _tierLabel),
          ),
        ],
      ),
    );
  }
}

class _TierBadge extends StatelessWidget {
  final String label;
  const _TierBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.lock_rounded, color: Colors.white, size: 12),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
