import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

interface CreateDrizzleOptions {
  organizationId?: string;
  role?: string;
  userId?: string;
  admin: Database;
  client: Database;
}

export async function createDrizzle({
  organizationId,
  role,
  userId,
  admin,
  client,
}: CreateDrizzleOptions) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(
        async (tx) => {
          try {
            if (organizationId) {
              await tx.execute(
                sql.raw(`SET LOCAL auth.organization_id = '${organizationId}'`)
              );
            }
            if (role) {
              await tx.execute(sql.raw(`SET LOCAL auth.role = '${role}'`));
            }
            if (userId) {
              await tx.execute(sql.raw(`SET LOCAL auth.user_id = '${userId}'`));
            }
            return await transaction(tx);
          } finally {
            try {
              await tx.execute(sql`RESET auth.organization_id`);
              await tx.execute(sql`RESET auth.role`);
              await tx.execute(sql`RESET auth.user_id`);
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
