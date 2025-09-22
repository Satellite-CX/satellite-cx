import { publicProcedure, router } from "../trpc";
import { ticketsRouter } from "./tickets";

export const appRouter = router({
  tickets: ticketsRouter,
  health: publicProcedure.query(async ({ ctx }) => {
    return {
      status: "ok",
    };
  }),
});

export type AppRouter = typeof appRouter;
