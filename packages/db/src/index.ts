import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import { adminDB, clientDB } from "./client";
import { createDrizzle } from "./create-drizzle";
import * as schema from "./schema";
import { Role } from "./schema";

export async function createDrizzleClient(tenantId: number, role: Role) {
  return await createDrizzle({
    tenantId,
    role,
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
