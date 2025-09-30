import { Hono } from "hono";

const tickets = new Hono();

tickets.get("/", async (c) => {
  return c.json({ ok: true, data: "Hello, world!" });
});

export { tickets };
