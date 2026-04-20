import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../features/students/data/students_repository.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/messages_repository.dart';
import '../domain/message.dart';
import 'chat_screen.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(StudentsRepository.studentsStreamProvider);
    final repo = ref.watch(MessagesRepository.messagesRepositoryProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Messages',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        elevation: 0,
      ),
      body: studentsAsync.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (students) {
          if (students.isEmpty) {
            return const EmptyState(
              icon: Icons.chat_bubble_outline_rounded,
              title: 'No conversations yet',
              subtitle: 'Add students to start messaging them.',
            );
          }

          return StreamBuilder<Map<String, Message>>(
            stream: repo.getLatestMessages(),
            builder: (context, snapshot) {
              final latestMessages = snapshot.data ?? {};

              // Sort students: those with messages first (most recent), then rest
              final studentsWithMessages = students
                  .where((s) => latestMessages.containsKey(s.id))
                  .toList()
                ..sort((a, b) {
                  final aTime = latestMessages[a.id]!.createdAt;
                  final bTime = latestMessages[b.id]!.createdAt;
                  return bTime.compareTo(aTime);
                });
              final studentsWithoutMessages = students
                  .where((s) => !latestMessages.containsKey(s.id))
                  .toList()
                ..sort((a, b) => a.name.compareTo(b.name));

              final allStudents = [
                ...studentsWithMessages,
                ...studentsWithoutMessages,
              ];

              return ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: allStudents.length,
                separatorBuilder: (_, __) => const Divider(
                  height: 1,
                  indent: 72,
                  endIndent: 16,
                  color: Color(0xFFF0F0F0),
                ),
                itemBuilder: (context, index) {
                  final student = allStudents[index];
                  final lastMsg = latestMessages[student.id];
                  return _ConversationTile(
                    studentId: student.id,
                    studentName: student.name,
                    lastMessage: lastMsg,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final String studentId;
  final String studentName;
  final Message? lastMessage;

  const _ConversationTile({
    required this.studentId,
    required this.studentName,
    this.lastMessage,
  });

  String get _timeLabel {
    if (lastMessage == null) return '';
    final now = DateTime.now();
    final dt = lastMessage!.createdAt;
    if (dt.isSameDay(now)) return dt.formatTime;
    if (dt.isSameDay(now.subtract(const Duration(days: 1)))) return 'Yesterday';
    return dt.formatDateShort;
  }

  @override
  Widget build(BuildContext context) {
    final initial =
        studentName.isNotEmpty ? studentName[0].toUpperCase() : '?';
    final hasUnread = lastMessage != null && !lastMessage!.read &&
        lastMessage!.toId != lastMessage!.fromId;

    return InkWell(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ChatScreen(
            studentId: studentId,
            studentName: studentName,
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                initial,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Name + preview
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        studentName,
                        style: TextStyle(
                          fontWeight: hasUnread
                              ? FontWeight.w700
                              : FontWeight.w600,
                          fontSize: 15,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (lastMessage != null)
                        Text(
                          _timeLabel,
                          style: TextStyle(
                            fontSize: 12,
                            color: hasUnread
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: hasUnread
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  if (lastMessage != null)
                    Text(
                      lastMessage!.text,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: hasUnread
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                        fontWeight: hasUnread
                            ? FontWeight.w500
                            : FontWeight.normal,
                      ),
                    )
                  else
                    const Text(
                      'No messages yet',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),

            // Unread dot
            if (hasUnread) ...[
              const SizedBox(width: 8),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
