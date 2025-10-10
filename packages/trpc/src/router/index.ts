import { protectedProcedure, publicProcedure, router } from "../trpc";
import { ticketsRouter } from "./tickets";
import { statusesRouter } from "./statuses";

export const appRouter = router({
  tickets: ticketsRouter,
  statuses: statusesRouter,
  session: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
  health: publicProcedure.query(async () => {
    return {
      status: "ok",
    };
  }),
});

export type AppRouter = typeof appRouter;
