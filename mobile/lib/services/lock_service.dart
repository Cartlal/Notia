import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'auth_service.dart';

/// Central lock: the Secure section is gated by the user's own account
/// password (verified server-side, see backend's /auth/verify-password and
/// notesController's setNoteLock/unlockNote) — no separate app-specific PIN
/// to create. On-device, `local_auth`'s `authenticate(biometricOnly: false)`
/// already asks the OS for its own device-credential fallback (the phone's
/// system PIN/pattern/password, or a fingerprint/face) — this class never
/// implements its own PIN entry; it only decides when that system prompt
/// can stand in for retyping the account password.
class LockService {
  final AuthService _auth;
  final LocalAuthentication _bio = LocalAuthentication();
  final _storage = const FlutterSecureStorage();
  static const _passwordKey = 'secure_section_password';

  LockService(this._auth);

  Future<bool> isBiometricAvailable() async {
    try {
      final canCheck = await _bio.canCheckBiometrics;
      final isSupported = await _bio.isDeviceSupported();
      return canCheck && isSupported;
    } catch (_) {
      return false;
    }
  }

  /// Verifies a typed account password against the server and, on
  /// success, stores it (encrypted, via flutter_secure_storage) so future
  /// opens — this session or after an app restart — can be unlocked with
  /// just the device's system authentication instead of retyping it.
  Future<bool> verifyAndStorePassword(String password) async {
    final ok = await _auth.verifyPassword(password);
    if (ok) await _storage.write(key: _passwordKey, value: password);
    return ok;
  }

  Future<String?> _storedPassword() => _storage.read(key: _passwordKey);

  /// Call when the user explicitly re-locks the Secure section, and on
  /// logout — forgets the cached password so the device prompt stops
  /// being a shortcut until it's typed again.
  Future<void> forgetPassword() => _storage.delete(key: _passwordKey);

  /// The main entry point for opening anything protected. Returns the
  /// verified account password (ready to send to the server) on success,
  /// or null if the caller should fall back to showing a password dialog:
  ///   1. No password stored yet → null (first time; nothing to unlock with).
  ///   2. Password stored + the OS's own authenticate() prompt succeeds
  ///      (fingerprint, face, or the phone's system PIN/pattern/password —
  ///      Android/iOS decide which to offer, this app never asks for one
  ///      itself) → returns it, no typing needed.
  ///   3. Password stored but the device prompt is unavailable, declined,
  ///      or fails → null, same as before: it's a convenience layer, never
  ///      a silent bypass when it can't be used.
  Future<String?> tryDeviceUnlock() async {
    final stored = await _storedPassword();
    if (stored == null) return null;
    if (!await isBiometricAvailable()) return null;

    try {
      final didAuthenticate = await _bio.authenticate(
        localizedReason: 'Unlock your secure notes',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
      return didAuthenticate ? stored : null;
    } catch (_) {
      return null;
    }
  }
}
