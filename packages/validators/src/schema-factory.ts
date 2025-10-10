import { createSchemaFactory } from "drizzle-zod";
import { z as zOpenApi } from "@hono/zod-openapi";

export const { createSelectSchema } = createSchemaFactory({
  zodInstance: zOpenApi,
});
