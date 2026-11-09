import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";
import { resolveNoteAccess, requireOwner } from "../services/noteAccess";

function serializeLink(link: { id: string; token: string; role: string; expiresAt: Date | null; createdAt: Date }) {
  return { id: link.id, token: link.token, role: link.role, expiresAt: link.expiresAt, createdAt: link.createdAt };
}

export async function listShareLinks(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);
  const links = await prisma.sharedNote.findMany({ where: { noteId: note.id }, orderBy: { createdAt: "desc" } });
  res.json({ links: links.map(serializeLink) });
}

const createSchema = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

export async function createShareLink(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);
  if (note.isProtected) {
    throw new ApiError(409, "note_locked", "Remove this note's PIN before creating a public link");
  }
  const { role: linkRole } = createSchema.parse(req.body);

  const link = await prisma.sharedNote.create({
    data: { noteId: note.id, ownerId: req.userId!, role: linkRole },
  });
  res.status(201).json({ link: serializeLink(link) });
}

export async function revokeShareLink(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);
  const link = await prisma.sharedNote.findUnique({ where: { id: req.params.linkId } });
  if (!link || link.noteId !== note.id) throw new ApiError(404, "link_not_found", "Share link not found");
  await prisma.sharedNote.delete({ where: { id: link.id } });
  res.status(204).send();
}
