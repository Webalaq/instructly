import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../features/bookings/data/bookings_repository.dart';
import '../../../features/bookings/domain/booking.dart';
import '../../../features/notifications/data/notifications_repository.dart';
import '../../../features/students/data/students_repository.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/loading_indicator.dart';
import 'widgets/quick_stats_card.dart';
import 'widgets/today_lessons_card.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _todaysBookingsProvider = StreamProvider<List<Booking>>((ref) {
  final now = DateTime.now();
  final start = now.startOfDay;
  final end = now.endOfDay.add(const Duration(seconds: 1));
  final repo = ref.watch(BookingsRepository.bookingsRepositoryProvider);
  return repo
      .getBookingsForRange(start, end)
      .map((list) => list.where((b) => b.status == BookingStatus.confirmed).toList());
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class InstructorDashboardScreen extends ConsumerWidget {
  const InstructorDashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    final studentsAsync = ref.watch(StudentsRepository.studentsStreamProvider);
    final todayAsync = ref.watch(_todaysBookingsProvider);
    final unreadAsync = ref.watch(unreadCountProvider);

    final unreadCount = unreadAsync.valueOrNull ?? 0;
    final todayBookings = todayAsync.valueOrNull ?? [];

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ----------------------------------------------------------------
          // Hero app bar
          // ----------------------------------------------------------------
          SliverAppBar(
            backgroundColor: AppColors.surface,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            pinned: true,
            expandedHeight: 140,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primaryLight,
                    ],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      _greeting(),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.textOnPrimary.withValues(alpha: 0.8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Instructly',
                      style: theme.textTheme.displaySmall?.copyWith(
                        color: AppColors.textOnPrimary,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Collapsed app bar content
            title: Text(
              'Instructly',
              style: theme.textTheme.titleLarge?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
              ),
            ),
            titleTextStyle: theme.textTheme.titleLarge?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w800,
            ),
            actions: [
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    color: AppColors.textOnPrimary,
                    onPressed: () => context.push(AppRoutes.notifications),
                    tooltip: 'Notifications',
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.primary, width: 1.5),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          unreadCount > 99 ? '99+' : '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            height: 1,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),

          // ----------------------------------------------------------------
          // Body content
          // ----------------------------------------------------------------
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Today's date chip
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundAccent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 13,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        DateTime.now().formatDateFull,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // ── Quick Stats ──────────────────────────────────────────
                Text(
                  'Overview',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                studentsAsync.when(
                  loading: () => const SizedBox(
                    height: 110,
                    child: LoadingIndicator(),
                  ),
                  error: (_, __) => _statsRow(
                    context,
                    studentCount: '—',
                    todayCount: todayBookings.length.toString(),
                  ),
                  data: (students) {
                    final activeCount = students
                        .where((s) => s.status.name == 'active')
                        .length;
                    return _statsRow(
                      context,
                      studentCount: '$activeCount',
                      todayCount: todayBookings.length.toString(),
                    );
                  },
                ),

                const SizedBox(height: 28),

                // ── Today's Lessons ──────────────────────────────────────
                Text(
                  'Schedule',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                todayAsync.when(
                  loading: () => const SizedBox(
                    height: 120,
                    child: LoadingIndicator(),
                  ),
                  error: (_, __) => TodayLessonsCard(bookings: const []),
                  data: (bookings) => TodayLessonsCard(bookings: bookings),
                ),

                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsRow(
    BuildContext context, {
    required String studentCount,
    required String todayCount,
  }) {
    return Row(
      children: [
        Expanded(
          child: QuickStatsCard(
            icon: Icons.people_alt_rounded,
            value: studentCount,
            label: 'Active Students',
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: QuickStatsCard(
            icon: Icons.directions_car_rounded,
            value: todayCount,
            label: "Today's Lessons",
            color: AppColors.secondary,
          ),
        ),
      ],
    );
  }
}
