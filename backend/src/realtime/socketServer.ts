import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../services/token";
import { env } from "../lib/env";
import { setIo } from "./io";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.webOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      (socket.data as any).userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as any).userId as string;
    socket.join(`user:${userId}`);

    socket.on("note:join", (noteId: string) => socket.join(`note:${noteId}`));
    socket.on("note:leave", (noteId: string) => socket.leave(`note:${noteId}`));
  });

  setIo(io);
  return io;
}
