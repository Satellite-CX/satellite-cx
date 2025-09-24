import { protectedProcedure, publicProcedure, router } from "../trpc";
import { ticketsRouter } from "./tickets";

export const appRouter = router({
  tickets: ticketsRouter,
  session: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
  health: publicProcedure.query(async ({ ctx }) => {
    return {
      status: "ok",
    };
  }),
});

export type AppRouter = typeof appRouter;
