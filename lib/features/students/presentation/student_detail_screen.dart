import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/students_repository.dart';
import '../domain/student.dart';

class StudentDetailScreen extends ConsumerWidget {
  const StudentDetailScreen({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(StudentsRepository.studentsStreamProvider);

    return studentsAsync.when(
      loading: () => const Scaffold(body: LoadingIndicator()),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Student')),
        body: Center(child: Text('Error: $error')),
      ),
      data: (students) {
        final student = students.cast<Student?>().firstWhere(
              (s) => s?.id == studentId,
              orElse: () => null,
            );

        if (student == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Student')),
            body: const Center(child: Text('Student not found')),
          );
        }

        return _StudentDetailView(student: student, ref: ref);
      },
    );
  }
}

class _StudentDetailView extends StatelessWidget {
  const _StudentDetailView({required this.student, required this.ref});

  final Student student;
  final WidgetRef ref;

  Future<void> _updateStatus(BuildContext context, StudentStatus status) async {
    try {
      final repo = ref.read(StudentsRepository.studentsRepositoryProvider);
      await repo.updateStudentStatus(student.id, status.name);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(student.name),
          actions: [
            PopupMenuButton<StudentStatus>(
              icon: const Icon(Icons.more_vert),
              tooltip: 'Change status',
              onSelected: (status) => _updateStatus(context, status),
              itemBuilder: (_) => const [
                PopupMenuItem(
                  value: StudentStatus.active,
                  child: Text('Set Active'),
                ),
                PopupMenuItem(
                  value: StudentStatus.inactive,
                  child: Text('Set Inactive'),
                ),
                PopupMenuItem(
                  value: StudentStatus.passed,
                  child: Text('Mark as Passed'),
                ),
              ],
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Progress'),
              Tab(text: 'Lessons'),
              Tab(text: 'Mock Tests'),
            ],
          ),
        ),
        body: Column(
          children: [
            _StudentHeader(student: student),
            Expanded(
              child: TabBarView(
                children: [
                  _OverviewTab(student: student),
                  const _PlaceholderTab(text: 'Progress coming soon'),
                  const _PlaceholderTab(text: 'Lessons coming soon'),
                  const _PlaceholderTab(text: 'Mock Tests coming soon'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentHeader extends StatelessWidget {
  const _StudentHeader({required this.student});

  final Student student;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      color: AppColors.backgroundAccent,
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(
              student.name.isNotEmpty ? student.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student.name,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (student.phone != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.phone_outlined, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        student.phone!,
                        style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
                if (student.email != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.email_outlined, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          student.email!,
                          style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.student});

  final Student student;

  @override
  Widget build(BuildContext context) {
    final notes = student.notes;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Text(
        notes != null && notes.isNotEmpty ? notes : 'No notes yet',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
      ),
    );
  }
}
