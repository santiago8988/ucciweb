// Verifies the web_readonly role (db/readonly-role.sql) using the DATABASE_URL in
// .env.local. Read-only: only SELECTs and privilege checks, never writes.
// Usage: node db/verify-readonly.js
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const file = path.join(__dirname, "..", ".env.local");
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvLocal();
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();
const ORG = process.env.ORGANIZATION_ID;
let failures = 0;
const check = (cond, msg) => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
};

(async () => {
  const [me] = await prisma.$queryRaw`
    SELECT current_user AS "user", r.rolsuper AS "super", r.rolbypassrls AS "bypassRls",
           current_setting('statement_timeout') AS "timeout"
    FROM pg_roles r WHERE r.rolname = current_user`;
  if (me.user === "postgres" || me.super) {
    console.log(`DATABASE_URL todavía usa "${me.user}". Cambialo al rol web_readonly en .env.local y volvé a correr.`);
    process.exit(1);
  }
  check(me.user === "web_readonly", `conectado como ${me.user}`);
  check(!me.super && !me.bypassRls, "sin superusuario ni BYPASSRLS");
  check(me.timeout !== "0", `statement_timeout = ${me.timeout}`);

  const allowed = ["properties", "property_images", "property_videos", "agents"];
  const forbidden = ["bank_movements", "units", "subunits", "users", "organizations", "property_cards", "payments"];
  for (const t of allowed) {
    const [p] = await prisma.$queryRawUnsafe(
      `SELECT has_table_privilege(current_user, 'public.${t}', 'SELECT') s,
              has_table_privilege(current_user, 'public.${t}', 'INSERT, UPDATE, DELETE, TRUNCATE') w`
    );
    check(p.s && !p.w, `${t}: puede leer, no puede escribir`);
  }
  for (const t of forbidden) {
    const [p] = await prisma.$queryRawUnsafe(
      `SELECT has_table_privilege(current_user, 'public.${t}', 'SELECT') s`
    );
    check(!p.s, `${t}: sin acceso`);
  }

  const rls = await prisma.$queryRaw`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname IN ('properties','property_images','property_videos','agents')`;
  console.log("      RLS:", rls.map((r) => `${r.relname}=${r.relrowsecurity ? "activo" : "inactivo"}`).join(", "));

  const [visible] = await prisma.$queryRaw`
    SELECT count(*)::int n FROM properties
    WHERE organization_id = ${ORG} AND is_published = true AND status = 'disponible'`;
  check(visible.n > 0, `propiedades publicadas visibles para UCCI: ${visible.n}`);
  const [imgs] = await prisma.$queryRaw`
    SELECT count(*)::int n FROM property_images i JOIN properties p ON p.id = i.property_id
    WHERE p.organization_id = ${ORG} AND p.is_published = true`;
  check(imgs.n > 0, `fotos visibles: ${imgs.n}`);

  // Isolation: RLS must hide other agencies and unpublished listings.
  const [others] = await prisma.$queryRaw`
    SELECT count(*)::int n FROM properties WHERE organization_id <> ${ORG}`;
  check(others.n === 0, `propiedades de otras inmobiliarias visibles: ${others.n}`);
  const [drafts] = await prisma.$queryRaw`
    SELECT count(*)::int n FROM properties WHERE is_published = false`;
  check(drafts.n === 0, `propiedades sin publicar visibles: ${drafts.n}`);

  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} control(es) fallaron.`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
