import { createSchemaFactory } from "drizzle-zod";
import { z as zOpenApi } from "@hono/zod-openapi";

const schemaFactory = createSchemaFactory({
  zodInstance: zOpenApi,
});

export const createSelectSchema = schemaFactory.createSelectSchema;
export const createInsertSchema = schemaFactory.createInsertSchema;
export const createUpdateSchema = schemaFactory.createUpdateSchema;
