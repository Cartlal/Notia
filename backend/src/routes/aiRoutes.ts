import { Router } from "express";
import * as ai from "../controllers/aiController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/status", asyncHandler(ai.status));
router.post("/summarize", asyncHandler(ai.summarize));
router.post("/fix-grammar", asyncHandler(ai.fixGrammar));
router.post("/rewrite", asyncHandler(ai.rewrite));
router.post("/generate", asyncHandler(ai.generate));
router.post("/extract-tasks", asyncHandler(ai.extractTasks));
router.post("/translate", asyncHandler(ai.translate));

export default router;
