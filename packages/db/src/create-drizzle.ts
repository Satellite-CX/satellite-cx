import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

interface CreateDrizzleOptions {
  tenantId: number;
  role: string;
  admin: Database;
  client: Database;
}

export async function createDrizzle({
  tenantId,
  role,
  admin,
  client,
}: CreateDrizzleOptions) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          try {
            await tx.execute(sql.raw(`SET LOCAL auth.tenant_id = ${tenantId}`));
            return await transaction(tx);
          } finally {
            try {
              await tx.execute(sql`RESET auth.tenant_id`);
            } catch (cleanupError) {
              console.warn(
                "Failed to reset auth settings during cleanup:",
                cleanupError
              );
            }
          }
        },
        ...rest
      );
    }) as typeof client.transaction,
  };
}
