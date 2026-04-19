import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/student.dart';

class StudentCard extends StatelessWidget {
  const StudentCard({
    super.key,
    required this.student,
    required this.onTap,
  });

  final Student student;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.backgroundAccent,
          child: Text(
            student.name.isNotEmpty ? student.name[0].toUpperCase() : '?',
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(student.name),
        subtitle: student.phone != null ? Text(student.phone!) : null,
        trailing: _StatusBadge(status: student.status),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final StudentStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      StudentStatus.active => ('Active', AppColors.statusActive),
      StudentStatus.inactive => ('Inactive', AppColors.statusInactive),
      StudentStatus.passed => ('Passed', AppColors.statusPassed),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
