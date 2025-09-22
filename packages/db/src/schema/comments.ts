import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createdAt, id, organizationId, updatedAt } from "./common";
import { customers } from "./customers";
import { tickets } from "./tickets";

export const commentTypes = pgEnum("comment_type", ["public", "private"]);

export const comments = pgTable("comment", {
  id,
  organizationId,
  type: commentTypes("type").notNull(),
  content_text: text("content_text").notNull(),
  content_html: text("content_html").notNull(),
  ticketId: text("ticket_id").references(() => tickets.id, {
    onDelete: "cascade",
  }),
  authorId: text("author_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "cascade",
  }),
  createdAt,
  updatedAt,
});

export const attachments = pgTable("attachment", {
  id,
  organizationId,
  commentId: text("comment_id").references(() => comments.id, {
    onDelete: "cascade",
  }),
  file_name: text("file_name").notNull(),
  file_path: text("file_path").notNull(),
  createdAt,
});
