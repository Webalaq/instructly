import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_motion.dart';

/// A row of 5 numbered circles representing a 1–5 rating scale.
///
/// - Circles up to [rating] are filled; the rest are empty.
/// - Color: 1–2 → [AppColors.ratingLow], 3 → [AppColors.ratingMedium],
///   4–5 → [AppColors.ratingHigh].
/// - When [onChanged] is provided, the circles are tappable.
class RatingIndicator extends StatelessWidget {
  const RatingIndicator({
    super.key,
    required this.rating,
    this.onChanged,
    this.size = 32,
  });

  final int rating;
  final ValueChanged<int>? onChanged;
  final double size;

  Color _colorForIndex(int index) {
    // index is 1-based
    if (index <= 2) return AppColors.ratingLow;
    if (index == 3) return AppColors.ratingMedium;
    return AppColors.ratingHigh;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final index = i + 1; // 1-based
        final isFilled = index <= rating;
        final color = _colorForIndex(index);

        Widget circle = AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.standard,
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isFilled ? color : Colors.transparent,
            border: Border.all(
              color: isFilled
                  ? color
                  : AppColors.textSecondary.withValues(alpha: 0.3),
              width: 1.5,
            ),
          ),
          child: Center(
            child: AnimatedDefaultTextStyle(
              duration: AppMotion.fast,
              style: (theme.textTheme.labelSmall ?? const TextStyle()).copyWith(
                color: isFilled
                    ? AppColors.textOnPrimary
                    : AppColors.textSecondary.withValues(alpha: 0.5),
                fontWeight: FontWeight.w700,
                fontSize: size * 0.38,
              ),
              child: Text('$index'),
            ),
          ),
        );

        if (onChanged != null) {
          circle = GestureDetector(
            onTap: () {
              // Tapping the current rating resets to 0; otherwise sets to index.
              onChanged!(index == rating ? 0 : index);
            },
            child: circle,
          );
        }

        return Padding(
          padding: EdgeInsets.only(right: i < 4 ? size * 0.2 : 0),
          child: circle,
        );
      }),
    );
  }
}
