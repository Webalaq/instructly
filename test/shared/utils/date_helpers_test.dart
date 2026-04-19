import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/shared/utils/date_helpers.dart';

void main() {
  group('DateTimeExtension', () {
    final monday = DateTime(2024, 4, 15); // Monday
    final tuesday = DateTime(2024, 4, 16);
    final sunday = DateTime(2024, 4, 21); // Sunday

    group('isSameDay', () {
      test('returns true for same date with different times', () {
        final a = DateTime(2024, 4, 15, 8, 30);
        final b = DateTime(2024, 4, 15, 22, 0);
        expect(a.isSameDay(b), isTrue);
      });

      test('returns false for different dates', () {
        final a = DateTime(2024, 4, 15);
        final b = DateTime(2024, 4, 16);
        expect(a.isSameDay(b), isFalse);
      });

      test('returns false for different months', () {
        final a = DateTime(2024, 3, 15);
        final b = DateTime(2024, 4, 15);
        expect(a.isSameDay(b), isFalse);
      });

      test('returns false for different years', () {
        final a = DateTime(2023, 4, 15);
        final b = DateTime(2024, 4, 15);
        expect(a.isSameDay(b), isFalse);
      });
    });

    group('startOfDay', () {
      test('returns midnight of the same date', () {
        final dt = DateTime(2024, 4, 15, 14, 30, 45);
        final result = dt.startOfDay;
        expect(result, equals(DateTime(2024, 4, 15, 0, 0, 0)));
      });

      test('already midnight returns same time', () {
        final dt = DateTime(2024, 4, 15, 0, 0, 0);
        expect(dt.startOfDay, equals(DateTime(2024, 4, 15, 0, 0, 0)));
      });
    });

    group('endOfDay', () {
      test('returns 23:59:59 of the same date', () {
        final dt = DateTime(2024, 4, 15, 8, 0, 0);
        final result = dt.endOfDay;
        expect(result, equals(DateTime(2024, 4, 15, 23, 59, 59)));
      });
    });

    group('formatTime', () {
      test('formats time as HH:mm', () {
        final dt = DateTime(2024, 4, 15, 9, 5);
        expect(dt.formatTime, equals('09:05'));
      });

      test('formats afternoon time correctly', () {
        final dt = DateTime(2024, 4, 15, 14, 30);
        expect(dt.formatTime, equals('14:30'));
      });

      test('formats midnight correctly', () {
        final dt = DateTime(2024, 4, 15, 0, 0);
        expect(dt.formatTime, equals('00:00'));
      });
    });

    group('formatDateShort', () {
      test('formats as d MMM', () {
        final dt = DateTime(2024, 4, 15);
        expect(dt.formatDateShort, equals('15 Apr'));
      });

      test('formats single digit day', () {
        final dt = DateTime(2024, 4, 5);
        expect(dt.formatDateShort, equals('5 Apr'));
      });
    });

    group('formatDateFull', () {
      test('formats as EEEE, d MMMM yyyy', () {
        final dt = DateTime(2024, 4, 15);
        expect(dt.formatDateFull, equals('Monday, 15 April 2024'));
      });
    });

    group('formatDateMedium', () {
      test('formats as d MMM yyyy', () {
        final dt = DateTime(2024, 4, 15);
        expect(dt.formatDateMedium, equals('15 Apr 2024'));
      });
    });

    group('startOfWeek', () {
      test('Monday returns itself', () {
        expect(monday.startOfWeek, equals(DateTime(2024, 4, 15)));
      });

      test('Tuesday returns previous Monday', () {
        expect(tuesday.startOfWeek, equals(DateTime(2024, 4, 15)));
      });

      test('Sunday returns Monday of same week', () {
        expect(sunday.startOfWeek, equals(DateTime(2024, 4, 15)));
      });

      test('start of week is at midnight', () {
        final dt = DateTime(2024, 4, 17, 10, 30); // Wednesday
        final result = dt.startOfWeek;
        expect(result, equals(DateTime(2024, 4, 15, 0, 0, 0)));
      });
    });
  });
}
