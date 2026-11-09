import { createServer } from "http";
import { createApp } from "./app";
import { createSocketServer } from "./realtime/socketServer";
import { env } from "./lib/env";

const app = createApp();
const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
