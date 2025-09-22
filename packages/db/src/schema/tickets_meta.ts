import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, organizationId, updatedAt } from "./common";

export const statuses = pgTable("status", {
  id,
  organizationId,
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt,
  updatedAt,
});

export const priorities = pgTable("priority", {
  id,
  organizationId,
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt,
  updatedAt,
});
