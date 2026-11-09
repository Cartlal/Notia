import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/notes_service.dart';
import '../services/lock_service.dart';

// Mirrors web's theme store: defaults to light (never follows the OS's
// dark-mode preference — see main.dart), toggled explicitly by the user.
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

final authServiceProvider = Provider((ref) => AuthService());
final notesServiceProvider = Provider((ref) => NotesService());
final lockServiceProvider = Provider((ref) => LockService(ref.read(notesServiceProvider)));

/// Holds the signed-in user, or null when signed out / not yet checked.
/// `AsyncValue` so the UI can tell "still checking" apart from "signed out".
class AuthController extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() => ref.read(authServiceProvider).currentUser();

  Future<void> login(String email, String password) async {
    final user = await ref.read(authServiceProvider).login(email, password);
    state = AsyncData(user);
  }

  Future<void> register(String name, String email, String password) async {
    final user = await ref.read(authServiceProvider).register(name, email, password);
    state = AsyncData(user);
  }

  Future<void> logout() async {
    await ref.read(authServiceProvider).logout();
    state = const AsyncData(null);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthUser?>(AuthController.new);
