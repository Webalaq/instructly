import 'package:flutter/material.dart';

import '../../../../shared/utils/validators.dart';
import '../../../auth/presentation/widgets/auth_form_field.dart';

class ProfileStep extends StatelessWidget {
  const ProfileStep({
    super.key,
    required this.nameController,
    required this.phoneController,
  });

  final TextEditingController nameController;
  final TextEditingController phoneController;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tell us about yourself',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'This information will be shown to your students.',
          style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 32),
        AuthFormField(
          controller: nameController,
          label: 'Full Name',
          hint: 'e.g. Jane Smith',
          prefixIcon: Icons.person_outline,
          validator: Validators.required,
        ),
        const SizedBox(height: 20),
        AuthFormField(
          controller: phoneController,
          label: 'Phone Number',
          hint: 'e.g. 07700 123456',
          prefixIcon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
          validator: Validators.phone,
        ),
      ],
    );
  }
}
