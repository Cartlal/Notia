import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";
import { storage } from "../services/storage";

export async function uploadAttachment(req: AuthedRequest, res: Response) {
  const note = await prisma.note.findFirst({ where: { id: req.params.noteId, userId: req.userId! } });
  if (!note) throw new ApiError(404, "note_not_found", "Note not found");
  if (!req.file) throw new ApiError(400, "no_file", "No file uploaded");

  const stored = await storage.save(req.file.originalname, req.file.buffer);
  const kind = req.file.mimetype.startsWith("image/") ? "image" : req.file.mimetype.startsWith("audio/") ? "audio" : "file";

  const attachment = await prisma.attachment.create({
    data: {
      noteId: note.id,
      userId: req.userId!,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: stored.sizeBytes,
      url: stored.url,
      kind,
    },
  });

  res.status(201).json({ attachment });
}

export async function deleteAttachment(req: AuthedRequest, res: Response) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!attachment) throw new ApiError(404, "attachment_not_found", "Attachment not found");
  await prisma.attachment.delete({ where: { id: attachment.id } });
  res.status(204).send();
}
