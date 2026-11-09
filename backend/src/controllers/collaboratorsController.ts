import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";
import { resolveNoteAccess, requireOwner, MAX_COLLABORATORS_PER_NOTE } from "../services/noteAccess";

function serializeCollaborator(c: { id: string; role: string; addedAt: Date; user: { id: string; name: string; email: string; avatarUrl: string | null } }) {
  return { id: c.id, role: c.role, addedAt: c.addedAt, user: c.user };
}

export async function listCollaborators(req: AuthedRequest, res: Response) {
  // Any owner, viewer, or editor can see who has access; only the owner
  // can change it (enforced in add/update/remove below).
  await resolveNoteAccess(req.userId!, req.params.noteId);
  const collaborators = await prisma.collaborator.findMany({
    where: { noteId: req.params.noteId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { addedAt: "asc" },
  });
  res.json({ collaborators: collaborators.map(serializeCollaborator) });
}

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "EDITOR"]),
});

export async function addCollaborator(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);

  const { email, role: newRole } = addSchema.parse(req.body);

  const count = await prisma.collaborator.count({ where: { noteId: note.id } });
  if (count >= MAX_COLLABORATORS_PER_NOTE) {
    throw new ApiError(409, "collaborator_limit", `A note can have at most ${MAX_COLLABORATORS_PER_NOTE} collaborators`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "user_not_found", "No Notia account with that email");
  if (user.id === note.userId) throw new ApiError(409, "already_owner", "That user already owns this note");

  const existing = await prisma.collaborator.findUnique({ where: { noteId_userId: { noteId: note.id, userId: user.id } } });
  const collaborator = existing
    ? await prisma.collaborator.update({
        where: { id: existing.id },
        data: { role: newRole },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      })
    : await prisma.collaborator.create({
        data: { noteId: note.id, userId: user.id, role: newRole },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      });

  res.status(201).json({ collaborator: serializeCollaborator(collaborator) });
}

const updateSchema = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

async function getOwnedCollaborator(noteId: string, collaboratorId: string) {
  const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
  if (!collaborator || collaborator.noteId !== noteId) {
    throw new ApiError(404, "collaborator_not_found", "Collaborator not found");
  }
  return collaborator;
}

export async function updateCollaborator(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);
  const { role: newRole } = updateSchema.parse(req.body);
  await getOwnedCollaborator(note.id, req.params.collaboratorId);

  const collaborator = await prisma.collaborator.update({
    where: { id: req.params.collaboratorId },
    data: { role: newRole },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
  res.json({ collaborator: serializeCollaborator(collaborator) });
}

export async function removeCollaborator(req: AuthedRequest, res: Response) {
  const { note, role } = await resolveNoteAccess(req.userId!, req.params.noteId);
  requireOwner(role);
  await getOwnedCollaborator(note.id, req.params.collaboratorId);
  await prisma.collaborator.delete({ where: { id: req.params.collaboratorId } });
  res.status(204).send();
}
