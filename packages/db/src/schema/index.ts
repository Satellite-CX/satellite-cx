export * from "./users";
export * from "./organizations";
export * from "./tickets";
export * from "./comments";

// Re-export relations for Drizzle
import { ticketsRelations } from "./tickets";
import { commentsRelations } from "./comments";

export { ticketsRelations, commentsRelations };