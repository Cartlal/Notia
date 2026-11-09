import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/token";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

const googleClient = new OAuth2Client(env.googleClientId);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = "refresh_token";
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function toSafeUser(user: { id: string; email: string; name: string; avatarUrl: string | null; passwordHash?: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    // Whether the Secure section can be gated at all — a Google-only
    // account has no password to verify against.
    hasPassword: Boolean(user.passwordHash),
  };
}

// Web authenticates via the httpOnly refresh cookie; mobile has no reliable
// cookie jar across app restarts, so it also gets the refresh token in the
// JSON body and stores it in secure storage, sending it back explicitly on
// /refresh. Both paths issue the same JWTs.
function issueTokens(res: Response, user: { id: string; email: string }) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "email_in_use", "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, settings: { create: {} } },
  });

  const { accessToken, refreshToken } = issueTokens(res, user);
  res.status(201).json({ accessToken, refreshToken, user: toSafeUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw new ApiError(401, "invalid_credentials", "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "invalid_credentials", "Invalid email or password");

  const { accessToken, refreshToken } = issueTokens(res, user);
  res.json({ accessToken, refreshToken, user: toSafeUser(user) });
}

export async function googleLogin(req: Request, res: Response) {
  const { idToken } = z.object({ idToken: z.string() }).parse(req.body);
  if (!env.googleClientId) throw new ApiError(503, "google_oauth_not_configured", "Google OAuth is not configured on this server");

  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new ApiError(401, "invalid_google_token", "Could not verify Google token");

  const user = await prisma.user.upsert({
    where: { email: payload.email },
    create: {
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture,
      authProvider: "GOOGLE",
      googleId: payload.sub,
      settings: { create: {} },
    },
    update: { googleId: payload.sub, avatarUrl: payload.picture },
  });

  const { accessToken, refreshToken } = issueTokens(res, user);
  res.json({ accessToken, refreshToken, user: toSafeUser(user) });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (!token) throw new ApiError(401, "no_refresh_token", "No refresh token provided");
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "invalid_refresh_token", "Refresh token expired or invalid");
  }
  const { accessToken, refreshToken } = issueTokens(res, { id: payload.sub, email: payload.email });
  res.json({ accessToken, refreshToken });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).send();
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw new ApiError(404, "user_not_found", "User not found");
  res.json({ user: toSafeUser(user) });
}

export async function deleteAccount(req: AuthedRequest, res: Response) {
  await prisma.user.delete({ where: { id: req.userId! } });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).send();
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function updateProfile(req: AuthedRequest, res: Response) {
  const body = updateProfileSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId! }, data: { name: body.name } });
  res.json({ user: toSafeUser(user) });
}

// No separate "security PIN" to manage — the Secure section is gated by
// the same account password used to log in (verified here), with the
// device's own system authentication (fingerprint/system PIN/pattern) as
// the on-device shortcut once that password has been entered once (see
// mobile/lib/services/lock_service.dart).
const verifyPasswordSchema = z.object({ password: z.string().min(1) });

export async function verifyPassword(req: AuthedRequest, res: Response) {
  const { password } = verifyPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.passwordHash) throw new ApiError(409, "no_password", "This account has no password to verify against");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "invalid_credentials", "Incorrect password");
  res.status(204).send();
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function changePassword(req: AuthedRequest, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.passwordHash) {
    throw new ApiError(409, "no_password", "This account signs in with Google and has no password to change");
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "invalid_credentials", "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.status(204).send();
}
