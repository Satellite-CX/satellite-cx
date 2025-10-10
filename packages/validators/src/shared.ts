import { z } from "zod";
import { z as zOpenApi } from "@hono/zod-openapi";

export const limit = z.int().min(1).max(100).optional();
export const offset = z.int().min(0).max(100).optional();

export const limitOpenApi = zOpenApi.coerce.number().min(1).max(100).optional();
export const offsetOpenApi = zOpenApi.coerce
  .number()
  .min(0)
  .max(100)
  .optional();
