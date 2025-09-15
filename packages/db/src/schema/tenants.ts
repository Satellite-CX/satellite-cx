import { sql } from "drizzle-orm";
import {
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const tenants = pgTable(
  "tenants",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    domain: text("domain").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("Users can only view their own tenants", {
      for: "select",
      using: sql`id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1)`,
    }),
  ]
);

export type Tenant = typeof tenants.$inferSelect;
