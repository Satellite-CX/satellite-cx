import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, organizationId, updatedAt } from "./common";
import { tickets } from "./tickets";

export const tags = pgTable("tag", {
  id,
  organizationId,
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt,
  updatedAt,
});

export const ticketTags = pgTable("ticket_tag", {
  ticketId: text("ticket_id").references(() => tickets.id, {
    onDelete: "cascade",
  }),
  tagId: text("tag_id").references(() => tags.id, {
    onDelete: "cascade",
  }),
});
