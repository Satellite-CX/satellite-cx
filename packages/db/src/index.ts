import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import { adminDB, clientDB } from "./client";
import { createDrizzle } from "./create-drizzle";
import * as schema from "./schema";

interface CreateDrizzleClientOptions {
  organizationId?: string;
  role?: string;
  userId?: string;
}

export async function createDrizzleClient({
  organizationId,
  role,
  userId,
}: CreateDrizzleClientOptions = {}) {
  return await createDrizzle({
    organizationId,
    role,
    userId,
    admin: adminDB,
    client: clientDB,
  });
}

export type DB = Awaited<ReturnType<typeof createDrizzleClient>>;

type Schema = typeof schema;
type TSchema = ExtractTablesWithRelations<Schema>;

type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfig<
  "one" | "many",
  boolean,
  TSchema,
  TSchema[TableName]
>["with"];

export type InferResultType<
  TableName extends keyof TSchema,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<
  TSchema,
  TSchema[TableName],
  {
    with: With;
  }
>;
