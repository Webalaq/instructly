import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/instructor_profile.dart';
import '../widgets/time_range_picker.dart';

class AvailabilityStep extends StatelessWidget {
  const AvailabilityStep({
    super.key,
    required this.weeklyAvailability,
    required this.onAvailabilityChanged,
  });

  final Map<String, List<TimeSlot>> weeklyAvailability;
  final ValueChanged<Map<String, List<TimeSlot>>> onAvailabilityChanged;

  static const _days = [
    ('mon', 'Monday'),
    ('tue', 'Tuesday'),
    ('wed', 'Wednesday'),
    ('thu', 'Thursday'),
    ('fri', 'Friday'),
    ('sat', 'Saturday'),
    ('sun', 'Sunday'),
  ];

  static const _defaultSlot = TimeSlot(start: '09:00', end: '17:00');

  void _toggleDay(String dayKey, bool enabled) {
    final updated = Map<String, List<TimeSlot>>.from(weeklyAvailability);
    if (enabled) {
      updated[dayKey] = [_defaultSlot];
    } else {
      updated.remove(dayKey);
    }
    onAvailabilityChanged(updated);
  }

  void _updateSlot(String dayKey, TimeSlot slot) {
    final updated = Map<String, List<TimeSlot>>.from(weeklyAvailability);
    updated[dayKey] = [slot];
    onAvailabilityChanged(updated);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Weekly Availability',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Set the days and hours you are available to teach.',
          style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 24),
        ..._days.map((entry) {
          final dayKey = entry.$1;
          final dayLabel = entry.$2;
          final isEnabled = weeklyAvailability.containsKey(dayKey);
          final slot = isEnabled
              ? weeklyAvailability[dayKey]!.first
              : _defaultSlot;

          return _DayRow(
            dayLabel: dayLabel,
            isEnabled: isEnabled,
            slot: slot,
            onToggle: (value) => _toggleDay(dayKey, value),
            onSlotChanged: (newSlot) => _updateSlot(dayKey, newSlot),
          );
        }),
      ],
    );
  }
}

class _DayRow extends StatelessWidget {
  const _DayRow({
    required this.dayLabel,
    required this.isEnabled,
    required this.slot,
    required this.onToggle,
    required this.onSlotChanged,
  });

  final String dayLabel;
  final bool isEnabled;
  final TimeSlot slot;
  final ValueChanged<bool> onToggle;
  final ValueChanged<TimeSlot> onSlotChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isEnabled
              ? AppColors.backgroundAccent
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isEnabled
                ? AppColors.primary.withValues(alpha: 0.25)
                : Colors.grey.shade200,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 88,
              child: Text(
                dayLabel,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight:
                      isEnabled ? FontWeight.w600 : FontWeight.w400,
                  color: isEnabled
                      ? AppColors.textPrimary
                      : AppColors.textSecondary,
                ),
              ),
            ),
            Switch(
              value: isEnabled,
              onChanged: onToggle,
              activeThumbColor: AppColors.primary,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            const Spacer(),
            if (isEnabled)
              TimeRangePicker(
                value: slot,
                onChanged: onSlotChanged,
              )
            else
              const Text(
                'Unavailable',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
