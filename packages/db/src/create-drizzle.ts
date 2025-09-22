import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

interface CreateDrizzleOptions {
  organizationId: string;
  role: string;
  admin: Database;
  client: Database;
}

export async function createDrizzle({
  organizationId,
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
            await tx.execute(
              sql.raw(`SET LOCAL auth.tenant_id = ${organizationId}`)
            );
            await tx.execute(sql.raw(`SET LOCAL auth.role = '${role}'`));
            return await transaction(tx);
          } finally {
            try {
              await tx.execute(sql`RESET auth.tenant_id`);
              await tx.execute(sql`RESET auth.role`);
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
