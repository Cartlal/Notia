import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/providers.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/notes_list_screen.dart';

void main() {
  runApp(const ProviderScope(child: NotiaApp()));
}

class NotiaApp extends StatelessWidget {
  const NotiaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Notia',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // Without this, MaterialApp defaults to ThemeMode.system and follows
      // the OS's dark-mode preference on first launch — same issue as the
      // web app's theme store. Light is always the default; dark is opt-in
      // once a toggle exists in this app too.
      themeMode: ThemeMode.light,
      home: const _AuthGate(),
    );
  }
}

class _AuthGate extends ConsumerWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    return auth.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (_, __) => const LoginScreen(),
      data: (user) => user == null ? const LoginScreen() : const NotesListScreen(),
    );
  }
}
