import { Router } from "express";
import multer from "multer";
import * as notes from "../controllers/notesController";
import * as attachments from "../controllers/attachmentsController";
import * as collaborators from "../controllers/collaboratorsController";
import * as shareLinks from "../controllers/shareLinksController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(requireAuth);

router.get("/", asyncHandler(notes.listNotes));
router.post("/", asyncHandler(notes.createNote));
router.get("/:id", asyncHandler(notes.getNote));
router.patch("/:id", asyncHandler(notes.updateNote));
router.delete("/:id", asyncHandler(notes.deleteNotePermanently));

router.post("/:id/pin", asyncHandler(notes.togglePin));
router.post("/:id/favorite", asyncHandler(notes.toggleFavorite));
router.post("/:id/archive", asyncHandler(notes.toggleArchive));
router.post("/:id/trash", asyncHandler(notes.trashNote));
router.post("/:id/restore", asyncHandler(notes.restoreNote));
router.post("/:id/duplicate", asyncHandler(notes.duplicateNote));

router.post("/:id/lock", asyncHandler(notes.setNoteLock));
router.delete("/:id/lock", asyncHandler(notes.removeNoteLock));
router.post("/:id/unlock", asyncHandler(notes.unlockNote));

router.post("/:noteId/attachments", upload.single("file"), asyncHandler(attachments.uploadAttachment));

router.get("/:noteId/collaborators", asyncHandler(collaborators.listCollaborators));
router.post("/:noteId/collaborators", asyncHandler(collaborators.addCollaborator));
router.patch("/:noteId/collaborators/:collaboratorId", asyncHandler(collaborators.updateCollaborator));
router.delete("/:noteId/collaborators/:collaboratorId", asyncHandler(collaborators.removeCollaborator));

router.get("/:noteId/share-links", asyncHandler(shareLinks.listShareLinks));
router.post("/:noteId/share-links", asyncHandler(shareLinks.createShareLink));
router.delete("/:noteId/share-links/:linkId", asyncHandler(shareLinks.revokeShareLink));

export default router;
