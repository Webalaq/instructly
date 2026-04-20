import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../progress/domain/dvsa_skills.dart';

/// Displays DVSA skills grouped by category as selectable [FilterChip]s.
class SkillChipSelector extends StatelessWidget {
  const SkillChipSelector({
    super.key,
    required this.selectedSkillIds,
    required this.onChanged,
  });

  final List<String> selectedSkillIds;
  final ValueChanged<List<String>> onChanged;

  void _toggle(String skillId) {
    final updated = List<String>.from(selectedSkillIds);
    if (updated.contains(skillId)) {
      updated.remove(skillId);
    } else {
      updated.add(skillId);
    }
    onChanged(updated);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: DvsaSkills.categories.entries.map((entry) {
        final categoryName = entry.key;
        final skills = entry.value;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 3,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      categoryName,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: skills.map((skill) {
                  final isSelected = selectedSkillIds.contains(skill.id);
                  return FilterChip(
                    label: Text(skill.name),
                    selected: isSelected,
                    onSelected: (_) => _toggle(skill.id),
                    labelStyle: theme.textTheme.bodySmall?.copyWith(
                      color: isSelected
                          ? AppColors.textOnPrimary
                          : AppColors.textPrimary,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                    backgroundColor: AppColors.backgroundAccent,
                    selectedColor: AppColors.primary,
                    checkmarkColor: AppColors.textOnPrimary,
                    side: BorderSide(
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.textSecondary.withValues(alpha: 0.3),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    showCheckmark: true,
                  );
                }).toList(),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
