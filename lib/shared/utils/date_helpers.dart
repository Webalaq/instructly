import 'package:intl/intl.dart';

extension DateTimeExtension on DateTime {
  bool isSameDay(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }

  DateTime get startOfDay => DateTime(year, month, day, 0, 0, 0);

  DateTime get endOfDay => DateTime(year, month, day, 23, 59, 59);

  String get formatTime => DateFormat('HH:mm').format(this);

  String get formatDateShort => DateFormat('d MMM').format(this);

  String get formatDateFull => DateFormat('EEEE, d MMMM yyyy').format(this);

  String get formatDateMedium => DateFormat('d MMM yyyy').format(this);

  DateTime get startOfWeek {
    // weekday: 1 = Monday, 7 = Sunday
    final daysFromMonday = weekday - 1;
    return DateTime(year, month, day - daysFromMonday, 0, 0, 0);
  }
}
