import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/subscription/domain/subscription.dart';
import 'package:instructly/features/subscription/presentation/widgets/feature_gate.dart';

void main() {
  group('FeatureGate', () {
    testWidgets('shows child when subscription meets required tier',
        (tester) async {
      // Pro tier with pro required → unlocked
      final proSubscription = AppSubscription(
        tier: SubscriptionTier.pro,
        status: SubscriptionStatus.active,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider
                .overrideWith((ref) => proSubscription),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FeatureGate(
                requiredTier: SubscriptionTier.pro,
                child: Text('Unlocked Content'),
              ),
            ),
          ),
        ),
      );

      await tester.pump();

      // Child is visible and not behind an AbsorbPointer (no locked overlay)
      expect(find.text('Unlocked Content'), findsOneWidget);
      // No lock badge present
      expect(find.byIcon(Icons.lock_rounded), findsNothing);
    });

    testWidgets('shows locked indicator when subscription is insufficient',
        (tester) async {
      // Basic tier with premium required → locked
      final basicSubscription = AppSubscription(
        tier: SubscriptionTier.basic,
        status: SubscriptionStatus.active,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider
                .overrideWith((ref) => basicSubscription),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FeatureGate(
                requiredTier: SubscriptionTier.premium,
                child: Text('Premium Content'),
              ),
            ),
          ),
        ),
      );

      await tester.pump();

      // Child is rendered but inside AbsorbPointer (greyed out)
      expect(find.text('Premium Content'), findsOneWidget);
      // Lock icon in tier badge is visible
      expect(find.byIcon(Icons.lock_rounded), findsOneWidget);
    });

    testWidgets('shows snackbar with upgrade prompt when locked area is tapped',
        (tester) async {
      final basicSubscription = AppSubscription(
        tier: SubscriptionTier.basic,
        status: SubscriptionStatus.active,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider
                .overrideWith((ref) => basicSubscription),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FeatureGate(
                requiredTier: SubscriptionTier.pro,
                child: SizedBox(
                    width: 200,
                    height: 100,
                    child: Text('Pro Content')),
              ),
            ),
          ),
        ),
      );

      await tester.pump();

      // Tap the GestureDetector (the Stack wrapper), not the absorbed child
      await tester.tap(find.byType(GestureDetector).first,
          warnIfMissed: false);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Snackbar should appear
      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('shows child when subscription is premium and basic required',
        (tester) async {
      // Premium tier with basic required → unlocked (higher tier satisfies lower)
      final premiumSubscription = AppSubscription(
        tier: SubscriptionTier.premium,
        status: SubscriptionStatus.active,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider
                .overrideWith((ref) => premiumSubscription),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FeatureGate(
                requiredTier: SubscriptionTier.basic,
                child: Text('Basic Content'),
              ),
            ),
          ),
        ),
      );

      await tester.pump();

      expect(find.text('Basic Content'), findsOneWidget);
      expect(find.byIcon(Icons.lock_rounded), findsNothing);
    });

    testWidgets('shows locked when subscription status is none even for basic tier',
        (tester) async {
      // No subscription → should be locked for pro
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider
                .overrideWith((ref) => AppSubscription.none),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: FeatureGate(
                requiredTier: SubscriptionTier.pro,
                child: Text('Pro Content'),
              ),
            ),
          ),
        ),
      );

      await tester.pump();

      expect(find.byIcon(Icons.lock_rounded), findsOneWidget);
    });
  });
}
