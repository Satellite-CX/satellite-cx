import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { id, organizationId } from "./common";

export const customers = pgTable("customer", {
  id,
  organizationId,
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
