import { createInsertSchema } from "../schema-factory";
import { tickets } from "@repo/db/schema";

export const TicketCreateInput = createInsertSchema(tickets).omit({
  organizationId: true,
});
