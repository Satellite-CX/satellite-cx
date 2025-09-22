import type { DB } from "@repo/db";
import { Session } from "@repo/db/auth";
import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

interface TRPCContext {
  opts: FetchCreateContextFnOptions;
  session: Session;
  db: DB;
}

export const createTRPCContext = (params: TRPCContext) => {
  const { opts, session, db } = params;
  return {
    headers: opts.req.headers,
    session,
    db,
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create();
