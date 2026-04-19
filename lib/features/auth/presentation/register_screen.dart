import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../shared/utils/validators.dart';
import '../data/auth_repository.dart';
import 'widgets/auth_form_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({
    super.key,
    this.isStudent = false,
    this.inviteCode,
  });

  final bool isStudent;
  final String? inviteCode;

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _inviteCodeController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

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
    _inviteCodeController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  /// Placeholder: returns null until Cloud Functions implement invite lookup.
  Future<String?> _findInstructorByInvite(String inviteCode) async {
    return null;
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final repo = ref.read(AuthRepository.authRepositoryProvider);

      if (widget.isStudent) {
        final inviteCode = _inviteCodeController.text.trim();
        final instructorId = await _findInstructorByInvite(inviteCode);

        await repo.registerStudent(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          inviteCode: inviteCode,
          instructorId: instructorId ?? '',
        );

        if (!mounted) return;
        context.go('/student');
      } else {
        await repo.registerInstructor(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        if (!mounted) return;
        context.go('/onboarding');
      }
    } on FirebaseAuthException catch (e) {
      setState(() {
        _error = e.message ?? 'Registration failed.';
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'An unexpected error occurred. Please try again.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isStudent = widget.isStudent;

    final title = isStudent ? 'Join Your Instructor' : 'Create Account';
    final subtitle = isStudent
        ? 'Enter your invite code to get started'
        : 'Start managing your driving lessons';
    final buttonLabel = isStudent ? 'Join' : 'Create Account';

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/login'),
        ),
        title: Text(title),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title
                  Text(
                    title,
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Subtitle
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Invite code field (students only)
                  if (isStudent) ...[
                    AuthFormField(
                      controller: _inviteCodeController,
                      label: 'Invite Code',
                      hint: 'Enter your invite code',
                      prefixIcon: Icons.vpn_key_outlined,
                      validator: Validators.required,
                    ),
                    const SizedBox(height: 16),
                  ],
                  // Email field
                  AuthFormField(
                    controller: _emailController,
                    label: 'Email',
                    hint: 'you@example.com',
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: Icons.email_outlined,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),
                  // Password field
                  AuthFormField(
                    controller: _passwordController,
                    label: 'Password',
                    hint: 'At least 8 characters',
                    obscureText: true,
                    prefixIcon: Icons.lock_outline,
                    validator: Validators.password,
                  ),
                  const SizedBox(height: 16),
                  // Confirm password field
                  AuthFormField(
                    controller: _confirmPasswordController,
                    label: 'Confirm Password',
                    hint: 'Re-enter your password',
                    obscureText: true,
                    prefixIcon: Icons.lock_outline,
                    validator: _validateConfirmPassword,
                  ),
                  // Error message
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.error.withOpacity(0.3)),
                      ),
                      child: Text(
                        _error!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  // Submit button
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
                        : Text(buttonLabel),
                  ),
                  const SizedBox(height: 12),
                  // Sign in link
                  TextButton(
                    onPressed: _loading ? null : () => context.go('/login'),
                    child: const Text('Already have an account? Sign in'),
                  ),
                  // Student invite link (only shown on instructor registration)
                  if (!isStudent)
                    TextButton(
                      onPressed: _loading
                          ? null
                          : () => context.go('/register/student'),
                      child: const Text("I'm a student with an invite code"),
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
