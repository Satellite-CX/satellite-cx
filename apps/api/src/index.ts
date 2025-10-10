import { trpcServer } from "@hono/trpc-server";
import { auth } from "@repo/db/auth";
import { appRouter, createTRPCContext } from "@repo/trpc";
import { env } from "@repo/validators";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { openapi } from "./routes";
import { corsMiddleware } from "./utils/cors";

const app = new Hono();

app.use(
  logger((str) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ${str}`);
  })
);

app.use("*", corsMiddleware);

app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.on("GET", "/health", async (c) => {
  return c.json({
    ok: true,
    uptime: process.uptime(),
  });
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts, c) =>
      createTRPCContext({ headers: c.req.raw.headers }),
  })
);

app.route("/", openapi);

app.notFound((c) => {
  return c.json({ ok: false, error: "Not Found", status: 404 }, 404);
});

export default {
  port: env.API_PORT,
  fetch: app.fetch,
};

export { app };
