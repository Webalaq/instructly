import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/instructor_profile.dart';

class TimeRangePicker extends StatelessWidget {
  const TimeRangePicker({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final TimeSlot value;
  final ValueChanged<TimeSlot> onChanged;

  TimeOfDay _parseTime(String time) {
    final parts = time.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Future<void> _pickTime({
    required BuildContext context,
    required String current,
    required ValueChanged<String> onPicked,
  }) async {
    final initial = _parseTime(current);
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );
    if (picked != null) {
      onPicked(_formatTime(picked));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _TimeDisplay(
          label: 'Start',
          time: value.start,
          onTap: () => _pickTime(
            context: context,
            current: value.start,
            onPicked: (newStart) => onChanged(
              TimeSlot(start: newStart, end: value.end),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            '–',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        _TimeDisplay(
          label: 'End',
          time: value.end,
          onTap: () => _pickTime(
            context: context,
            current: value.end,
            onPicked: (newEnd) => onChanged(
              TimeSlot(start: value.start, end: newEnd),
            ),
          ),
        ),
      ],
    );
  }
}

class _TimeDisplay extends StatelessWidget {
  const _TimeDisplay({
    required this.label,
    required this.time,
    required this.onTap,
  });

  final String label;
  final String time;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.backgroundAccent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              time,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
