import { OpenAPIHono } from "@hono/zod-openapi";

import { tickets } from "./tickets";
import { statuses } from "./statuses";
import { priorities } from "./priorities";

const openapi = new OpenAPIHono();

openapi.openAPIRegistry.registerComponent("securitySchemes", "ApiKey", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description: "API key for authentication. Example: `scx_12345abcd`",
});

openapi.route("/tickets", tickets);
openapi.route("/statuses", statuses);
openapi.route("/priorities", priorities);

openapi.doc("/openapi", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

export { openapi };
