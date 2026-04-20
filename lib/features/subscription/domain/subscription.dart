import 'package:cloud_firestore/cloud_firestore.dart';

enum SubscriptionTier { basic, pro, premium }

enum SubscriptionStatus { active, trialing, pastDue, canceled, none }

class AppSubscription {
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  const AppSubscription({
    required this.tier,
    required this.status,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  // ---------------------------------------------------------------------------
  // Named constructor for no subscription
  // ---------------------------------------------------------------------------

  static const none = AppSubscription(
    tier: SubscriptionTier.basic,
    status: SubscriptionStatus.none,
  );

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------

  bool get isActive =>
      status == SubscriptionStatus.active ||
      status == SubscriptionStatus.trialing;

  bool get isTrial => status == SubscriptionStatus.trialing;

  // ---------------------------------------------------------------------------
  // Tier helpers
  // ---------------------------------------------------------------------------

  bool get _isProOrAbove =>
      tier == SubscriptionTier.pro || tier == SubscriptionTier.premium;
  bool get _isPremium => tier == SubscriptionTier.premium;

  bool get hasUnlimitedStudents => isActive && _isProOrAbove;
  bool get hasFullProgress => isActive && _isProOrAbove;
  bool get hasMockTests => isActive && _isPremium;
  bool get hasMessaging => isActive && _isProOrAbove;
  bool get hasBasicAnalytics => isActive;
  bool get hasFullAnalytics => isActive && _isPremium;
  bool get hasResources => isActive && _isProOrAbove;

  int get maxStudents {
    if (!isActive) return 10;
    if (tier == SubscriptionTier.basic) return 10;
    return 999999;
  }

  // ---------------------------------------------------------------------------
  // Tier ordering (for gate comparisons)
  // ---------------------------------------------------------------------------

  int get tierIndex => tier.index;

  bool meetsRequirement(SubscriptionTier required) {
    return isActive && tierIndex >= required.index;
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  factory AppSubscription.fromMap(Map<String, dynamic> map) {
    final tierStr = map['tier'] as String? ?? 'basic';
    final statusStr = map['status'] as String? ?? 'none';

    final tier = SubscriptionTier.values.firstWhere(
      (t) => t.name == tierStr,
      orElse: () => SubscriptionTier.basic,
    );

    final SubscriptionStatus status;
    switch (statusStr) {
      case 'active':
        status = SubscriptionStatus.active;
        break;
      case 'trialing':
        status = SubscriptionStatus.trialing;
        break;
      case 'past_due':
        status = SubscriptionStatus.pastDue;
        break;
      case 'canceled':
      case 'cancelled':
        status = SubscriptionStatus.canceled;
        break;
      default:
        status = SubscriptionStatus.none;
    }

    DateTime? currentPeriodEnd;
    final rawEnd = map['current_period_end'];
    if (rawEnd is Timestamp) {
      currentPeriodEnd = rawEnd.toDate();
    } else if (rawEnd is DateTime) {
      currentPeriodEnd = rawEnd;
    }

    return AppSubscription(
      tier: tier,
      status: status,
      currentPeriodEnd: currentPeriodEnd,
      cancelAtPeriodEnd: map['cancel_at_period_end'] as bool? ?? false,
    );
  }
}
