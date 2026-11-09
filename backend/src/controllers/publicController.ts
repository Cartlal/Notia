import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

const noteSelect = {
  id: true,
  title: true,
  content: true,
  color: true,
  updatedAt: true,
  version: true,
  isProtected: true,
};

async function resolveLink(token: string) {
  const link = await prisma.sharedNote.findUnique({ where: { token } });
  if (!link) throw new ApiError(404, "link_not_found", "This share link doesn't exist or was revoked");
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new ApiError(410, "link_expired", "This share link has expired");
  }
  const note = await prisma.note.findUnique({ where: { id: link.noteId }, select: noteSelect });
  if (!note) throw new ApiError(404, "note_not_found", "Note not found");
  if (note.isProtected) {
    // The owner locked this note with a PIN after the link was created —
    // a public link never bypasses that, same rule as collaborators.
    throw new ApiError(403, "note_locked", "This note is now PIN-protected and no longer shareable by link");
  }
  return { link, note };
}

// No auth middleware on these routes — anyone with the token can read
// (and, for an EDITOR link, write) this one note. This mirrors
// "anyone with the link" sharing in Google Docs: the link itself is the
// credential, scoped to exactly one note, never a login.
export async function getPublicNote(req: Request, res: Response) {
  const { note, link } = await resolveLink(req.params.token);
  res.json({ note, role: link.role });
}

const updateSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  plainText: z.string().optional(),
  version: z.number().int().optional(),
});

export async function updatePublicNote(req: Request, res: Response) {
  const { note, link } = await resolveLink(req.params.token);
  if (link.role !== "EDITOR") {
    throw new ApiError(403, "read_only", "This link only grants view access");
  }
  const body = updateSchema.parse(req.body);
  if (body.version !== undefined && body.version !== note.version) {
    return res.status(409).json({ error: "conflict", message: "Note was modified elsewhere", note });
  }

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: {
      title: body.title,
      content: body.content,
      plainText: body.plainText,
      version: { increment: 1 },
    },
    select: noteSelect,
  });
  res.json({ note: updated, role: link.role });
}
