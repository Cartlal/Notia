import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true });

router.post("/register", authLimiter, asyncHandler(auth.register));
router.post("/login", authLimiter, asyncHandler(auth.login));
router.post("/google", authLimiter, asyncHandler(auth.googleLogin));
router.post("/refresh", asyncHandler(auth.refresh));
router.post("/logout", asyncHandler(auth.logout));
router.get("/me", requireAuth, asyncHandler(auth.me));
router.patch("/me", requireAuth, asyncHandler(auth.updateProfile));
router.delete("/me", requireAuth, asyncHandler(auth.deleteAccount));
router.post("/change-password", requireAuth, authLimiter, asyncHandler(auth.changePassword));
router.post("/verify-password", requireAuth, authLimiter, asyncHandler(auth.verifyPassword));

export default router;
