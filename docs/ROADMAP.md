# Roadmap

- [x] **Phase 1 — Foundation**: monorepo setup, Postgres schema + Prisma,
  JWT auth (email/password + Google OAuth stub), notes CRUD API, web
  dashboard + TipTap editor, Flutter app skeleton with auth + note list,
  image attachment (web + mobile), per-note PIN + fingerprint lock
  (mobile), logo + color system.
- [ ] **Phase 2**: folders (nested), tags, pin/favorite/archive/trash,
  global search (title/content/tags/folder), grid/list views, sorting.
- [ ] **Phase 3**: attachments (files/audio), reminders + recurring
  reminders, checklists, priority levels, daily/journal templates.
- [ ] **Phase 4**: offline mode polish, background sync, conflict
  resolution UI, multi-device real-time updates via Socket.IO.
- [ ] **Phase 5**: sharing (link + user), read-only/editor roles,
  comments, version history + restore.
- [ ] **Phase 6**: AI assistant (summarize, rewrite, grammar, generate,
  categorize, translate, RAG chat-with-notes), semantic search
  (pgvector embeddings).
- [ ] **Phase 7**: backlinks + graph view, markdown/PDF/DOCX/HTML export,
  web clipper, command palette, PWA, plugin architecture, test coverage,
  deployment.

This build delivers Phase 1 end-to-end and working. Each later phase is
additive and does not require re-architecting what Phase 1 ships.
