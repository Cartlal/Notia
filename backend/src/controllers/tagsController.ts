import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

const tagSchema = z.object({ name: z.string().min(1).max(50), color: z.string().optional() });

export async function listTags(req: AuthedRequest, res: Response) {
  const tags = await prisma.tag.findMany({ where: { userId: req.userId! }, orderBy: { name: "asc" } });
  res.json({ tags });
}

export async function createTag(req: AuthedRequest, res: Response) {
  const body = tagSchema.parse(req.body);
  const existing = await prisma.tag.findUnique({ where: { userId_name: { userId: req.userId!, name: body.name } } });
  if (existing) throw new ApiError(409, "tag_exists", "Tag already exists");
  const tag = await prisma.tag.create({ data: { ...body, userId: req.userId! } });
  res.status(201).json({ tag });
}

export async function deleteTag(req: AuthedRequest, res: Response) {
  const existing = await prisma.tag.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) throw new ApiError(404, "tag_not_found", "Tag not found");
  await prisma.tag.delete({ where: { id: existing.id } });
  res.status(204).send();
}
