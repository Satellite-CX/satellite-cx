import { createInsertSchema } from "../schema-factory";
import { tickets } from "@repo/db/schema";

export const TicketCreate = createInsertSchema(tickets).omit({
  organizationId: true,
});
