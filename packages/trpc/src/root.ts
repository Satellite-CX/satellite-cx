import { Session } from "@repo/auth";
import type { DB } from "@repo/db";
import { initTRPC } from "@trpc/server";

interface TRPCContext {
  session: Session | null;
  db: DB;
}

export const createTRPCContext = (params: TRPCContext) => {
  const { session, db } = params;
  return {
    session,
    db,
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create();
