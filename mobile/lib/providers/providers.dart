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
final lockServiceProvider = Provider((ref) => LockService(ref.read(authServiceProvider)));

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
    await ref.read(lockServiceProvider).forgetPassword();
    state = const AsyncData(null);
  }

  Future<void> updateProfile({required String name}) async {
    final user = await ref.read(authServiceProvider).updateProfile(name: name);
    state = AsyncData(user);
  }

  Future<void> deleteAccount() async {
    await ref.read(authServiceProvider).deleteAccount();
    state = const AsyncData(null);
  }

  /// Re-fetches /auth/me — used after a change-password, since that can
  /// flip `hasPassword` server-side without otherwise changing the cached
  /// user.
  Future<void> refresh() async {
    final user = await ref.read(authServiceProvider).currentUser();
    state = AsyncData(user);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthUser?>(AuthController.new);
