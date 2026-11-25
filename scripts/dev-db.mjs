// Local Postgres for development, without Docker: PGlite (Postgres compiled to WASM)
// behind a Postgres wire-protocol socket. Data lives in .pglite/ (git-ignored).
//
//   npm run db:local          start on 127.0.0.1:54329 (applies the migrations not yet run)
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
// Applied files are recorded, so a new migration also reaches a database that already holds data.
await db.exec("create table if not exists public.dev_migration (file text primary key)");
const applied = new Set((await db.query("select file from public.dev_migration")).rows.map((r) => r.file));
const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
// a database created before this table existed already has the first migration
if (!fresh && applied.size === 0) {
  await db.query("insert into public.dev_migration (file) values ($1)", [files[0]]);
  applied.add(files[0]);
}
for (const f of files.filter((f) => !applied.has(f))) {
  await db.exec(readFileSync(join("supabase/migrations", f), "utf8"));
  await db.query("insert into public.dev_migration (file) values ($1)", [f]);
  console.log(`migrated ${f}`);
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
