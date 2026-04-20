import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/bookings_repository.dart';
import '../domain/booking.dart';
import 'widgets/booking_tile.dart';
import 'widgets/day_cell.dart';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/// Streams bookings for a date range defined by [start, end).
final bookingsForRangeProvider = StreamProvider.family<List<Booking>,
    ({DateTime start, DateTime end})>((ref, args) {
  final repo = ref.watch(BookingsRepository.bookingsRepositoryProvider);
  return repo.getBookingsForRange(args.start, args.end);
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen>
    with SingleTickerProviderStateMixin {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.week;

  DateTime get _rangeStart {
    // Load a full month worth to populate dots.
    return DateTime(_focusedDay.year, _focusedDay.month, 1);
  }

  DateTime get _rangeEnd {
    return DateTime(_focusedDay.year, _focusedDay.month + 1, 1);
  }

  List<Booking> _bookingsForDay(List<Booking> all, DateTime day) {
    return all.where((b) => b.startTime.isSameDay(day)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final rangeAsync = ref.watch(
      bookingsForRangeProvider((start: _rangeStart, end: _rangeEnd)),
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Calendar'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              onPressed: () {
                setState(() {
                  _calendarFormat =
                      _calendarFormat == CalendarFormat.week
                          ? CalendarFormat.month
                          : CalendarFormat.week;
                });
              },
              icon: Icon(
                _calendarFormat == CalendarFormat.week
                    ? Icons.calendar_month_outlined
                    : Icons.view_week_outlined,
                size: 18,
                color: AppColors.primary,
              ),
              label: Text(
                _calendarFormat == CalendarFormat.week ? 'Month' : 'Week',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      body: rangeAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading bookings…'),
        error: (e, _) => Center(
          child: Text('Error: $e',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: AppColors.error)),
        ),
        data: (allBookings) {
          final selectedBookings = _bookingsForDay(allBookings, _selectedDay);

          return Column(
            children: [
              // Calendar card
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TableCalendar<Booking>(
                  firstDay: DateTime(2020),
                  lastDay: DateTime(2030),
                  focusedDay: _focusedDay,
                  calendarFormat: _calendarFormat,
                  selectedDayPredicate: (day) =>
                      day.isSameDay(_selectedDay),
                  onDaySelected: (selected, focused) {
                    setState(() {
                      _selectedDay = selected;
                      _focusedDay = focused;
                    });
                  },
                  onPageChanged: (focused) {
                    setState(() => _focusedDay = focused);
                  },
                  eventLoader: (day) => _bookingsForDay(allBookings, day),
                  calendarStyle: const CalendarStyle(
                    outsideDaysVisible: false,
                    todayDecoration: BoxDecoration(color: Colors.transparent),
                    selectedDecoration: BoxDecoration(color: Colors.transparent),
                    defaultDecoration: BoxDecoration(color: Colors.transparent),
                    weekendDecoration: BoxDecoration(color: Colors.transparent),
                  ),
                  calendarBuilders: CalendarBuilders(
                    defaultBuilder: (ctx, day, focused) => DayCell(
                      day: day,
                      focusedDay: focused,
                      isSelected: false,
                      isToday: day.isSameDay(DateTime.now()),
                      isAvailable: true,
                      bookingCount: _bookingsForDay(allBookings, day).length,
                    ),
                    selectedBuilder: (ctx, day, focused) => DayCell(
                      day: day,
                      focusedDay: focused,
                      isSelected: true,
                      isToday: day.isSameDay(DateTime.now()),
                      isAvailable: true,
                      bookingCount: _bookingsForDay(allBookings, day).length,
                    ),
                    todayBuilder: (ctx, day, focused) => DayCell(
                      day: day,
                      focusedDay: focused,
                      isSelected: day.isSameDay(_selectedDay),
                      isToday: true,
                      isAvailable: true,
                      bookingCount: _bookingsForDay(allBookings, day).length,
                    ),
                    outsideBuilder: (ctx, day, focused) => DayCell(
                      day: day,
                      focusedDay: focused,
                      isSelected: false,
                      isToday: false,
                      isAvailable: false,
                      bookingCount: 0,
                    ),
                  ),
                  headerStyle: HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                    titleTextStyle: theme.textTheme.titleMedium!.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    leftChevronIcon: const Icon(
                      Icons.chevron_left_rounded,
                      color: AppColors.primary,
                    ),
                    rightChevronIcon: const Icon(
                      Icons.chevron_right_rounded,
                      color: AppColors.primary,
                    ),
                    decoration: const BoxDecoration(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                    ),
                  ),
                  daysOfWeekStyle: DaysOfWeekStyle(
                    weekdayStyle: theme.textTheme.labelSmall!.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                    weekendStyle: theme.textTheme.labelSmall!.copyWith(
                      color: AppColors.error.withValues(alpha: 0.7),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

              // Selected day header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      _selectedDay.isSameDay(DateTime.now())
                          ? 'Today'
                          : _selectedDay.formatDateFull,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (selectedBookings.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${selectedBookings.length}',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Bookings list for selected day
              Expanded(
                child: AnimatedSwitcher(
                  duration: AppMotion.normal,
                  child: selectedBookings.isEmpty
                      ? EmptyState(
                          key: ValueKey(_selectedDay),
                          icon: Icons.event_available_outlined,
                          title: 'No lessons',
                          subtitle: 'Nothing scheduled for this day.',
                        )
                      : ListView.builder(
                          key: ValueKey(_selectedDay),
                          padding: const EdgeInsets.only(bottom: 100),
                          itemCount: selectedBookings.length,
                          itemBuilder: (ctx, i) {
                            final booking = selectedBookings[i];
                            return BookingTile(
                              booking: booking,
                              onTap: () => context.push(
                                '/instructor/calendar/booking/${booking.id}',
                              ),
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/instructor/calendar/create'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        icon: const Icon(Icons.add_rounded),
        label: const Text(
          'Book Lesson',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
