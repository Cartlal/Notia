import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

const folderSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export async function listFolders(req: AuthedRequest, res: Response) {
  const folders = await prisma.folder.findMany({ where: { userId: req.userId! }, orderBy: { name: "asc" } });
  res.json({ folders });
}

export async function createFolder(req: AuthedRequest, res: Response) {
  const body = folderSchema.parse(req.body);
  const folder = await prisma.folder.create({ data: { ...body, userId: req.userId! } });
  res.status(201).json({ folder });
}

export async function updateFolder(req: AuthedRequest, res: Response) {
  const existing = await prisma.folder.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) throw new ApiError(404, "folder_not_found", "Folder not found");
  const body = folderSchema.partial().parse(req.body);
  const folder = await prisma.folder.update({ where: { id: existing.id }, data: body });
  res.json({ folder });
}

export async function deleteFolder(req: AuthedRequest, res: Response) {
  const existing = await prisma.folder.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) throw new ApiError(404, "folder_not_found", "Folder not found");
  await prisma.folder.delete({ where: { id: existing.id } });
  res.status(204).send();
}
