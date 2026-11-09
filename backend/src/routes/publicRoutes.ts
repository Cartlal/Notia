import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as pub from "../controllers/publicController";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

// No requireAuth here on purpose — a share-link token is the credential.
// Rate limited since, unlike authenticated routes, anyone can hit these
// without ever logging in.
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true });
router.use(publicLimiter);

router.get("/notes/:token", asyncHandler(pub.getPublicNote));
router.patch("/notes/:token", asyncHandler(pub.updatePublicNote));

export default router;
