import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/students_repository.dart';
import 'widgets/invite_dialog.dart';
import 'widgets/student_card.dart';

class StudentsListScreen extends ConsumerWidget {
  const StudentsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(StudentsRepository.studentsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            tooltip: 'Add Student',
            onPressed: () => context.push('/instructor/students/add'),
          ),
        ],
      ),
      body: studentsAsync.when(
        loading: () => const LoadingIndicator(),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (students) {
          if (students.isEmpty) {
            return EmptyState(
              icon: Icons.people_outline,
              title: 'No Students Yet',
              subtitle: 'Add your first student to get started.',
              actionLabel: 'Add Student',
              onAction: () => context.push('/instructor/students/add'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: students.length,
            itemBuilder: (context, index) {
              final student = students[index];
              return StudentCard(
                student: student,
                onTap: () => context.push('/instructor/students/${student.id}'),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final repo = ref.read(StudentsRepository.studentsRepositoryProvider);
          try {
            final code = await repo.generateInviteCode();
            if (context.mounted) {
              await showDialog<void>(
                context: context,
                builder: (_) => InviteDialog(code: code),
              );
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to generate invite code: $e')),
              );
            }
          }
        },
        icon: const Icon(Icons.link),
        label: const Text('Invite'),
      ),
    );
  }
}
