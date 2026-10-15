# UCCI Propiedades — sitio web

Sitio público de UCCI Propiedades (Mar del Plata). Muestra las propiedades publicadas que los agentes cargan en la app de gestión, que comparte la misma base de datos.

- **Stack:** Next.js 16 (App Router), React 19, Tailwind v4, shadcn/base-ui, Prisma 6 → PostgreSQL en Supabase.
- **Producción / staging:** ver [DEPLOY.md](DEPLOY.md) (AWS São Paulo con Docker + Caddy; staging en Vercel).
- **Auditoría técnica y roadmap:** [AUDITORIA_UCCI.md](AUDITORIA_UCCI.md).

## Puesta en marcha

```bash
npm install
```

```bash
cp .env.example .env.local   # completar DATABASE_URL (rol web_readonly) y ORGANIZATION_ID
```

```bash
npm run dev
```

El sitio solo **lee** la base con el rol `web_readonly` ([db/readonly-role.sql](db/readonly-role.sql) y [db/readonly-policies.sql](db/readonly-policies.sql)), a través del Transaction Pooler de Supabase (puerto 6543). `node db/verify-readonly.js` comprueba permisos y aislamiento.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila (`output: "standalone"`) |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Tests de Playwright contra el build (ver abajo) |

## Tests end-to-end

Los tests de [e2e/](e2e/) cubren:
- que ninguna página desborde a 360 px;
- que el HTML no exponga datos ocultos;
- headers de seguridad, SEO (metadata, JSON-LD, sitemap, redirecciones);
- conversión: WhatsApp, compartir, galería, filtros, favoritos, vendidas y reservadas.

**En CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) corren contra un Postgres descartable con datos sintéticos ([e2e/seed.sql](e2e/seed.sql)). Nunca contra la base real.

**En local**, con un build ya hecho y una base de prueba:

```bash
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
```

```bash
PW_CHANNEL=chrome npm run test:e2e
```

Contra un sitio ya publicado solo corren los chequeos de lectura:

```bash
E2E_BASE_URL=https://ucciweb.vercel.app npm run test:e2e
```

## Caché y actualización de datos

Todas las lecturas públicas se cachean bajo el tag `properties`. Cuando un agente edita una propiedad, un **Database Webhook de Supabase** llama a `POST /api/revalidate` con `Authorization: Bearer <REVALIDATE_SECRET>` y el sitio se actualiza al instante. Sin webhook, la caché se renueva cada 5 minutos. La configuración está en [DEPLOY.md](DEPLOY.md#webhooks-de-supabase).

## Errores

`src/instrumentation.ts` registra cada error del servidor como una línea JSON (visible en los logs de Vercel o en `docker logs`).
