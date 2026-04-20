import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class DayCell extends StatelessWidget {
  final DateTime day;
  final DateTime focusedDay;
  final bool isSelected;
  final bool isToday;
  final bool isAvailable;
  final int bookingCount;

  const DayCell({
    super.key,
    required this.day,
    required this.focusedDay,
    required this.isSelected,
    required this.isToday,
    required this.isAvailable,
    required this.bookingCount,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dots = bookingCount.clamp(0, 3);

    Color bgColor = Colors.transparent;
    Color textColor = AppColors.textPrimary;
    FontWeight fontWeight = FontWeight.w400;

    if (isSelected) {
      bgColor = AppColors.primary;
      textColor = AppColors.textOnPrimary;
      fontWeight = FontWeight.w700;
    } else if (isToday) {
      bgColor = AppColors.primary.withValues(alpha: 0.12);
      textColor = AppColors.primary;
      fontWeight = FontWeight.w700;
    } else if (!isAvailable) {
      textColor = AppColors.textSecondary.withValues(alpha: 0.4);
    }

    return Container(
      margin: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${day.day}',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: textColor,
              fontWeight: fontWeight,
            ),
          ),
          if (dots > 0) ...[
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(dots, (i) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  width: 5,
                  height: 5,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected
                        ? AppColors.textOnPrimary.withValues(alpha: 0.8)
                        : AppColors.secondary,
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }
}
