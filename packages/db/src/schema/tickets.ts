import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { organizations } from "./organizations";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "pending",
  "solved",
  "closed"
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "normal", 
  "high",
  "urgent"
]);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("normal"),
  ticketNumber: integer("ticket_number").notNull().unique(),
  
  // Relations
  customerId: uuid("customer_id").notNull().references(() => users.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one }) => ({
  customer: one(users, {
    fields: [tickets.customerId],
    references: [users.id],
    relationName: "customer_tickets"
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "assigned_tickets"
  }),
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
}));

export const insertTicketSchema = createInsertSchema(tickets);
export const selectTicketSchema = createSelectSchema(tickets);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;