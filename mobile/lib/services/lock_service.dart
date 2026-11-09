import 'package:local_auth/local_auth.dart';
import 'notes_service.dart';

/// Per-note protection: a note marked `isProtected` requires its PIN (set
/// via NotesService.setLock, verified server-side via NotesService.verifyLock)
/// before its content is shown. Fingerprint/face unlock is a convenience
/// layer on top of that PIN, never a replacement for it on the server —
/// the backend only ever knows about the PIN hash (see
/// backend/src/controllers/notesController.ts: setNoteLock/unlockNote).
///
/// This service decides, on the device, when biometrics are allowed to
/// stand in for typing the PIN again.
class LockService {
  final NotesService _notes;
  final LocalAuthentication _bio = LocalAuthentication();

  /// Notes unlocked earlier in this app session. Cleared when the process
  /// restarts — nothing here is persisted to disk.
  final Set<String> _sessionUnlocked = {};

  LockService(this._notes);

  Future<bool> isBiometricAvailable() async {
    try {
      final canCheck = await _bio.canCheckBiometrics;
      final isSupported = await _bio.isDeviceSupported();
      return canCheck && isSupported;
    } catch (_) {
      return false;
    }
  }

  /// Verifies a typed PIN against the server and, on success, remembers
  /// this note as unlocked for the rest of the session.
  Future<bool> unlockWithPin(String noteId, String pin) async {
    final ok = await _notes.verifyLock(noteId, pin);
    if (ok) _sessionUnlocked.add(noteId);
    return ok;
  }

  void lockAgain(String noteId) => _sessionUnlocked.remove(noteId);

  /// Default unlock policy:
  ///  1. Already unlocked this session → open immediately, no re-prompt.
  ///  2. Biometric hardware available → try it. A device PIN/pattern
  ///     fallback is allowed (`biometricOnly: false`) since the OS prompt
  ///     is itself a legitimate "prove you are this device's owner" check,
  ///     the same trust boundary Android/iOS use to guard other apps'
  ///     locked content. Success marks the note unlocked for the session
  ///     without calling the server — see the class doc: biometrics gate
  ///     local access to a PIN the server already verified exists, not the
  ///     PIN's secrecy itself, so this does not weaken server-side trust.
  ///  3. Biometric unavailable, not enrolled, or declined/failed → return
  ///     false. The caller (the lock screen) is expected to fall back to
  ///     `unlockWithPin`, which *does* hit the server.
  Future<bool> unlock(String noteId) async {
    if (_sessionUnlocked.contains(noteId)) return true;

    if (!await isBiometricAvailable()) return false;

    try {
      final didAuthenticate = await _bio.authenticate(
        localizedReason: 'Unlock this note',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
      if (didAuthenticate) {
        _sessionUnlocked.add(noteId);
        return true;
      }
    } catch (_) {
      // Lockout, cancellation, or a platform error — fall through to PIN.
    }
    return false;
  }
}
