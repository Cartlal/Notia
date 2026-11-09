import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true });

router.post("/register", authLimiter, auth.register);
router.post("/login", authLimiter, auth.login);
router.post("/google", authLimiter, auth.googleLogin);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.me);
router.delete("/me", requireAuth, auth.deleteAccount);

export default router;
