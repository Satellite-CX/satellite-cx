import { sql } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./auth";

export const id = text("id")
  .default(sql`gen_random_uuid()`)
  .primaryKey();

export const createdAt = timestamp("created_at").defaultNow().notNull();
export const updatedAt = timestamp("updated_at")
  .$onUpdate(() => /* @__PURE__ */ new Date())
  .notNull();

export const organizationId = text("organization_id").references(
  () => organizations.id,
  {
    onDelete: "cascade",
  }
);
