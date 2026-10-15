// Extra backend checks on the LOCAL PGlite DB (never production).
const { PrismaClient } = require("C:/Users/santi/Desktop/UcciWeb/src/generated/prisma");
const crypto = require("crypto");
const URL = "postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable&connection_limit=1&pgbouncer=true";
if (!URL.includes("127.0.0.1")) throw new Error("local only");
const prisma = new PrismaClient({ datasourceUrl: URL });
const ORG = "ucci-org";
const PUBLIC = { organizationId: ORG, isPublished: true, status: "disponible" };

(async () => {
  // (a) Wildcards: does `contains` escape % and _ ? Does the raw amenities ILIKE?
  const total = await prisma.property.count({ where: PUBLIC });
  const containsPct = await prisma.property.count({ where: { ...PUBLIC, title: { contains: "%", mode: "insensitive" } } });
  const rawPct = await prisma.$queryRaw`SELECT count(*)::int n FROM properties WHERE organization_id = ${ORG} AND amenities::text ILIKE ${"%" + "%" + "%"}`;
  console.log(`(a) q="%": total públicas=${total}; Prisma contains -> ${containsPct}; raw amenities ILIKE -> ${rawPct[0].n} filas (todas las de la org)`);

  // (b) Favorites server action with many ids (body limit 1MB ≈ 27k UUIDs)
  for (const n of [5, 1000, 10000]) {
    const ids = Array.from({ length: n }, () => crypto.randomUUID());
    const t0 = performance.now();
    try {
      await prisma.property.findMany({ where: { id: { in: ids }, organizationId: ORG, isPublished: true }, include: { images: { orderBy: { order: "asc" }, take: 1 } } });
      console.log(`(b) favoritos con ${n} ids: ${Math.round(performance.now() - t0)} ms, JSON body ≈ ${(JSON.stringify(ids).length / 1024).toFixed(0)} KB`);
    } catch (e) { console.log(`(b) favoritos con ${n} ids: ERROR ${e.message.split("\n").slice(-1)[0].slice(0, 120)}`); }
  }

  // (c) Payload: current (all columns + all images fetched) vs lean DTO for the 12 cards
  const full = await prisma.property.findMany({ where: PUBLIC, include: { images: { orderBy: { order: "asc" }, take: 1 } }, take: 12, orderBy: { createdAt: "desc" } });
  const lean = await prisma.property.findMany({
    where: PUBLIC, take: 12, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, propertyType: true, operationType: true, salePrice: true, rentPrice: true, currency: true,
      hideSalePrice: true, rooms: true, bedrooms: true, bathrooms: true, parkingSpaces: true, totalSurface: true, coveredSurface: true,
      neighborhood: true, locality: true, featured: true, images: { select: { imageUrl: true }, orderBy: { order: "asc" }, take: 1 } },
  });
  const f = JSON.stringify(full).length, l = JSON.stringify(lean).length;
  console.log(`(c) payload 12 cards: actual ${(f / 1024).toFixed(1)} KB vs DTO mínimo ${(l / 1024).toFixed(1)} KB (−${Math.round((1 - l / f) * 100)}%)`);
  const imgRows = await prisma.propertyImage.count({ where: { propertyId: { in: full.map((p) => p.id) } } });
  console.log(`(c) imágenes leídas de la BD para mostrar 12: ${imgRows}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
