import "server-only";
import postgres from "postgres";
import { env } from "./env";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __hnhSql?: Sql };

/**
 * One pooled client per server instance. Supabase's transaction pooler
 * does not support prepared statements, hence prepare: false, and stalls on
 * pipelined queries (more queries than connections hang forever), hence max_pipeline: 1.
 * All tables live in schema "hnh" and are always schema-qualified.
 */
export function db(): Sql {
  if (!globalForDb.__hnhSql) {
    globalForDb.__hnhSql = postgres(env.databaseUrl, {
      prepare: false,
      max_pipeline: 1,
      max: Number(process.env.DATABASE_POOL_MAX) || (env.isProd ? 3 : 5),
      idle_timeout: 20,
      connect_timeout: 15,
      types: {
        // keep bigint ids as JS numbers (they stay far below 2^53)
        bigint: postgres.BigInt,
      },
    });
  }
  return globalForDb.__hnhSql;
}

/** Thrown inside transactions to abort with a user-facing French message. */
export class UserError extends Error {
  constructor(
    message: string,
    public code: string = "USER_ERROR",
  ) {
    super(message);
  }
}
