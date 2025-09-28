import type { DB } from "@repo/db";
import { initTRPC } from "@trpc/server";

interface TRPCContext {
  headers: Headers;
  db: DB;
}

export const createTRPCContext = (params: TRPCContext) => {
  const { headers, db } = params;
  return {
    headers,
    db,
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create();
