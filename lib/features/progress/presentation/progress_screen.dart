import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/progress_repository.dart';
import '../domain/skill.dart';
import 'widgets/skill_card.dart';

/// Provider for a student's progress stream.
final progressStreamProvider =
    StreamProvider.family<List<Skill>, String>((ref, studentId) {
  final repo = ref.watch(ProgressRepository.progressRepositoryProvider);
  return repo.getProgress(studentId);
});

/// Displays a student's progress, grouped by skill category.
///
/// [editable] controls whether the rating circles are tappable.
class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({
    super.key,
    required this.studentId,
    this.editable = true,
  });

  final String studentId;
  final bool editable;

  Future<void> _onRatingChanged(
    BuildContext context,
    WidgetRef ref,
    Skill skill,
    int newRating,
  ) async {
    final repo = ref.read(ProgressRepository.progressRepositoryProvider);
    try {
      await repo.updateSkillRating(
        studentId: studentId,
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        rating: newRating,
        isCustom: skill.isCustom,
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update rating: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _initializeSkills(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(ProgressRepository.progressRepositoryProvider);
    try {
      await repo.initializeDefaultSkills(studentId);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initialize skills: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(progressStreamProvider(studentId));

    return progressAsync.when(
      loading: () => const LoadingIndicator(message: 'Loading progress…'),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
      data: (skills) {
        if (skills.isEmpty) {
          return EmptyState(
            icon: Icons.bar_chart_rounded,
            title: 'No Skills Yet',
            subtitle:
                'Initialize the default DVSA skills to start tracking progress.',
            actionLabel: 'Initialize Skills',
            onAction: () => _initializeSkills(context, ref),
          );
        }

        // Group by category label (display-friendly)
        final grouped = <String, List<Skill>>{};
        for (final skill in skills) {
          final label = _categoryLabel(skill.category);
          grouped.putIfAbsent(label, () => []).add(skill);
        }

        // Sort categories: Manoeuvres → Road Skills → Custom → others
        final order = ['Manoeuvres', 'Road Skills', 'Custom'];
        final sortedCategories = grouped.keys.toList()
          ..sort((a, b) {
            final ia = order.indexOf(a);
            final ib = order.indexOf(b);
            if (ia == -1 && ib == -1) return a.compareTo(b);
            if (ia == -1) return 1;
            if (ib == -1) return -1;
            return ia.compareTo(ib);
          });

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            for (final category in sortedCategories) ...[
              _CategoryHeader(category: category),
              const SizedBox(height: 10),
              for (int i = 0; i < grouped[category]!.length; i++)
                _AnimatedSkillCard(
                  skill: grouped[category]![i],
                  index: i,
                  editable: editable,
                  onRatingChanged: editable
                      ? (rating) => _onRatingChanged(
                          context, ref, grouped[category]![i], rating)
                      : null,
                ),
              const SizedBox(height: 16),
            ],
          ],
        );
      },
    );
  }

  String _categoryLabel(String category) {
    switch (category) {
      case 'manoeuvres':
        return 'Manoeuvres';
      case 'road_skills':
        return 'Road Skills';
      case 'custom':
        return 'Custom';
      default:
        return category;
    }
  }
}

// ---------------------------------------------------------------------------
// Helper widgets
// ---------------------------------------------------------------------------

class _CategoryHeader extends StatelessWidget {
  const _CategoryHeader({required this.category});

  final String category;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            category,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ],
      ),
    );
  }
}

class _AnimatedSkillCard extends StatelessWidget {
  const _AnimatedSkillCard({
    required this.skill,
    required this.index,
    required this.editable,
    this.onRatingChanged,
  });

  final Skill skill;
  final int index;
  final bool editable;
  final ValueChanged<int>? onRatingChanged;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: AppMotion.normal +
          Duration(
              milliseconds: index * AppMotion.stagger.inMilliseconds),
      curve: AppMotion.enter,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, 12 * (1 - value)),
          child: child,
        ),
      ),
      child: SkillCard(
        skill: skill,
        onRatingChanged: onRatingChanged,
      ),
    );
  }
}
