import { Router } from "express";
import * as folders from "../controllers/foldersController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(folders.listFolders));
router.post("/", asyncHandler(folders.createFolder));
router.patch("/:id", asyncHandler(folders.updateFolder));
router.delete("/:id", asyncHandler(folders.deleteFolder));

export default router;
