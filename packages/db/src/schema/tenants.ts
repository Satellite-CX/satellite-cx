import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
