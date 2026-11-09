import 'package:flutter/material.dart';

/// Returns the entered PIN, or null if the user cancelled.
Future<String?> showPinDialog(BuildContext context, {required String title, required String message}) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            autofocus: true,
            obscureText: true,
            keyboardType: TextInputType.number,
            maxLength: 12,
            decoration: const InputDecoration(labelText: 'PIN', counterText: ''),
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
