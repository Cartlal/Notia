import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";
import { getIo } from "../realtime/io";
import { resolveNoteAccess, requireWriteAccess } from "../services/noteAccess";

const noteCreateSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  contentJson: z.string().optional(),
  plainText: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["STANDARD", "CHECKLIST", "DAILY", "MEETING", "JOURNAL"]).optional(),
  folderId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

const noteUpdateSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  contentJson: z.string().optional(),
  plainText: z.string().optional(),
  color: z.string().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  version: z.number().int().optional(),
});

const noteInclude = {
  noteTags: { include: { tag: true } },
  attachments: true,
  tasks: { orderBy: { sortOrder: "asc" as const } },
};

function serializeNote(note: any) {
  const { noteTags, ...rest } = note;
  return { ...rest, tags: noteTags?.map((nt: any) => nt.tag) ?? [], pinHash: undefined };
}

// Used for list endpoints: a protected note's body never goes out in a list
// response, central-PIN-verified or not — only opening the note individually
// (which requires the PIN) reveals content. Without this, content for every
// note in the new "Secure" view (and any protected note mixed into "All
// notes") would leak in the network response even though the UI hides it.
function serializeNoteRedacted(note: any) {
  const serialized = serializeNote(note);
  if (note.isProtected) {
    return { ...serialized, content: null, contentJson: null, plainText: "" };
  }
  return serialized;
}

async function getOwnedNote(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId }, include: noteInclude });
  if (!note) throw new ApiError(404, "note_not_found", "Note not found");
  return note;
}

async function getNoteWithInclude(noteId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId }, include: noteInclude });
  if (!note) throw new ApiError(404, "note_not_found", "Note not found");
  return note;
}

export async function listNotes(req: AuthedRequest, res: Response) {
  const { folderId, tagId, view, sort = "updatedAt", order = "desc" } = req.query as Record<string, string>;

  if (view === "shared") {
    const notes = await prisma.note.findMany({
      where: { isTrashed: false, collaborators: { some: { userId: req.userId! } } },
      include: noteInclude,
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ notes: notes.map(serializeNoteRedacted) });
  }

  const where: any = { userId: req.userId! };
  if (view === "trash") where.isTrashed = true;
  else {
    where.isTrashed = false;
    if (view === "archived") where.isArchived = true;
    else if (view === "favorites") where.isFavorite = true;
    else if (view === "pinned") where.isPinned = true;
    else if (view === "locked") where.isProtected = true;
    else where.isArchived = false;
  }
  if (folderId) where.folderId = folderId;
  if (tagId) where.noteTags = { some: { tagId } };

  const orderBy: any = { [sort]: order === "asc" ? "asc" : "desc" };

  const notes = await prisma.note.findMany({ where, include: noteInclude, orderBy });
  res.json({ notes: notes.map(serializeNoteRedacted) });
}

export async function getNote(req: AuthedRequest, res: Response) {
  const { role } = await resolveNoteAccess(req.userId!, req.params.id);
  const note = await getNoteWithInclude(req.params.id);
  if (note.isProtected) return res.json({ note: { ...serializeNote(note), content: null, locked: true }, role });
  res.json({ note: serializeNote(note), role });
}

export async function createNote(req: AuthedRequest, res: Response) {
  const body = noteCreateSchema.parse(req.body);
  const note = await prisma.note.create({
    data: {
      userId: req.userId!,
      title: body.title ?? "Untitled",
      content: body.content ?? "",
      contentJson: body.contentJson,
      plainText: body.plainText ?? "",
      color: body.color,
      type: body.type ?? "STANDARD",
      folderId: body.folderId ?? undefined,
      noteTags: body.tagIds ? { create: body.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: noteInclude,
  });
  res.status(201).json({ note: serializeNote(note) });
}

export async function updateNote(req: AuthedRequest, res: Response) {
  const { role } = await resolveNoteAccess(req.userId!, req.params.id);
  requireWriteAccess(role);
  const existing = await getNoteWithInclude(req.params.id);
  const body = noteUpdateSchema.parse(req.body);

  if (body.version !== undefined && body.version !== existing.version) {
    return res.status(409).json({ error: "conflict", message: "Note was modified elsewhere", note: serializeNote(existing) });
  }

  if (body.content !== undefined && body.content !== existing.content) {
    await prisma.noteVersion.create({
      data: { noteId: existing.id, title: existing.title, content: existing.content, contentJson: existing.contentJson, version: existing.version },
    });
  }

  const note = await prisma.note.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      content: body.content,
      contentJson: body.contentJson,
      plainText: body.plainText,
      color: body.color,
      folderId: body.folderId,
      version: { increment: 1 },
      noteTags: body.tagIds ? { deleteMany: {}, create: body.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: noteInclude,
  });

  getIo()?.to(`note:${note.id}`).emit("note:updated", serializeNote(note));
  res.json({ note: serializeNote(note) });
}

async function toggleField(req: AuthedRequest, res: Response, field: "isPinned" | "isFavorite" | "isArchived") {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const note = await prisma.note.update({ where: { id: existing.id }, data: { [field]: !existing[field] }, include: noteInclude });
  res.json({ note: serializeNote(note) });
}

export const togglePin = (req: AuthedRequest, res: Response) => toggleField(req, res, "isPinned");
export const toggleFavorite = (req: AuthedRequest, res: Response) => toggleField(req, res, "isFavorite");
export const toggleArchive = (req: AuthedRequest, res: Response) => toggleField(req, res, "isArchived");

export async function trashNote(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const note = await prisma.note.update({ where: { id: existing.id }, data: { isTrashed: true, trashedAt: new Date() } });
  res.json({ note: serializeNote(note) });
}

export async function restoreNote(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const note = await prisma.note.update({ where: { id: existing.id }, data: { isTrashed: false, trashedAt: null } });
  res.json({ note: serializeNote(note) });
}

export async function deleteNotePermanently(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  await prisma.note.delete({ where: { id: existing.id } });
  res.status(204).send();
}

export async function duplicateNote(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const copy = await prisma.note.create({
    data: {
      userId: req.userId!,
      title: `${existing.title} (copy)`,
      content: existing.content,
      contentJson: existing.contentJson,
      plainText: existing.plainText,
      color: existing.color,
      type: existing.type,
      folderId: existing.folderId,
      noteTags: { create: existing.noteTags.map((nt: any) => ({ tagId: nt.tagId })) },
    },
    include: noteInclude,
  });
  res.status(201).json({ note: serializeNote(copy) });
}

const pinSchema = z.object({ pin: z.string().min(4).max(12) });

// Notes are protected by ONE central "security PIN" on the User, not a
// separate PIN per note (Note.pinHash is unused/legacy) — unlocking the
// Secure section once covers every note in it, matching the web/Flutter
// "central lock" UX.
export async function setNoteLock(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.securityPinHash) {
    throw new ApiError(409, "no_security_pin", "Set a security PIN first (Settings → Security)");
  }
  const note = await prisma.note.update({ where: { id: existing.id }, data: { isProtected: true } });
  res.json({ note: serializeNote(note) });
}

export async function removeNoteLock(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  const note = await prisma.note.update({ where: { id: existing.id }, data: { isProtected: false } });
  res.json({ note: serializeNote(note) });
}

export async function unlockNote(req: AuthedRequest, res: Response) {
  const existing = await getOwnedNote(req.userId!, req.params.id);
  if (!existing.isProtected) return res.json({ note: serializeNote(existing) });
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.securityPinHash) return res.json({ note: serializeNote(existing) });
  const { pin } = pinSchema.parse(req.body);
  const valid = await bcrypt.compare(pin, user.securityPinHash);
  if (!valid) throw new ApiError(401, "invalid_pin", "Incorrect PIN");
  res.json({ note: serializeNote(existing) });
}
