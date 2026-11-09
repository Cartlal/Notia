import { Router } from "express";
import * as ai from "../controllers/aiController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/status", ai.status);
router.post("/summarize", ai.summarize);
router.post("/fix-grammar", ai.fixGrammar);
router.post("/rewrite", ai.rewrite);
router.post("/generate", ai.generate);
router.post("/extract-tasks", ai.extractTasks);
router.post("/translate", ai.translate);

export default router;
