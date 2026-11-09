import { create } from "zustand";

interface SecureSessionState {
  /** The verified security PIN, kept in memory only for this tab's
   * session — never persisted. Once set, opening any other protected
   * note reuses it instead of prompting again, which is the whole point
   * of a *central* lock over the old per-note one. */
  verifiedPin: string | null;
  setVerifiedPin: (pin: string) => void;
  clear: () => void;
}

export const useSecureSessionStore = create<SecureSessionState>((set) => ({
  verifiedPin: null,
  setVerifiedPin: (pin) => set({ verifiedPin: pin }),
  clear: () => set({ verifiedPin: null }),
}));
