import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { USER_ROLES } from "@repo/validators";

export const rolesEnum = pgEnum("roles", USER_ROLES);

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  role: rolesEnum().notNull(),
});

export type User = typeof users.$inferSelect;
export type Role = (typeof rolesEnum.enumValues)[number];
