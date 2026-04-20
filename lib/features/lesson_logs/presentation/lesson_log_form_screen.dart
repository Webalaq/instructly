import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../shared/utils/date_helpers.dart';
import '../data/lesson_logs_repository.dart';
import 'widgets/skill_chip_selector.dart';

class LessonLogFormScreen extends ConsumerStatefulWidget {
  const LessonLogFormScreen({
    super.key,
    required this.studentId,
    this.bookingId,
  });

  final String studentId;
  final String? bookingId;

  @override
  ConsumerState<LessonLogFormScreen> createState() =>
      _LessonLogFormScreenState();
}

class _LessonLogFormScreenState extends ConsumerState<LessonLogFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _areasController = TextEditingController();

  DateTime _date = DateTime.now();
  int _duration = 60; // minutes
  List<String> _selectedSkillIds = [];
  bool _saving = false;

  @override
  void dispose() {
    _notesController.dispose();
    _areasController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: Theme.of(ctx).colorScheme.copyWith(
                primary: AppColors.primary,
              ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _date = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedSkillIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one skill covered.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final repo = ref.read(LessonLogsRepository.lessonLogsRepositoryProvider);
      await repo.addLog(
        studentId: widget.studentId,
        bookingId: widget.bookingId,
        date: _date,
        duration: _duration,
        skillsCovered: _selectedSkillIds,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        areasToImprove: _areasController.text.trim().isEmpty
            ? null
            : _areasController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lesson log saved.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving log: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Log Lesson'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ---- Date & Duration row ----
              Row(
                children: [
                  Expanded(
                    child: _SectionCard(
                      child: InkWell(
                        onTap: _pickDate,
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded,
                                      size: 14, color: AppColors.primary),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Date',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _date.formatDateMedium,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined,
                                  size: 14, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Text(
                                'Duration',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              value: _duration,
                              isExpanded: true,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                              items: [30, 45, 60, 90, 120].map((m) {
                                final label = m < 60
                                    ? '${m}m'
                                    : m % 60 == 0
                                        ? '${m ~/ 60}h'
                                        : '${m ~/ 60}h ${m % 60}m';
                                return DropdownMenuItem(
                                    value: m, child: Text(label));
                              }).toList(),
                              onChanged: (v) {
                                if (v != null) setState(() => _duration = v);
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // ---- Skills covered ----
              _SectionHeader(
                icon: Icons.school_outlined,
                label: 'Skills Covered',
              ),
              const SizedBox(height: 12),
              _SectionCard(
                child: SkillChipSelector(
                  selectedSkillIds: _selectedSkillIds,
                  onChanged: (ids) => setState(() => _selectedSkillIds = ids),
                ),
              ),

              const SizedBox(height: 20),

              // ---- Notes ----
              _SectionHeader(
                icon: Icons.notes_rounded,
                label: 'Lesson Notes',
              ),
              const SizedBox(height: 12),
              _SectionCard(
                child: TextFormField(
                  controller: _notesController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'How did the lesson go?',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ---- Areas to improve ----
              _SectionHeader(
                icon: Icons.trending_up_rounded,
                label: 'Areas to Improve',
              ),
              const SizedBox(height: 12),
              _SectionCard(
                child: TextFormField(
                  controller: _areasController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'What should the student focus on next?',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // ---- Save button ----
              SizedBox(
                width: double.infinity,
                child: AnimatedSwitcher(
                  duration: AppMotion.fast,
                  child: _saving
                      ? const SizedBox(
                          height: 50,
                          child: Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation(
                                  AppColors.primary),
                            ),
                          ),
                        )
                      : ElevatedButton.icon(
                          key: const ValueKey('save_btn'),
                          onPressed: _save,
                          icon: const Icon(Icons.check_rounded),
                          label: const Text('Save Lesson Log'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.textOnPrimary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Helper widgets
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
      child: child,
    );
  }
}
