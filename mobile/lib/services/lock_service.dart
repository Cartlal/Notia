import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'auth_service.dart';

/// Central lock: ONE security PIN gates every note marked `isProtected`,
/// not a separate PIN per note (see backend's User.securityPinHash and
/// notesController's setNoteLock/unlockNote, which both check that single
/// hash now). Verifying it once — by typing it, or via a fingerprint that
/// unlocks the securely-stored copy — opens every locked note for the rest
/// of the session, matching the "central lock, not a separate one per note"
/// request this replaced the old per-note design for.
class LockService {
  final AuthService _auth;
  final LocalAuthentication _bio = LocalAuthentication();
  final _storage = const FlutterSecureStorage();
  static const _pinKey = 'security_pin';

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

  /// Verifies a typed PIN against the server and, on success, stores it
  /// (encrypted, via flutter_secure_storage) so future opens — this
  /// session or after an app restart — can be unlocked with just a
  /// fingerprint instead of retyping it.
  Future<bool> verifyAndStorePin(String pin) async {
    final ok = await _auth.verifySecurityPin(pin);
    if (ok) await _storage.write(key: _pinKey, value: pin);
    return ok;
  }

  Future<String?> _storedPin() => _storage.read(key: _pinKey);

  /// Call when the user explicitly re-locks the Secure section, and on
  /// logout — forgets the cached PIN so biometrics stop being a shortcut
  /// until it's typed again.
  Future<void> forgetPin() => _storage.delete(key: _pinKey);

  /// The main entry point for opening anything protected. Returns the
  /// verified PIN (ready to send to the server) on success, or null if
  /// the caller should fall back to showing a PIN-entry dialog:
  ///   1. No PIN stored yet → null (first time; nothing to unlock with).
  ///   2. PIN stored + biometric succeeds → returns it, no typing needed.
  ///   3. PIN stored but biometric unavailable/declined/failed → null,
  ///      same as the old per-note design: biometric is a convenience
  ///      layer, never a silent bypass when it can't be used.
  Future<String?> tryBiometricUnlock() async {
    final stored = await _storedPin();
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
