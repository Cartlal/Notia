import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Prompts for the account password (used to unlock the Secure section).
/// Returns the entered password, or null if the user cancelled.
Future<String?> showPasswordDialog(BuildContext context, {required String title, required String message}) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: const TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            autofocus: true,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Account password'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.of(context).pop(controller.text), child: const Text('Continue')),
      ],
    ),
  );
}
