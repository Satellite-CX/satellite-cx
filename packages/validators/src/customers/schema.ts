import { createSelectSchema } from "../schema-factory";
import { customers } from "@repo/db/schema";

export const Customer = createSelectSchema(customers);