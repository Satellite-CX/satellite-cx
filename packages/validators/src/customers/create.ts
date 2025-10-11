import { createInsertSchema } from "../schema-factory";
import { customers } from "@repo/db/schema";

export const CustomerCreateInput = createInsertSchema(customers).omit({
  organizationId: true,
});