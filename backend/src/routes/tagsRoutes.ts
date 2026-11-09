import { Router } from "express";
import * as tags from "../controllers/tagsController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(tags.listTags));
router.post("/", asyncHandler(tags.createTag));
router.delete("/:id", asyncHandler(tags.deleteTag));

export default router;
