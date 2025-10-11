import { z as zOpenApi } from "@hono/zod-openapi";
import { z } from "zod";
import { Customer } from "./schema";
import { limit, limitOpenApi, offset, offsetOpenApi } from "../shared";

const orderByFields = [
  "createdAt",
  "updatedAt",
  "name",
  "email",
] as const;

export const CustomerOrderBy = z.object({
  field: z.enum(orderByFields),
  direction: z.enum(["asc", "desc"]),
});

export const CustomerListTrpcInput = zOpenApi
  .strictObject({
    limit,
    offset,
    orderBy: CustomerOrderBy.optional(),
  })
  .optional();

export const CustomerListInput = zOpenApi.strictObject({
  limit: limitOpenApi.openapi({
    example: 10,
    description: "Limit the number of customers returned",
  }),
  offset: offsetOpenApi.openapi({
    example: 10,
    description: "Skip the first N customers",
  }),
  orderBy: zOpenApi
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error("Invalid JSON format for orderBy");
      }
    })
    .pipe(CustomerOrderBy)
    .optional(),
});

export const CustomerList = Customer.array();