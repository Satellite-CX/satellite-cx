import { initTRPC } from "@trpc/server";

interface TRPCContext {
  headers: Headers;
}

export const createTRPCContext = (params: TRPCContext) => {
  const { headers } = params;
  return {
    headers,
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create();
