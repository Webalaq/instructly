# Instructly MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Instructly MVP — a Flutter + Firebase mobile app for driving instructors to manage students, bookings, progress tracking, lesson logs, messages, notifications, and subscriptions.

**Architecture:** Feature-first Flutter architecture with Riverpod for state management, GoRouter for navigation, and Firebase as the serverless backend (Auth, Firestore, Cloud Functions, FCM, Storage). Each feature follows a data/domain/presentation layer split.

**Tech Stack:** Flutter 3.x, Dart, Firebase (Auth, Firestore, Functions, Messaging, Storage, Remote Config), Stripe, Riverpod, GoRouter

**Spec:** `docs/superpowers/specs/2026-04-18-instructly-design.md`

---

## File Structure Overview

```
instructly/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── app_colors.dart
│   │   │   ├── app_typography.dart
│   │   │   └── app_motion.dart
│   │   └── router/
│   │       └── app_router.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── app_user.dart
│   │   │   └── presentation/
│   │   │       ├── login_screen.dart
│   │   │       ├── register_screen.dart
│   │   │       ├── role_select_screen.dart
│   │   │       └── widgets/
│   │   │           └── auth_form_field.dart
│   │   ├── onboarding/
│   │   │   ├── data/
│   │   │   │   └── onboarding_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── instructor_profile.dart
│   │   │   └── presentation/
│   │   │       ├── onboarding_screen.dart
│   │   │       ├── steps/
│   │   │       │   ├── profile_step.dart
│   │   │       │   ├── teaching_setup_step.dart
│   │   │       │   └── availability_step.dart
│   │   │       └── widgets/
│   │   │           └── time_range_picker.dart
│   │   ├── students/
│   │   │   ├── data/
│   │   │   │   └── students_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── student.dart
│   │   │   └── presentation/
│   │   │       ├── students_list_screen.dart
│   │   │       ├── student_detail_screen.dart
│   │   │       ├── add_student_screen.dart
│   │   │       └── widgets/
│   │   │           ├── student_card.dart
│   │   │           └── invite_dialog.dart
│   │   ├── bookings/
│   │   │   ├── data/
│   │   │   │   └── bookings_repository.dart
│   │   │   ├── domain/
│   │   │   │   ├── booking.dart
│   │   │   │   └── availability.dart
│   │   │   └── presentation/
│   │   │       ├── calendar_screen.dart
│   │   │       ├── booking_detail_screen.dart
│   │   │       ├── create_booking_screen.dart
│   │   │       └── widgets/
│   │   │           ├── day_cell.dart
│   │   │           ├── booking_tile.dart
│   │   │           └── time_slot_picker.dart
│   │   ├── lesson_logs/
│   │   │   ├── data/
│   │   │   │   └── lesson_logs_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── lesson_log.dart
│   │   │   └── presentation/
│   │   │       ├── lesson_log_form_screen.dart
│   │   │       ├── lesson_logs_list_screen.dart
│   │   │       └── widgets/
│   │   │           └── skill_chip_selector.dart
│   │   ├── progress/
│   │   │   ├── data/
│   │   │   │   └── progress_repository.dart
│   │   │   ├── domain/
│   │   │   │   ├── skill.dart
│   │   │   │   └── dvsa_skills.dart
│   │   │   └── presentation/
│   │   │       ├── progress_screen.dart
│   │   │       └── widgets/
│   │   │           ├── skill_card.dart
│   │   │           └── rating_indicator.dart
│   │   ├── messages/
│   │   │   ├── data/
│   │   │   │   └── messages_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── message.dart
│   │   │   └── presentation/
│   │   │       ├── conversations_screen.dart
│   │   │       ├── chat_screen.dart
│   │   │       └── widgets/
│   │   │           └── message_bubble.dart
│   │   ├── subscription/
│   │   │   ├── data/
│   │   │   │   └── subscription_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── subscription.dart
│   │   │   └── presentation/
│   │   │       ├── paywall_screen.dart
│   │   │       ├── subscription_screen.dart
│   │   │       └── widgets/
│   │   │           ├── tier_card.dart
│   │   │           └── feature_gate.dart
│   │   ├── notifications/
│   │   │   ├── data/
│   │   │   │   └── notifications_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── app_notification.dart
│   │   │   └── presentation/
│   │   │       └── notifications_screen.dart
│   │   └── dashboard/
│   │       └── presentation/
│   │           ├── instructor_dashboard_screen.dart
│   │           ├── student_home_screen.dart
│   │           └── widgets/
│   │               ├── today_lessons_card.dart
│   │               ├── quick_stats_card.dart
│   │               └── next_lesson_card.dart
│   └── shared/
│       ├── widgets/
│       │   ├── app_scaffold.dart
│       │   ├── loading_indicator.dart
│       │   └── empty_state.dart
│       ├── services/
│       │   └── fcm_service.dart
│       └── utils/
│           ├── date_helpers.dart
│           └── validators.dart
├── test/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/auth_repository_test.dart
│   │   │   └── presentation/login_screen_test.dart
│   │   ├── onboarding/
│   │   │   └── data/onboarding_repository_test.dart
│   │   ├── students/
│   │   │   ├── data/students_repository_test.dart
│   │   │   └── domain/student_test.dart
│   │   ├── bookings/
│   │   │   ├── data/bookings_repository_test.dart
│   │   │   ├── domain/booking_test.dart
│   │   │   └── domain/availability_test.dart
│   │   ├── lesson_logs/
│   │   │   └── data/lesson_logs_repository_test.dart
│   │   ├── progress/
│   │   │   ├── data/progress_repository_test.dart
│   │   │   └── domain/dvsa_skills_test.dart
│   │   ├── messages/
│   │   │   └── data/messages_repository_test.dart
│   │   ├── subscription/
│   │   │   ├── data/subscription_repository_test.dart
│   │   │   └── presentation/feature_gate_test.dart
│   │   └── notifications/
│   │       └── data/notifications_repository_test.dart
│   └── shared/
│       └── utils/
│           ├── date_helpers_test.dart
│           └── validators_test.dart
├── functions/               # Cloud Functions (Node.js)
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth/
│   │   │   └── on_user_created.ts
│   │   ├── bookings/
│   │   │   ├── on_booking_created.ts
│   │   │   ├── on_booking_updated.ts
│   │   │   └── send_reminders.ts
│   │   ├── invites/
│   │   │   └── claim_invite.ts
│   │   ├── notifications/
│   │   │   └── send_push.ts
│   │   └── subscriptions/
│   │       └── on_subscription_updated.ts
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

---

## Task 1: Flutter Project Scaffolding

**Files:**
- Create: `pubspec.yaml` (modify generated)
- Create: `lib/main.dart`
- Create: `lib/app/app.dart`
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`

- [ ] **Step 1: Create Flutter project**

```bash
flutter create instructly --org com.instructly --platforms ios,android
cd instructly
```

- [ ] **Step 2: Add dependencies to `pubspec.yaml`**

Replace the `dependencies` and `dev_dependencies` sections:

```yaml
dependencies:
  flutter:
    sdk: flutter
  # Firebase
  firebase_core: ^3.8.1
  firebase_auth: ^5.4.1
  cloud_firestore: ^5.6.4
  firebase_messaging: ^15.2.1
  firebase_storage: ^12.4.1
  firebase_remote_config: ^5.3.1
  # State & Routing
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  go_router: ^14.8.1
  # UI
  table_calendar: ^3.1.3
  google_fonts: ^6.2.1
  # Payments
  flutter_stripe: ^11.3.0
  # Utils
  intl: ^0.19.0
  shared_preferences: ^2.3.4
  reactive_forms: ^17.0.1
  uuid: ^4.5.1
  url_launcher: ^6.3.1
  cached_network_image: ^3.4.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  riverpod_generator: ^2.6.3
  build_runner: ^2.4.14
  mockito: ^5.4.4
  fake_cloud_firestore: ^3.1.0
  firebase_auth_mocks: ^0.14.1
```

- [ ] **Step 3: Install dependencies**

```bash
flutter pub get
```

Expected: Dependencies resolve successfully.

- [ ] **Step 4: Set up Firebase project**

```bash
npm install -g firebase-tools
firebase login
dart pub global activate flutterfire_cli
flutterfire configure --project=YOUR_PROJECT_ID
```

Expected: Generates `lib/firebase_options.dart` and platform config files.

- [ ] **Step 5: Create `lib/main.dart`**

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const ProviderScope(child: InstructlyApp()));
}
```

- [ ] **Step 6: Create `lib/app/app.dart`** (placeholder — router added in Task 3)

```dart
import 'package:flutter/material.dart';

class InstructlyApp extends StatelessWidget {
  const InstructlyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Instructly',
      home: const Scaffold(
        body: Center(child: Text('Instructly')),
      ),
    );
  }
}
```

- [ ] **Step 7: Create `firestore.rules`**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Instructor data — only the instructor can read/write
    match /instructors/{instructorId} {
      allow read, write: if request.auth != null && request.auth.uid == instructorId;

      // Students subcollection
      match /students/{studentId} {
        allow read, write: if request.auth != null && request.auth.uid == instructorId;
        // Students can read their own record
        allow read: if request.auth != null && request.auth.uid == studentId;

        // Progress subcollection
        match /progress/{skillId} {
          allow read, write: if request.auth != null && request.auth.uid == instructorId;
          allow read: if request.auth != null && request.auth.uid == studentId;
        }

        // Lesson logs
        match /lessonLogs/{logId} {
          allow read, write: if request.auth != null && request.auth.uid == instructorId;
          allow read: if request.auth != null && request.auth.uid == studentId;
        }

        // Mock tests
        match /mockTests/{testId} {
          allow read, write: if request.auth != null && request.auth.uid == instructorId;
          allow read: if request.auth != null && request.auth.uid == studentId;
        }
      }

      // Bookings
      match /bookings/{bookingId} {
        allow read, write: if request.auth != null && request.auth.uid == instructorId;
        allow read: if request.auth != null
          && resource.data.studentId == request.auth.uid;
      }

      // Messages
      match /messages/{messageId} {
        allow read: if request.auth != null
          && (request.auth.uid == instructorId
              || resource.data.toId == request.auth.uid
              || resource.data.fromId == request.auth.uid);
        allow create: if request.auth != null
          && (request.auth.uid == instructorId
              || request.auth.uid == request.resource.data.fromId);
        allow update: if request.auth != null && request.auth.uid == instructorId;
      }

      // Invites
      match /invites/{code} {
        allow read, write: if request.auth != null && request.auth.uid == instructorId;
        allow read: if request.auth != null;
      }

      // Blocked slots
      match /blockedSlots/{slotId} {
        allow read, write: if request.auth != null && request.auth.uid == instructorId;
      }

      // Resources
      match /resources/{resourceId} {
        allow read, write: if request.auth != null && request.auth.uid == instructorId;
        allow read: if request.auth != null;
      }
    }

    // Notifications
    match /users/{userId}/notifications/{notifId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      // Only Cloud Functions create notifications
    }

    // Stripe customers (managed by extension)
    match /customers/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      match /checkout_sessions/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /subscriptions/{id} {
        allow read: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

- [ ] **Step 8: Create `firestore.indexes.json`**

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "startTime", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fromId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

- [ ] **Step 9: Verify app builds**

```bash
flutter run
```

Expected: App launches showing "Instructly" text.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Flutter project with Firebase and dependencies"
```

---

## Task 2: Theme & Design System

**Files:**
- Create: `lib/app/theme/app_colors.dart`
- Create: `lib/app/theme/app_typography.dart`
- Create: `lib/app/theme/app_motion.dart`
- Create: `lib/app/theme/app_theme.dart`
- Modify: `lib/app/app.dart`

- [ ] **Step 1: Create `lib/app/theme/app_colors.dart`**

```dart
import 'package:flutter/material.dart';

abstract final class AppColors {
  // Primary
  static const primary = Color(0xFF1B6B4A);
  static const primaryLight = Color(0xFF2A8F64);
  static const primaryDark = Color(0xFF14503A);

  // Secondary / Accent
  static const secondary = Color(0xFFF5A623);
  static const secondaryLight = Color(0xFFFFBF4A);
  static const secondaryDark = Color(0xFFD4891A);

  // Surfaces
  static const surface = Color(0xFFFAFAF7);
  static const card = Color(0xFFFFFFFF);
  static const backgroundAccent = Color(0xFFF0F7F4);

  // Text
  static const textPrimary = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF6B7280);
  static const textOnPrimary = Color(0xFFFFFFFF);

  // Semantic
  static const error = Color(0xFFDC3545);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF5A623);

  // Progress rating colors
  static const ratingLow = Color(0xFFDC3545);       // 1-2
  static const ratingMedium = Color(0xFFF5A623);     // 3
  static const ratingHigh = Color(0xFF22C55E);       // 4-5

  // Status badge colors
  static const statusActive = Color(0xFF22C55E);
  static const statusTestReady = Color(0xFFF5A623);
  static const statusInactive = Color(0xFF9CA3AF);
  static const statusPassed = Color(0xFF3B82F6);
}
```

- [ ] **Step 2: Create `lib/app/theme/app_typography.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppTypography {
  static TextTheme get textTheme {
    final bodyFont = GoogleFonts.plusJakartaSans();
    final displayFont = GoogleFonts.dmSerifDisplay();

    return TextTheme(
      displayLarge: displayFont.copyWith(
        fontSize: 32,
        fontWeight: FontWeight.w400,
        height: 1.2,
      ),
      displayMedium: displayFont.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w400,
        height: 1.2,
      ),
      displaySmall: displayFont.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w400,
        height: 1.3,
      ),
      headlineLarge: bodyFont.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.3,
      ),
      headlineMedium: bodyFont.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        height: 1.3,
      ),
      headlineSmall: bodyFont.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.4,
      ),
      titleLarge: bodyFont.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.4,
      ),
      titleMedium: bodyFont.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.4,
      ),
      titleSmall: bodyFont.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1.4,
      ),
      bodyLarge: bodyFont.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      ),
      bodyMedium: bodyFont.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      ),
      bodySmall: bodyFont.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.5,
      ),
      labelLarge: bodyFont.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: 0.5,
      ),
      labelMedium: bodyFont.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: 0.5,
      ),
      labelSmall: bodyFont.copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        height: 1.4,
        letterSpacing: 0.5,
      ),
    );
  }
}
```

- [ ] **Step 3: Create `lib/app/theme/app_motion.dart`**

```dart
abstract final class AppMotion {
  // Durations
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 500);
  static const stagger = Duration(milliseconds: 50);

  // Curves
  static const standard = Curves.easeInOut;
  static const enter = Curves.easeOut;
  static const exit = Curves.easeIn;
  static const bounce = Curves.elasticOut;
}
```

- [ ] **Step 4: Create `lib/app/theme/app_theme.dart`**

```dart
import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

abstract final class AppTheme {
  static ThemeData get light {
    final textTheme = AppTypography.textTheme;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        onPrimary: AppColors.textOnPrimary,
        secondary: AppColors.secondary,
        onSecondary: AppColors.textPrimary,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
        onError: AppColors.textOnPrimary,
      ),
      scaffoldBackgroundColor: AppColors.surface,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.card,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 1,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.shade200),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: AppColors.primary),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: textTheme.labelLarge,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.card,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
        hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.secondary,
        foregroundColor: AppColors.textPrimary,
        elevation: 4,
        shape: CircleBorder(),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.card,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: textTheme.labelSmall,
        unselectedLabelStyle: textTheme.labelSmall,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.backgroundAccent,
        selectedColor: AppColors.primary,
        labelStyle: textTheme.labelMedium,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.grey.shade200,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: Update `lib/app/app.dart` to use theme**

```dart
import 'package:flutter/material.dart';

import 'theme/app_theme.dart';

class InstructlyApp extends StatelessWidget {
  const InstructlyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Instructly',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(child: Text('Instructly')),
      ),
    );
  }
}
```

- [ ] **Step 6: Verify theme applies**

```bash
flutter run
```

Expected: App renders with warm off-white background, green-tinted theme.

- [ ] **Step 7: Commit**

```bash
git add lib/app/theme/ lib/app/app.dart
git commit -m "feat: add design system — colors, typography, motion, theme"
```

---

## Task 3: Router & App Shell

**Files:**
- Create: `lib/app/router/app_router.dart`
- Create: `lib/shared/widgets/app_scaffold.dart`
- Modify: `lib/app/app.dart`

- [ ] **Step 1: Create `lib/app/router/app_router.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../shared/widgets/app_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) async {
      final user = FirebaseAuth.instance.currentUser;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (user == null) {
        return isAuthRoute ? null : '/login';
      }

      if (isAuthRoute) {
        // Check user role and onboarding status
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        if (!userDoc.exists) return '/login';

        final role = userDoc.data()?['role'] as String?;
        final onboarded = userDoc.data()?['onboarded'] as bool? ?? false;

        if (role == 'instructor') {
          return onboarded ? '/instructor' : '/onboarding';
        } else if (role == 'student') {
          return '/student';
        }

        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/register/student',
        builder: (context, state) {
          final inviteCode = state.uri.queryParameters['code'];
          return RegisterScreen(
            isStudent: true,
            inviteCode: inviteCode,
          );
        },
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const Placeholder(), // Task 6
      ),
      // Instructor shell with bottom nav
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppScaffold(
            navigationShell: navigationShell,
            isInstructor: true,
          );
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/instructor',
              builder: (context, state) =>
                  const Placeholder(), // Dashboard — Task 22
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/instructor/calendar',
              builder: (context, state) =>
                  const Placeholder(), // Calendar — Task 10
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/instructor/students',
              builder: (context, state) =>
                  const Placeholder(), // Students — Task 8
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/instructor/more',
              builder: (context, state) =>
                  const Placeholder(), // More — Task 20
            ),
          ]),
        ],
      ),
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
              builder: (context, state) =>
                  const Placeholder(), // Student bookings — Task 23
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/student/progress',
              builder: (context, state) =>
                  const Placeholder(), // Progress — Task 16
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/student/more',
              builder: (context, state) =>
                  const Placeholder(), // More
            ),
          ]),
        ],
      ),
    ],
  );
});
```

- [ ] **Step 2: Create `lib/shared/widgets/app_scaffold.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  final bool isInstructor;

  const AppScaffold({
    super.key,
    required this.navigationShell,
    required this.isInstructor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        destinations: isInstructor
            ? const [
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.calendar_today_outlined),
                  selectedIcon: Icon(Icons.calendar_today),
                  label: 'Calendar',
                ),
                NavigationDestination(
                  icon: Icon(Icons.people_outline),
                  selectedIcon: Icon(Icons.people),
                  label: 'Students',
                ),
                NavigationDestination(
                  icon: Icon(Icons.more_horiz),
                  selectedIcon: Icon(Icons.more_horiz),
                  label: 'More',
                ),
              ]
            : const [
                NavigationDestination(
                  icon: Icon(Icons.calendar_today_outlined),
                  selectedIcon: Icon(Icons.calendar_today),
                  label: 'Bookings',
                ),
                NavigationDestination(
                  icon: Icon(Icons.trending_up_outlined),
                  selectedIcon: Icon(Icons.trending_up),
                  label: 'Progress',
                ),
                NavigationDestination(
                  icon: Icon(Icons.more_horiz),
                  selectedIcon: Icon(Icons.more_horiz),
                  label: 'More',
                ),
              ],
      ),
    );
  }
}
```

- [ ] **Step 3: Update `lib/app/app.dart` to use router**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router/app_router.dart';
import 'theme/app_theme.dart';

class InstructlyApp extends ConsumerWidget {
  const InstructlyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Instructly',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }
}
```

- [ ] **Step 4: Create placeholder screens for compilation**

Create `lib/features/auth/presentation/login_screen.dart`:

```dart
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Login — to be implemented')),
    );
  }
}
```

Create `lib/features/auth/presentation/register_screen.dart`:

```dart
import 'package:flutter/material.dart';

class RegisterScreen extends StatelessWidget {
  final bool isStudent;
  final String? inviteCode;

  const RegisterScreen({
    super.key,
    this.isStudent = false,
    this.inviteCode,
  });

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Register — to be implemented')),
    );
  }
}
```

- [ ] **Step 5: Verify build**

```bash
flutter run
```

Expected: App shows login placeholder. Bottom nav visible when navigating to instructor/student routes.

- [ ] **Step 6: Commit**

```bash
git add lib/app/router/ lib/shared/widgets/ lib/features/auth/presentation/ lib/app/app.dart
git commit -m "feat: add GoRouter with auth guards and bottom nav shell"
```

---

## Task 4: Shared Utilities

**Files:**
- Create: `lib/shared/utils/date_helpers.dart`
- Create: `lib/shared/utils/validators.dart`
- Create: `lib/shared/widgets/loading_indicator.dart`
- Create: `lib/shared/widgets/empty_state.dart`
- Create: `test/shared/utils/date_helpers_test.dart`
- Create: `test/shared/utils/validators_test.dart`

- [ ] **Step 1: Write tests for date helpers — `test/shared/utils/date_helpers_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/shared/utils/date_helpers.dart';

void main() {
  group('DateHelpers', () {
    test('isSameDay returns true for same day', () {
      final a = DateTime(2026, 4, 19, 10, 30);
      final b = DateTime(2026, 4, 19, 15, 45);
      expect(a.isSameDay(b), isTrue);
    });

    test('isSameDay returns false for different days', () {
      final a = DateTime(2026, 4, 19);
      final b = DateTime(2026, 4, 20);
      expect(a.isSameDay(b), isFalse);
    });

    test('startOfDay returns midnight', () {
      final dt = DateTime(2026, 4, 19, 14, 30, 45);
      expect(dt.startOfDay, DateTime(2026, 4, 19));
    });

    test('endOfDay returns 23:59:59', () {
      final dt = DateTime(2026, 4, 19, 14, 30);
      expect(dt.endOfDay, DateTime(2026, 4, 19, 23, 59, 59));
    });

    test('formatTime returns HH:mm', () {
      final dt = DateTime(2026, 4, 19, 9, 5);
      expect(dt.formatTime, '09:05');
    });

    test('formatDateShort returns d MMM', () {
      final dt = DateTime(2026, 4, 19);
      expect(dt.formatDateShort, '19 Apr');
    });

    test('startOfWeek returns Monday', () {
      // 19 Apr 2026 is a Sunday
      final dt = DateTime(2026, 4, 19);
      final monday = dt.startOfWeek;
      expect(monday.weekday, DateTime.monday);
      expect(monday, DateTime(2026, 4, 13));
    });
  });
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
flutter test test/shared/utils/date_helpers_test.dart
```

Expected: FAIL — file not found.

- [ ] **Step 3: Implement `lib/shared/utils/date_helpers.dart`**

```dart
import 'package:intl/intl.dart';

extension DateHelpers on DateTime {
  bool isSameDay(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }

  DateTime get startOfDay => DateTime(year, month, day);

  DateTime get endOfDay => DateTime(year, month, day, 23, 59, 59);

  String get formatTime => DateFormat('HH:mm').format(this);

  String get formatDateShort => DateFormat('d MMM').format(this);

  String get formatDateFull => DateFormat('EEEE, d MMMM yyyy').format(this);

  String get formatDateMedium => DateFormat('d MMM yyyy').format(this);

  DateTime get startOfWeek {
    final daysFromMonday = weekday - DateTime.monday;
    return DateTime(year, month, day - daysFromMonday);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/shared/utils/date_helpers_test.dart
```

Expected: All tests PASS.

- [ ] **Step 5: Write tests for validators — `test/shared/utils/validators_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/shared/utils/validators.dart';

void main() {
  group('Validators', () {
    test('email validation accepts valid emails', () {
      expect(Validators.email('test@example.com'), isNull);
      expect(Validators.email('user.name+tag@domain.co.uk'), isNull);
    });

    test('email validation rejects invalid emails', () {
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('notanemail'), isNotNull);
      expect(Validators.email('missing@'), isNotNull);
    });

    test('required validation rejects empty', () {
      expect(Validators.required(''), isNotNull);
      expect(Validators.required(null), isNotNull);
      expect(Validators.required('  '), isNotNull);
    });

    test('required validation accepts non-empty', () {
      expect(Validators.required('hello'), isNull);
    });

    test('phone validation accepts UK numbers', () {
      expect(Validators.phone('07123456789'), isNull);
      expect(Validators.phone('+447123456789'), isNull);
    });

    test('phone validation rejects invalid', () {
      expect(Validators.phone('123'), isNotNull);
      expect(Validators.phone(''), isNotNull);
    });

    test('password validation requires minimum length', () {
      expect(Validators.password('short'), isNotNull);
      expect(Validators.password('longenoughpassword'), isNull);
    });
  });
}
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
flutter test test/shared/utils/validators_test.dart
```

Expected: FAIL.

- [ ] **Step 7: Implement `lib/shared/utils/validators.dart`**

```dart
abstract final class Validators {
  static final _emailRegex = RegExp(r'^[\w.+-]+@[\w-]+\.[\w.]+$');
  static final _phoneRegex = RegExp(r'^(\+44|0)7\d{9}$');

  static String? required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'This field is required';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    if (!_emailRegex.hasMatch(value)) return 'Enter a valid email';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'Phone number is required';
    if (!_phoneRegex.hasMatch(value.replaceAll(' ', ''))) {
      return 'Enter a valid UK phone number';
    }
    return null;
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
flutter test test/shared/utils/validators_test.dart
```

Expected: All PASS.

- [ ] **Step 9: Create `lib/shared/widgets/loading_indicator.dart`**

```dart
import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

class LoadingIndicator extends StatelessWidget {
  final String? message;

  const LoadingIndicator({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}
```

- [ ] **Step 10: Create `lib/shared/widgets/empty_state.dart`**

```dart
import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: AppColors.textSecondary.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.displaySmall,
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 11: Commit**

```bash
git add lib/shared/ test/shared/
git commit -m "feat: add shared utilities — date helpers, validators, common widgets"
```

---

## Task 5: Auth — Data Layer

**Files:**
- Create: `lib/features/auth/domain/app_user.dart`
- Create: `lib/features/auth/data/auth_repository.dart`
- Create: `test/features/auth/data/auth_repository_test.dart`

- [ ] **Step 1: Create `lib/features/auth/domain/app_user.dart`**

```dart
class AppUser {
  final String uid;
  final String email;
  final String? displayName;
  final String? phone;
  final String role; // 'instructor' or 'student'
  final bool onboarded;
  final String? linkedInstructorId; // for students
  final DateTime createdAt;

  const AppUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.phone,
    required this.role,
    this.onboarded = false,
    this.linkedInstructorId,
    required this.createdAt,
  });

  bool get isInstructor => role == 'instructor';
  bool get isStudent => role == 'student';

  factory AppUser.fromMap(Map<String, dynamic> map, String uid) {
    return AppUser(
      uid: uid,
      email: map['email'] as String? ?? '',
      displayName: map['displayName'] as String?,
      phone: map['phone'] as String?,
      role: map['role'] as String? ?? 'instructor',
      onboarded: map['onboarded'] as bool? ?? false,
      linkedInstructorId: map['linkedInstructorId'] as String?,
      createdAt: map['createdAt'] != null
          ? (map['createdAt'] as dynamic).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'phone': phone,
      'role': role,
      'onboarded': onboarded,
      'linkedInstructorId': linkedInstructorId,
      'createdAt': createdAt,
    };
  }

  AppUser copyWith({
    String? displayName,
    String? phone,
    bool? onboarded,
    String? linkedInstructorId,
  }) {
    return AppUser(
      uid: uid,
      email: email,
      displayName: displayName ?? this.displayName,
      phone: phone ?? this.phone,
      role: role,
      onboarded: onboarded ?? this.onboarded,
      linkedInstructorId: linkedInstructorId ?? this.linkedInstructorId,
      createdAt: createdAt,
    );
  }
}
```

- [ ] **Step 2: Write tests for auth repository — `test/features/auth/data/auth_repository_test.dart`**

```dart
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/auth/data/auth_repository.dart';

void main() {
  late MockFirebaseAuth mockAuth;
  late FakeFirebaseFirestore fakeFirestore;
  late AuthRepository repository;

  setUp(() {
    mockAuth = MockFirebaseAuth();
    fakeFirestore = FakeFirebaseFirestore();
    repository = AuthRepository(
      auth: mockAuth,
      firestore: fakeFirestore,
    );
  });

  group('AuthRepository', () {
    test('registerInstructor creates auth user and Firestore docs', () async {
      final user = await repository.registerInstructor(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(user, isNotNull);
      expect(user!.email, 'test@example.com');
      expect(user.role, 'instructor');

      // Verify Firestore doc created
      final userDoc =
          await fakeFirestore.collection('users').doc(user.uid).get();
      expect(userDoc.exists, isTrue);
      expect(userDoc.data()?['role'], 'instructor');

      final instructorDoc =
          await fakeFirestore.collection('instructors').doc(user.uid).get();
      expect(instructorDoc.exists, isTrue);
    });

    test('registerStudent creates auth user linked to instructor', () async {
      // Setup: create instructor with invite
      await fakeFirestore.collection('instructors').doc('inst123').set({
        'profile': {'name': 'Test Instructor'},
      });
      await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('invites')
          .doc('ABC123')
          .set({
        'claimed': false,
        'expiresAt': DateTime.now().add(const Duration(days: 7)),
      });

      final user = await repository.registerStudent(
        email: 'student@example.com',
        password: 'password123',
        inviteCode: 'ABC123',
        instructorId: 'inst123',
      );

      expect(user, isNotNull);
      expect(user!.role, 'student');
      expect(user.linkedInstructorId, 'inst123');
    });

    test('signIn returns AppUser for existing user', () async {
      // Setup: create user in Firestore
      mockAuth = MockFirebaseAuth(
        mockUser: MockUser(uid: 'user123', email: 'test@example.com'),
      );
      await fakeFirestore.collection('users').doc('user123').set({
        'email': 'test@example.com',
        'role': 'instructor',
        'onboarded': true,
        'createdAt': DateTime.now(),
      });
      repository = AuthRepository(auth: mockAuth, firestore: fakeFirestore);

      final user = await repository.signIn(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(user, isNotNull);
      expect(user!.isInstructor, isTrue);
    });

    test('signOut signs out from Firebase Auth', () async {
      mockAuth = MockFirebaseAuth(signedIn: true);
      repository = AuthRepository(auth: mockAuth, firestore: fakeFirestore);

      await repository.signOut();
      expect(mockAuth.currentUser, isNull);
    });
  });
}
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
flutter test test/features/auth/data/auth_repository_test.dart
```

Expected: FAIL — AuthRepository not found.

- [ ] **Step 4: Implement `lib/features/auth/data/auth_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/app_user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    auth: FirebaseAuth.instance,
    firestore: FirebaseFirestore.instance,
  );
});

final authStateProvider = StreamProvider<User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

final currentUserProvider = FutureProvider<AppUser?>((ref) {
  final authState = ref.watch(authStateProvider).value;
  if (authState == null) return Future.value(null);
  return ref.watch(authRepositoryProvider).getCurrentUser();
});

class AuthRepository {
  final FirebaseAuth auth;
  final FirebaseFirestore firestore;

  AuthRepository({required this.auth, required this.firestore});

  Stream<User?> get authStateChanges => auth.authStateChanges();

  Future<AppUser?> registerInstructor({
    required String email,
    required String password,
  }) async {
    final credential = await auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final uid = credential.user!.uid;
    final now = DateTime.now();

    final appUser = AppUser(
      uid: uid,
      email: email,
      role: 'instructor',
      createdAt: now,
    );

    final batch = firestore.batch();

    batch.set(firestore.collection('users').doc(uid), appUser.toMap());
    batch.set(firestore.collection('instructors').doc(uid), {
      'profile': {'name': '', 'email': email},
      'settings': {
        'lessonDurations': [60],
        'bufferMinutes': 15,
      },
      'teachingAreas': [],
      'preferredTestCentres': [],
      'weeklyAvailability': {},
    });

    await batch.commit();

    return appUser;
  }

  Future<AppUser?> registerStudent({
    required String email,
    required String password,
    required String inviteCode,
    required String instructorId,
  }) async {
    final credential = await auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final uid = credential.user!.uid;
    final now = DateTime.now();

    final appUser = AppUser(
      uid: uid,
      email: email,
      role: 'student',
      onboarded: true,
      linkedInstructorId: instructorId,
      createdAt: now,
    );

    final batch = firestore.batch();

    batch.set(firestore.collection('users').doc(uid), appUser.toMap());

    // Mark invite as claimed
    batch.update(
      firestore
          .collection('instructors')
          .doc(instructorId)
          .collection('invites')
          .doc(inviteCode),
      {'claimed': true, 'claimedBy': uid},
    );

    // Create student record under instructor
    batch.set(
      firestore
          .collection('instructors')
          .doc(instructorId)
          .collection('students')
          .doc(uid),
      {
        'name': '',
        'email': email,
        'status': 'active',
        'joinedAt': now,
        'inviteCode': inviteCode,
      },
    );

    await batch.commit();

    return appUser;
  }

  Future<AppUser?> signIn({
    required String email,
    required String password,
  }) async {
    final credential = await auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    return getCurrentUser(uid: credential.user?.uid);
  }

  Future<AppUser?> getCurrentUser({String? uid}) async {
    final userId = uid ?? auth.currentUser?.uid;
    if (userId == null) return null;

    final doc = await firestore.collection('users').doc(userId).get();
    if (!doc.exists) return null;

    return AppUser.fromMap(doc.data()!, userId);
  }

  Future<void> signOut() async {
    await auth.signOut();
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
flutter test test/features/auth/data/auth_repository_test.dart
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/features/auth/ test/features/auth/
git commit -m "feat: add auth data layer — AppUser model, AuthRepository with Firebase"
```

---

## Task 6: Auth — Presentation (Login & Register Screens)

**Files:**
- Create: `lib/features/auth/presentation/widgets/auth_form_field.dart`
- Modify: `lib/features/auth/presentation/login_screen.dart`
- Modify: `lib/features/auth/presentation/register_screen.dart`

- [ ] **Step 1: Create `lib/features/auth/presentation/widgets/auth_form_field.dart`**

```dart
import 'package:flutter/material.dart';

class AuthFormField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;

  const AuthFormField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: prefixIcon != null ? Icon(prefixIcon) : null,
      ),
      validator: validator,
      obscureText: obscureText,
      keyboardType: keyboardType,
    );
  }
}
```

- [ ] **Step 2: Implement `lib/features/auth/presentation/login_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/validators.dart';
import '../data/auth_repository.dart';
import 'widgets/auth_form_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final repo = ref.read(authRepositoryProvider);
      final user = await repo.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (user == null) {
        setState(() => _error = 'Account not found');
        return;
      }

      if (user.isInstructor) {
        context.go(user.onboarded ? '/instructor' : '/onboarding');
      } else {
        context.go('/student');
      }
    } on Exception catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Instructly',
                    style: theme.textTheme.displayLarge?.copyWith(
                      color: AppColors.primary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your driving instruction hub',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),
                  AuthFormField(
                    controller: _emailController,
                    label: 'Email',
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),
                  AuthFormField(
                    controller: _passwordController,
                    label: 'Password',
                    prefixIcon: Icons.lock_outlined,
                    obscureText: true,
                    validator: Validators.password,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.error,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.textOnPrimary,
                            ),
                          )
                        : const Text('Sign In'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.go('/register'),
                    child: const Text("Don't have an account? Register"),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Implement `lib/features/auth/presentation/register_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/validators.dart';
import '../data/auth_repository.dart';
import 'widgets/auth_form_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final bool isStudent;
  final String? inviteCode;

  const RegisterScreen({
    super.key,
    this.isStudent = false,
    this.inviteCode,
  });

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _inviteCodeController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.inviteCode != null) {
      _inviteCodeController.text = widget.inviteCode!;
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _inviteCodeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final repo = ref.read(authRepositoryProvider);

      if (widget.isStudent) {
        // Look up invite code to find instructor
        final inviteCode = _inviteCodeController.text.trim().toUpperCase();
        final instructorId = await _findInstructorByInvite(inviteCode);

        if (instructorId == null) {
          setState(() => _error = 'Invalid or expired invite code');
          return;
        }

        await repo.registerStudent(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          inviteCode: inviteCode,
          instructorId: instructorId,
        );

        if (mounted) context.go('/student');
      } else {
        await repo.registerInstructor(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        if (mounted) context.go('/onboarding');
      }
    } on Exception catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _findInstructorByInvite(String code) async {
    // Cloud Function handles this in production (callable function)
    // For now, search across instructors' invites
    // This will be replaced by a callable Cloud Function in Task 18
    return null; // Placeholder — implemented in Cloud Functions task
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    widget.isStudent
                        ? 'Join Your Instructor'
                        : 'Create Account',
                    style: theme.textTheme.displayMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.isStudent
                        ? 'Enter your invite code to get started'
                        : 'Start managing your driving lessons',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  if (widget.isStudent) ...[
                    AuthFormField(
                      controller: _inviteCodeController,
                      label: 'Invite Code',
                      hint: 'e.g. ABC123',
                      prefixIcon: Icons.card_membership_outlined,
                      validator: Validators.required,
                    ),
                    const SizedBox(height: 16),
                  ],
                  AuthFormField(
                    controller: _emailController,
                    label: 'Email',
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),
                  AuthFormField(
                    controller: _passwordController,
                    label: 'Password',
                    prefixIcon: Icons.lock_outlined,
                    obscureText: true,
                    validator: Validators.password,
                  ),
                  const SizedBox(height: 16),
                  AuthFormField(
                    controller: _confirmPasswordController,
                    label: 'Confirm Password',
                    prefixIcon: Icons.lock_outlined,
                    obscureText: true,
                    validator: Validators.password,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.error,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.textOnPrimary,
                            ),
                          )
                        : Text(widget.isStudent ? 'Join' : 'Create Account'),
                  ),
                  if (!widget.isStudent) ...[
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Already have an account? Sign in'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => context.go('/register/student'),
                      child: const Text("I'm a student with an invite code"),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Verify build**

```bash
flutter run
```

Expected: Login screen renders with "Instructly" heading, email/password fields, sign in button.

- [ ] **Step 5: Commit**

```bash
git add lib/features/auth/presentation/
git commit -m "feat: add login and register screens with form validation"
```

---

## Task 7: Instructor Onboarding

**Files:**
- Create: `lib/features/onboarding/domain/instructor_profile.dart`
- Create: `lib/features/onboarding/data/onboarding_repository.dart`
- Create: `lib/features/onboarding/presentation/onboarding_screen.dart`
- Create: `lib/features/onboarding/presentation/steps/profile_step.dart`
- Create: `lib/features/onboarding/presentation/steps/teaching_setup_step.dart`
- Create: `lib/features/onboarding/presentation/steps/availability_step.dart`
- Create: `lib/features/onboarding/presentation/widgets/time_range_picker.dart`
- Create: `test/features/onboarding/data/onboarding_repository_test.dart`
- Modify: `lib/app/router/app_router.dart` (replace Placeholder)

- [ ] **Step 1: Create `lib/features/onboarding/domain/instructor_profile.dart`**

```dart
class InstructorProfile {
  final String name;
  final String phone;
  final String? photoUrl;
  final List<int> lessonDurations; // in minutes
  final int bufferMinutes;
  final List<String> teachingAreas;
  final List<String> preferredTestCentres;
  final Map<String, List<TimeSlot>> weeklyAvailability;

  const InstructorProfile({
    required this.name,
    required this.phone,
    this.photoUrl,
    this.lessonDurations = const [60],
    this.bufferMinutes = 15,
    this.teachingAreas = const [],
    this.preferredTestCentres = const [],
    this.weeklyAvailability = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'profile': {
        'name': name,
        'phone': phone,
        'photoUrl': photoUrl,
      },
      'settings': {
        'lessonDurations': lessonDurations,
        'bufferMinutes': bufferMinutes,
      },
      'teachingAreas': teachingAreas,
      'preferredTestCentres': preferredTestCentres,
      'weeklyAvailability': weeklyAvailability.map(
        (day, slots) => MapEntry(
          day,
          slots.map((s) => s.toMap()).toList(),
        ),
      ),
    };
  }
}

class TimeSlot {
  final String start; // "09:00"
  final String end;   // "17:00"

  const TimeSlot({required this.start, required this.end});

  Map<String, dynamic> toMap() => {'start': start, 'end': end};

  factory TimeSlot.fromMap(Map<String, dynamic> map) {
    return TimeSlot(
      start: map['start'] as String,
      end: map['end'] as String,
    );
  }
}
```

- [ ] **Step 2: Write test for onboarding repository — `test/features/onboarding/data/onboarding_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/onboarding/data/onboarding_repository.dart';
import 'package:instructly/features/onboarding/domain/instructor_profile.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late OnboardingRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = OnboardingRepository(firestore: fakeFirestore);
  });

  group('OnboardingRepository', () {
    test('saveProfile writes instructor data and marks onboarded', () async {
      final profile = InstructorProfile(
        name: 'John Smith',
        phone: '07123456789',
        lessonDurations: [60, 120],
        bufferMinutes: 15,
        teachingAreas: ['North London'],
        preferredTestCentres: ['Mill Hill'],
        weeklyAvailability: {
          'mon': [const TimeSlot(start: '09:00', end: '17:00')],
        },
      );

      await repository.saveProfile(uid: 'inst123', profile: profile);

      final instructorDoc =
          await fakeFirestore.collection('instructors').doc('inst123').get();
      expect(instructorDoc.data()?['profile']['name'], 'John Smith');
      expect(instructorDoc.data()?['settings']['bufferMinutes'], 15);

      final userDoc =
          await fakeFirestore.collection('users').doc('inst123').get();
      expect(userDoc.data()?['onboarded'], true);
    });
  });
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
flutter test test/features/onboarding/data/onboarding_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 4: Implement `lib/features/onboarding/data/onboarding_repository.dart`**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/instructor_profile.dart';

final onboardingRepositoryProvider = Provider<OnboardingRepository>((ref) {
  return OnboardingRepository(firestore: FirebaseFirestore.instance);
});

class OnboardingRepository {
  final FirebaseFirestore firestore;

  OnboardingRepository({required this.firestore});

  Future<void> saveProfile({
    required String uid,
    required InstructorProfile profile,
  }) async {
    final batch = firestore.batch();

    batch.set(
      firestore.collection('instructors').doc(uid),
      profile.toMap(),
      SetOptions(merge: true),
    );

    batch.update(
      firestore.collection('users').doc(uid),
      {
        'onboarded': true,
        'displayName': profile.name,
        'phone': profile.phone,
      },
    );

    await batch.commit();
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
flutter test test/features/onboarding/data/onboarding_repository_test.dart
```

Expected: PASS.

- [ ] **Step 6: Create `lib/features/onboarding/presentation/widgets/time_range_picker.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/instructor_profile.dart';

class TimeRangePicker extends StatelessWidget {
  final TimeSlot value;
  final ValueChanged<TimeSlot> onChanged;

  const TimeRangePicker({
    super.key,
    required this.value,
    required this.onChanged,
  });

  Future<void> _pickTime(BuildContext context, bool isStart) async {
    final parts = (isStart ? value.start : value.end).split(':');
    final initial = TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );

    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      onChanged(isStart
          ? TimeSlot(start: formatted, end: value.end)
          : TimeSlot(start: value.start, end: formatted));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        GestureDetector(
          onTap: () => _pickTime(context, true),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.primary),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(value.start, style: theme.textTheme.titleMedium),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('to', style: theme.textTheme.bodyMedium),
        ),
        GestureDetector(
          onTap: () => _pickTime(context, false),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.primary),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(value.end, style: theme.textTheme.titleMedium),
          ),
        ),
      ],
    );
  }
}
```

- [ ] **Step 7: Create onboarding step widgets**

Create `lib/features/onboarding/presentation/steps/profile_step.dart`:

```dart
import 'package:flutter/material.dart';

import '../../../../shared/utils/validators.dart';
import '../../../auth/presentation/widgets/auth_form_field.dart';

class ProfileStep extends StatelessWidget {
  final TextEditingController nameController;
  final TextEditingController phoneController;

  const ProfileStep({
    super.key,
    required this.nameController,
    required this.phoneController,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('About You', style: theme.textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Tell us a bit about yourself',
          style: theme.textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        AuthFormField(
          controller: nameController,
          label: 'Full Name',
          prefixIcon: Icons.person_outlined,
          validator: Validators.required,
        ),
        const SizedBox(height: 16),
        AuthFormField(
          controller: phoneController,
          label: 'Phone Number',
          hint: '07123456789',
          prefixIcon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
          validator: Validators.phone,
        ),
      ],
    );
  }
}
```

Create `lib/features/onboarding/presentation/steps/teaching_setup_step.dart`:

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class TeachingSetupStep extends StatelessWidget {
  final List<int> selectedDurations;
  final ValueChanged<List<int>> onDurationsChanged;
  final int bufferMinutes;
  final ValueChanged<int> onBufferChanged;
  final TextEditingController teachingAreaController;
  final TextEditingController testCentreController;
  final List<String> teachingAreas;
  final ValueChanged<List<String>> onTeachingAreasChanged;
  final List<String> testCentres;
  final ValueChanged<List<String>> onTestCentresChanged;

  const TeachingSetupStep({
    super.key,
    required this.selectedDurations,
    required this.onDurationsChanged,
    required this.bufferMinutes,
    required this.onBufferChanged,
    required this.teachingAreaController,
    required this.testCentreController,
    required this.teachingAreas,
    required this.onTeachingAreasChanged,
    required this.testCentres,
    required this.onTestCentresChanged,
  });

  void _toggleDuration(int duration) {
    final updated = List<int>.from(selectedDurations);
    if (updated.contains(duration)) {
      if (updated.length > 1) updated.remove(duration);
    } else {
      updated.add(duration);
    }
    onDurationsChanged(updated);
  }

  void _addChip(TextEditingController controller, List<String> list,
      ValueChanged<List<String>> onChanged) {
    final text = controller.text.trim();
    if (text.isNotEmpty && !list.contains(text)) {
      onChanged([...list, text]);
      controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Teaching Setup', style: theme.textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Configure your lesson preferences',
          style: theme.textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),

        // Lesson durations
        Text('Lesson Durations', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [60, 90, 120].map((d) {
            final selected = selectedDurations.contains(d);
            return FilterChip(
              label: Text('${d}min'),
              selected: selected,
              onSelected: (_) => _toggleDuration(d),
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: selected ? AppColors.textOnPrimary : AppColors.textPrimary,
              ),
              checkmarkColor: AppColors.textOnPrimary,
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Buffer time
        Text('Buffer Between Lessons', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [0, 10, 15, 20, 30].map((b) {
            final selected = bufferMinutes == b;
            return ChoiceChip(
              label: Text(b == 0 ? 'None' : '${b}min'),
              selected: selected,
              onSelected: (_) => onBufferChanged(b),
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: selected ? AppColors.textOnPrimary : AppColors.textPrimary,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Teaching areas
        Text('Teaching Areas', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: teachingAreaController,
                decoration: const InputDecoration(
                  hintText: 'e.g. North London',
                ),
                onSubmitted: (_) => _addChip(
                    teachingAreaController, teachingAreas, onTeachingAreasChanged),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => _addChip(
                  teachingAreaController, teachingAreas, onTeachingAreasChanged),
              icon: const Icon(Icons.add_circle, color: AppColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: teachingAreas
              .map((area) => Chip(
                    label: Text(area),
                    onDeleted: () => onTeachingAreasChanged(
                        teachingAreas.where((a) => a != area).toList()),
                  ))
              .toList(),
        ),
        const SizedBox(height: 20),

        // Test centres
        Text('Preferred Test Centres', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: testCentreController,
                decoration: const InputDecoration(
                  hintText: 'e.g. Mill Hill',
                ),
                onSubmitted: (_) => _addChip(
                    testCentreController, testCentres, onTestCentresChanged),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => _addChip(
                  testCentreController, testCentres, onTestCentresChanged),
              icon: const Icon(Icons.add_circle, color: AppColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: testCentres
              .map((centre) => Chip(
                    label: Text(centre),
                    onDeleted: () => onTestCentresChanged(
                        testCentres.where((c) => c != centre).toList()),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
```

Create `lib/features/onboarding/presentation/steps/availability_step.dart`:

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/instructor_profile.dart';
import '../widgets/time_range_picker.dart';

class AvailabilityStep extends StatelessWidget {
  final Map<String, List<TimeSlot>> availability;
  final ValueChanged<Map<String, List<TimeSlot>>> onChanged;

  const AvailabilityStep({
    super.key,
    required this.availability,
    required this.onChanged,
  });

  static const _days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  static const _dayLabels = {
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday',
  };

  void _toggleDay(String day) {
    final updated = Map<String, List<TimeSlot>>.from(availability);
    if (updated.containsKey(day)) {
      updated.remove(day);
    } else {
      updated[day] = [const TimeSlot(start: '09:00', end: '17:00')];
    }
    onChanged(updated);
  }

  void _updateSlot(String day, int index, TimeSlot slot) {
    final updated = Map<String, List<TimeSlot>>.from(availability);
    final slots = List<TimeSlot>.from(updated[day]!);
    slots[index] = slot;
    updated[day] = slots;
    onChanged(updated);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Availability', style: theme.textTheme.displaySmall),
        const SizedBox(height: 8),
        Text(
          'Set your weekly teaching schedule',
          style: theme.textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        ..._days.map((day) {
          final isActive = availability.containsKey(day);
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Switch(
                      value: isActive,
                      onChanged: (_) => _toggleDay(day),
                      activeColor: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _dayLabels[day]!,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: isActive
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (isActive)
                  Padding(
                    padding: const EdgeInsets.only(left: 60, top: 4),
                    child: TimeRangePicker(
                      value: availability[day]![0],
                      onChanged: (slot) => _updateSlot(day, 0, slot),
                    ),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
```

- [ ] **Step 8: Create `lib/features/onboarding/presentation/onboarding_screen.dart`**

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../data/onboarding_repository.dart';
import '../domain/instructor_profile.dart';
import 'steps/availability_step.dart';
import 'steps/profile_step.dart';
import 'steps/teaching_setup_step.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  bool _saving = false;

  // Step 1: Profile
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  // Step 2: Teaching setup
  List<int> _lessonDurations = [60];
  int _bufferMinutes = 15;
  final _teachingAreaController = TextEditingController();
  final _testCentreController = TextEditingController();
  List<String> _teachingAreas = [];
  List<String> _testCentres = [];

  // Step 3: Availability
  Map<String, List<TimeSlot>> _availability = {};

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _teachingAreaController.dispose();
    _testCentreController.dispose();
    super.dispose();
  }

  void _next() {
    if (_currentStep == 0 && !_formKey.currentState!.validate()) return;
    if (_currentStep < 2) {
      setState(() => _currentStep++);
    } else {
      _save();
    }
  }

  void _back() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);

    try {
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final profile = InstructorProfile(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        lessonDurations: _lessonDurations,
        bufferMinutes: _bufferMinutes,
        teachingAreas: _teachingAreas,
        preferredTestCentres: _testCentres,
        weeklyAvailability: _availability,
      );

      await ref
          .read(onboardingRepositoryProvider)
          .saveProfile(uid: uid, profile: profile);

      if (mounted) context.go('/instructor');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
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
      appBar: AppBar(
        title: const Text('Get Started'),
        leading: _currentStep > 0
            ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back)
            : null,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Row(
                children: List.generate(3, (i) {
                  return Expanded(
                    child: AnimatedContainer(
                      duration: AppMotion.normal,
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(
                        color: i <= _currentStep
                            ? AppColors.primary
                            : AppColors.primary.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Step ${_currentStep + 1} of 3',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),

            // Step content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: AnimatedSwitcher(
                    duration: AppMotion.normal,
                    child: _buildStep(),
                  ),
                ),
              ),
            ),

            // Next button
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _next,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.textOnPrimary,
                          ),
                        )
                      : Text(_currentStep == 2 ? 'Complete Setup' : 'Next'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_currentStep) {
      case 0:
        return ProfileStep(
          key: const ValueKey('profile'),
          nameController: _nameController,
          phoneController: _phoneController,
        );
      case 1:
        return TeachingSetupStep(
          key: const ValueKey('teaching'),
          selectedDurations: _lessonDurations,
          onDurationsChanged: (v) => setState(() => _lessonDurations = v),
          bufferMinutes: _bufferMinutes,
          onBufferChanged: (v) => setState(() => _bufferMinutes = v),
          teachingAreaController: _teachingAreaController,
          testCentreController: _testCentreController,
          teachingAreas: _teachingAreas,
          onTeachingAreasChanged: (v) => setState(() => _teachingAreas = v),
          testCentres: _testCentres,
          onTestCentresChanged: (v) => setState(() => _testCentres = v),
        );
      case 2:
        return AvailabilityStep(
          key: const ValueKey('availability'),
          availability: _availability,
          onChanged: (v) => setState(() => _availability = v),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
```

- [ ] **Step 9: Update router to use OnboardingScreen**

In `lib/app/router/app_router.dart`, replace the onboarding placeholder import and route:

Add import:
```dart
import '../../features/onboarding/presentation/onboarding_screen.dart';
```

Replace:
```dart
GoRoute(
  path: '/onboarding',
  builder: (context, state) => const Placeholder(),
),
```
With:
```dart
GoRoute(
  path: '/onboarding',
  builder: (context, state) => const OnboardingScreen(),
),
```

- [ ] **Step 10: Run tests**

```bash
flutter test test/features/onboarding/
```

Expected: All PASS.

- [ ] **Step 11: Commit**

```bash
git add lib/features/onboarding/ lib/app/router/app_router.dart test/features/onboarding/
git commit -m "feat: add instructor onboarding wizard — profile, teaching setup, availability"
```

---

## Task 8: Student Management — Data & Domain

**Files:**
- Create: `lib/features/students/domain/student.dart`
- Create: `lib/features/students/data/students_repository.dart`
- Create: `test/features/students/domain/student_test.dart`
- Create: `test/features/students/data/students_repository_test.dart`

- [ ] **Step 1: Write model test — `test/features/students/domain/student_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/students/domain/student.dart';

void main() {
  group('Student', () {
    test('fromMap creates Student correctly', () {
      final student = Student.fromMap({
        'name': 'Jane Doe',
        'email': 'jane@example.com',
        'phone': '07123456789',
        'status': 'active',
        'joinedAt': DateTime(2026, 1, 1),
        'inviteCode': 'ABC123',
        'notes': 'Needs extra help with parking',
      }, 'student123');

      expect(student.id, 'student123');
      expect(student.name, 'Jane Doe');
      expect(student.status, StudentStatus.active);
      expect(student.isActive, isTrue);
    });

    test('toMap serializes correctly', () {
      final student = Student(
        id: 'student123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '07123456789',
        status: StudentStatus.active,
        joinedAt: DateTime(2026, 1, 1),
        inviteCode: 'ABC123',
      );

      final map = student.toMap();
      expect(map['name'], 'Jane Doe');
      expect(map['status'], 'active');
    });

    test('status parsing handles all values', () {
      expect(
        Student.fromMap({'name': '', 'status': 'passed', 'joinedAt': DateTime.now()}, 'id').status,
        StudentStatus.passed,
      );
      expect(
        Student.fromMap({'name': '', 'status': 'inactive', 'joinedAt': DateTime.now()}, 'id').status,
        StudentStatus.inactive,
      );
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/features/students/domain/student_test.dart
```

Expected: FAIL.

- [ ] **Step 3: Implement `lib/features/students/domain/student.dart`**

```dart
enum StudentStatus { active, inactive, passed }

class Student {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final StudentStatus status;
  final DateTime joinedAt;
  final String? inviteCode;
  final String? notes;

  const Student({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.status,
    required this.joinedAt,
    this.inviteCode,
    this.notes,
  });

  bool get isActive => status == StudentStatus.active;

  factory Student.fromMap(Map<String, dynamic> map, String id) {
    return Student(
      id: id,
      name: map['name'] as String? ?? '',
      email: map['email'] as String?,
      phone: map['phone'] as String?,
      status: _parseStatus(map['status'] as String? ?? 'active'),
      joinedAt: map['joinedAt'] is DateTime
          ? map['joinedAt'] as DateTime
          : (map['joinedAt'] as dynamic).toDate(),
      inviteCode: map['inviteCode'] as String?,
      notes: map['notes'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'email': email,
      'phone': phone,
      'status': status.name,
      'joinedAt': joinedAt,
      'inviteCode': inviteCode,
      'notes': notes,
    };
  }

  Student copyWith({
    String? name,
    String? email,
    String? phone,
    StudentStatus? status,
    String? notes,
  }) {
    return Student(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      status: status ?? this.status,
      joinedAt: joinedAt,
      inviteCode: inviteCode,
      notes: notes ?? this.notes,
    );
  }

  static StudentStatus _parseStatus(String value) {
    return StudentStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => StudentStatus.active,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
flutter test test/features/students/domain/student_test.dart
```

Expected: All PASS.

- [ ] **Step 5: Write repository test — `test/features/students/data/students_repository_test.dart`**

```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/students/data/students_repository.dart';

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late StudentsRepository repository;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    repository = StudentsRepository(
      firestore: fakeFirestore,
      instructorId: 'inst123',
    );
  });

  group('StudentsRepository', () {
    test('addStudent creates document', () async {
      await repository.addStudent(
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '07123456789',
      );

      final snapshot = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .get();

      expect(snapshot.docs.length, 1);
      expect(snapshot.docs.first.data()['name'], 'Jane Doe');
    });

    test('getStudents returns list', () async {
      await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .add({
        'name': 'Jane',
        'status': 'active',
        'joinedAt': DateTime.now(),
      });

      final students = await repository.getStudents().first;
      expect(students.length, 1);
      expect(students.first.name, 'Jane');
    });

    test('updateStudentStatus updates status field', () async {
      final ref = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('students')
          .add({
        'name': 'Jane',
        'status': 'active',
        'joinedAt': DateTime.now(),
      });

      await repository.updateStudentStatus(ref.id, 'inactive');

      final doc = await ref.get();
      expect(doc.data()?['status'], 'inactive');
    });

    test('generateInviteCode creates invite document', () async {
      final code = await repository.generateInviteCode();

      expect(code.length, 6);

      final inviteDoc = await fakeFirestore
          .collection('instructors')
          .doc('inst123')
          .collection('invites')
          .doc(code)
          .get();

      expect(inviteDoc.exists, isTrue);
      expect(inviteDoc.data()?['claimed'], false);
    });
  });
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
flutter test test/features/students/data/students_repository_test.dart
```

Expected: FAIL.

- [ ] **Step 7: Implement `lib/features/students/data/students_repository.dart`**

```dart
import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/student.dart';

final studentsRepositoryProvider = Provider<StudentsRepository>((ref) {
  final uid = FirebaseAuth.instance.currentUser!.uid;
  return StudentsRepository(
    firestore: FirebaseFirestore.instance,
    instructorId: uid,
  );
});

final studentsStreamProvider = StreamProvider<List<Student>>((ref) {
  return ref.watch(studentsRepositoryProvider).getStudents();
});

class StudentsRepository {
  final FirebaseFirestore firestore;
  final String instructorId;

  StudentsRepository({
    required this.firestore,
    required this.instructorId,
  });

  CollectionReference get _studentsRef => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('students');

  CollectionReference get _invitesRef => firestore
      .collection('instructors')
      .doc(instructorId)
      .collection('invites');

  Stream<List<Student>> getStudents() {
    return _studentsRef.orderBy('name').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return Student.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  Future<Student> getStudent(String studentId) async {
    final doc = await _studentsRef.doc(studentId).get();
    return Student.fromMap(doc.data() as Map<String, dynamic>, doc.id);
  }

  Future<void> addStudent({
    required String name,
    String? email,
    String? phone,
  }) async {
    await _studentsRef.add({
      'name': name,
      'email': email,
      'phone': phone,
      'status': 'active',
      'joinedAt': DateTime.now(),
    });
  }

  Future<void> updateStudent(String studentId, Map<String, dynamic> data) async {
    await _studentsRef.doc(studentId).update(data);
  }

  Future<void> updateStudentStatus(String studentId, String status) async {
    await _studentsRef.doc(studentId).update({'status': status});
  }

  Future<String> generateInviteCode() async {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final random = Random.secure();
    final code = List.generate(6, (_) => chars[random.nextInt(chars.length)]).join();

    await _invitesRef.doc(code).set({
      'claimed': false,
      'createdAt': DateTime.now(),
      'expiresAt': DateTime.now().add(const Duration(days: 7)),
    });

    return code;
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
flutter test test/features/students/
```

Expected: All PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/features/students/ test/features/students/
git commit -m "feat: add student management — Student model, StudentsRepository with CRUD and invites"
```

---

## Task 9: Student Management — Presentation

**Files:**
- Create: `lib/features/students/presentation/widgets/student_card.dart`
- Create: `lib/features/students/presentation/widgets/invite_dialog.dart`
- Create: `lib/features/students/presentation/students_list_screen.dart`
- Create: `lib/features/students/presentation/student_detail_screen.dart`
- Create: `lib/features/students/presentation/add_student_screen.dart`
- Modify: `lib/app/router/app_router.dart`

- [ ] **Step 1: Create `lib/features/students/presentation/widgets/student_card.dart`**

```dart
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/student.dart';

class StudentCard extends StatelessWidget {
  final Student student;
  final VoidCallback onTap;

  const StudentCard({super.key, required this.student, required this.onTap});

  Color get _statusColor {
    switch (student.status) {
      case StudentStatus.active:
        return AppColors.statusActive;
      case StudentStatus.inactive:
        return AppColors.statusInactive;
      case StudentStatus.passed:
        return AppColors.statusPassed;
    }
  }

  String get _statusLabel {
    switch (student.status) {
      case StudentStatus.active:
        return 'Active';
      case StudentStatus.inactive:
        return 'Inactive';
      case StudentStatus.passed:
        return 'Passed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: AppColors.backgroundAccent,
          child: Text(
            student.name.isNotEmpty ? student.name[0].toUpperCase() : '?',
            style: theme.textTheme.titleMedium?.copyWith(
              color: AppColors.primary,
            ),
          ),
        ),
        title: Text(student.name, style: theme.textTheme.titleMedium),
        subtitle: student.phone != null
            ? Text(student.phone!, style: theme.textTheme.bodySmall)
            : null,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _statusColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            _statusLabel,
            style: theme.textTheme.labelSmall?.copyWith(color: _statusColor),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Create `lib/features/students/presentation/widgets/invite_dialog.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/theme/app_colors.dart';

class InviteDialog extends StatelessWidget {
  final String code;

  const InviteDialog({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: const Text('Invite Code'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Share this code with your student:',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.backgroundAccent,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            child: Text(
              code,
              style: theme.textTheme.displaySmall?.copyWith(
                color: AppColors.primary,
                letterSpacing: 4,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Expires in 7 days',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: code));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Code copied to clipboard')),
            );
          },
          child: const Text('Copy'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Done'),
        ),
      ],
    );
  }
}
```

- [ ] **Step 3: Create `lib/features/students/presentation/students_list_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/students_repository.dart';
import 'widgets/invite_dialog.dart';
import 'widgets/student_card.dart';

class StudentsListScreen extends ConsumerWidget {
  const StudentsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => context.push('/instructor/students/add'),
          ),
        ],
      ),
      body: studentsAsync.when(
        data: (students) {
          if (students.isEmpty) {
            return EmptyState(
              icon: Icons.people_outline,
              title: 'No Students Yet',
              subtitle: 'Add your first student or generate an invite code',
              actionLabel: 'Add Student',
              onAction: () => context.push('/instructor/students/add'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: students.length,
            itemBuilder: (context, index) {
              final student = students[index];
              return StudentCard(
                student: student,
                onTap: () => context.push(
                  '/instructor/students/${student.id}',
                ),
              );
            },
          );
        },
        loading: () => const LoadingIndicator(),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final repo = ref.read(studentsRepositoryProvider);
          final code = await repo.generateInviteCode();
          if (context.mounted) {
            showDialog(
              context: context,
              builder: (_) => InviteDialog(code: code),
            );
          }
        },
        icon: const Icon(Icons.link),
        label: const Text('Invite'),
      ),
    );
  }
}
```

- [ ] **Step 4: Create `lib/features/students/presentation/add_student_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/utils/validators.dart';
import '../../auth/presentation/widgets/auth_form_field.dart';
import '../data/students_repository.dart';

class AddStudentScreen extends ConsumerStatefulWidget {
  const AddStudentScreen({super.key});

  @override
  ConsumerState<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends ConsumerState<AddStudentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    try {
      await ref.read(studentsRepositoryProvider).addStudent(
            name: _nameController.text.trim(),
            email: _emailController.text.trim().isEmpty
                ? null
                : _emailController.text.trim(),
            phone: _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
          );

      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Student')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthFormField(
                controller: _nameController,
                label: 'Full Name',
                prefixIcon: Icons.person_outlined,
                validator: Validators.required,
              ),
              const SizedBox(height: 16),
              AuthFormField(
                controller: _emailController,
                label: 'Email (optional)',
                prefixIcon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AuthFormField(
                controller: _phoneController,
                label: 'Phone (optional)',
                prefixIcon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Add Student'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: Create `lib/features/students/presentation/student_detail_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/students_repository.dart';
import '../domain/student.dart';

class StudentDetailScreen extends ConsumerWidget {
  final String studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsStreamProvider);
    final theme = Theme.of(context);

    return studentsAsync.when(
      data: (students) {
        final student = students.where((s) => s.id == studentId).firstOrNull;
        if (student == null) {
          return const Scaffold(
            body: Center(child: Text('Student not found')),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(student.name),
            actions: [
              PopupMenuButton<String>(
                onSelected: (value) async {
                  final repo = ref.read(studentsRepositoryProvider);
                  await repo.updateStudentStatus(studentId, value);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'active', child: Text('Set Active')),
                  const PopupMenuItem(value: 'inactive', child: Text('Set Inactive')),
                  const PopupMenuItem(value: 'passed', child: Text('Mark as Passed')),
                ],
              ),
            ],
          ),
          body: DefaultTabController(
            length: 4,
            child: Column(
              children: [
                // Student info header
                Container(
                  padding: const EdgeInsets.all(24),
                  color: AppColors.backgroundAccent,
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          student.name.isNotEmpty
                              ? student.name[0].toUpperCase()
                              : '?',
                          style: theme.textTheme.displaySmall?.copyWith(
                            color: AppColors.textOnPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(student.name,
                                style: theme.textTheme.headlineMedium),
                            if (student.phone != null)
                              Text(student.phone!,
                                  style: theme.textTheme.bodyMedium),
                            if (student.email != null)
                              Text(student.email!,
                                  style: theme.textTheme.bodySmall),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const TabBar(
                  tabs: [
                    Tab(text: 'Overview'),
                    Tab(text: 'Progress'),
                    Tab(text: 'Lessons'),
                    Tab(text: 'Mock Tests'),
                  ],
                  labelColor: AppColors.primary,
                  indicatorColor: AppColors.primary,
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      // Overview tab — placeholder for notes
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            student.notes ?? 'No notes yet',
                            style: theme.textTheme.bodyLarge,
                          ),
                        ),
                      ),
                      // Progress tab — implemented in Task 15
                      const Center(child: Text('Progress — coming soon')),
                      // Lessons tab — implemented in Task 13
                      const Center(child: Text('Lessons — coming soon')),
                      // Mock tests tab — Phase 2
                      const Center(child: Text('Mock Tests — Phase 2')),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const Scaffold(body: LoadingIndicator()),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
    );
  }
}
```

- [ ] **Step 6: Update router with student routes**

In `lib/app/router/app_router.dart`, add imports:

```dart
import '../../features/students/presentation/students_list_screen.dart';
import '../../features/students/presentation/student_detail_screen.dart';
import '../../features/students/presentation/add_student_screen.dart';
```

Replace the students branch placeholder:
```dart
StatefulShellBranch(routes: [
  GoRoute(
    path: '/instructor/students',
    builder: (context, state) => const StudentsListScreen(),
    routes: [
      GoRoute(
        path: 'add',
        builder: (context, state) => const AddStudentScreen(),
      ),
      GoRoute(
        path: ':id',
        builder: (context, state) => StudentDetailScreen(
          studentId: state.pathParameters['id']!,
        ),
      ),
    ],
  ),
]),
```

- [ ] **Step 7: Verify build**

```bash
flutter run
```

Expected: Students tab shows empty state. Can navigate to add student form.

- [ ] **Step 8: Commit**

```bash
git add lib/features/students/presentation/ lib/app/router/app_router.dart
git commit -m "feat: add student management screens — list, detail, add, invite"
```

---

**Remaining tasks continue in Part 2: `docs/superpowers/plans/2026-04-19-instructly-mvp-part2.md`**

Tasks 10-20 cover:
- Task 10: Bookings — Data & Domain (Booking model, availability logic, repository)
- Task 11: Bookings — Calendar Screen (table_calendar integration, day cells, booking tiles)
- Task 12: Bookings — Create/Edit Flow (time slot picker, recurring bookings)
- Task 13: Lesson Logs — Data, Domain & Presentation
- Task 14: Progress Tracking — Data, Domain & Presentation (DVSA skills, rating UI)
- Task 15: Messages — Data, Domain & Presentation
- Task 16: Subscription — Stripe Extension Setup & Feature Gating
- Task 17: Notifications — FCM Setup & Cloud Functions
- Task 18: Cloud Functions (auth triggers, booking triggers, invite claiming, reminders)
- Task 19: Instructor Dashboard
- Task 20: Student App Screens (bookings view, progress view)
