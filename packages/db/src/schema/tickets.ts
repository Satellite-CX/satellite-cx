import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createdAt, id, organizationId, updatedAt } from "./common";
import { customers } from "./customers";
import { priorities, statuses } from "./tickets_meta";

export const tickets = pgTable("ticket", {
  id,
  organizationId,
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status_id").references(() => statuses.id, {
    onDelete: "cascade",
  }),
  priority: text("priority_id").references(() => priorities.id),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  assigneeId: text("assignee_id").references(() => users.id),
  createdAt,
  updatedAt,
  closedAt: timestamp("closed_at"),
});

export const ticketAudits = pgTable("ticket_audit", {
  id,
  organizationId,
  ticketId: text("ticket_id").references(() => tickets.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  from_value: jsonb("from_value"),
  to_value: jsonb("to_value"),
  createdAt,
});
