import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./router";
import { createTRPCContext } from "./root";
import { appRouter } from "./router";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export const createTrpcCaller = appRouter.createCaller;
export type TRPCCaller = ReturnType<typeof createTrpcCaller>;

export { createTRPCContext, appRouter };
export type { AppRouter, RouterInputs, RouterOutputs };
