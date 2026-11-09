import { Router } from "express";
import multer from "multer";
import * as notes from "../controllers/notesController";
import * as attachments from "../controllers/attachmentsController";
import { requireAuth } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(requireAuth);

router.get("/", notes.listNotes);
router.post("/", notes.createNote);
router.get("/:id", notes.getNote);
router.patch("/:id", notes.updateNote);
router.delete("/:id", notes.deleteNotePermanently);

router.post("/:id/pin", notes.togglePin);
router.post("/:id/favorite", notes.toggleFavorite);
router.post("/:id/archive", notes.toggleArchive);
router.post("/:id/trash", notes.trashNote);
router.post("/:id/restore", notes.restoreNote);
router.post("/:id/duplicate", notes.duplicateNote);

router.post("/:id/lock", notes.setNoteLock);
router.delete("/:id/lock", notes.removeNoteLock);
router.post("/:id/unlock", notes.unlockNote);

router.post("/:noteId/attachments", upload.single("file"), attachments.uploadAttachment);

export default router;
