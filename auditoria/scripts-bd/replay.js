// Replays the app's Prisma calls (same where/include/orderBy as src/lib/queries.ts and the
// pages) against the LOCAL PGlite instance, logging generated SQL, timings and EXPLAIN ANALYZE.
const { PrismaClient } = require("C:/Users/santi/Desktop/UcciWeb/src/generated/prisma");
const fs = require("fs");

const URL = "postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable&connection_limit=1&pgbouncer=true";
if (!URL.includes("127.0.0.1")) throw new Error("refusing to run against a non-local DB");
const prisma = new PrismaClient({ datasourceUrl: URL, log: [{ emit: "event", level: "query" }] });

const ORG = "ucci-org";
let current = null;
const log = {};
prisma.$on("query", (e) => {
  if (!current) return;
  (log[current] ||= []).push({ sql: e.query, params: JSON.parse(e.params || "[]"), ms: e.duration });
});

const INCLUDE_PROPERTY = { images: { orderBy: { order: "asc" } }, videos: { orderBy: { order: "asc" } }, agent: true };
const INCLUDE_LIST = { images: { orderBy: { order: "asc" }, take: 1 } };
const PUBLIC = { organizationId: ORG, isPublished: true, status: "disponible" };

async function run(name, fn) {
  current = name;
  const t0 = performance.now();
  const res = await fn();
  const wall = performance.now() - t0;
  current = null;
  const rows = Array.isArray(res) ? res.length : res && typeof res === "object" ? 1 : res;
  const payload = JSON.stringify(res).length;
  return { name, wallMs: Math.round(wall), queries: (log[name] || []).length, rows, payloadBytes: payload };
}

(async () => {
  const anyProp = await prisma.property.findFirst({ where: { ...PUBLIC, agentId: { not: null } }, select: { id: true } });
  const ids = (await prisma.property.findMany({ where: PUBLIC, select: { id: true }, take: 5 })).map((p) => p.id);
  const results = [];

  // warm-up
  await prisma.property.count({ where: PUBLIC });

  results.push(await run("listado_default", async () => {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({ where: PUBLIC, include: INCLUDE_LIST, skip: 0, take: 12, orderBy: { createdAt: "desc" } }),
      prisma.property.count({ where: PUBLIC }),
    ]);
    return properties;
  }));

  const filteredWhere = {
    ...PUBLIC,
    propertyType: { in: ["casa", "departamento"] },
    operationType: { in: ["venta", "venta_alquiler"] },
    OR: [{ salePrice: { gte: 50000, lte: 300000 } }, { rentPrice: { gte: 50000, lte: 300000 } }],
    rooms: { gte: 3 },
  };
  results.push(await run("listado_filtros", async () => {
    const [properties] = await Promise.all([
      prisma.property.findMany({ where: filteredWhere, include: INCLUDE_LIST, skip: 0, take: 12, orderBy: { salePrice: "asc" } }),
      prisma.property.count({ where: filteredWhere }),
    ]);
    return properties;
  }));

  results.push(await run("listado_q_pileta", async () => {
    const q = "pileta";
    const textOr = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { neighborhood: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
    const rows = await prisma.$queryRaw`SELECT id FROM properties WHERE organization_id = ${ORG} AND amenities::text ILIKE ${"%" + q + "%"}`;
    if (rows.length > 0) textOr.push({ id: { in: rows.map((r) => r.id) } });
    const where = { ...PUBLIC, OR: textOr };
    const [properties] = await Promise.all([
      prisma.property.findMany({ where, include: INCLUDE_LIST, skip: 0, take: 12, orderBy: { createdAt: "desc" } }),
      prisma.property.count({ where }),
    ]);
    return properties;
  }));

  results.push(await run("listado_pagina_25", async () =>
    prisma.property.findMany({ where: PUBLIC, include: INCLUDE_LIST, skip: 24 * 12, take: 12, orderBy: { createdAt: "desc" } })));

  results.push(await run("ficha_x2_(metadata+page)", async () => {
    const one = () => prisma.property.findFirst({ where: { id: anyProp.id, organizationId: ORG, isPublished: true }, include: INCLUDE_PROPERTY });
    const [a] = await Promise.all([one(), one()]);
    return a;
  }));

  results.push(await run("home_destacadas+count", async () => {
    const [f] = await Promise.all([
      prisma.property.findMany({ where: { ...PUBLIC, featured: true }, include: INCLUDE_LIST, take: 6, orderBy: { createdAt: "desc" } }),
      prisma.property.count({ where: PUBLIC }),
    ]);
    return f;
  }));

  results.push(await run("localidades", async () =>
    prisma.property.findMany({ where: PUBLIC, select: { locality: true }, distinct: ["locality"], orderBy: { locality: "asc" } })));

  results.push(await run("favoritos_5_ids", async () =>
    prisma.property.findMany({ where: { id: { in: ids }, organizationId: ORG, isPublished: true }, include: INCLUDE_LIST })));

  results.push(await run("sitemap", async () =>
    prisma.property.findMany({ where: PUBLIC, select: { id: true, updatedAt: true } })));

  console.table(results);
  fs.writeFileSync(__dirname + "/queries.json", JSON.stringify(log, null, 1));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
