import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../progress/domain/dvsa_skills.dart';
import '../data/lesson_logs_repository.dart';
import '../domain/lesson_log.dart';

/// Provider for a student's lesson logs stream.
final lessonLogsStreamProvider =
    StreamProvider.family<List<LessonLog>, String>((ref, studentId) {
  final repo = ref.watch(LessonLogsRepository.lessonLogsRepositoryProvider);
  return repo.getLogs(studentId);
});

class LessonLogsListScreen extends ConsumerWidget {
  const LessonLogsListScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  final String studentId;
  final String studentName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(lessonLogsStreamProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Lesson Logs'),
            Text(
              studentName,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton.icon(
              onPressed: () => context.push(
                '/students/$studentId/lesson-logs/new',
              ),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Log'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
                visualDensity: VisualDensity.compact,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ),
        ],
      ),
      body: logsAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading logs…'),
        error: (e, _) => Center(
          child: Text('Error: $e',
              style: const TextStyle(color: AppColors.error)),
        ),
        data: (logs) {
          if (logs.isEmpty) {
            return EmptyState(
              icon: Icons.library_books_outlined,
              title: 'No Lesson Logs Yet',
              subtitle:
                  'Start logging lessons to track progress over time.',
              actionLabel: 'Add First Log',
              onAction: () =>
                  context.push('/students/$studentId/lesson-logs/new'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: logs.length,
            itemBuilder: (context, index) {
              return _LessonLogCard(log: logs[index], index: index);
            },
          );
        },
      ),
    );
  }
}

class _LessonLogCard extends StatelessWidget {
  const _LessonLogCard({required this.log, required this.index});

  final LessonLog log;
  final int index;

  String _formatDuration(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h > 0 && m > 0) return '${h}h ${m}m';
    if (h > 0) return '${h}h';
    return '${m}m';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: AppMotion.normal +
          Duration(milliseconds: index * AppMotion.stagger.inMilliseconds),
      curve: AppMotion.enter,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, 16 * (1 - value)),
          child: child,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row: date + duration
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded,
                              size: 12, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            log.date.formatDateMedium,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundAccent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.timer_outlined,
                              size: 12, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            _formatDuration(log.duration),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Skills chips
                if (log.skillsCovered.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Icon(Icons.school_outlined,
                            size: 14, color: AppColors.textSecondary),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: log.skillsCovered.map((skillId) {
                            final skill = DvsaSkills.getById(skillId);
                            final label = skill?.name ?? skillId;
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primary
                                    .withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.25),
                                ),
                              ),
                              child: Text(
                                label,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ],

                // Notes
                if (log.notes != null && log.notes!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _NoteSection(
                    icon: Icons.notes_rounded,
                    label: 'Notes',
                    text: log.notes!,
                  ),
                ],

                // Areas to improve
                if (log.areasToImprove != null &&
                    log.areasToImprove!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _NoteSection(
                    icon: Icons.trending_up_rounded,
                    label: 'Areas to improve',
                    text: log.areasToImprove!,
                    iconColor: AppColors.ratingMedium,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NoteSection extends StatelessWidget {
  const _NoteSection({
    required this.icon,
    required this.label,
    required this.text,
    this.iconColor = AppColors.textSecondary,
  });

  final IconData icon;
  final String label;
  final String text;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(icon, size: 14, color: iconColor),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                text,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textPrimary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
