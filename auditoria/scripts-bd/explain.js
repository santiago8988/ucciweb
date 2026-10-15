// EXPLAIN ANALYZE the captured app queries on the LOCAL PGlite DB, optionally after creating indexes.
const { PrismaClient } = require("C:/Users/santi/Desktop/UcciWeb/src/generated/prisma");
const fs = require("fs");
const URL = "postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable&connection_limit=1&pgbouncer=true";
if (!URL.includes("127.0.0.1")) throw new Error("local only");
const prisma = new PrismaClient({ datasourceUrl: URL });
const q = require("./queries.json");
const mode = process.argv[2] || "before";

const TARGETS = [
  ["listado: propiedades", "listado_default", 0],
  ["listado: imágenes (take 1)", "listado_default", 1],
  ["listado: count", "listado_default", 2],
  ["listado con filtros", "listado_filtros", 1],
  ["q: amenities ILIKE", "listado_q_pileta", 0],
  ["q: propiedades OR ILIKE", "listado_q_pileta", 1],
  ["localidades (distinct)", "localidades", 0],
  ["ficha: findFirst", "ficha_x2_(metadata+page)", 0],
  ["ficha: imágenes", "ficha_x2_(metadata+page)", 1],
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS properties_public_listing_idx ON properties (organization_id, created_at DESC) WHERE is_published AND status = 'disponible'`,
  `CREATE INDEX IF NOT EXISTS property_images_property_order_idx ON property_images (property_id, "order")`,
];

(async () => {
  if (mode === "after") {
    for (const ddl of INDEXES) await prisma.$executeRawUnsafe(ddl);
    await prisma.$executeRawUnsafe("ANALYZE properties");
    await prisma.$executeRawUnsafe("ANALYZE property_images");
  }
  const out = [];
  for (const [label, key, idx] of TARGETS) {
    const { sql, params } = q[key][idx];
    // warm, then measure 5 runs of EXPLAIN ANALYZE and keep the median execution time
    const times = [];
    let plan;
    for (let i = 0; i < 5; i++) {
      const rows = await prisma.$queryRawUnsafe("EXPLAIN (ANALYZE, BUFFERS) " + sql, ...params);
      const lines = rows.map((r) => r["QUERY PLAN"]);
      times.push(parseFloat(lines.find((l) => l.startsWith("Execution Time")).match(/[\d.]+/)[0]));
      plan = lines;
    }
    times.sort((a, b) => a - b);
    const top = plan.filter((l) => /Scan|Sort|Limit|Aggregate|Unique|Hash|Nested|Bitmap/.test(l)).slice(0, 6).map((l) => l.replace(/\s+\(cost=[^)]*\)/, "").trim());
    const rowsOut = (plan[0].match(/actual time=[^ ]+ rows=(\d+)/) || [])[1];
    out.push({ label, medianMs: times[2], rowsReturned: rowsOut, plan: top });
  }
  for (const o of out) {
    console.log(`\n## ${o.label} — ${o.medianMs} ms (rows=${o.rowsReturned})`);
    o.plan.forEach((l) => console.log("   " + l.slice(0, 170)));
  }
  fs.writeFileSync(__dirname + `/explain_${mode}.json`, JSON.stringify(out, null, 1));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
