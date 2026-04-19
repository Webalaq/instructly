import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/theme/app_colors.dart';

class InviteDialog extends StatelessWidget {
  const InviteDialog({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Invite Code'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Share this code with your student:'),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.backgroundAccent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              code,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Expires in 7 days',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
        ],
      ),
      actions: [
        TextButton.icon(
          onPressed: () async {
            await Clipboard.setData(ClipboardData(text: code));
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Invite code copied to clipboard')),
              );
            }
          },
          icon: const Icon(Icons.copy_outlined),
          label: const Text('Copy'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Done'),
        ),
      ],
    );
  }
}
