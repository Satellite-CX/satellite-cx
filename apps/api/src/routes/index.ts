import { OpenAPIHono } from "@hono/zod-openapi";

import { tickets } from "./tickets";
import { statuses } from "./statuses";

const openapi = new OpenAPIHono();

openapi.route("/tickets", tickets);
openapi.route("/statuses", statuses);

openapi.doc("/docs", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

export { openapi };
