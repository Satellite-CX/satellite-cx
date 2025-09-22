import { protectedMiddleware } from "./middleware";
import { t } from "./root";

export const router = t.router;

export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(protectedMiddleware);
