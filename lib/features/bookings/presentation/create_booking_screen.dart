import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../onboarding/domain/instructor_profile.dart';
import '../../students/data/students_repository.dart';
import '../../students/domain/student.dart';
import '../data/bookings_repository.dart';
import '../domain/availability.dart';
import '../domain/booking.dart';
import 'calendar_screen.dart';
import 'widgets/time_slot_picker.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _instructorProfileProvider =
    FutureProvider<InstructorProfile?>((ref) async {
  final uid = FirebaseAuth.instance.currentUser?.uid;
  if (uid == null) return null;
  final doc = await FirebaseFirestore.instance
      .collection('instructors')
      .doc(uid)
      .get();
  if (!doc.exists || doc.data() == null) return null;
  final data = doc.data()!;

  // Parse weeklyAvailability
  final rawAvail =
      (data['weeklyAvailability'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(
              k,
              (v as List)
                  .map((s) => TimeSlot.fromMap(Map<String, dynamic>.from(s)))
                  .toList(),
            ),
          ) ??
          {};

  return InstructorProfile(
    name: data['name'] as String? ?? '',
    phone: data['phone'] as String? ?? '',
    lessonDurations: (data['lessonDurations'] as List?)
            ?.map((e) => e as int)
            .toList() ??
        [60],
    bufferMinutes: data['bufferMinutes'] as int? ?? 15,
    weeklyAvailability: rawAvail,
  );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class CreateBookingScreen extends ConsumerStatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  ConsumerState<CreateBookingScreen> createState() =>
      _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  Student? _selectedStudent;
  DateTime? _selectedDate;
  int _selectedDuration = 60;
  DateTime? _selectedSlot;
  final _pickupController = TextEditingController();
  final _notesController = TextEditingController();
  bool _recurring = false;
  int _recurringWeeks = 4;
  bool _submitting = false;

  @override
  void dispose() {
    _pickupController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _selectedSlot = null; // reset slot when date changes
      });
    }
  }

  List<DateTime> _computeSlots(
    InstructorProfile? profile,
    List<Booking> existingBookings,
  ) {
    if (profile == null || _selectedDate == null) return [];
    final calc = AvailabilityCalculator(
      weeklyAvailability: profile.weeklyAvailability,
      bufferMinutes: profile.bufferMinutes,
    );
    return calc.getAvailableSlots(
      date: _selectedDate!,
      existingBookings: existingBookings,
      duration: _selectedDuration,
    );
  }

  Future<void> _submit(
    BuildContext context,
    InstructorProfile? profile,
  ) async {
    if (_selectedStudent == null ||
        _selectedDate == null ||
        _selectedSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please fill in all required fields.')),
      );
      return;
    }

    setState(() => _submitting = true);

    final repo = ref.read(BookingsRepository.bookingsRepositoryProvider);
    final startTime = _selectedSlot!;
    final endTime = startTime.add(Duration(minutes: _selectedDuration));
    final pickup = _pickupController.text.trim().isEmpty
        ? null
        : _pickupController.text.trim();
    final notes = _notesController.text.trim().isEmpty
        ? null
        : _notesController.text.trim();

    try {
      if (_recurring) {
        await repo.createRecurringBookings(
          studentId: _selectedStudent!.id,
          studentName: _selectedStudent!.name,
          startTime: startTime,
          duration: _selectedDuration,
          pickupLocation: pickup,
          weeks: _recurringWeeks,
          notes: notes,
        );
      } else {
        await repo.createBooking(
          studentId: _selectedStudent!.id,
          studentName: _selectedStudent!.name,
          startTime: startTime,
          endTime: endTime,
          duration: _selectedDuration,
          pickupLocation: pickup,
          notes: notes,
        );
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_recurring
                ? 'Recurring lessons booked for $_recurringWeeks weeks.'
                : 'Lesson booked successfully.'),
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profileAsync = ref.watch(_instructorProfileProvider);
    final studentsAsync = ref.watch(StudentsRepository.studentsStreamProvider);

    // Load existing bookings for the selected date to compute available slots.
    final rangeKey = _selectedDate != null
        ? (
            start: _selectedDate!.startOfDay,
            end: _selectedDate!.endOfDay.add(const Duration(seconds: 1)),
          )
        : null;
    final dayBookingsAsync = rangeKey != null
        ? ref.watch(bookingsForRangeProvider(rangeKey))
        : null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Book a Lesson'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: profileAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading profile…'),
        error: (e, _) =>
            Center(child: Text('Error: $e')),
        data: (profile) {
          return studentsAsync.when(
            loading: () =>
                const LoadingIndicator(message: 'Loading students…'),
            error: (e, _) =>
                Center(child: Text('Error: $e')),
            data: (students) {
              final activeStudents =
                  students.where((s) => s.isActive).toList();

              final dayBookings = dayBookingsAsync?.asData?.value ?? [];
              final availableSlots =
                  _computeSlots(profile, dayBookings);
              final durations = profile?.lessonDurations ?? [60];

              return SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ---- Student ----
                    _SectionLabel(label: 'Student', icon: Icons.person_outline_rounded),
                    const SizedBox(height: 8),
                    _FormCard(
                      child: DropdownButton<Student>(
                        value: _selectedStudent,
                        isExpanded: true,
                        underline: const SizedBox.shrink(),
                        hint: const Text('Select a student'),
                        items: activeStudents
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(s.name),
                              ),
                            )
                            .toList(),
                        onChanged: (s) =>
                            setState(() => _selectedStudent = s),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ---- Duration ----
                    _SectionLabel(
                        label: 'Duration', icon: Icons.timer_outlined),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: durations.map((d) {
                        final selected = d == _selectedDuration;
                        final label = d >= 60
                            ? d % 60 == 0
                                ? '${d ~/ 60}h'
                                : '${d ~/ 60}h ${d % 60}m'
                            : '${d}m';
                        return ChoiceChip(
                          label: Text(label),
                          selected: selected,
                          onSelected: (_) {
                            setState(() {
                              _selectedDuration = d;
                              _selectedSlot = null;
                            });
                          },
                          selectedColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: selected
                                ? AppColors.textOnPrimary
                                : AppColors.textPrimary,
                            fontWeight: selected
                                ? FontWeight.w700
                                : FontWeight.w400,
                          ),
                          backgroundColor: AppColors.backgroundAccent,
                          side: BorderSide(
                            color: selected
                                ? AppColors.primary
                                : AppColors.textSecondary
                                    .withValues(alpha: 0.2),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 20),

                    // ---- Date ----
                    _SectionLabel(
                        label: 'Date', icon: Icons.calendar_today_outlined),
                    const SizedBox(height: 8),
                    _FormCard(
                      onTap: () => _pickDate(context),
                      child: Row(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 18,
                            color: _selectedDate != null
                                ? AppColors.primary
                                : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _selectedDate != null
                                ? _selectedDate!.formatDateFull
                                : 'Choose a date',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: _selectedDate != null
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ---- Time Slot ----
                    _SectionLabel(
                        label: 'Time Slot', icon: Icons.access_time_rounded),
                    const SizedBox(height: 8),
                    if (_selectedDate == null)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          'Select a date to see available slots.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary),
                        ),
                      )
                    else if (dayBookingsAsync == null ||
                        dayBookingsAsync.isLoading)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: SizedBox(
                          height: 24,
                          child: LoadingIndicator(),
                        ),
                      )
                    else
                      TimeSlotPicker(
                        slots: availableSlots,
                        selectedSlot: _selectedSlot,
                        onSelected: (slot) =>
                            setState(() => _selectedSlot = slot),
                      ),

                    const SizedBox(height: 20),

                    // ---- Pickup location ----
                    _SectionLabel(
                        label: 'Pickup Location (optional)',
                        icon: Icons.location_on_outlined),
                    const SizedBox(height: 8),
                    _FormCard(
                      child: TextField(
                        controller: _pickupController,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'e.g. 12 Main Street',
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ---- Notes ----
                    _SectionLabel(
                        label: 'Notes (optional)',
                        icon: Icons.notes_rounded),
                    const SizedBox(height: 8),
                    _FormCard(
                      child: TextField(
                        controller: _notesController,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Any additional notes…',
                          contentPadding: EdgeInsets.zero,
                        ),
                        maxLines: 3,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ---- Recurring toggle ----
                    _FormCard(
                      child: Column(
                        children: [
                          SwitchListTile.adaptive(
                            contentPadding: EdgeInsets.zero,
                            value: _recurring,
                            onChanged: (v) =>
                                setState(() => _recurring = v),
                            title: Row(
                              children: [
                                const Icon(
                                  Icons.repeat_rounded,
                                  size: 18,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Recurring weekly',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            activeTrackColor: AppColors.primary,
                            activeThumbColor: AppColors.textOnPrimary,
                          ),
                          if (_recurring) ...[
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Text(
                                  'Number of weeks:',
                                  style: theme.textTheme.bodyMedium,
                                ),
                                const Spacer(),
                                IconButton(
                                  onPressed: _recurringWeeks > 1
                                      ? () => setState(
                                          () => _recurringWeeks--)
                                      : null,
                                  icon: const Icon(Icons.remove_circle_outline),
                                  color: AppColors.primary,
                  ),
                                Text(
                                  '$_recurringWeeks',
                                  style:
                                      theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                IconButton(
                                  onPressed: _recurringWeeks < 52
                                      ? () => setState(
                                          () => _recurringWeeks++)
                                      : null,
                                  icon: const Icon(Icons.add_circle_outline),
                                  color: AppColors.primary,
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ---- Submit ----
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitting
                            ? null
                            : () => _submit(context, profile),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.textOnPrimary,
                          padding:
                              const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          disabledBackgroundColor:
                              AppColors.primary.withValues(alpha: 0.5),
                        ),
                        child: _submitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _recurring
                                    ? 'Book $_recurringWeeks Lessons'
                                    : 'Book Lesson',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Helper widgets
// ---------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  final String label;
  final IconData icon;

  const _SectionLabel({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              ),
        ),
      ],
    );
  }
}

class _FormCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;

  const _FormCard({required this.child, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
