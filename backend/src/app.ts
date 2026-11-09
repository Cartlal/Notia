import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./lib/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import notesRoutes from "./routes/notesRoutes";
import foldersRoutes from "./routes/foldersRoutes";
import tagsRoutes from "./routes/tagsRoutes";
import attachmentsRoutes from "./routes/attachmentsRoutes";
import aiRoutes from "./routes/aiRoutes";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/notes", notesRoutes);
  app.use("/api/folders", foldersRoutes);
  app.use("/api/tags", tagsRoutes);
  app.use("/api/attachments", attachmentsRoutes);
  app.use("/api/ai", aiRoutes);

  app.use(errorHandler);
  return app;
}
