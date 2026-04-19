# Instructly MVP Implementation Plan — Part 2 (Tasks 10–20)

> Continues from `docs/superpowers/plans/2026-04-19-instructly-mvp.md`

---

## Task 10: Bookings — Data & Domain

**Files:**
- Create: `lib/features/bookings/domain/booking.dart`
- Create: `lib/features/bookings/domain/availability.dart`
- Create: `lib/features/bookings/data/bookings_repository.dart`
- Create: `test/features/bookings/domain/booking_test.dart`
- Create: `test/features/bookings/domain/availability_test.dart`
- Create: `test/features/bookings/data/bookings_repository_test.dart`

- [ ] **Step 1: Write booking model test — `test/features/bookings/domain/booking_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/domain/booking.dart';

void main() {
  group('Booking', () {
    test('fromMap creates Booking correctly', () {
      final booking = Booking.fromMap({
        'studentId': 'student1',
        'studentName': 'Jane Doe',
        'startTime': DateTime(2026, 4, 20, 10, 0),
        'endTime': DateTime(2026, 4, 20, 11, 0),
        'duration': 60,
        'pickupLocation': 'High Street',
        'status': 'confirmed',
        'recurring': false,
        'lateCancellation': false,
      }, 'booking1');

      expect(booking.id, 'booking1');
      expect(booking.studentName, 'Jane Doe');
      expect(booking.status, BookingStatus.confirmed);
      expect(booking.duration, 60);
    });

    test('isUpcoming returns true for future bookings', () {
      final booking = Booking(
        id: '1',
        studentId: 's1',
        studentName: 'Jane',
        startTime: DateTime.now().add(const Duration(hours: 2)),
        endTime: DateTime.now().add(const Duration(hours: 3)),
        duration: 60,
        status: BookingStatus.confirmed,
      );
      expect(booking.isUpcoming, isTrue);
    });

    test('isLateCancellation returns true when cancelled within 24h', () {
      final booking = Booking(
        id: '1',
        studentId: 's1',
        studentName: 'Jane',
        startTime: DateTime.now().add(const Duration(hours: 12)),
        endTime: DateTime.now().add(const Duration(hours: 13)),
        duration: 60,
        status: BookingStatus.confirmed,
      );
      expect(booking.wouldBeLateCancellation, isTrue);
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/features/bookings/domain/booking_test.dart
```

Expected: FAIL.

- [ ] **Step 3: Implement `lib/features/bookings/domain/booking.dart`**

```dart
enum BookingStatus { confirmed, cancelled, completed }

class Booking {
  final String id;
  final String studentId;
  final String studentName;
  final DateTime startTime;
  final DateTime endTime;
  final int duration; // minutes
  final String? pickupLocation;
  final BookingStatus status;
  final bool recurring;
  final String? recurringGroupId;
  final String? cancellationReason;
  final bool lateCancellation;
  final String? notes;

  const Booking({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.startTime,
    required this.endTime,
    required this.duration,
    this.pickupLocation,
    required this.status,
    this.recurring = false,
    this.recurringGroupId,
    this.cancellationReason,
    this.lateCancellation = false,
    this.notes,
  });

  bool get isUpcoming =>
      status == BookingStatus.confirmed && startTime.isAfter(DateTime.now());

  bool get wouldBeLateCancellation =>
      startTime.difference(DateTime.now()).inHours < 24;

  factory Booking.fromMap(Map<String, dynamic> map, String id) {
    return Booking(
      id: id,
      studentId: map['studentId'] as String? ?? '',
      studentName: map['studentName'] as String? ?? '',
      startTime: map['startTime'] is DateTime
          ? map['startTime'] as DateTime
          : (map['startTime'] as dynamic).toDate(),
      endTime: map['endTime'] is DateTime
          ? map['endTime'] as DateTime
          : (map['endTime'] as dynamic).toDate(),
      duration: map['duration'] as int? ?? 60,
      pickupLocation: map['pickupLocation'] as String?,
      status: _parseStatus(map['status'] as String? ?? 'confirmed'),
      recurring: map['recurring'] as bool? ?? false,
      recurringGroupId: map['recurringGroupId'] as String?,
      cancellationReason: map['cancellationReason'] as String?,
      lateCancellation: map['lateCancellation'] as bool? ?? false,
      notes: map['notes'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      'pickupLocation': pickupLocation,
      'status': status.name,
      'recurring': recurring,
      'recurringGroupId': recurringGroupId,
      'cancellationReason': cancellationReason,
      'lateCancellation': lateCancellation,
      'notes': notes,
    };
  }

  static BookingStatus _parseStatus(String value) {
    return BookingStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => BookingStatus.confirmed,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
flutter test test/features/bookings/domain/booking_test.dart
```

Expected: All PASS.

- [ ] **Step 5: Write availability test — `test/features/bookings/domain/availability_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/domain/availability.dart';
import 'package:instructly/features/bookings/domain/booking.dart';
import 'package:instructly/features/onboarding/domain/instructor_profile.dart';

void main() {
  group('AvailabilityCalculator', () {
    test('getAvailableSlots returns slots for a day', () {
      final calculator = AvailabilityCalculator(
        weeklyAvailability: {
          'mon': [const TimeSlot(start: '09:00', end: '17:00')],
        },
        bufferMinutes: 15,
      );

      // Monday 20 Apr 2026
      final slots = calculator.getAvailableSlots(
        date: DateTime(2026, 4, 20),
        existingBookings: [],
        duration: 60,
      );

      // 09:00-10:00, 10:15-11:15, 11:30-12:30, 12:45-13:45,
      // 14:00-15:00, 15:15-16:15 = 6 slots with 15min buffer
      expect(slots.length, greaterThan(0));
      expect(slots.first.hour, 9);
      expect(slots.first.minute, 0);
    });

    test('getAvailableSlots excludes booked times', () {
      final calculator = AvailabilityCalculator(
        weeklyAvailability: {
          'mon': [const TimeSlot(start: '09:00', end: '12:00')],
        },
        bufferMinutes: 0,
      );

      final existingBookings = [
        Booking(
          id: '1',
          studentId: 's1',
          studentName: 'Jane',
          startTime: DateTime(2026, 4, 20, 9, 0),
          endTime: DateTime(2026, 4, 20, 10, 0),
          duration: 60,
          status: BookingStatus.confirmed,
        ),
      ];

      final slots = calculator.getAvailableSlots(
        date: DateTime(2026, 4, 20),
        existingBookings: existingBookings,
        duration: 60,
      );

      // 09:00 is taken, so first available is 10:00
      expect(slots.first.hour, 10);
    });

    test('getAvailableSlots returns empty for unavailable day', () {
      final calculator = AvailabilityCalculator(
        weeklyAvailability: {
          'mon': [const TimeSlot(start: '09:00', end: '17:00')],
        },
        bufferMinutes: 0,
      );

      // Tuesday — not in availability
      final slots = calculator.getAvailableSlots(
        date: DateTime(2026, 4, 21),
        existingBookings: [],
        duration: 60,
      );

      expect(slots, isEmpty);
    });
  });
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
flutter test test/features/bookings/domain/availability_test.dart
```

Expected: FAIL.

- [ ] **Step 7: Implement `lib/features/bookings/domain/availability.dart`**

```dart
import '../../onboarding/domain/instructor_profile.dart';
import 'booking.dart';

class AvailabilityCalculator {
  final Map<String, List<TimeSlot>> weeklyAvailability;
  final int bufferMinutes;

  const AvailabilityCalculator({
    required this.weeklyAvailability,
    required this.bufferMinutes,
  });

  static const _dayKeys = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  List<DateTime> getAvailableSlots({
    required DateTime date,
    required List<Booking> existingBookings,
    required int duration,
  }) {
    final dayKey = _dayKeys[date.weekday];
    final daySlots = weeklyAvailability[dayKey];

    if (daySlots == null || daySlots.isEmpty) return [];

    final available = <DateTime>[];

    for (final slot in daySlots) {
      final startParts = slot.start.split(':');
      final endParts = slot.end.split(':');

      var current = DateTime(
        date.year, date.month, date.day,
        int.parse(startParts[0]), int.parse(startParts[1]),
      );
      final slotEnd = DateTime(
        date.year, date.month, date.day,
        int.parse(endParts[0]), int.parse(endParts[1]),
      );

      while (current.add(Duration(minutes: duration)).compareTo(slotEnd) <= 0) {
        final candidateEnd = current.add(Duration(minutes: duration));

        final isConflict = existingBookings.any((b) {
          if (b.status == BookingStatus.cancelled) return false;
          return current.isBefore(b.endTime) && candidateEnd.isAfter(b.startTime);
        });

        if (!isConflict) {
          available.add(current);
        }

        current = current.add(Duration(minutes: duration + bufferMinutes));
      }
    }

    return available;
  }

  bool isDayAvailable(DateTime date) {
    final dayKey = _dayKeys[date.weekday];
    return weeklyAvailability.containsKey(dayKey);
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
flutter test test/features/bookings/domain/availability_test.dart
```

Expected: All PASS.

- [ ] **Step 9: Write repository test — `test/features/bookings/data/bookings_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/bookings/data/bookings_repository.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late BookingsRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = BookingsRepository(
      firestore: fakeFirestore,
      instructorId: 'inst123',
    );
  });

  group('BookingsRepository', () {
    test('createBooking writes document', () async {
      await repository.createBooking(
        studentId: 'student1',
        studentName: 'Jane Doe',
        startTime: DateTime(2026, 4, 20, 10, 0),
        endTime: DateTime(2026, 4, 20, 11, 0),
        duration: 60,
        pickupLocation: 'High Street',
      );

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('bookings')
          .get();

      expect(snapshot.docs.length, 1);
      expect(snapshot.docs.first.data()['studentName'], 'Jane Doe');
      expect(snapshot.docs.first.data()['status'], 'confirmed');
    });

    test('getBookingsForRange returns bookings in date range', () async {
      await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('bookings')
          .add({
        'studentId': 's1',
        'studentName': 'Jane',
        'startTime': DateTime(2026, 4, 20, 10, 0),
        'endTime': DateTime(2026, 4, 20, 11, 0),
        'duration': 60,
        'status': 'confirmed',
      });

      final bookings = await repository
          .getBookingsForRange(
            DateTime(2026, 4, 20),
            DateTime(2026, 4, 21),
          )
          .first;

      expect(bookings.length, 1);
    });

    test('cancelBooking updates status', () async {
      final ref = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('bookings')
          .add({
        'studentId': 's1',
        'studentName': 'Jane',
        'startTime': DateTime(2026, 4, 20, 10, 0),
        'endTime': DateTime(2026, 4, 20, 11, 0),
        'duration': 60,
        'status': 'confirmed',
      });

      await repository.cancelBooking(ref.id, reason: 'Student unavailable');

      final doc = await ref.get();
      expect(doc.data()?['status'], 'cancelled');
      expect(doc.data()?['cancellationReason'], 'Student unavailable');
    });

    test('createRecurringBookings creates multiple bookings', () async {
      await repository.createRecurringBookings(
        studentId: 'student1',
        studentName: 'Jane Doe',
        startTime: DateTime(2026, 4, 20, 10, 0),
        duration: 60,
        pickupLocation: 'High Street',
        weeks: 4,
      );

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('bookings')
          .get();

      expect(snapshot.docs.length, 4);
      // All share the same recurringGroupId
      final groupIds = snapshot.docs
          .map((d) => d.data()['recurringGroupId'])
          .toSet();
      expect(groupIds.length, 1);
    });
  });
}
```

- [ ] **Step 10: Run test to verify it fails**

```bash
flutter test test/features/bookings/data/bookings_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 11: Implement `lib/features/bookings/data/bookings_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../domain/booking.dart';

final bookingsRepositoryProvider = Provider<BookingsRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return BookingsRepository(
    firestore: FirebaseFirestore.instance,
    instructorId: uid,
  );
});

class BookingsRepository {
  final FirebaseFirestore firestore;
  final String instructorId;

  BookingsRepository({
    required this.firestore,
    required this.instructorId,
  });

  CollectionReference get _bookingsRef => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('bookings');

  Stream<List<Booking>> getBookingsForRange(DateTime start, DateTime end) {
    return _bookingsRef
        .where('startTime', isGreaterThanOrEqualTo: start)
        .where('startTime', isLessThan: end)
        .orderBy('startTime')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                Booking.fromMap(doc.data() as Map<String, dynamic>, doc.id))
            .toList());
  }

  Stream<List<Booking>> getBookingsForStudent(String studentId) {
    return _bookingsRef
        .where('studentId', isEqualTo: studentId)
        .orderBy('startTime', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                Booking.fromMap(doc.data() as Map<String, dynamic>, doc.id))
            .toList());
  }

  Future<void> createBooking({
    required String studentId,
    required String studentName,
    required DateTime startTime,
    required DateTime endTime,
    required int duration,
    String? pickupLocation,
    String? notes,
  }) async {
    await _bookingsRef.add({
      'studentId': studentId,
      'studentName': studentName,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      'pickupLocation': pickupLocation,
      'status': 'confirmed',
      'recurring': false,
      'lateCancellation': false,
      'notes': notes,
    });
  }

  Future<void> createRecurringBookings({
    required String studentId,
    required String studentName,
    required DateTime startTime,
    required int duration,
    String? pickupLocation,
    required int weeks,
  }) async {
    final groupId = const Uuid().v4();
    final batch = firestore.batch();

    for (var i = 0; i < weeks; i++) {
      final start = startTime.add(Duration(days: 7 * i));
      final end = start.add(Duration(minutes: duration));

      batch.set(_bookingsRef.doc(), {
        'studentId': studentId,
        'studentName': studentName,
        'startTime': start,
        'endTime': end,
        'duration': duration,
        'pickupLocation': pickupLocation,
        'status': 'confirmed',
        'recurring': true,
        'recurringGroupId': groupId,
        'lateCancellation': false,
      });
    }

    await batch.commit();
  }

  Future<void> cancelBooking(String bookingId, {String? reason}) async {
    final doc = await _bookingsRef.doc(bookingId).get();
    final data = doc.data() as Map<String, dynamic>?;
    final startTime = data?['startTime'] is DateTime
        ? data!['startTime'] as DateTime
        : (data?['startTime'] as dynamic)?.toDate();

    final isLate = startTime != null &&
        startTime.difference(DateTime.now()).inHours < 24;

    await _bookingsRef.doc(bookingId).update({
      'status': 'cancelled',
      'cancellationReason': reason,
      'lateCancellation': isLate,
    });
  }

  Future<void> cancelRecurringFuture(String recurringGroupId) async {
    final snapshot = await _bookingsRef
        .where('recurringGroupId', isEqualTo: recurringGroupId)
        .where('startTime', isGreaterThan: DateTime.now())
        .where('status', isEqualTo: 'confirmed')
        .get();

    final batch = firestore.batch();
    for (final doc in snapshot.docs) {
      batch.update(doc.reference, {'status': 'cancelled'});
    }
    await batch.commit();
  }

  Future<void> completeBooking(String bookingId) async {
    await _bookingsRef.doc(bookingId).update({'status': 'completed'});
  }
}
```

- [ ] **Step 12: Run tests to verify they pass**

```bash
flutter test test/features/bookings/
```

Expected: All PASS.

- [ ] **Step 13: Commit**

```bash
git add lib/features/bookings/data/ lib/features/bookings/domain/ test/features/bookings/
git commit -m "feat: add bookings data layer — Booking model, availability calculator, repository"
```

---

## Task 11: Bookings — Calendar & Create Screens

**Files:**
- Create: `lib/features/bookings/presentation/widgets/day_cell.dart`
- Create: `lib/features/bookings/presentation/widgets/booking_tile.dart`
- Create: `lib/features/bookings/presentation/widgets/time_slot_picker.dart`
- Create: `lib/features/bookings/presentation/calendar_screen.dart`
- Create: `lib/features/bookings/presentation/booking_detail_screen.dart`
- Create: `lib/features/bookings/presentation/create_booking_screen.dart`
- Modify: `lib/app/router/app_router.dart`

- [ ] **Step 1: Create `lib/features/bookings/presentation/widgets/day_cell.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class DayCell extends StatelessWidget {
  final DateTime day;
  final bool isSelected;
  final bool isToday;
  final int bookingCount;
  final bool isAvailable;

  const DayCell({
    super.key,
    required this.day,
    required this.isSelected,
    required this.isToday,
    required this.bookingCount,
    required this.isAvailable,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isSelected
            ? AppColors.primary
            : isToday
                ? AppColors.backgroundAccent
                : null,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${day.day}',
            style: TextStyle(
              color: isSelected
                  ? AppColors.textOnPrimary
                  : isAvailable
                      ? AppColors.textPrimary
                      : AppColors.textSecondary.withValues(alpha: 0.5),
              fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          if (bookingCount > 0)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                bookingCount.clamp(0, 3),
                (_) => Container(
                  width: 5,
                  height: 5,
                  margin: const EdgeInsets.symmetric(horizontal: 1, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.textOnPrimary : AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: Create `lib/features/bookings/presentation/widgets/booking_tile.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/utils/date_helpers.dart';
import '../../domain/booking.dart';

class BookingTile extends StatelessWidget {
  final Booking booking;
  final VoidCallback onTap;

  const BookingTile({super.key, required this.booking, required this.onTap});

  Color get _statusColor {
    switch (booking.status) {
      case BookingStatus.confirmed:
        return AppColors.primary;
      case BookingStatus.cancelled:
        return AppColors.error;
      case BookingStatus.completed:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Time column
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: _statusColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${booking.startTime.formatTime} - ${booking.endTime.formatTime}',
                    style: theme.textTheme.titleSmall,
                  ),
                  Text(
                    '${booking.duration} min',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.studentName,
                      style: theme.textTheme.titleMedium,
                    ),
                    if (booking.pickupLocation != null)
                      Text(
                        booking.pickupLocation!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              if (booking.recurring)
                Icon(Icons.repeat, size: 16, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Create `lib/features/bookings/presentation/widgets/time_slot_picker.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_motion.dart';
import '../../../../shared/utils/date_helpers.dart';

class TimeSlotPicker extends StatelessWidget {
  final List<DateTime> availableSlots;
  final DateTime? selectedSlot;
  final ValueChanged<DateTime> onSelected;

  const TimeSlotPicker({
    super.key,
    required this.availableSlots,
    this.selectedSlot,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (availableSlots.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          'No available slots for this day',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: availableSlots.map((slot) {
        final isSelected = selectedSlot != null &&
            slot.hour == selectedSlot!.hour &&
            slot.minute == selectedSlot!.minute;

        return AnimatedContainer(
          duration: AppMotion.fast,
          child: ChoiceChip(
            label: Text(slot.formatTime),
            selected: isSelected,
            onSelected: (_) => onSelected(slot),
            selectedColor: AppColors.primary,
            labelStyle: TextStyle(
              color: isSelected ? AppColors.textOnPrimary : AppColors.textPrimary,
            ),
          ),
        );
      }).toList(),
    );
  }
}
```

- [ ] **Step 4: Create `lib/features/bookings/presentation/calendar_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/bookings_repository.dart';
import '../domain/booking.dart';
import 'widgets/booking_tile.dart';
import 'widgets/day_cell.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.week;

  @override
  Widget build(BuildContext context) {
    final startOfRange = _focusedDay.startOfWeek;
    final endOfRange = startOfRange.add(const Duration(days: 14));

    final bookingsAsync = ref.watch(
      bookingsForRangeProvider((start: startOfRange, end: endOfRange)),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(_focusedDay.formatDateMedium),
        actions: [
          IconButton(
            icon: Icon(_calendarFormat == CalendarFormat.week
                ? Icons.calendar_view_month
                : Icons.calendar_view_week),
            onPressed: () {
              setState(() {
                _calendarFormat = _calendarFormat == CalendarFormat.week
                    ? CalendarFormat.month
                    : CalendarFormat.week;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          bookingsAsync.when(
            data: (bookings) {
              final bookingsByDay = <DateTime, List<Booking>>{};
              for (final b in bookings) {
                final day = b.startTime.startOfDay;
                bookingsByDay.putIfAbsent(day, () => []).add(b);
              }

              return TableCalendar(
                firstDay: DateTime.now().subtract(const Duration(days: 365)),
                lastDay: DateTime.now().add(const Duration(days: 365)),
                focusedDay: _focusedDay,
                calendarFormat: _calendarFormat,
                startingDayOfWeek: StartingDayOfWeek.monday,
                selectedDayPredicate: (day) => day.isSameDay(_selectedDay),
                onDaySelected: (selected, focused) {
                  setState(() {
                    _selectedDay = selected;
                    _focusedDay = focused;
                  });
                },
                onPageChanged: (focused) {
                  setState(() => _focusedDay = focused);
                },
                calendarBuilders: CalendarBuilders(
                  defaultBuilder: (context, day, focused) {
                    final count =
                        bookingsByDay[day.startOfDay]?.length ?? 0;
                    return DayCell(
                      day: day,
                      isSelected: false,
                      isToday: false,
                      bookingCount: count,
                      isAvailable: true,
                    );
                  },
                  selectedBuilder: (context, day, focused) {
                    final count =
                        bookingsByDay[day.startOfDay]?.length ?? 0;
                    return DayCell(
                      day: day,
                      isSelected: true,
                      isToday: false,
                      bookingCount: count,
                      isAvailable: true,
                    );
                  },
                  todayBuilder: (context, day, focused) {
                    final count =
                        bookingsByDay[day.startOfDay]?.length ?? 0;
                    return DayCell(
                      day: day,
                      isSelected: day.isSameDay(_selectedDay),
                      isToday: true,
                      bookingCount: count,
                      isAvailable: true,
                    );
                  },
                ),
                headerStyle: const HeaderStyle(
                  formatButtonVisible: false,
                  titleCentered: true,
                  leftChevronIcon:
                      Icon(Icons.chevron_left, color: AppColors.primary),
                  rightChevronIcon:
                      Icon(Icons.chevron_right, color: AppColors.primary),
                ),
                calendarStyle: CalendarStyle(
                  outsideDaysVisible: false,
                  weekendTextStyle:
                      const TextStyle(color: AppColors.textSecondary),
                  todayDecoration: BoxDecoration(
                    color: AppColors.backgroundAccent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  selectedDecoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
            },
            loading: () => const SizedBox(
              height: 100,
              child: LoadingIndicator(),
            ),
            error: (e, _) => Text('Error: $e'),
          ),

          const Divider(height: 1),

          // Selected day bookings
          Expanded(
            child: bookingsAsync.when(
              data: (bookings) {
                final dayBookings = bookings
                    .where((b) => b.startTime.isSameDay(_selectedDay))
                    .toList()
                  ..sort((a, b) => a.startTime.compareTo(b.startTime));

                if (dayBookings.isEmpty) {
                  return const EmptyState(
                    icon: Icons.event_available,
                    title: 'No Lessons',
                    subtitle: 'No lessons scheduled for this day',
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: dayBookings.length,
                  itemBuilder: (context, index) {
                    final booking = dayBookings[index];
                    return BookingTile(
                      booking: booking,
                      onTap: () => context.push(
                        '/instructor/calendar/booking/${booking.id}',
                      ),
                    );
                  },
                );
              },
              loading: () => const LoadingIndicator(),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/instructor/calendar/create'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

// Provider for bookings in a date range
final bookingsForRangeProvider = StreamProvider.family<
    List<Booking>,
    ({DateTime start, DateTime end})>((ref, range) {
  return ref
      .watch(bookingsRepositoryProvider)
      .getBookingsForRange(range.start, range.end);
});
```

- [ ] **Step 5: Create `lib/features/bookings/presentation/booking_detail_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../data/bookings_repository.dart';
import '../domain/booking.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    // Fetch booking from current range bookings or as a one-off
    // For simplicity, we get it from the existing stream
    final today = DateTime.now();
    final range = (
      start: today.subtract(const Duration(days: 30)),
      end: today.add(const Duration(days: 60)),
    );
    final bookingsAsync = ref.watch(bookingsForRangeProvider(range));

    return bookingsAsync.when(
      data: (bookings) {
        final booking = bookings.where((b) => b.id == bookingId).firstOrNull;
        if (booking == null) {
          return const Scaffold(
            body: Center(child: Text('Booking not found')),
          );
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Lesson Details')),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Student name
                Text(booking.studentName, style: theme.textTheme.displaySmall),
                const SizedBox(height: 24),

                // Date & time
                _DetailRow(
                  icon: Icons.calendar_today,
                  label: 'Date',
                  value: booking.startTime.formatDateFull,
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.access_time,
                  label: 'Time',
                  value:
                      '${booking.startTime.formatTime} - ${booking.endTime.formatTime} (${booking.duration}min)',
                ),
                const SizedBox(height: 12),
                if (booking.pickupLocation != null) ...[
                  _DetailRow(
                    icon: Icons.location_on_outlined,
                    label: 'Pickup',
                    value: booking.pickupLocation!,
                  ),
                  const SizedBox(height: 12),
                ],
                _DetailRow(
                  icon: Icons.info_outline,
                  label: 'Status',
                  value: booking.status.name.toUpperCase(),
                ),
                if (booking.recurring) ...[
                  const SizedBox(height: 12),
                  _DetailRow(
                    icon: Icons.repeat,
                    label: 'Recurring',
                    value: 'Weekly',
                  ),
                ],

                const Spacer(),

                // Action buttons
                if (booking.status == BookingStatus.confirmed) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await ref
                            .read(bookingsRepositoryProvider)
                            .completeBooking(bookingId);
                        if (context.mounted) {
                          context.push(
                            '/instructor/students/${booking.studentId}/log?bookingId=$bookingId',
                          );
                        }
                      },
                      child: const Text('Complete & Log Lesson'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => _showCancelDialog(context, ref, booking),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                      child: const Text('Cancel Lesson'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        body: Center(child: Text('Error: $e')),
      ),
    );
  }

  void _showCancelDialog(
      BuildContext context, WidgetRef ref, Booking booking) {
    final isRecurring = booking.recurring;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Lesson'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (booking.wouldBeLateCancellation)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'This is a late cancellation (less than 24h before the lesson).',
                ),
              ),
            const Text('Are you sure you want to cancel this lesson?'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep'),
          ),
          if (isRecurring)
            TextButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await ref
                    .read(bookingsRepositoryProvider)
                    .cancelRecurringFuture(booking.recurringGroupId!);
                if (context.mounted) context.pop();
              },
              child: const Text('Cancel All Future'),
            ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref
                  .read(bookingsRepositoryProvider)
                  .cancelBooking(bookingId);
              if (context.mounted) context.pop();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Cancel This Lesson'),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.labelSmall?.copyWith(
              color: AppColors.textSecondary,
            )),
            Text(value, style: theme.textTheme.bodyLarge),
          ],
        ),
      ],
    );
  }
}
```

- [ ] **Step 6: Create `lib/features/bookings/presentation/create_booking_screen.dart`**

```dart
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
import 'widgets/time_slot_picker.dart';

class CreateBookingScreen extends ConsumerStatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  ConsumerState<CreateBookingScreen> createState() =>
      _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  Student? _selectedStudent;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  DateTime? _selectedSlot;
  int _duration = 60;
  bool _recurring = false;
  int _recurringWeeks = 4;
  final _locationController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_selectedStudent == null || _selectedSlot == null) return;

    setState(() => _saving = true);

    try {
      final repo = ref.read(bookingsRepositoryProvider);
      final startTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedSlot!.hour,
        _selectedSlot!.minute,
      );

      if (_recurring) {
        await repo.createRecurringBookings(
          studentId: _selectedStudent!.id,
          studentName: _selectedStudent!.name,
          startTime: startTime,
          duration: _duration,
          pickupLocation: _locationController.text.trim().isEmpty
              ? null
              : _locationController.text.trim(),
          weeks: _recurringWeeks,
        );
      } else {
        await repo.createBooking(
          studentId: _selectedStudent!.id,
          studentName: _selectedStudent!.name,
          startTime: startTime,
          endTime: startTime.add(Duration(minutes: _duration)),
          duration: _duration,
          pickupLocation: _locationController.text.trim().isEmpty
              ? null
              : _locationController.text.trim(),
        );
      }

      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final studentsAsync = ref.watch(studentsStreamProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('New Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Select student
            Text('Student', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            studentsAsync.when(
              data: (students) {
                final activeStudents =
                    students.where((s) => s.isActive).toList();
                return DropdownButtonFormField<Student>(
                  value: _selectedStudent,
                  decoration: const InputDecoration(
                    hintText: 'Select a student',
                    prefixIcon: Icon(Icons.person_outlined),
                  ),
                  items: activeStudents.map((s) {
                    return DropdownMenuItem(value: s, child: Text(s.name));
                  }).toList(),
                  onChanged: (s) => setState(() => _selectedStudent = s),
                );
              },
              loading: () => const LoadingIndicator(),
              error: (e, _) => Text('Error: $e'),
            ),
            const SizedBox(height: 20),

            // 2. Select date
            Text('Date', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() {
                    _selectedDate = picked;
                    _selectedSlot = null; // Reset slot on date change
                  });
                }
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today,
                        color: AppColors.textSecondary),
                    const SizedBox(width: 12),
                    Text(
                      _selectedDate.formatDateFull,
                      style: theme.textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 3. Duration
            Text('Duration', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [60, 90, 120].map((d) {
                return ChoiceChip(
                  label: Text('${d}min'),
                  selected: _duration == d,
                  onSelected: (_) => setState(() {
                    _duration = d;
                    _selectedSlot = null;
                  }),
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: _duration == d
                        ? AppColors.textOnPrimary
                        : AppColors.textPrimary,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // 4. Available time slots
            Text('Available Times', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            FutureBuilder<Map<String, dynamic>?>(
              future: _getInstructorSettings(),
              builder: (context, settingsSnap) {
                if (!settingsSnap.hasData) return const LoadingIndicator();

                final settings = settingsSnap.data!;
                final availability = (settings['weeklyAvailability']
                        as Map<String, dynamic>?)
                    ?.map((day, slots) => MapEntry(
                          day,
                          (slots as List)
                              .map((s) => TimeSlot.fromMap(
                                  s as Map<String, dynamic>))
                              .toList(),
                        )) ??
                    {};
                final buffer =
                    settings['settings']?['bufferMinutes'] as int? ?? 15;

                final calculator = AvailabilityCalculator(
                  weeklyAvailability: availability,
                  bufferMinutes: buffer,
                );

                // Get existing bookings for the selected date
                return StreamBuilder<List<Booking>>(
                  stream: ref
                      .read(bookingsRepositoryProvider)
                      .getBookingsForRange(
                        _selectedDate.startOfDay,
                        _selectedDate.endOfDay,
                      ),
                  builder: (context, bookingsSnap) {
                    final existingBookings = bookingsSnap.data ?? [];
                    final slots = calculator.getAvailableSlots(
                      date: _selectedDate,
                      existingBookings: existingBookings,
                      duration: _duration,
                    );

                    return TimeSlotPicker(
                      availableSlots: slots,
                      selectedSlot: _selectedSlot,
                      onSelected: (s) =>
                          setState(() => _selectedSlot = s),
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 20),

            // 5. Pickup location
            Text('Pickup Location', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(
                hintText: 'e.g. Outside Tesco, High Street',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 20),

            // 6. Recurring
            SwitchListTile(
              title: const Text('Recurring Weekly'),
              value: _recurring,
              onChanged: (v) => setState(() => _recurring = v),
              activeColor: AppColors.primary,
              contentPadding: EdgeInsets.zero,
            ),
            if (_recurring) ...[
              Wrap(
                spacing: 8,
                children: [4, 6, 8].map((w) {
                  return ChoiceChip(
                    label: Text('$w weeks'),
                    selected: _recurringWeeks == w,
                    onSelected: (_) =>
                        setState(() => _recurringWeeks = w),
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: _recurringWeeks == w
                          ? AppColors.textOnPrimary
                          : AppColors.textPrimary,
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 32),

            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_selectedStudent != null && _selectedSlot != null && !_saving)
                    ? _save
                    : null,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(_recurring
                        ? 'Book $_recurringWeeks Lessons'
                        : 'Book Lesson'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<Map<String, dynamic>?> _getInstructorSettings() async {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    final doc = await FirebaseFirestore.instance
        .collection('instructors')
        .doc(uid)
        .get();
    return doc.data();
  }
}
```

- [ ] **Step 7: Update router with booking routes**

In `lib/app/router/app_router.dart`, add imports:

```dart
import '../../features/bookings/presentation/calendar_screen.dart';
import '../../features/bookings/presentation/booking_detail_screen.dart';
import '../../features/bookings/presentation/create_booking_screen.dart';
```

Replace the calendar branch placeholder:
```dart
StatefulShellBranch(routes: [
  GoRoute(
    path: '/instructor/calendar',
    builder: (context, state) => const CalendarScreen(),
    routes: [
      GoRoute(
        path: 'create',
        builder: (context, state) => const CreateBookingScreen(),
      ),
      GoRoute(
        path: 'booking/:id',
        builder: (context, state) => BookingDetailScreen(
          bookingId: state.pathParameters['id']!,
        ),
      ),
    ],
  ),
]),
```

- [ ] **Step 8: Verify build**

```bash
flutter run
```

Expected: Calendar tab shows weekly view. FAB opens create booking flow with student dropdown, date picker, time slots, and booking options.

- [ ] **Step 9: Commit**

```bash
git add lib/features/bookings/presentation/ lib/app/router/app_router.dart
git commit -m "feat: add booking screens — calendar, create booking, booking detail"
```

---

## Task 12: Lesson Logs

**Files:**
- Create: `lib/features/lesson_logs/domain/lesson_log.dart`
- Create: `lib/features/lesson_logs/data/lesson_logs_repository.dart`
- Create: `lib/features/lesson_logs/presentation/widgets/skill_chip_selector.dart`
- Create: `lib/features/lesson_logs/presentation/lesson_log_form_screen.dart`
- Create: `lib/features/lesson_logs/presentation/lesson_logs_list_screen.dart`
- Create: `test/features/lesson_logs/data/lesson_logs_repository_test.dart`

- [ ] **Step 1: Create `lib/features/lesson_logs/domain/lesson_log.dart`**

```dart
class LessonLog {
  final String id;
  final String? bookingId;
  final DateTime date;
  final int duration;
  final List<String> skillsCovered; // skill IDs
  final String? notes;
  final String? areasToImprove;

  const LessonLog({
    required this.id,
    this.bookingId,
    required this.date,
    required this.duration,
    this.skillsCovered = const [],
    this.notes,
    this.areasToImprove,
  });

  factory LessonLog.fromMap(Map<String, dynamic> map, String id) {
    return LessonLog(
      id: id,
      bookingId: map['bookingId'] as String?,
      date: map['date'] is DateTime
          ? map['date'] as DateTime
          : (map['date'] as dynamic).toDate(),
      duration: map['duration'] as int? ?? 60,
      skillsCovered: List<String>.from(map['skillsCovered'] ?? []),
      notes: map['notes'] as String?,
      areasToImprove: map['areasToImprove'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'bookingId': bookingId,
      'date': date,
      'duration': duration,
      'skillsCovered': skillsCovered,
      'notes': notes,
      'areasToImprove': areasToImprove,
    };
  }
}
```

- [ ] **Step 2: Write test — `test/features/lesson_logs/data/lesson_logs_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/lesson_logs/data/lesson_logs_repository.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late LessonLogsRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = LessonLogsRepository(
      firestore: fakeFirestore,
      instructorId: 'inst123',
    );
  });

  group('LessonLogsRepository', () {
    test('addLog creates document under student', () async {
      await repository.addLog(
        studentId: 'student1',
        bookingId: 'booking1',
        date: DateTime(2026, 4, 20),
        duration: 60,
        skillsCovered: ['parallel_parking', 'roundabouts'],
        notes: 'Good progress on parking',
        areasToImprove: 'Needs work on roundabouts',
      );

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .doc('student1')
          .collection('lessonLogs')
          .get();

      expect(snapshot.docs.length, 1);
      expect(snapshot.docs.first.data()['notes'], 'Good progress on parking');
    });

    test('getLogs returns sorted list', () async {
      final ref = fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .doc('student1')
          .collection('lessonLogs');

      await ref.add({
        'date': DateTime(2026, 4, 18),
        'duration': 60,
        'skillsCovered': [],
      });
      await ref.add({
        'date': DateTime(2026, 4, 20),
        'duration': 60,
        'skillsCovered': [],
      });

      final logs = await repository.getLogs('student1').first;
      expect(logs.length, 2);
    });
  });
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
flutter test test/features/lesson_logs/data/lesson_logs_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 4: Implement `lib/features/lesson_logs/data/lesson_logs_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/lesson_log.dart';

final lessonLogsRepositoryProvider = Provider<LessonLogsRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return LessonLogsRepository(
    firestore: FirebaseFirestore.instance,
    instructorId: uid,
  );
});

class LessonLogsRepository {
  final FirebaseFirestore firestore;
  final String instructorId;

  LessonLogsRepository({
    required this.firestore,
    required this.instructorId,
  });

  CollectionReference _logsRef(String studentId) => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('students')
      .doc(studentId)
      .collection('lessonLogs');

  Stream<List<LessonLog>> getLogs(String studentId) {
    return _logsRef(studentId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                LessonLog.fromMap(doc.data() as Map<String, dynamic>, doc.id))
            .toList());
  }

  Future<void> addLog({
    required String studentId,
    String? bookingId,
    required DateTime date,
    required int duration,
    required List<String> skillsCovered,
    String? notes,
    String? areasToImprove,
  }) async {
    await _logsRef(studentId).add({
      'bookingId': bookingId,
      'date': date,
      'duration': duration,
      'skillsCovered': skillsCovered,
      'notes': notes,
      'areasToImprove': areasToImprove,
    });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
flutter test test/features/lesson_logs/data/lesson_logs_repository_test.dart
```

Expected: All PASS.

- [ ] **Step 6: Create `lib/features/lesson_logs/presentation/widgets/skill_chip_selector.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../progress/domain/dvsa_skills.dart';

class SkillChipSelector extends StatelessWidget {
  final List<String> selectedSkillIds;
  final ValueChanged<List<String>> onChanged;

  const SkillChipSelector({
    super.key,
    required this.selectedSkillIds,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: DvsaSkills.categories.entries.map((category) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(category.key, style: theme.textTheme.labelLarge),
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: category.value.map((skill) {
                final selected = selectedSkillIds.contains(skill.id);
                return FilterChip(
                  label: Text(skill.name),
                  selected: selected,
                  onSelected: (val) {
                    final updated = List<String>.from(selectedSkillIds);
                    if (val) {
                      updated.add(skill.id);
                    } else {
                      updated.remove(skill.id);
                    }
                    onChanged(updated);
                  },
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    color: selected
                        ? AppColors.textOnPrimary
                        : AppColors.textPrimary,
                  ),
                  checkmarkColor: AppColors.textOnPrimary,
                  visualDensity: VisualDensity.compact,
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
          ],
        );
      }).toList(),
    );
  }
}
```

- [ ] **Step 7: Create `lib/features/lesson_logs/presentation/lesson_log_form_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/lesson_logs_repository.dart';
import 'widgets/skill_chip_selector.dart';

class LessonLogFormScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String? bookingId;

  const LessonLogFormScreen({
    super.key,
    required this.studentId,
    this.bookingId,
  });

  @override
  ConsumerState<LessonLogFormScreen> createState() =>
      _LessonLogFormScreenState();
}

class _LessonLogFormScreenState extends ConsumerState<LessonLogFormScreen> {
  List<String> _selectedSkills = [];
  final _notesController = TextEditingController();
  final _improveController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _notesController.dispose();
    _improveController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);

    try {
      await ref.read(lessonLogsRepositoryProvider).addLog(
            studentId: widget.studentId,
            bookingId: widget.bookingId,
            date: DateTime.now(),
            duration: 60,
            skillsCovered: _selectedSkills,
            notes: _notesController.text.trim().isEmpty
                ? null
                : _notesController.text.trim(),
            areasToImprove: _improveController.text.trim().isEmpty
                ? null
                : _improveController.text.trim(),
          );

      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Log Lesson')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Skills Covered', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            SkillChipSelector(
              selectedSkillIds: _selectedSkills,
              onChanged: (skills) =>
                  setState(() => _selectedSkills = skills),
            ),
            const SizedBox(height: 20),
            Text('Notes', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'What went well? What did you cover?',
              ),
            ),
            const SizedBox(height: 20),
            Text('Areas to Improve', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            TextField(
              controller: _improveController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'What should the student practice?',
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save Lesson Log'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 8: Create `lib/features/lesson_logs/presentation/lesson_logs_list_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/lesson_logs_repository.dart';
import '../domain/lesson_log.dart';

class LessonLogsListScreen extends ConsumerWidget {
  final String studentId;

  const LessonLogsListScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return StreamBuilder(
      stream: ref.watch(lessonLogsRepositoryProvider).getLogs(studentId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator();
        }

        final logs = snapshot.data ?? [];

        if (logs.isEmpty) {
          return const EmptyState(
            icon: Icons.note_outlined,
            title: 'No Lesson Logs',
            subtitle: 'Logs will appear here after lessons are completed',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: logs.length,
          itemBuilder: (context, index) {
            final log = logs[index];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          log.date.formatDateMedium,
                          style: theme.textTheme.titleSmall,
                        ),
                        Text(
                          '${log.duration}min',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (log.skillsCovered.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: log.skillsCovered.map((s) {
                          return Chip(
                            label: Text(s),
                            visualDensity: VisualDensity.compact,
                            labelStyle: const TextStyle(fontSize: 11),
                          );
                        }).toList(),
                      ),
                    ],
                    if (log.notes != null) ...[
                      const SizedBox(height: 8),
                      Text(log.notes!, style: theme.textTheme.bodyMedium),
                    ],
                    if (log.areasToImprove != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Improve: ${log.areasToImprove}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add lib/features/lesson_logs/ test/features/lesson_logs/
git commit -m "feat: add lesson logs — model, repository, form, and list screens"
```

---

## Task 13: Progress Tracking — Data & Domain

**Files:**
- Create: `lib/features/progress/domain/skill.dart`
- Create: `lib/features/progress/domain/dvsa_skills.dart`
- Create: `lib/features/progress/data/progress_repository.dart`
- Create: `test/features/progress/domain/dvsa_skills_test.dart`
- Create: `test/features/progress/data/progress_repository_test.dart`

- [ ] **Step 1: Create `lib/features/progress/domain/skill.dart`**

```dart
class Skill {
  final String id;
  final String name;
  final String category; // "manoeuvres", "road_skills", "custom"
  final int rating; // 1-5, 0 = not rated
  final DateTime? lastUpdated;
  final String? instructorNotes;
  final bool isCustom;

  const Skill({
    required this.id,
    required this.name,
    required this.category,
    this.rating = 0,
    this.lastUpdated,
    this.instructorNotes,
    this.isCustom = false,
  });

  String get ratingLabel {
    switch (rating) {
      case 1: return 'Not introduced';
      case 2: return 'Needs work';
      case 3: return 'Developing';
      case 4: return 'Competent';
      case 5: return 'Test ready';
      default: return 'Not rated';
    }
  }

  factory Skill.fromMap(Map<String, dynamic> map, String id) {
    return Skill(
      id: id,
      name: map['skillName'] as String? ?? '',
      category: map['category'] as String? ?? 'custom',
      rating: map['rating'] as int? ?? 0,
      lastUpdated: map['lastUpdated'] != null
          ? (map['lastUpdated'] is DateTime
              ? map['lastUpdated'] as DateTime
              : (map['lastUpdated'] as dynamic).toDate())
          : null,
      instructorNotes: map['instructorNotes'] as String?,
      isCustom: map['isCustom'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'skillName': name,
      'category': category,
      'rating': rating,
      'lastUpdated': lastUpdated ?? DateTime.now(),
      'instructorNotes': instructorNotes,
      'isCustom': isCustom,
    };
  }
}
```

- [ ] **Step 2: Create `lib/features/progress/domain/dvsa_skills.dart`**

```dart
import 'skill.dart';

abstract final class DvsaSkills {
  static const Map<String, List<Skill>> categories = {
    'Manoeuvres': [
      Skill(id: 'parallel_parking', name: 'Parallel Parking', category: 'manoeuvres'),
      Skill(id: 'bay_parking_forward', name: 'Bay Parking (Forward)', category: 'manoeuvres'),
      Skill(id: 'bay_parking_reverse', name: 'Bay Parking (Reverse)', category: 'manoeuvres'),
      Skill(id: 'emergency_stop', name: 'Emergency Stop', category: 'manoeuvres'),
      Skill(id: 'pulling_up_right', name: 'Pulling Up on the Right', category: 'manoeuvres'),
    ],
    'Road Skills': [
      Skill(id: 'junctions', name: 'Junctions', category: 'road_skills'),
      Skill(id: 'roundabouts', name: 'Roundabouts', category: 'road_skills'),
      Skill(id: 'speed_control', name: 'Speed Control', category: 'road_skills'),
      Skill(id: 'lane_discipline', name: 'Lane Discipline', category: 'road_skills'),
      Skill(id: 'mirror_use', name: 'Mirror Use (MSM)', category: 'road_skills'),
      Skill(id: 'independent_driving', name: 'Independent Driving', category: 'road_skills'),
      Skill(id: 'dual_carriageways', name: 'Dual Carriageways', category: 'road_skills'),
      Skill(id: 'pedestrian_crossings', name: 'Pedestrian Crossings', category: 'road_skills'),
    ],
  };

  static List<Skill> get allSkills =>
      categories.values.expand((skills) => skills).toList();

  static Skill? getById(String id) {
    for (final skills in categories.values) {
      for (final skill in skills) {
        if (skill.id == id) return skill;
      }
    }
    return null;
  }
}
```

- [ ] **Step 3: Write test — `test/features/progress/domain/dvsa_skills_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/progress/domain/dvsa_skills.dart';

void main() {
  group('DvsaSkills', () {
    test('allSkills returns 13 default skills', () {
      expect(DvsaSkills.allSkills.length, 13);
    });

    test('getById finds existing skill', () {
      final skill = DvsaSkills.getById('parallel_parking');
      expect(skill, isNotNull);
      expect(skill!.name, 'Parallel Parking');
    });

    test('getById returns null for unknown id', () {
      expect(DvsaSkills.getById('unknown'), isNull);
    });

    test('categories contains Manoeuvres and Road Skills', () {
      expect(DvsaSkills.categories.keys, containsAll(['Manoeuvres', 'Road Skills']));
    });
  });
}
```

- [ ] **Step 4: Run test**

```bash
flutter test test/features/progress/domain/dvsa_skills_test.dart
```

Expected: All PASS.

- [ ] **Step 5: Write repository test — `test/features/progress/data/progress_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/progress/data/progress_repository.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late ProgressRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = ProgressRepository(
      firestore: fakeFirestore,
      instructorId: 'inst123',
    );
  });

  group('ProgressRepository', () {
    test('updateSkillRating creates or updates skill progress', () async {
      await repository.updateSkillRating(
        studentId: 'student1',
        skillId: 'parallel_parking',
        skillName: 'Parallel Parking',
        category: 'manoeuvres',
        rating: 3,
        notes: 'Getting better',
      );

      final doc = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .doc('student1')
          .collection('progress')
          .doc('parallel_parking')
          .get();

      expect(doc.exists, isTrue);
      expect(doc.data()?['rating'], 3);
      expect(doc.data()?['instructorNotes'], 'Getting better');
    });

    test('getProgress returns list of skills', () async {
      await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .doc('student1')
          .collection('progress')
          .doc('roundabouts')
          .set({
        'skillName': 'Roundabouts',
        'category': 'road_skills',
        'rating': 4,
        'lastUpdated': DateTime.now(),
      });

      final skills = await repository.getProgress('student1').first;
      expect(skills.length, 1);
      expect(skills.first.rating, 4);
    });

    test('initializeDefaultSkills creates all DVSA skills', () async {
      await repository.initializeDefaultSkills('student1');

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .doc('student1')
          .collection('progress')
          .get();

      expect(snapshot.docs.length, 13); // 5 manoeuvres + 8 road skills
    });
  });
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
flutter test test/features/progress/data/progress_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 7: Implement `lib/features/progress/data/progress_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/dvsa_skills.dart';
import '../domain/skill.dart';

final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return ProgressRepository(
    firestore: FirebaseFirestore.instance,
    instructorId: uid,
  );
});

class ProgressRepository {
  final FirebaseFirestore firestore;
  final String instructorId;

  ProgressRepository({
    required this.firestore,
    required this.instructorId,
  });

  CollectionReference _progressRef(String studentId) => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('students')
      .doc(studentId)
      .collection('progress');

  Stream<List<Skill>> getProgress(String studentId) {
    return _progressRef(studentId).snapshots().map((snapshot) => snapshot.docs
        .map(
            (doc) => Skill.fromMap(doc.data() as Map<String, dynamic>, doc.id))
        .toList());
  }

  Future<void> updateSkillRating({
    required String studentId,
    required String skillId,
    required String skillName,
    required String category,
    required int rating,
    String? notes,
  }) async {
    await _progressRef(studentId).doc(skillId).set({
      'skillName': skillName,
      'category': category,
      'rating': rating,
      'lastUpdated': DateTime.now(),
      'instructorNotes': notes,
    }, SetOptions(merge: true));
  }

  Future<void> initializeDefaultSkills(String studentId) async {
    final batch = firestore.batch();

    for (final skill in DvsaSkills.allSkills) {
      batch.set(
        _progressRef(studentId).doc(skill.id),
        skill.toMap(),
      );
    }

    await batch.commit();
  }

  Future<void> addCustomSkill({
    required String studentId,
    required String name,
    required String category,
  }) async {
    final id = name.toLowerCase().replaceAll(' ', '_');
    await _progressRef(studentId).doc(id).set({
      'skillName': name,
      'category': category,
      'rating': 0,
      'lastUpdated': DateTime.now(),
      'isCustom': true,
    });
  }
}
```

- [ ] **Step 8: Run tests**

```bash
flutter test test/features/progress/
```

Expected: All PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/features/progress/data/ lib/features/progress/domain/ test/features/progress/
git commit -m "feat: add progress tracking — Skill model, DVSA skills, ProgressRepository"
```

---

## Task 14: Progress Tracking — Presentation

**Files:**
- Create: `lib/features/progress/presentation/widgets/rating_indicator.dart`
- Create: `lib/features/progress/presentation/widgets/skill_card.dart`
- Create: `lib/features/progress/presentation/progress_screen.dart`

- [ ] **Step 1: Create `lib/features/progress/presentation/widgets/rating_indicator.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_motion.dart';

class RatingIndicator extends StatelessWidget {
  final int rating; // 0-5
  final ValueChanged<int>? onChanged;
  final double size;

  const RatingIndicator({
    super.key,
    required this.rating,
    this.onChanged,
    this.size = 28,
  });

  Color _colorForRating(int r) {
    if (r <= 2) return AppColors.ratingLow;
    if (r == 3) return AppColors.ratingMedium;
    return AppColors.ratingHigh;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final filled = index < rating;
        final color = filled ? _colorForRating(rating) : Colors.grey.shade300;

        return GestureDetector(
          onTap: onChanged != null ? () => onChanged!(index + 1) : null,
          child: AnimatedContainer(
            duration: AppMotion.fast,
            width: size,
            height: size,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color: filled ? color : Colors.transparent,
              border: Border.all(color: color, width: 2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontSize: size * 0.4,
                  fontWeight: FontWeight.bold,
                  color: filled ? AppColors.textOnPrimary : color,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
```

- [ ] **Step 2: Create `lib/features/progress/presentation/widgets/skill_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/skill.dart';
import 'rating_indicator.dart';

class SkillCard extends StatelessWidget {
  final Skill skill;
  final ValueChanged<int>? onRatingChanged;

  const SkillCard({
    super.key,
    required this.skill,
    this.onRatingChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(skill.name, style: theme.textTheme.titleSmall),
                ),
                if (skill.isCustom)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundAccent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Custom',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                RatingIndicator(
                  rating: skill.rating,
                  onChanged: onRatingChanged,
                ),
                Text(
                  skill.ratingLabel,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            if (skill.instructorNotes != null) ...[
              const SizedBox(height: 8),
              Text(
                skill.instructorNotes!,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Create `lib/features/progress/presentation/progress_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/progress_repository.dart';
import '../domain/dvsa_skills.dart';
import '../domain/skill.dart';
import 'widgets/skill_card.dart';

class ProgressScreen extends ConsumerWidget {
  final String studentId;
  final bool editable; // false for student view

  const ProgressScreen({
    super.key,
    required this.studentId,
    this.editable = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return StreamBuilder<List<Skill>>(
      stream: ref.watch(progressRepositoryProvider).getProgress(studentId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator();
        }

        final skills = snapshot.data ?? [];

        if (skills.isEmpty) {
          return EmptyState(
            icon: Icons.trending_up,
            title: 'No Progress Data',
            subtitle: 'Initialize DVSA skills to start tracking',
            actionLabel: editable ? 'Initialize Skills' : null,
            onAction: editable
                ? () async {
                    await ref
                        .read(progressRepositoryProvider)
                        .initializeDefaultSkills(studentId);
                  }
                : null,
          );
        }

        // Group by category
        final grouped = <String, List<Skill>>{};
        for (final skill in skills) {
          final label = skill.category == 'manoeuvres'
              ? 'Manoeuvres'
              : skill.category == 'road_skills'
                  ? 'Road Skills'
                  : 'Custom';
          grouped.putIfAbsent(label, () => []).add(skill);
        }

        return ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: grouped.entries.map((entry) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    entry.key,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ),
                ...entry.value.map((skill) {
                  return SkillCard(
                    skill: skill,
                    onRatingChanged: editable
                        ? (rating) {
                            ref
                                .read(progressRepositoryProvider)
                                .updateSkillRating(
                                  studentId: studentId,
                                  skillId: skill.id,
                                  skillName: skill.name,
                                  category: skill.category,
                                  rating: rating,
                                );
                          }
                        : null,
                  );
                }),
              ],
            );
          }).toList(),
        );
      },
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/features/progress/presentation/
git commit -m "feat: add progress tracking UI — skill cards with rating indicators"
```

---

## Task 15: Messages

**Files:**
- Create: `lib/features/messages/domain/message.dart`
- Create: `lib/features/messages/data/messages_repository.dart`
- Create: `lib/features/messages/presentation/widgets/message_bubble.dart`
- Create: `lib/features/messages/presentation/conversations_screen.dart`
- Create: `lib/features/messages/presentation/chat_screen.dart`
- Create: `test/features/messages/data/messages_repository_test.dart`

- [ ] **Step 1: Create `lib/features/messages/domain/message.dart`**

```dart
class Message {
  final String id;
  final String fromId;
  final String toId;
  final String fromRole; // "instructor" or "student"
  final String text;
  final String? attachmentUrl;
  final DateTime createdAt;
  final bool read;

  const Message({
    required this.id,
    required this.fromId,
    required this.toId,
    required this.fromRole,
    required this.text,
    this.attachmentUrl,
    required this.createdAt,
    this.read = false,
  });

  factory Message.fromMap(Map<String, dynamic> map, String id) {
    return Message(
      id: id,
      fromId: map['fromId'] as String? ?? '',
      toId: map['toId'] as String? ?? '',
      fromRole: map['fromRole'] as String? ?? 'instructor',
      text: map['text'] as String? ?? '',
      attachmentUrl: map['attachmentUrl'] as String?,
      createdAt: map['createdAt'] is DateTime
          ? map['createdAt'] as DateTime
          : (map['createdAt'] as dynamic).toDate(),
      read: map['read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'fromId': fromId,
      'toId': toId,
      'fromRole': fromRole,
      'text': text,
      'attachmentUrl': attachmentUrl,
      'createdAt': createdAt,
      'read': read,
    };
  }
}
```

- [ ] **Step 2: Write test — `test/features/messages/data/messages_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/messages/data/messages_repository.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late MessagesRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = MessagesRepository(
      firestore: fakeFirestore,
      instructorId: 'inst123',
      currentUserId: 'inst123',
    );
  });

  group('MessagesRepository', () {
    test('sendMessage creates document', () async {
      await repository.sendMessage(
        toId: 'student1',
        text: 'Hello!',
        fromRole: 'instructor',
      );

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('messages')
          .get();

      expect(snapshot.docs.length, 1);
      expect(snapshot.docs.first.data()['text'], 'Hello!');
    });

    test('getConversation returns messages for a student', () async {
      final ref = fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('messages');

      await ref.add({
        'fromId': 'inst123',
        'toId': 'student1',
        'fromRole': 'instructor',
        'text': 'Hello!',
        'createdAt': DateTime.now(),
        'read': false,
      });
      await ref.add({
        'fromId': 'student1',
        'toId': 'inst123',
        'fromRole': 'student',
        'text': 'Hi!',
        'createdAt': DateTime.now(),
        'read': false,
      });

      final messages = await repository.getConversation('student1').first;
      expect(messages.length, 2);
    });
  });
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
flutter test test/features/messages/data/messages_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 4: Implement `lib/features/messages/data/messages_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/message.dart';

final messagesRepositoryProvider = Provider<MessagesRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return MessagesRepository(
    firestore: FirebaseFirestore.instance,
    instructorId: uid, // For student, this would be linkedInstructorId
    currentUserId: uid,
  );
});

class MessagesRepository {
  final FirebaseFirestore firestore;
  final String instructorId;
  final String currentUserId;

  MessagesRepository({
    required this.firestore,
    required this.instructorId,
    required this.currentUserId,
  });

  CollectionReference get _messagesRef => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('messages');

  Stream<List<Message>> getConversation(String otherUserId) {
    return _messagesRef
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) =>
              Message.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .where((m) =>
              (m.fromId == currentUserId && m.toId == otherUserId) ||
              (m.fromId == otherUserId && m.toId == currentUserId))
          .toList();
    });
  }

  Future<void> sendMessage({
    required String toId,
    required String text,
    required String fromRole,
  }) async {
    await _messagesRef.add({
      'fromId': currentUserId,
      'toId': toId,
      'fromRole': fromRole,
      'text': text,
      'createdAt': DateTime.now(),
      'read': false,
    });
  }

  Future<void> markAsRead(String messageId) async {
    await _messagesRef.doc(messageId).update({'read': true});
  }

  /// Returns the latest message per conversation partner
  Stream<Map<String, Message>> getLatestMessages() {
    return _messagesRef
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      final messages = snapshot.docs.map((doc) =>
          Message.fromMap(doc.data() as Map<String, dynamic>, doc.id));

      final latest = <String, Message>{};
      for (final m in messages) {
        final partnerId = m.fromId == currentUserId ? m.toId : m.fromId;
        if (!latest.containsKey(partnerId)) {
          latest[partnerId] = m;
        }
      }
      return latest;
    });
  }
}
```

- [ ] **Step 5: Run tests**

```bash
flutter test test/features/messages/
```

Expected: All PASS.

- [ ] **Step 6: Create `lib/features/messages/presentation/widgets/message_bubble.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/utils/date_helpers.dart';
import '../../domain/message.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMine;

  const MessageBubble({super.key, required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMine ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMine ? 16 : 4),
            bottomRight: Radius.circular(isMine ? 4 : 16),
          ),
          boxShadow: [
            if (!isMine)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              message.text,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isMine ? AppColors.textOnPrimary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              message.createdAt.formatTime,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isMine
                    ? AppColors.textOnPrimary.withValues(alpha: 0.7)
                    : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 7: Create `lib/features/messages/presentation/chat_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/messages_repository.dart';
import 'widgets/message_bubble.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String studentName;

  const ChatScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    ref.read(messagesRepositoryProvider).sendMessage(
          toId: widget.studentId,
          text: text,
          fromRole: 'instructor',
        );

    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final repo = ref.watch(messagesRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: Text(widget.studentName)),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder(
              stream: repo.getConversation(widget.studentId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const LoadingIndicator();
                }

                final messages = snapshot.data ?? [];

                if (messages.isEmpty) {
                  return Center(
                    child: Text(
                      'No messages yet.\nSend a message to start the conversation.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    return MessageBubble(
                      message: message,
                      isMine: message.fromId == repo.currentUserId,
                    );
                  },
                );
              },
            ),
          ),

          // Input bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.card,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: AppColors.textOnPrimary, size: 18),
                      onPressed: _send,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 8: Create `lib/features/messages/presentation/conversations_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../students/data/students_repository.dart';
import '../data/messages_repository.dart';
import '../domain/message.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: StreamBuilder<Map<String, Message>>(
        stream: ref.watch(messagesRepositoryProvider).getLatestMessages(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }

          final conversations = snapshot.data ?? {};

          if (conversations.isEmpty) {
            return const EmptyState(
              icon: Icons.chat_outlined,
              title: 'No Messages',
              subtitle: 'Start a conversation from a student\'s profile',
            );
          }

          final studentsAsync = ref.watch(studentsStreamProvider);

          return studentsAsync.when(
            data: (students) {
              final entries = conversations.entries.toList();

              return ListView.builder(
                itemCount: entries.length,
                itemBuilder: (context, index) {
                  final entry = entries[index];
                  final studentId = entry.key;
                  final lastMessage = entry.value;
                  final student = students
                      .where((s) => s.id == studentId)
                      .firstOrNull;
                  final name = student?.name ?? 'Unknown';

                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.backgroundAccent,
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    title: Text(name, style: theme.textTheme.titleMedium),
                    subtitle: Text(
                      lastMessage.text,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                    trailing: Text(
                      lastMessage.createdAt.formatTime,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    onTap: () => context.push(
                      '/instructor/messages/$studentId?name=${Uri.encodeComponent(name)}',
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingIndicator(),
            error: (e, _) => Center(child: Text('Error: $e')),
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add lib/features/messages/ test/features/messages/
git commit -m "feat: add messaging — conversations list, chat screen, message bubbles"
```

---

## Task 16: Subscription & Feature Gating

**Files:**
- Create: `lib/features/subscription/domain/subscription.dart`
- Create: `lib/features/subscription/data/subscription_repository.dart`
- Create: `lib/features/subscription/presentation/widgets/feature_gate.dart`
- Create: `lib/features/subscription/presentation/widgets/tier_card.dart`
- Create: `lib/features/subscription/presentation/paywall_screen.dart`
- Create: `lib/features/subscription/presentation/subscription_screen.dart`
- Create: `test/features/subscription/data/subscription_repository_test.dart`
- Create: `test/features/subscription/presentation/feature_gate_test.dart`

- [ ] **Step 1: Create `lib/features/subscription/domain/subscription.dart`**

```dart
enum SubscriptionTier { basic, pro, premium }

enum SubscriptionStatus { active, trialing, pastDue, canceled, none }

class AppSubscription {
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  const AppSubscription({
    required this.tier,
    required this.status,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  bool get isActive =>
      status == SubscriptionStatus.active ||
      status == SubscriptionStatus.trialing;

  bool get isTrial => status == SubscriptionStatus.trialing;

  // Feature access based on tier
  bool get hasUnlimitedStudents => tier != SubscriptionTier.basic;
  bool get hasFullProgress => tier != SubscriptionTier.basic;
  bool get hasMockTests => tier != SubscriptionTier.basic;
  bool get hasMessaging => tier != SubscriptionTier.basic;
  bool get hasBasicAnalytics => tier == SubscriptionTier.pro || tier == SubscriptionTier.premium;
  bool get hasFullAnalytics => tier == SubscriptionTier.premium;
  bool get hasResources => tier == SubscriptionTier.premium;
  int get maxStudents => tier == SubscriptionTier.basic ? 10 : 999999;

  static const none = AppSubscription(
    tier: SubscriptionTier.basic,
    status: SubscriptionStatus.none,
  );

  factory AppSubscription.fromMap(Map<String, dynamic> map) {
    return AppSubscription(
      tier: _parseTier(map['tier'] as String? ?? 'basic'),
      status: _parseStatus(map['status'] as String? ?? 'active'),
      currentPeriodEnd: map['currentPeriodEnd'] != null
          ? (map['currentPeriodEnd'] is DateTime
              ? map['currentPeriodEnd'] as DateTime
              : (map['currentPeriodEnd'] as dynamic).toDate())
          : null,
      cancelAtPeriodEnd: map['cancelAtPeriodEnd'] as bool? ?? false,
    );
  }

  static SubscriptionTier _parseTier(String value) {
    return SubscriptionTier.values.firstWhere(
      (t) => t.name == value,
      orElse: () => SubscriptionTier.basic,
    );
  }

  static SubscriptionStatus _parseStatus(String value) {
    switch (value) {
      case 'active': return SubscriptionStatus.active;
      case 'trialing': return SubscriptionStatus.trialing;
      case 'past_due': return SubscriptionStatus.pastDue;
      case 'canceled': return SubscriptionStatus.canceled;
      default: return SubscriptionStatus.none;
    }
  }
}
```

- [ ] **Step 2: Implement `lib/features/subscription/data/subscription_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/subscription.dart';

final subscriptionRepositoryProvider =
    Provider<SubscriptionRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return SubscriptionRepository(
    firestore: FirebaseFirestore.instance,
    uid: uid,
  );
});

final subscriptionProvider = StreamProvider<AppSubscription>((ref) {
  return ref.watch(subscriptionRepositoryProvider).watchSubscription();
});

class SubscriptionRepository {
  final FirebaseFirestore firestore;
  final String uid;

  SubscriptionRepository({required this.firestore, required this.uid});

  Stream<AppSubscription> watchSubscription() {
    return firestore
        .collection('customers')
        .doc(uid)
        .collection('subscriptions')
        .where('status', whereIn: ['active', 'trialing', 'past_due'])
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (snapshot.docs.isEmpty) return AppSubscription.none;
      return AppSubscription.fromMap(snapshot.docs.first.data());
    });
  }

  Future<String> createCheckoutSession({
    required String priceId,
    required String successUrl,
    required String cancelUrl,
  }) async {
    final docRef = await firestore
        .collection('customers')
        .doc(uid)
        .collection('checkout_sessions')
        .add({
      'price': priceId,
      'success_url': successUrl,
      'cancel_url': cancelUrl,
    });

    // Wait for the extension to populate the URL
    return docRef
        .snapshots()
        .firstWhere((snap) => snap.data()?['url'] != null)
        .then((snap) => snap.data()!['url'] as String);
  }
}
```

- [ ] **Step 3: Write FeatureGate test — `test/features/subscription/presentation/feature_gate_test.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/subscription/domain/subscription.dart';
import 'package:instructly/features/subscription/presentation/widgets/feature_gate.dart';

void main() {
  group('FeatureGate', () {
    testWidgets('shows child when feature is unlocked', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider.overrideWithValue(
              const AppSubscription(
                tier: SubscriptionTier.pro,
                status: SubscriptionStatus.active,
              ),
            ),
          ],
          child: const MaterialApp(
            home: FeatureGate(
              requiredTier: SubscriptionTier.pro,
              child: Text('Pro Feature'),
            ),
          ),
        ),
      );

      expect(find.text('Pro Feature'), findsOneWidget);
    });

    testWidgets('shows locked indicator when feature is locked', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionOverrideProvider.overrideWithValue(
              const AppSubscription(
                tier: SubscriptionTier.basic,
                status: SubscriptionStatus.active,
              ),
            ),
          ],
          child: const MaterialApp(
            home: FeatureGate(
              requiredTier: SubscriptionTier.premium,
              child: Text('Premium Feature'),
            ),
          ),
        ),
      );

      expect(find.text('Premium'), findsOneWidget);
      expect(find.text('Premium Feature'), findsNothing);
    });
  });
}
```

- [ ] **Step 4: Run test to verify it fails**

```bash
flutter test test/features/subscription/presentation/feature_gate_test.dart
```

Expected: FAIL.

- [ ] **Step 5: Implement `lib/features/subscription/presentation/widgets/feature_gate.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/subscription.dart';

// Override provider for testing
final subscriptionOverrideProvider = Provider<AppSubscription>((ref) {
  return AppSubscription.none;
});

class FeatureGate extends ConsumerWidget {
  final SubscriptionTier requiredTier;
  final Widget child;
  final Widget? lockedChild;

  const FeatureGate({
    super.key,
    required this.requiredTier,
    required this.child,
    this.lockedChild,
  });

  bool _isUnlocked(SubscriptionTier currentTier) {
    return currentTier.index >= requiredTier.index;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscription = ref.watch(subscriptionOverrideProvider);

    if (_isUnlocked(subscription.tier) && subscription.isActive) {
      return child;
    }

    if (lockedChild != null) return lockedChild!;

    return GestureDetector(
      onTap: () {
        // Navigate to subscription screen
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'This feature requires ${requiredTier.name.toUpperCase()}. Upgrade to unlock.',
            ),
            action: SnackBarAction(
              label: 'Upgrade',
              onPressed: () {
                // Navigate to paywall
              },
            ),
          ),
        );
      },
      child: Stack(
        children: [
          Opacity(
            opacity: 0.3,
            child: IgnorePointer(child: child),
          ),
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                requiredTier.name[0].toUpperCase() +
                    requiredTier.name.substring(1),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
flutter test test/features/subscription/presentation/feature_gate_test.dart
```

Expected: All PASS.

- [ ] **Step 7: Create `lib/features/subscription/presentation/widgets/tier_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class TierCard extends StatelessWidget {
  final String name;
  final String price;
  final List<String> features;
  final bool isRecommended;
  final bool isCurrent;
  final VoidCallback onSelect;

  const TierCard({
    super.key,
    required this.name,
    required this.price,
    required this.features,
    this.isRecommended = false,
    this.isCurrent = false,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isRecommended
            ? const BorderSide(color: AppColors.primary, width: 2)
            : BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(name, style: theme.textTheme.headlineMedium),
                if (isRecommended)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Best Value',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textOnPrimary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: price,
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                  TextSpan(
                    text: '/month',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ...features.map((f) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle,
                          size: 16, color: AppColors.success),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(f, style: theme.textTheme.bodySmall),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: isCurrent
                  ? OutlinedButton(
                      onPressed: null,
                      child: const Text('Current Plan'),
                    )
                  : ElevatedButton(
                      onPressed: onSelect,
                      child: const Text('Select'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 8: Create `lib/features/subscription/presentation/paywall_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme/app_colors.dart';
import '../data/subscription_repository.dart';
import '../domain/subscription.dart';
import 'widgets/tier_card.dart';

class PaywallScreen extends ConsumerWidget {
  const PaywallScreen({super.key});

  // These will come from your Stripe dashboard
  static const _priceIds = {
    SubscriptionTier.basic: 'price_basic_monthly',
    SubscriptionTier.pro: 'price_pro_monthly',
    SubscriptionTier.premium: 'price_premium_monthly',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final subscriptionAsync = ref.watch(subscriptionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Plan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Unlock Your Potential',
              style: theme.textTheme.displayMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Choose the plan that works for you',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            TierCard(
              name: 'Basic',
              price: '\u00A36.99',
              features: [
                'Up to 10 students',
                'Booking system',
                'Lesson notes',
                'Basic progress tracking',
              ],
              isCurrent: subscriptionAsync.value?.tier == SubscriptionTier.basic,
              onSelect: () => _subscribe(ref, SubscriptionTier.basic),
            ),
            const SizedBox(height: 12),

            TierCard(
              name: 'Pro',
              price: '\u00A312.99',
              isRecommended: true,
              features: [
                'Unlimited students',
                'Full DVSA progress tracking',
                'Mock tests',
                'Messaging',
                'Basic analytics',
              ],
              isCurrent: subscriptionAsync.value?.tier == SubscriptionTier.pro,
              onSelect: () => _subscribe(ref, SubscriptionTier.pro),
            ),
            const SizedBox(height: 12),

            TierCard(
              name: 'Premium',
              price: '\u00A319.99',
              features: [
                'Everything in Pro',
                'Full analytics dashboard',
                'Learning resources',
                'Priority support',
                'Future: WhatsApp integration',
              ],
              isCurrent: subscriptionAsync.value?.tier == SubscriptionTier.premium,
              onSelect: () => _subscribe(ref, SubscriptionTier.premium),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _subscribe(WidgetRef ref, SubscriptionTier tier) async {
    final priceId = _priceIds[tier]!;
    final repo = ref.read(subscriptionRepositoryProvider);

    final url = await repo.createCheckoutSession(
      priceId: priceId,
      successUrl: 'https://instructly.app/success',
      cancelUrl: 'https://instructly.app/cancel',
    );

    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add lib/features/subscription/ test/features/subscription/
git commit -m "feat: add subscription system — tier model, Stripe checkout, feature gating, paywall"
```

---

## Task 17: Cloud Functions

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/index.ts`
- Create: `functions/src/auth/on_user_created.ts`
- Create: `functions/src/bookings/on_booking_created.ts`
- Create: `functions/src/bookings/on_booking_updated.ts`
- Create: `functions/src/bookings/send_reminders.ts`
- Create: `functions/src/notifications/send_push.ts`
- Create: `functions/src/invites/claim_invite.ts`

- [ ] **Step 1: Create `functions/package.json`**

```json
{
  "name": "instructly-functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create `functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

- [ ] **Step 3: Create `functions/src/notifications/send_push.ts`**

```typescript
import * as admin from "firebase-admin";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  // Get user's FCM token
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;

  if (!fcmToken) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data,
    });
  } catch (error) {
    console.error(`Failed to send push to ${userId}:`, error);
  }

  // Store notification in Firestore for in-app history
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .add({
      type: data?.type ?? "general",
      title,
      body,
      relatedId: data?.relatedId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
}
```

- [ ] **Step 4: Create `functions/src/bookings/on_booking_created.ts`**

```typescript
import * as functions from "firebase-functions";
import { sendPushNotification } from "../notifications/send_push";

export const onBookingCreated = functions.firestore
  .document("instructors/{instructorId}/bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const studentId = booking.studentId;
    const instructorId = context.params.instructorId;

    if (!studentId) return;

    await sendPushNotification(
      studentId,
      "Lesson Booked",
      `Your lesson on ${booking.startTime.toDate().toLocaleDateString()} has been confirmed.`,
      {
        type: "booking_confirmed",
        relatedId: context.params.bookingId,
      }
    );
  });
```

- [ ] **Step 5: Create `functions/src/bookings/on_booking_updated.ts`**

```typescript
import * as functions from "firebase-functions";
import { sendPushNotification } from "../notifications/send_push";

export const onBookingUpdated = functions.firestore
  .document("instructors/{instructorId}/bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Booking cancelled
    if (before.status !== "cancelled" && after.status === "cancelled") {
      const studentId = after.studentId;

      await sendPushNotification(
        studentId,
        "Lesson Cancelled",
        `Your lesson on ${after.startTime.toDate().toLocaleDateString()} has been cancelled.${after.cancellationReason ? ` Reason: ${after.cancellationReason}` : ""}`,
        {
          type: "booking_cancelled",
          relatedId: context.params.bookingId,
        }
      );
    }

    // Booking completed
    if (before.status !== "completed" && after.status === "completed") {
      const studentId = after.studentId;

      await sendPushNotification(
        studentId,
        "Lesson Completed",
        "Your lesson has been completed. Check your progress for updates.",
        {
          type: "booking_completed",
          relatedId: context.params.bookingId,
        }
      );
    }
  });
```

- [ ] **Step 6: Create `functions/src/bookings/send_reminders.ts`**

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../notifications/send_push";

// Runs every hour
export const sendBookingReminders = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    const instructorsSnap = await admin
      .firestore()
      .collection("instructors")
      .get();

    for (const instructorDoc of instructorsSnap.docs) {
      const bookingsSnap = await instructorDoc.ref
        .collection("bookings")
        .where("status", "==", "confirmed")
        .where("startTime", ">=", now)
        .where("startTime", "<=", twentyFourHoursFromNow)
        .get();

      for (const bookingDoc of bookingsSnap.docs) {
        const booking = bookingDoc.data();
        const startTime = booking.startTime.toDate();
        const hoursUntil =
          (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if we should send a reminder (2h or 24h window)
        const reminderKey2h = `reminder_2h_${bookingDoc.id}`;
        const reminderKey24h = `reminder_24h_${bookingDoc.id}`;

        if (hoursUntil <= 2.5 && hoursUntil > 1.5) {
          // 2-hour reminder
          const alreadySent = booking[reminderKey2h];
          if (!alreadySent) {
            await sendPushNotification(
              booking.studentId,
              "Lesson in 2 Hours",
              `Your lesson starts at ${startTime.toLocaleTimeString()}.${booking.pickupLocation ? ` Pickup: ${booking.pickupLocation}` : ""}`,
              { type: "reminder", relatedId: bookingDoc.id }
            );
            await sendPushNotification(
              instructorDoc.id,
              "Lesson in 2 Hours",
              `Lesson with ${booking.studentName} at ${startTime.toLocaleTimeString()}.`,
              { type: "reminder", relatedId: bookingDoc.id }
            );
            await bookingDoc.ref.update({ [reminderKey2h]: true });
          }
        }

        if (hoursUntil <= 24.5 && hoursUntil > 23.5) {
          // 24-hour reminder
          const alreadySent = booking[reminderKey24h];
          if (!alreadySent) {
            await sendPushNotification(
              booking.studentId,
              "Lesson Tomorrow",
              `You have a lesson tomorrow at ${startTime.toLocaleTimeString()}.`,
              { type: "reminder", relatedId: bookingDoc.id }
            );
            await bookingDoc.ref.update({ [reminderKey24h]: true });
          }
        }
      }
    }
  });
```

- [ ] **Step 7: Create `functions/src/invites/claim_invite.ts`**

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const claimInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const { code } = data;

  if (!code || typeof code !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invite code required"
    );
  }

  const upperCode = code.toUpperCase();

  // Search all instructors' invites for this code
  const instructorsSnap = await admin
    .firestore()
    .collection("instructors")
    .get();

  for (const instructorDoc of instructorsSnap.docs) {
    const inviteDoc = await instructorDoc.ref
      .collection("invites")
      .doc(upperCode)
      .get();

    if (inviteDoc.exists) {
      const invite = inviteDoc.data()!;

      if (invite.claimed) {
        throw new functions.https.HttpsError(
          "already-exists",
          "This invite has already been used"
        );
      }

      const expiresAt = invite.expiresAt.toDate();
      if (expiresAt < new Date()) {
        throw new functions.https.HttpsError(
          "deadline-exceeded",
          "This invite has expired"
        );
      }

      return {
        instructorId: instructorDoc.id,
        valid: true,
      };
    }
  }

  throw new functions.https.HttpsError("not-found", "Invalid invite code");
});
```

- [ ] **Step 8: Create `functions/src/index.ts`**

```typescript
import * as admin from "firebase-admin";

admin.initializeApp();

export { onBookingCreated } from "./bookings/on_booking_created";
export { onBookingUpdated } from "./bookings/on_booking_updated";
export { sendBookingReminders } from "./bookings/send_reminders";
export { claimInvite } from "./invites/claim_invite";
```

- [ ] **Step 9: Install dependencies and build**

```bash
cd functions && npm install && npm run build
```

Expected: TypeScript compiles without errors.

- [ ] **Step 10: Commit**

```bash
cd .. && git add functions/
git commit -m "feat: add Cloud Functions — booking notifications, reminders, invite claiming"
```

---

## Task 18: FCM Service & Notifications Screen

**Files:**
- Create: `lib/shared/services/fcm_service.dart`
- Create: `lib/features/notifications/domain/app_notification.dart`
- Create: `lib/features/notifications/data/notifications_repository.dart`
- Create: `lib/features/notifications/presentation/notifications_screen.dart`

- [ ] **Step 1: Create `lib/shared/services/fcm_service.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permissions
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get and save token
    final token = await _messaging.getToken();
    if (token != null) {
      await _saveToken(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_saveToken);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Handle in-app notification display
      // This will be shown as a snackbar or overlay
    });

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      // Navigate to relevant screen based on message data
    });
  }

  Future<void> _saveToken(String token) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    await FirebaseFirestore.instance.collection('users').doc(uid).update({
      'fcmToken': token,
    });
  }
}
```

- [ ] **Step 2: Create `lib/features/notifications/domain/app_notification.dart`**

```dart
class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? relatedId;
  final DateTime createdAt;
  final bool read;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.relatedId,
    required this.createdAt,
    this.read = false,
  });

  factory AppNotification.fromMap(Map<String, dynamic> map, String id) {
    return AppNotification(
      id: id,
      type: map['type'] as String? ?? 'general',
      title: map['title'] as String? ?? '',
      body: map['body'] as String? ?? '',
      relatedId: map['relatedId'] as String?,
      createdAt: map['createdAt'] is DateTime
          ? map['createdAt'] as DateTime
          : (map['createdAt'] as dynamic).toDate(),
      read: map['read'] as bool? ?? false,
    );
  }
}
```

- [ ] **Step 3: Create `lib/features/notifications/data/notifications_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/app_notification.dart';

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return NotificationsRepository(
    firestore: FirebaseFirestore.instance,
    uid: uid,
  );
});

final notificationsStreamProvider =
    StreamProvider<List<AppNotification>>((ref) {
  return ref.watch(notificationsRepositoryProvider).watchNotifications();
});

class NotificationsRepository {
  final FirebaseFirestore firestore;
  final String uid;

  NotificationsRepository({required this.firestore, required this.uid});

  Stream<List<AppNotification>> watchNotifications() {
    return firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AppNotification.fromMap(doc.data(), doc.id))
            .toList());
  }

  Future<void> markAsRead(String notificationId) async {
    await firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .doc(notificationId)
        .update({'read': true});
  }

  Future<void> markAllAsRead() async {
    final snapshot = await firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .where('read', isEqualTo: false)
        .get();

    final batch = firestore.batch();
    for (final doc in snapshot.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  Stream<int> watchUnreadCount() {
    return firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .where('read', isEqualTo: false)
        .snapshots()
        .map((snapshot) => snapshot.docs.length);
  }
}
```

- [ ] **Step 4: Create `lib/features/notifications/presentation/notifications_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/notifications_repository.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notificationsAsync = ref.watch(notificationsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () =>
                ref.read(notificationsRepositoryProvider).markAllAsRead(),
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          if (notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none,
              title: 'No Notifications',
              subtitle: 'You\'re all caught up',
            );
          }

          return ListView.builder(
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final notif = notifications[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: notif.read
                      ? Colors.grey.shade200
                      : AppColors.primary.withValues(alpha: 0.15),
                  child: Icon(
                    _iconForType(notif.type),
                    color:
                        notif.read ? AppColors.textSecondary : AppColors.primary,
                    size: 20,
                  ),
                ),
                title: Text(
                  notif.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: notif.read ? FontWeight.normal : FontWeight.bold,
                  ),
                ),
                subtitle: Text(notif.body, style: theme.textTheme.bodySmall),
                trailing: Text(
                  notif.createdAt.formatDateShort,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                onTap: () {
                  if (!notif.read) {
                    ref
                        .read(notificationsRepositoryProvider)
                        .markAsRead(notif.id);
                  }
                  // Navigate to related content based on type
                },
              );
            },
          );
        },
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'booking_confirmed': return Icons.event_available;
      case 'booking_cancelled': return Icons.event_busy;
      case 'booking_completed': return Icons.check_circle;
      case 'reminder': return Icons.alarm;
      case 'message': return Icons.chat;
      default: return Icons.notifications;
    }
  }
}
```

- [ ] **Step 5: Initialize FCM in `lib/main.dart`**

Update `main.dart` to include FCM initialization:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'firebase_options.dart';
import 'shared/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await FcmService().initialize();
  runApp(const ProviderScope(child: InstructlyApp()));
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/shared/services/ lib/features/notifications/ lib/main.dart
git commit -m "feat: add notifications — FCM service, notifications repository, notifications screen"
```

---

## Task 19: Instructor Dashboard

**Files:**
- Create: `lib/features/dashboard/presentation/widgets/today_lessons_card.dart`
- Create: `lib/features/dashboard/presentation/widgets/quick_stats_card.dart`
- Create: `lib/features/dashboard/presentation/instructor_dashboard_screen.dart`
- Modify: `lib/app/router/app_router.dart`

- [ ] **Step 1: Create `lib/features/dashboard/presentation/widgets/quick_stats_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class QuickStatsCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  const QuickStatsCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cardColor = color ?? AppColors.primary;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: cardColor, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.headlineMedium?.copyWith(
                color: cardColor,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Create `lib/features/dashboard/presentation/widgets/today_lessons_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/utils/date_helpers.dart';
import '../../../bookings/domain/booking.dart';

class TodayLessonsCard extends StatelessWidget {
  final List<Booking> todayBookings;
  final VoidCallback onViewCalendar;

  const TodayLessonsCard({
    super.key,
    required this.todayBookings,
    required this.onViewCalendar,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final upcoming = todayBookings
        .where((b) => b.status == BookingStatus.confirmed)
        .toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Today's Lessons", style: theme.textTheme.titleMedium),
                TextButton(
                  onPressed: onViewCalendar,
                  child: const Text('View All'),
                ),
              ],
            ),
            if (upcoming.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No lessons scheduled for today',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              )
            else
              ...upcoming.map((booking) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Container(
                          width: 4,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${booking.startTime.formatTime} - ${booking.studentName}',
                              style: theme.textTheme.titleSmall,
                            ),
                            if (booking.pickupLocation != null)
                              Text(
                                booking.pickupLocation!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Create `lib/features/dashboard/presentation/instructor_dashboard_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../bookings/data/bookings_repository.dart';
import '../../bookings/presentation/calendar_screen.dart';
import '../../students/data/students_repository.dart';
import 'widgets/quick_stats_card.dart';
import 'widgets/today_lessons_card.dart';

class InstructorDashboardScreen extends ConsumerWidget {
  const InstructorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final todayRange = (start: now.startOfDay, end: now.endOfDay);
    final todayBookings = ref.watch(bookingsForRangeProvider(todayRange));
    final studentsAsync = ref.watch(studentsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Instructly',
          style: theme.textTheme.displaySmall?.copyWith(
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/instructor/notifications'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting
            Text(
              'Good ${_greeting()}',
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),

            // Quick stats row
            studentsAsync.when(
              data: (students) {
                final activeCount =
                    students.where((s) => s.isActive).length;

                return Row(
                  children: [
                    Expanded(
                      child: QuickStatsCard(
                        label: 'Active Students',
                        value: '$activeCount',
                        icon: Icons.people,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: todayBookings.when(
                        data: (bookings) => QuickStatsCard(
                          label: 'Today\'s Lessons',
                          value: '${bookings.where((b) => b.status.name == 'confirmed').length}',
                          icon: Icons.calendar_today,
                          color: AppColors.secondary,
                        ),
                        loading: () => const QuickStatsCard(
                          label: 'Today\'s Lessons',
                          value: '...',
                          icon: Icons.calendar_today,
                        ),
                        error: (_, __) => const QuickStatsCard(
                          label: 'Today\'s Lessons',
                          value: '-',
                          icon: Icons.calendar_today,
                        ),
                      ),
                    ),
                  ],
                );
              },
              loading: () => const LoadingIndicator(),
              error: (e, _) => Text('Error: $e'),
            ),
            const SizedBox(height: 16),

            // Today's lessons
            todayBookings.when(
              data: (bookings) => TodayLessonsCard(
                todayBookings: bookings,
                onViewCalendar: () => context.go('/instructor/calendar'),
              ),
              loading: () => const LoadingIndicator(),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
}
```

- [ ] **Step 4: Update router with dashboard**

In `lib/app/router/app_router.dart`, add import:
```dart
import '../../features/dashboard/presentation/instructor_dashboard_screen.dart';
```

Replace the instructor dashboard placeholder:
```dart
StatefulShellBranch(routes: [
  GoRoute(
    path: '/instructor',
    builder: (context, state) => const InstructorDashboardScreen(),
  ),
]),
```

- [ ] **Step 5: Commit**

```bash
git add lib/features/dashboard/ lib/app/router/app_router.dart
git commit -m "feat: add instructor dashboard — today's lessons, quick stats"
```

---

## Task 20: Student App Screens

**Files:**
- Create: `lib/features/dashboard/presentation/student_home_screen.dart`
- Create: `lib/features/dashboard/presentation/widgets/next_lesson_card.dart`
- Modify: `lib/app/router/app_router.dart`

- [ ] **Step 1: Create `lib/features/dashboard/presentation/widgets/next_lesson_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/utils/date_helpers.dart';
import '../../../bookings/domain/booking.dart';

class NextLessonCard extends StatelessWidget {
  final Booking booking;

  const NextLessonCard({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.primary, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Next Lesson', style: theme.textTheme.labelLarge?.copyWith(
              color: AppColors.primary,
            )),
            const SizedBox(height: 8),
            Text(
              booking.startTime.formatDateFull,
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              '${booking.startTime.formatTime} - ${booking.endTime.formatTime} (${booking.duration}min)',
              style: theme.textTheme.bodyLarge,
            ),
            if (booking.pickupLocation != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    booking.pickupLocation!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Create `lib/features/dashboard/presentation/student_home_screen.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/date_helpers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../bookings/domain/booking.dart';
import 'widgets/next_lesson_card.dart';

final studentBookingsProvider = StreamProvider<List<Booking>>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;

  // Get the linked instructor ID from user doc
  return FirebaseFirestore.instance
      .collection('users')
      .doc(uid)
      .snapshots()
      .asyncExpand((userDoc) {
    final instructorId = userDoc.data()?['linkedInstructorId'] as String?;
    if (instructorId == null) return Stream.value(<Booking>[]);

    return FirebaseFirestore.instance
        .collection('instructors')
        .doc(instructorId)
        .collection('bookings')
        .where('studentId', isEqualTo: uid)
        .orderBy('startTime')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                Booking.fromMap(doc.data(), doc.id))
            .toList());
  });
});

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final bookingsAsync = ref.watch(studentBookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Bookings',
          style: theme.textTheme.titleLarge,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Navigate to notifications
            },
          ),
        ],
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          final now = DateTime.now();
          final upcoming = bookings
              .where((b) =>
                  b.startTime.isAfter(now) &&
                  b.status == BookingStatus.confirmed)
              .toList();
          final past = bookings
              .where((b) =>
                  b.startTime.isBefore(now) ||
                  b.status != BookingStatus.confirmed)
              .toList()
            ..sort((a, b) => b.startTime.compareTo(a.startTime));

          if (bookings.isEmpty) {
            return const EmptyState(
              icon: Icons.calendar_today_outlined,
              title: 'No Bookings Yet',
              subtitle: 'Your instructor will book lessons for you',
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Next lesson (hero card)
              if (upcoming.isNotEmpty) ...[
                NextLessonCard(booking: upcoming.first),
                const SizedBox(height: 24),
              ],

              // Upcoming
              if (upcoming.length > 1) ...[
                Text('Upcoming', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                ...upcoming.skip(1).map((booking) => Card(
                      child: ListTile(
                        leading: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '${booking.startTime.day}',
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                            Text(
                              booking.startTime.formatDateShort.split(' ').last,
                              style: theme.textTheme.labelSmall,
                            ),
                          ],
                        ),
                        title: Text(
                          '${booking.startTime.formatTime} - ${booking.endTime.formatTime}',
                          style: theme.textTheme.titleSmall,
                        ),
                        subtitle: booking.pickupLocation != null
                            ? Text(booking.pickupLocation!)
                            : null,
                      ),
                    )),
                const SizedBox(height: 24),
              ],

              // Past lessons
              if (past.isNotEmpty) ...[
                Text('Past Lessons', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                ...past.take(10).map((booking) => Card(
                      child: ListTile(
                        title: Text(
                          booking.startTime.formatDateMedium,
                          style: theme.textTheme.titleSmall,
                        ),
                        subtitle: Text(
                          '${booking.startTime.formatTime} - ${booking.duration}min',
                          style: theme.textTheme.bodySmall,
                        ),
                        trailing: Icon(
                          booking.status == BookingStatus.completed
                              ? Icons.check_circle
                              : Icons.cancel,
                          color: booking.status == BookingStatus.completed
                              ? AppColors.success
                              : AppColors.error,
                          size: 20,
                        ),
                      ),
                    )),
              ],
            ],
          );
        },
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
```

- [ ] **Step 3: Update router with student screens**

In `lib/app/router/app_router.dart`, add imports:
```dart
import '../../features/dashboard/presentation/student_home_screen.dart';
import '../../features/progress/presentation/progress_screen.dart';
```

Replace the student branches:
```dart
// Student shell with bottom nav
StatefulShellRoute.indexedStack(
  builder: (context, state, navigationShell) {
    return AppScaffold(
      navigationShell: navigationShell,
      isInstructor: false,
    );
  },
  branches: [
    StatefulShellBranch(routes: [
      GoRoute(
        path: '/student',
        builder: (context, state) => const StudentHomeScreen(),
      ),
    ]),
    StatefulShellBranch(routes: [
      GoRoute(
        path: '/student/progress',
        builder: (context, state) {
          final uid = FirebaseAuth.instance.currentUser!.uid;
          return ProgressScreen(
            studentId: uid,
            editable: false,
          );
        },
      ),
    ]),
    StatefulShellBranch(routes: [
      GoRoute(
        path: '/student/more',
        builder: (context, state) => const Placeholder(), // Settings etc.
      ),
    ]),
  ],
),
```

- [ ] **Step 4: Verify full build**

```bash
flutter run
```

Expected: Full app flow — login, register, onboarding, dashboard, calendar, students, progress, messages, notifications.

- [ ] **Step 5: Commit**

```bash
git add lib/features/dashboard/ lib/app/router/app_router.dart
git commit -m "feat: add student screens — bookings view, progress view, next lesson card"
```

---

## Summary

The full MVP implementation is covered across **20 tasks** in two plan documents:

| Part | Tasks | Covers |
|---|---|---|
| Part 1 | 1–9 | Scaffolding, theme, router, auth, onboarding, student management |
| Part 2 | 10–20 | Bookings, lesson logs, progress, messages, subscription, cloud functions, notifications, dashboard, student app |

All Firestore security rules, indexes, and Cloud Functions are included. The app follows feature-first architecture with Riverpod state management and TDD throughout.
