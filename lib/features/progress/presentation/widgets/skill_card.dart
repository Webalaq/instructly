import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/skill.dart';
import 'rating_indicator.dart';

/// Card displaying a single skill with its rating and optional notes.
class SkillCard extends StatelessWidget {
  const SkillCard({
    super.key,
    required this.skill,
    this.onRatingChanged,
  });

  final Skill skill;

  /// Called when the user taps a rating circle. Null means read-only.
  final ValueChanged<int>? onRatingChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Name + custom badge
            Row(
              children: [
                Expanded(
                  child: Text(
                    skill.name,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                if (skill.isCustom) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: AppColors.secondary.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      'Custom',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.secondaryDark,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 10),

            // Rating indicator
            RatingIndicator(
              rating: skill.rating,
              onChanged: onRatingChanged,
              size: 30,
            ),

            const SizedBox(height: 6),

            // Rating label
            Text(
              skill.ratingLabel,
              style: theme.textTheme.bodySmall?.copyWith(
                color: _ratingLabelColor(skill.rating),
                fontWeight: FontWeight.w500,
              ),
            ),

            // Instructor notes
            if (skill.instructorNotes != null &&
                skill.instructorNotes!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.backgroundAccent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.note_outlined,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        skill.instructorNotes!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _ratingLabelColor(int rating) {
    if (rating == 0) return AppColors.textSecondary;
    if (rating <= 2) return AppColors.ratingLow;
    if (rating == 3) return AppColors.ratingMedium;
    return AppColors.ratingHigh;
  }
}
