import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

const roles = ["admin", "agent"] as const;
export type Role = (typeof roles)[number];

export const rolesEnum = pgEnum("roles", roles);

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  role: rolesEnum().default("admin").notNull(),
});

export type User = typeof users.$inferSelect;
