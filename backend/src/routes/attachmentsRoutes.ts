import { Router } from "express";
import * as attachments from "../controllers/attachmentsController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();
router.use(requireAuth);

router.delete("/:id", asyncHandler(attachments.deleteAttachment));

export default router;
