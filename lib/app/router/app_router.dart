import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../shared/widgets/app_scaffold.dart';

// ---------------------------------------------------------------------------
// Route paths
// ---------------------------------------------------------------------------

class AppRoutes {
  static const login = '/login';
  static const register = '/register';
  static const registerStudent = '/register/student';
  static const onboarding = '/onboarding';

  // Instructor shell branches
  static const instructor = '/instructor';
  static const instructorCalendar = '/instructor/calendar';
  static const instructorStudents = '/instructor/students';
  static const instructorMore = '/instructor/more';

  // Student shell branches
  static const student = '/student';
  static const studentProgress = '/student/progress';
  static const studentMore = '/student/more';
}

// ---------------------------------------------------------------------------
// Router provider
// ---------------------------------------------------------------------------

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.login,
    redirect: (context, state) {
      // TODO: Replace with real auth check once Firebase is configured.
      // For now, always redirect to login so the app shows something useful.
      // When Firebase Auth is wired up, check FirebaseAuth.instance.currentUser
      // here and redirect based on role.
      return null; // No redirect — let the initial location handle it.
    },
    routes: [
      // ------------------------------------------------------------------
      // Auth routes
      // ------------------------------------------------------------------
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.registerStudent,
        builder: (context, state) {
          final code = state.uri.queryParameters['code'];
          return RegisterScreen(isStudent: true, inviteCode: code);
        },
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),

      // ------------------------------------------------------------------
      // Instructor shell (StatefulShellRoute with bottom nav)
      // ------------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppScaffold(
          navigationShell: navigationShell,
          isInstructor: true,
        ),
        branches: [
          // Branch 0 – Dashboard
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.instructor,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Instructor Dashboard — to be implemented')),
                ),
              ),
            ],
          ),
          // Branch 1 – Calendar
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.instructorCalendar,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Calendar — to be implemented')),
                ),
              ),
            ],
          ),
          // Branch 2 – Students
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.instructorStudents,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Students — to be implemented')),
                ),
              ),
            ],
          ),
          // Branch 3 – More
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.instructorMore,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('More — to be implemented')),
                ),
              ),
            ],
          ),
        ],
      ),

      // ------------------------------------------------------------------
      // Student shell (StatefulShellRoute with bottom nav)
      // ------------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppScaffold(
          navigationShell: navigationShell,
          isInstructor: false,
        ),
        branches: [
          // Branch 0 – Bookings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.student,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Bookings — to be implemented')),
                ),
              ),
            ],
          ),
          // Branch 1 – Progress
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.studentProgress,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Progress — to be implemented')),
                ),
              ),
            ],
          ),
          // Branch 2 – More
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.studentMore,
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('More — to be implemented')),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
