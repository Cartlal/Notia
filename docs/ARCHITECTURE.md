# Architecture

## Monorepo layout

```
notes app/
  backend/     Node.js + Express + TypeScript API (REST + Socket.IO)
  web/         React + TypeScript + Vite + Tailwind + shadcn/ui + TipTap
  mobile/      Flutter app (Android first, iOS-ready)
  docs/        Architecture, schema, roadmap
```

All three clients talk to one backend over REST (CRUD, auth, search, AI)
and one Socket.IO namespace (real-time note updates, presence, comments).

## Backend

- **Express + TypeScript**, layered: `routes -> controllers -> services -> prisma`.
- **Prisma + PostgreSQL** for all persistent data (schema: `docs/SCHEMA.md` /
  `backend/prisma/schema.prisma`).
- **Redis** for session/rate-limit counters, Socket.IO adapter, and job queue
  (reminders). Optional in dev — the app degrades gracefully without it.
- **JWT** access + refresh tokens (httpOnly refresh cookie on web, secure
  storage on mobile). Google OAuth as an alternate login provider.
- **Local disk storage in dev** behind a `StorageProvider` interface
  (`backend/src/services/storage.ts`) so it can be swapped for S3 /
  Cloudflare R2 in production by changing one env var, no code changes.
- **AI features are optional and modular**: every AI endpoint is behind
  `AI_PROVIDER_API_KEY` — if unset, those endpoints return
  `503 ai_not_configured` and the rest of the app (notes, folders, tags,
  sync) works fully without it.
- **Socket.IO** room-per-note (`note:<id>`) for live edits, and
  room-per-user (`user:<id>`) for cross-device sync pushes.

## Web

- Vite + React + TypeScript, Tailwind for styling, shadcn/ui for primitives,
  lucide-react for icons, TipTap for the rich text editor.
- Zustand for client state, TanStack Query for server state/caching.
- Offline-first: notes are cached in IndexedDB; writes queue and replay on
  reconnect; the server is the conflict-resolution authority
  (last-write-wins by version counter, never silently drops newer content).

## Mobile (Flutter)

- Flutter (Dart), Riverpod for state, `dio` for the API client, `hive` for
  local offline cache, `flutter_quill` for rich text.
- `local_auth` for fingerprint/biometric unlock, `flutter_secure_storage`
  for the PIN hash and biometric gate flag — PIN/biometric lock is enforced
  **per note** (a note can be marked "protected"), not just at app launch.
- Shares the same REST/Socket.IO backend as web; same auth/JWT flow.

## Security

- Passwords hashed with bcrypt. JWT access tokens short-lived (15 min),
  refresh tokens rotated and stored httpOnly (web) / secure storage
  (mobile). Protected notes store a separate per-note PIN hash (bcrypt) —
  the server never needs to know the device's biometric state, biometric
  unlock only gates revealing a PIN-unlocked note locally.
- All note/folder/tag endpoints scoped to `req.user.id`; Prisma queries
  always filter by owner or explicit share grant.
- Rate limiting (per-IP + per-user) via `express-rate-limit` + Redis store.
- Input validation with `zod` at every route boundary.

## Real-time sync & conflict resolution

Every note has a monotonic `version` column. A client sends
`{ version, patch }`; if the server's current version matches, it applies
and bumps the version, broadcasting to the note's room. If it doesn't
match, the server returns the latest full note and the client merges
(TipTap/Quill content uses structural diff merge; metadata uses
last-write-wins on the newer `updatedAt`). Newer content is never
overwritten by a stale write.
