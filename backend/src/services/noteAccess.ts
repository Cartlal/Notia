import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

export const MAX_COLLABORATORS_PER_NOTE = 5;

export type AccessRole = "OWNER" | "VIEWER" | "EDITOR";

export interface NoteAccess {
  note: NonNullable<Awaited<ReturnType<typeof prisma.note.findUnique>>>;
  role: AccessRole;
}

// A note is reachable by its owner (full control) or by a collaborator
// (VIEWER: read-only, EDITOR: read + write) added via the share feature.
// Protected (PIN-locked) notes stay owner-only — sharing a note does not
// bypass its lock.
export async function resolveNoteAccess(userId: string, noteId: string): Promise<NoteAccess> {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) throw new ApiError(404, "note_not_found", "Note not found");

  if (note.userId === userId) return { note, role: "OWNER" };

  const collab = await prisma.collaborator.findUnique({
    where: { noteId_userId: { noteId, userId } },
  });
  if (!collab) throw new ApiError(404, "note_not_found", "Note not found");
  if (note.isProtected) throw new ApiError(403, "note_locked", "This note is PIN-protected by its owner");

  return { note, role: collab.role === "EDITOR" ? "EDITOR" : "VIEWER" };
}

export function requireWriteAccess(role: AccessRole) {
  if (role === "VIEWER") {
    throw new ApiError(403, "read_only", "You only have view access to this note");
  }
}

export function requireOwner(role: AccessRole) {
  if (role !== "OWNER") {
    throw new ApiError(403, "owner_only", "Only the note's owner can do this");
  }
}
