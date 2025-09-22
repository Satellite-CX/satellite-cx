import { router } from "../trpc";
import { ticketsRouter } from "./tickets";

export const appRouter = router({
  tickets: ticketsRouter,
});

export type AppRouter = typeof appRouter;
