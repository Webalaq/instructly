import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../features/bookings/domain/booking.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import 'widgets/next_lesson_card.dart';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/// Streams all bookings for the currently authenticated student,
/// ordered by startTime ascending.
final studentBookingsProvider = StreamProvider<List<Booking>>((ref) async* {
  final uid = FirebaseAuth.instance.currentUser!.uid;

  // Fetch the student's linked instructor ID
  final userDoc = await FirebaseFirestore.instance
      .collection('users')
      .doc(uid)
      .get();

  final instructorId = userDoc.data()?['linkedInstructorId'] as String?;
  if (instructorId == null || instructorId.isEmpty) {
    yield [];
    return;
  }

  // Stream bookings from instructor's sub-collection filtered by studentId
  yield* FirebaseFirestore.instance
      .collection('instructors')
      .doc(instructorId)
      .collection('bookings')
      .where('studentId', isEqualTo: uid)
      .orderBy('startTime')
      .snapshots()
      .map(
        (snapshot) => snapshot.docs
            .map((doc) => Booking.fromMap(doc.data(), doc.id))
            .toList(),
      );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(studentBookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ----------------------------------------------------------------
          // App bar
          // ----------------------------------------------------------------
          SliverAppBar(
            backgroundColor: AppColors.surface,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            pinned: true,
            expandedHeight: 120,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Text(
                    'My Bookings',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: AppColors.textOnPrimary,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                  ),
                ),
              ),
            ),
            title: Text(
              'My Bookings',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                color: AppColors.textOnPrimary,
                onPressed: () => context.push(AppRoutes.notifications),
                tooltip: 'Notifications',
              ),
              const SizedBox(width: 4),
            ],
          ),

          // ----------------------------------------------------------------
          // Body
          // ----------------------------------------------------------------
          bookingsAsync.when(
            loading: () => const SliverFillRemaining(
              child: LoadingIndicator(message: 'Loading bookings…'),
            ),
            error: (e, _) => SliverFillRemaining(
              child: Center(
                child: Text(
                  'Error loading bookings: $e',
                  style: const TextStyle(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            data: (bookings) => _BookingsBody(bookings: bookings),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Body widget
// ---------------------------------------------------------------------------

class _BookingsBody extends StatelessWidget {
  const _BookingsBody({required this.bookings});

  final List<Booking> bookings;

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return const SliverFillRemaining(
        child: EmptyState(
          icon: Icons.calendar_today_rounded,
          title: 'No Bookings Yet',
          subtitle:
              'Your upcoming driving lessons will appear here once your instructor schedules them.',
        ),
      );
    }

    final now = DateTime.now();

    // Upcoming: confirmed + future
    final upcoming = bookings
        .where((b) =>
            b.status == BookingStatus.confirmed && b.startTime.isAfter(now))
        .toList();

    // Past: completed or cancelled, or confirmed in the past
    final past = bookings
        .where((b) =>
            b.status == BookingStatus.completed ||
            b.status == BookingStatus.cancelled ||
            (b.status == BookingStatus.confirmed &&
                b.startTime.isBefore(now)))
        .toList()
      ..sort((a, b) => b.startTime.compareTo(a.startTime)); // descending

    // Next lesson = first upcoming
    final nextLesson = upcoming.isNotEmpty ? upcoming.first : null;

    // Remaining upcoming (after the first)
    final remainingUpcoming =
        upcoming.length > 1 ? upcoming.sublist(1) : <Booking>[];

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          // ── Next lesson hero card ────────────────────────────────────────
          if (nextLesson != null) ...[
            _SectionLabel(label: 'Next Lesson', index: 0),
            const SizedBox(height: 12),
            _AnimatedItem(
              index: 0,
              child: NextLessonCard(booking: nextLesson),
            ),
            const SizedBox(height: 32),
          ],

          // ── Upcoming section ─────────────────────────────────────────────
          if (remainingUpcoming.isNotEmpty) ...[
            _SectionLabel(label: 'Upcoming', index: 1),
            const SizedBox(height: 12),
            ...List.generate(remainingUpcoming.length, (i) {
              final booking = remainingUpcoming[i];
              return _AnimatedItem(
                index: i + 1,
                child: _UpcomingBookingTile(booking: booking),
              );
            }),
            const SizedBox(height: 32),
          ],

          // ── Past lessons section ─────────────────────────────────────────
          if (past.isNotEmpty) ...[
            _SectionLabel(label: 'Past Lessons', index: 2),
            const SizedBox(height: 12),
            ...List.generate(past.length, (i) {
              final booking = past[i];
              return _AnimatedItem(
                index: i + (remainingUpcoming.length) + 2,
                child: _PastBookingTile(booking: booking),
              );
            }),
          ],

          // If there are only past bookings and no upcoming at all
          if (nextLesson == null && remainingUpcoming.isEmpty && past.isEmpty)
            const EmptyState(
              icon: Icons.calendar_today_rounded,
              title: 'No Bookings Yet',
              subtitle: 'Your driving lessons will appear here.',
            ),
        ]),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label, required this.index});

  final String label;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
            fontSize: 11,
          ),
    );
  }
}

// ---------------------------------------------------------------------------
// Animated item wrapper
// ---------------------------------------------------------------------------

class _AnimatedItem extends StatelessWidget {
  const _AnimatedItem({required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: AppMotion.normal +
          Duration(milliseconds: index * AppMotion.stagger.inMilliseconds),
      curve: AppMotion.enter,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, 16 * (1 - value)),
          child: child,
        ),
      ),
      child: child,
    );
  }
}

// ---------------------------------------------------------------------------
// Upcoming booking tile
// ---------------------------------------------------------------------------

class _UpcomingBookingTile extends StatelessWidget {
  const _UpcomingBookingTile({required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeRange =
        '${booking.startTime.formatTime} – ${booking.endTime.formatTime}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date column
            Container(
              width: 52,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.backgroundAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    '${booking.startTime.day}',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _monthAbbrev(booking.startTime.month),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 14),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    timeRange,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (booking.pickupLocation != null) ...[
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            booking.pickupLocation!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            // Confirmed badge
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Confirmed',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _monthAbbrev(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return months[month - 1];
  }
}

// ---------------------------------------------------------------------------
// Past booking tile
// ---------------------------------------------------------------------------

class _PastBookingTile extends StatelessWidget {
  const _PastBookingTile({required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final isCompleted = booking.status == BookingStatus.completed;
    final isCancelled = booking.status == BookingStatus.cancelled;

    final statusIcon = isCompleted
        ? Icons.check_circle_rounded
        : isCancelled
            ? Icons.cancel_rounded
            : Icons.history_rounded;

    final statusColor = isCompleted
        ? AppColors.success
        : isCancelled
            ? AppColors.error
            : AppColors.textSecondary;

    final statusLabel = isCompleted
        ? 'Completed'
        : isCancelled
            ? 'Cancelled'
            : 'Past';

    final timeRange =
        '${booking.startTime.formatTime} – ${booking.endTime.formatTime}';

    String _durationLabel(int minutes) {
      if (minutes < 60) return '${minutes}min';
      final h = minutes ~/ 60;
      final m = minutes % 60;
      return m == 0 ? '${h}h' : '${h}h ${m}min';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Status icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(statusIcon, color: statusColor, size: 20),
            ),

            const SizedBox(width: 14),

            // Date + time
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking.startTime.formatDateMedium,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$timeRange · ${_durationLabel(booking.duration)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Status label
            Text(
              statusLabel,
              style: theme.textTheme.labelSmall?.copyWith(
                color: statusColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
