// Scale test on the LOCAL PGlite DB: one org with 20k properties, compare current indexes vs composite index.
const { PrismaClient } = require("C:/Users/santi/Desktop/UcciWeb/src/generated/prisma");
const URL = "postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable&connection_limit=1&pgbouncer=true";
if (!URL.includes("127.0.0.1")) throw new Error("local only");
const prisma = new PrismaClient({ datasourceUrl: URL });
const q = require("./queries.json");

async function explain(label, sql, params) {
  const times = []; let plan;
  for (let i = 0; i < 5; i++) {
    const rows = await prisma.$queryRawUnsafe("EXPLAIN (ANALYZE, BUFFERS) " + sql, ...params);
    plan = rows.map((r) => r["QUERY PLAN"]);
    times.push(parseFloat(plan.find((l) => l.startsWith("Execution Time")).match(/[\d.]+/)[0]));
  }
  times.sort((a, b) => a - b);
  const node = plan.filter((l) => /Scan|Sort Method|Limit/.test(l)).slice(0, 4).map((l) => l.replace(/\s+\(cost=[^)]*\)/, "").trim().slice(0, 120));
  console.log(`${label.padEnd(44)} ${String(times[2]).padStart(8)} ms | ${node.join(" | ")}`);
}

(async () => {
  const exists = await prisma.$queryRawUnsafe(`SELECT count(*)::int n FROM properties WHERE organization_id='big-org'`);
  if (exists[0].n === 0) {
    await prisma.$executeRawUnsafe(`INSERT INTO organizations (id, organization_name, updated_at) VALUES ('big-org','Big Org', now())`);
    await prisma.$executeRawUnsafe(`
      INSERT INTO properties (id, organization_id, title, description, property_type, operation_type, sale_price, rent_price,
        currency, address, locality, province, neighborhood, rooms, status, is_published, featured, amenities, created_at, updated_at)
      SELECT gen_random_uuid()::text, 'big-org', title, description, property_type, operation_type, sale_price, rent_price,
        currency, address, locality, province, neighborhood, rooms, status, is_published, featured, amenities, created_at, now()
      FROM properties WHERE organization_id <> 'big-org' LIMIT 20000`);
    await prisma.$executeRawUnsafe(`ANALYZE properties`);
  }
  const list = q["listado_default"][0], count = q["listado_default"][2], filt = q["listado_filtros"][1], qtext = q["listado_q_pileta"][1];
  const big = (p) => p.map((v) => (v === "ucci-org" ? "big-org" : v));
  // q query references ucci ids in its IN-list; keep only scalar params replaced
  const run = async (tag) => {
    console.log(`\n--- ${tag}`);
    await explain("listado default (org 20k props)", list.sql, big(list.params));
    await explain("count (org 20k props)", count.sql, big(count.params));
    await explain("listado con filtros (org 20k props)", filt.sql, big(filt.params));
    await explain("listado página 50 (OFFSET 588)", list.sql, big(list.params).map((v, i, a) => (i === a.length - 1 ? 588 : v)));
    await explain("q OR ILIKE (org 20k props)", qtext.sql, big(qtext.params));
  };
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS properties_public_listing_idx`);
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS properties_org_status_pub_created_idx`);
  await run("índices actuales del schema");
  await prisma.$executeRawUnsafe(`CREATE INDEX properties_org_status_pub_created_idx ON properties (organization_id, status, is_published, created_at DESC)`);
  await prisma.$executeRawUnsafe(`ANALYZE properties`);
  await run("+ índice compuesto (organization_id, status, is_published, created_at DESC)");
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
