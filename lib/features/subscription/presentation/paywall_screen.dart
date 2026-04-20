import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme/app_colors.dart';
import '../data/subscription_repository.dart';
import '../domain/subscription.dart';
import 'widgets/tier_card.dart';

// ---------------------------------------------------------------------------
// Price IDs — replace with real Stripe price IDs
// ---------------------------------------------------------------------------

const _basicPriceId = 'price_basic_monthly';
const _proPriceId = 'price_pro_monthly';
const _premiumPriceId = 'price_premium_monthly';

class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  String? _loadingTier; // 'basic' | 'pro' | 'premium'

  Future<void> _subscribe(String priceId, String tierKey) async {
    setState(() => _loadingTier = tierKey);
    try {
      final repo = ref.read(SubscriptionRepository.subscriptionRepositoryProvider);
      final url = await repo.createCheckoutSession(
        priceId: priceId,
        successUrl: 'https://instructly.app/success',
        cancelUrl: 'https://instructly.app/cancel',
      );
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not start checkout: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingTier = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subAsync = ref.watch(SubscriptionRepository.subscriptionProvider);
    final currentTier = subAsync.valueOrNull?.tier;
    final isActive = subAsync.valueOrNull?.isActive ?? false;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.close_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _PaywallHeader()),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Basic
                TierCard(
                  name: 'Basic',
                  price: '£6.99',
                  period: '/month',
                  features: const [
                    'Up to 10 students',
                    'Lesson booking & calendar',
                    'Basic progress tracking',
                    'Basic analytics',
                  ],
                  isCurrent: isActive &&
                      currentTier == SubscriptionTier.basic,
                  isLoading: _loadingTier == 'basic',
                  onSelect: () => _subscribe(_basicPriceId, 'basic'),
                ),
                const SizedBox(height: 16),

                // Pro
                TierCard(
                  name: 'Pro',
                  price: '£12.99',
                  period: '/month',
                  features: const [
                    'Unlimited students',
                    'Everything in Basic',
                    'Full progress tracking',
                    'Messaging with students',
                    'Lesson resources',
                  ],
                  isRecommended: true,
                  isCurrent: isActive &&
                      currentTier == SubscriptionTier.pro,
                  isLoading: _loadingTier == 'pro',
                  onSelect: () => _subscribe(_proPriceId, 'pro'),
                ),
                const SizedBox(height: 16),

                // Premium
                TierCard(
                  name: 'Premium',
                  price: '£19.99',
                  period: '/month',
                  features: const [
                    'Everything in Pro',
                    'Mock theory tests',
                    'Full analytics & insights',
                    'Priority support',
                    'Early access to new features',
                  ],
                  isCurrent: isActive &&
                      currentTier == SubscriptionTier.premium,
                  isLoading: _loadingTier == 'premium',
                  onSelect: () => _subscribe(_premiumPriceId, 'premium'),
                ),
                const SizedBox(height: 24),

                // Footer
                const _PaywallFooter(),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

class _PaywallHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
      child: Column(
        children: [
          // Hero icon
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.primary, AppColors.primaryLight],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(
              Icons.school_rounded,
              color: Colors.white,
              size: 36,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Upgrade Instructly',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Choose the plan that fits your\ndriving school needs.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

class _PaywallFooter extends StatelessWidget {
  const _PaywallFooter();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _FooterChip(icon: Icons.lock_outline_rounded, label: 'Secure checkout'),
            const SizedBox(width: 16),
            _FooterChip(icon: Icons.cancel_outlined, label: 'Cancel anytime'),
          ],
        ),
        const SizedBox(height: 12),
        const Text(
          'Prices include VAT. Billed monthly. Cancel any time.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _FooterChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FooterChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
