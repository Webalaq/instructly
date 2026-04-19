import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
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
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  int _currentStep = 0;
  bool _isSaving = false;

  // Step 2 state
  List<int> _selectedDurations = [60];
  int _bufferMinutes = 15;
  List<String> _teachingAreas = [];
  List<String> _preferredTestCentres = [];

  // Step 3 state
  Map<String, List<TimeSlot>> _weeklyAvailability = {};

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  bool _validateCurrentStep() {
    if (_currentStep == 0) {
      return _formKey.currentState?.validate() ?? false;
    }
    return true;
  }

  Future<void> _handleNext() async {
    if (!_validateCurrentStep()) return;

    if (_currentStep < 2) {
      setState(() => _currentStep++);
      return;
    }

    // Step 3 — complete setup
    await _completeSetup();
  }

  Future<void> _completeSetup() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    setState(() => _isSaving = true);

    try {
      final profile = InstructorProfile(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        lessonDurations: _selectedDurations,
        bufferMinutes: _bufferMinutes,
        teachingAreas: _teachingAreas,
        preferredTestCentres: _preferredTestCentres,
        weeklyAvailability: _weeklyAvailability,
      );

      await ref
          .read(onboardingRepositoryProvider)
          .saveProfile(uid: uid, profile: profile);

      if (mounted) {
        context.go(AppRoutes.instructor);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save profile: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Widget _buildStep() {
    return switch (_currentStep) {
      0 => ProfileStep(
          nameController: _nameController,
          phoneController: _phoneController,
        ),
      1 => TeachingSetupStep(
          selectedDurations: _selectedDurations,
          bufferMinutes: _bufferMinutes,
          teachingAreas: _teachingAreas,
          preferredTestCentres: _preferredTestCentres,
          onDurationsChanged: (v) => setState(() => _selectedDurations = v),
          onBufferChanged: (v) => setState(() => _bufferMinutes = v),
          onTeachingAreasChanged: (v) => setState(() => _teachingAreas = v),
          onTestCentresChanged: (v) =>
              setState(() => _preferredTestCentres = v),
        ),
      _ => AvailabilityStep(
          weeklyAvailability: _weeklyAvailability,
          onAvailabilityChanged: (v) =>
              setState(() => _weeklyAvailability = v),
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          'Instructly',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // ── Progress bar ──────────────────────────────────────────
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Step ${_currentStep + 1} of 3',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: List.generate(3, (index) {
                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right: index < 2 ? 6 : 0,
                            ),
                            child: AnimatedContainer(
                              duration: AppMotion.normal,
                              curve: AppMotion.standard,
                              height: 4,
                              decoration: BoxDecoration(
                                color: index <= _currentStep
                                    ? AppColors.primary
                                    : AppColors.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ],
                ),
              ),

              // ── Step content ──────────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                  child: AnimatedSwitcher(
                    duration: AppMotion.normal,
                    switchInCurve: AppMotion.enter,
                    switchOutCurve: AppMotion.exit,
                    transitionBuilder: (child, animation) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0.05, 0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: child,
                        ),
                      );
                    },
                    child: KeyedSubtree(
                      key: ValueKey(_currentStep),
                      child: _buildStep(),
                    ),
                  ),
                ),
              ),

              // ── Bottom button ─────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Row(
                  children: [
                    if (_currentStep > 0) ...[
                      OutlinedButton(
                        onPressed:
                            _isSaving
                                ? null
                                : () =>
                                    setState(() => _currentStep--),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Back'),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: FilledButton(
                        onPressed: _isSaving ? null : _handleNext,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.textOnPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.textOnPrimary,
                                ),
                              )
                            : Text(
                                _currentStep == 2
                                    ? 'Complete Setup'
                                    : 'Next',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
