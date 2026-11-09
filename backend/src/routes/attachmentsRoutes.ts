import { Router } from "express";
import * as attachments from "../controllers/attachmentsController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.delete("/:id", attachments.deleteAttachment);

export default router;
