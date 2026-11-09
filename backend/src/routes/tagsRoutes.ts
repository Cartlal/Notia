import { Router } from "express";
import * as tags from "../controllers/tagsController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", tags.listTags);
router.post("/", tags.createTag);
router.delete("/:id", tags.deleteTag);

export default router;
