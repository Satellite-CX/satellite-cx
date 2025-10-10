import { createSelectSchema } from "../schema-factory";
import { tickets } from "@repo/db/schema";

export const ticketSchema = createSelectSchema(tickets);
