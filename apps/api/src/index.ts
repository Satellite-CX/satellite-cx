import { Hono } from "hono";
import { corsMiddleware } from "./utils/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter, createTRPCContext } from "@repo/trpc";
import { logger } from "hono/logger";
import { auth } from "@repo/auth";

const app = new Hono();

app.use(
  logger((str) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${str}`);
  })
);

app.use("*", corsMiddleware);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.on("GET", "/session", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return c.json(session);
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
    createContext: async (opts, c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return {
          headers: opts.req.headers,
          session: null,
        };
      }

      const db = await createDrizzleClient(session);

      return createTRPCContext({ opts, session, db });
    },
  })
);

app.notFound((c) => {
  return c.json({ ok: false, error: "Not Found", status: 404 }, 404);
});

export default {
  port: process.env.PORT,
  fetch: app.fetch,
};
