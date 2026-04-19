import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppTypography {
  static TextTheme get textTheme {
    final bodyFont = GoogleFonts.plusJakartaSans();
    final displayFont = GoogleFonts.dmSerifDisplay();

    return TextTheme(
      displayLarge: displayFont.copyWith(fontSize: 32, fontWeight: FontWeight.w400, height: 1.2),
      displayMedium: displayFont.copyWith(fontSize: 28, fontWeight: FontWeight.w400, height: 1.2),
      displaySmall: displayFont.copyWith(fontSize: 24, fontWeight: FontWeight.w400, height: 1.3),
      headlineLarge: bodyFont.copyWith(fontSize: 24, fontWeight: FontWeight.w700, height: 1.3),
      headlineMedium: bodyFont.copyWith(fontSize: 20, fontWeight: FontWeight.w700, height: 1.3),
      headlineSmall: bodyFont.copyWith(fontSize: 16, fontWeight: FontWeight.w700, height: 1.4),
      titleLarge: bodyFont.copyWith(fontSize: 20, fontWeight: FontWeight.w600, height: 1.4),
      titleMedium: bodyFont.copyWith(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4),
      titleSmall: bodyFont.copyWith(fontSize: 14, fontWeight: FontWeight.w600, height: 1.4),
      bodyLarge: bodyFont.copyWith(fontSize: 16, fontWeight: FontWeight.w400, height: 1.5),
      bodyMedium: bodyFont.copyWith(fontSize: 14, fontWeight: FontWeight.w400, height: 1.5),
      bodySmall: bodyFont.copyWith(fontSize: 12, fontWeight: FontWeight.w400, height: 1.5),
      labelLarge: bodyFont.copyWith(fontSize: 14, fontWeight: FontWeight.w600, height: 1.4, letterSpacing: 0.5),
      labelMedium: bodyFont.copyWith(fontSize: 12, fontWeight: FontWeight.w600, height: 1.4, letterSpacing: 0.5),
      labelSmall: bodyFont.copyWith(fontSize: 11, fontWeight: FontWeight.w500, height: 1.4, letterSpacing: 0.5),
    );
  }
}
