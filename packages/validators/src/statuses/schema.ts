import { createSelectSchema } from "../schema-factory";
import { statuses } from "@repo/db/schema";

export const Status = createSelectSchema(statuses);