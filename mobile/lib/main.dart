import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_quill/flutter_quill.dart' show FlutterQuillLocalizations;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/providers.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/notes_list_screen.dart';

void main() {
  runApp(const ProviderScope(child: NotiaApp()));
}

class NotiaApp extends ConsumerWidget {
  const NotiaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp(
      title: 'Notia',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // Never ThemeMode.system — defaults to light regardless of the OS's
      // dark-mode preference (same rule as web's theme store), toggled only
      // via the sidebar's "Toggle theme" control.
      themeMode: themeMode,
      // flutter_quill's toolbar (used by the note editor) requires its own
      // localizations delegate to be registered, alongside the standard
      // Material/Cupertino/Widgets ones it bundles via this list.
      localizationsDelegates: const [
        ...GlobalMaterialLocalizations.delegates,
        FlutterQuillLocalizations.delegate,
      ],
      supportedLocales: FlutterQuillLocalizations.supportedLocales,
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
