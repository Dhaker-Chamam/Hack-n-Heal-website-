// Local Postgres for development, without Docker: PGlite (Postgres compiled to WASM)
// behind a Postgres wire-protocol socket. Data lives in .pglite/ (git-ignored).
//
//   npm run db:local          start on 127.0.0.1:54329 (migrates on first run)
//   npm run db:local -- reset wipe the data and start fresh
//
// In .env.local: DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres
// and DATABASE_POOL_MAX=1 (PGlite serves one query at a time).
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIR = ".pglite";
const PORT = Number(process.env.PGLITE_PORT) || 54329;
if (process.argv.includes("reset")) rmSync(DIR, { recursive: true, force: true });
const fresh = !existsSync(DIR);

const db = await PGlite.create(DIR);
if (fresh) {
  for (const f of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join("supabase/migrations", f), "utf8"));
    console.log(`migrated ${f}`);
  }
}
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();
console.log(`Local Postgres ready on postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`);
const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
