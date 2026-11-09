import { Router } from "express";
import * as folders from "../controllers/foldersController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", folders.listFolders);
router.post("/", folders.createFolder);
router.patch("/:id", folders.updateFolder);
router.delete("/:id", folders.deleteFolder);

export default router;
