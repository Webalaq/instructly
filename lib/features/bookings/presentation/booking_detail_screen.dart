import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/bookings_repository.dart';
import '../domain/booking.dart';
import 'calendar_screen.dart';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Load a wide range so we can find the booking by id.
    final now = DateTime.now();
    final rangeAsync = ref.watch(
      bookingsForRangeProvider((
        start: DateTime(now.year - 1),
        end: DateTime(now.year + 2),
      )),
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Lesson Details'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: rangeAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading…'),
        error: (e, _) => Center(
          child: Text('Error: $e',
              style: TextStyle(color: AppColors.error)),
        ),
        data: (bookings) {
          final booking = bookings.cast<Booking?>().firstWhere(
                (b) => b?.id == bookingId,
                orElse: () => null,
              );

          if (booking == null) {
            return const Center(child: Text('Booking not found.'));
          }

          return _BookingDetailBody(booking: booking);
        },
      ),
    );
  }
}

class _BookingDetailBody extends ConsumerWidget {
  final Booking booking;
  const _BookingDetailBody({required this.booking});

  Color get _statusColor {
    switch (booking.status) {
      case BookingStatus.confirmed:
        return AppColors.success;
      case BookingStatus.cancelled:
        return AppColors.error;
      case BookingStatus.completed:
        return AppColors.primary;
    }
  }

  String get _statusLabel {
    switch (booking.status) {
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.cancelled:
        return 'Cancelled';
      case BookingStatus.completed:
        return 'Completed';
    }
  }

  Future<void> _completeBooking(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(BookingsRepository.bookingsRepositoryProvider);
    try {
      await repo.completeBooking(booking.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lesson marked as completed.')),
        );
        context.pop();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _showCancelDialog(BuildContext context, WidgetRef ref) async {
    final isLate = booking.wouldBeLateCancellation;
    final isRecurring = booking.recurring && booking.recurringGroupId != null;

    String? reason;
    bool cancelAll = false;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Cancel Lesson'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isLate) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: AppColors.warning.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded,
                          color: AppColors.warning, size: 18),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Late cancellation — less than 24 hours before the lesson.',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                onChanged: (v) => reason = v,
                decoration: const InputDecoration(
                  labelText: 'Reason (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              if (isRecurring) ...[
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: cancelAll,
                  onChanged: (v) =>
                      setDialogState(() => cancelAll = v ?? false),
                  title: const Text(
                    'Cancel all future recurring lessons',
                    style: TextStyle(fontSize: 13),
                  ),
                  activeColor: AppColors.primary,
                  controlAffinity: ListTileControlAffinity.leading,
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Keep Lesson'),
            ),
            TextButton(
              style: TextButton.styleFrom(foregroundColor: AppColors.error),
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Cancel Lesson'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final repo = ref.read(BookingsRepository.bookingsRepositoryProvider);
    try {
      if (cancelAll && booking.recurringGroupId != null) {
        await repo.cancelRecurringFuture(booking.recurringGroupId!);
      } else {
        await repo.cancelBooking(booking.id, reason: reason);
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lesson cancelled.')),
        );
        context.pop();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          AnimatedContainer(
            duration: AppMotion.normal,
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border:
                  Border.all(color: _statusColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(
                  booking.status == BookingStatus.confirmed
                      ? Icons.check_circle_outline_rounded
                      : booking.status == BookingStatus.completed
                          ? Icons.done_all_rounded
                          : Icons.cancel_outlined,
                  color: _statusColor,
                ),
                const SizedBox(width: 10),
                Text(
                  _statusLabel,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: _statusColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (booking.lateCancellation) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Late',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.warning,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Date/Time card
          _InfoCard(
            title: 'Date & Time',
            icon: Icons.schedule_rounded,
            children: [
              _InfoRow(
                label: 'Date',
                value: booking.startTime.formatDateFull,
              ),
              _InfoRow(
                label: 'Time',
                value:
                    '${booking.startTime.formatTime} – ${booking.endTime.formatTime}',
              ),
              _InfoRow(
                label: 'Duration',
                value: _formatDuration(booking.duration),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Student card
          _InfoCard(
            title: 'Student',
            icon: Icons.person_outline_rounded,
            children: [
              _InfoRow(label: 'Name', value: booking.studentName),
              if (booking.pickupLocation != null)
                _InfoRow(
                    label: 'Pickup', value: booking.pickupLocation!),
            ],
          ),

          if (booking.recurring) ...[
            const SizedBox(height: 16),
            _InfoCard(
              title: 'Recurring',
              icon: Icons.repeat_rounded,
              children: [
                _InfoRow(label: 'Type', value: 'Weekly recurring lesson'),
              ],
            ),
          ],

          if (booking.notes != null) ...[
            const SizedBox(height: 16),
            _InfoCard(
              title: 'Notes',
              icon: Icons.notes_rounded,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    booking.notes!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ],

          if (booking.cancellationReason != null) ...[
            const SizedBox(height: 16),
            _InfoCard(
              title: 'Cancellation Reason',
              icon: Icons.info_outline_rounded,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    booking.cancellationReason!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 32),

          // Actions
          if (booking.status == BookingStatus.confirmed) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _completeBooking(context, ref),
                icon: const Icon(Icons.done_all_rounded),
                label: const Text('Complete & Log Lesson'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.textOnPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showCancelDialog(context, ref),
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Cancel Lesson'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _formatDuration(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h > 0 && m > 0) return '${h}h ${m}m';
    if (h > 0) return '${h}h';
    return '${m}m';
  }
}

// ---------------------------------------------------------------------------
// Helper widgets
// ---------------------------------------------------------------------------

class _InfoCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _InfoCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                title,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
