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

  // TODO(human): implement the unlock decision.
  //
  // Called every time a protected note is opened. Decide here whether to:
  //   (a) let the note open immediately (already unlocked this session),
  //   (b) try biometric authentication and open on success,
  //   (c) fall back to asking for the PIN (biometric unavailable, not
  //       enrolled, or the user declined/failed biometric).
  //
  // Guidance to weigh:
  // - `_sessionUnlocked` already tracks notes unlocked this session — reuse
  //   it rather than re-prompting every time the same note reopens, but
  //   note it is memory-only (`lockAgain` exists for an explicit re-lock
  //   action the user can trigger).
  // - `_bio.authenticate(...)` takes a `localizedReason` string shown in the
  //   OS prompt, and options like `biometricOnly`. Decide whether a device
  //   PIN/pattern fallback (not this app's note-PIN — the OS one) should be
  //   allowed as an alternative to fingerprint.
  // - A biometric success does not call the server; it only trusts the
  //   device's hardware. Decide whether that is sufficient on its own, or
  //   whether you still want the real PIN checked (via `unlockWithPin`)
  //   the first time in a session.
  // - Return a bool: whether the note should now be shown unlocked.
  Future<bool> unlock(String noteId) async {
    throw UnimplementedError('LockService.unlock is not implemented yet');
  }
}
