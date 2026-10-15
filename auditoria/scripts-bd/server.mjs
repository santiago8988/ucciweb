// Local Postgres (PGlite) with the app's Prisma schema + synthetic multi-tenant data.
// Never touches the production database. Serves the wire protocol on 127.0.0.1:55432.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "pgdata");
const fresh = !fs.existsSync(dataDir);
const db = new PGlite(dataDir);
await db.waitReady;

if (fresh) {
  const t0 = Date.now();
  await db.exec(fs.readFileSync(path.join(here, "schema.sql"), "utf8"));
  await db.exec(fs.readFileSync(path.join(here, "seed.sql"), "utf8"));
  console.log(`schema + seed applied in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
const counts = await db.query(`
  SELECT (SELECT count(*) FROM organizations) orgs,
         (SELECT count(*) FROM properties) props,
         (SELECT count(*) FROM properties WHERE organization_id='ucci-org') ucci_props,
         (SELECT count(*) FROM property_images) images`);
console.log("rows:", JSON.stringify(counts.rows[0]));

const server = new PGLiteSocketServer({ db, port: 55432, host: "127.0.0.1", maxConnections: 32 });
await server.start();
console.log("PGlite listening on 127.0.0.1:55432");
