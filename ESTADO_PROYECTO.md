# Estado del proyecto — para retomar

> Última actualización: **14/10/2026** · rama `main` (CI en verde) · staging: https://ucciweb.vercel.app
> Contexto completo: [AUDITORIA_UCCI.md](AUDITORIA_UCCI.md) (84 hallazgos con IDs, métricas antes/después, roadmap) · Deploy: [DEPLOY.md](DEPLOY.md) · Desarrollo y tests: [README.md](README.md)

## 1. Dónde estamos

Se hizo una auditoría técnica completa y se implementaron los **quick wins**, el **bloque inmediato** y el **bloque de 1 mes** (salvo landings por búsqueda y Sentry, pospuestos a propósito). El estado por hallazgo está en la sección 4.9 de la auditoría.

Métricas en staging (Lighthouse mobile; detalle y metodología en la sección 3 de la auditoría):

| Página | Perf antes → ahora | LCP antes → ahora |
|---|---|---|
| Home | 72 → 90 | 8,8 s → 3,3 s |
| Listado | 72 → 88 | 8,2 s → 3,4 s |
| Ficha | 58 → 87 | 10,5 s → 3,3 s |
| Contacto | 62 → 93 | 11,1 s → 2,7 s |

Inventario publicado de UCCI al 14/10: **12 disponibles, 1 reservada, 7 vendidas**.

## 2. Pendientes del usuario (configuración, no código)

| # | Qué | Dónde | Estado |
|---|---|---|---|
| 1 | `REVALIDATE_SECRET` (Sensitive, Production + Preview) y Redeploy | Vercel → Environment Variables | **Pendiente** |
| 2 | 4 Database Webhooks (`properties`, `property_images`, `property_videos`, `agents`) → `POST https://ucciweb.vercel.app/api/revalidate` con `Authorization: Bearer <secreto>` | Supabase → Database → Webhooks ([DEPLOY.md](DEPLOY.md#webhooks-de-supabase)) | **Pendiente**. Después, probar juntos: editar una propiedad y ver el cambio al instante. Sin webhooks, la caché se renueva cada 5 min. |
| 3 | `NEXT_PUBLIC_GA_ID` (`G-…`) y Redeploy | Vercel (crear la propiedad en analytics.google.com) | **Pendiente**. El código de eventos `whatsapp_click` / `call_click` ya está. |
| 4 | Confirmar que `NEXT_PUBLIC_SITE_URL=https://ucciweb.vercel.app` está también en **Preview** | Vercel | Por confirmar |
| 5 | Rotar la contraseña del usuario `postgres` (estuvo en Vercel y en `.env.local`) | Supabase | **Coordinar con la app de agentes**, que casi seguro usa ese usuario |
| 6 | Validar el texto de [/privacidad](src/app/privacidad/page.tsx) con un asesor legal | — | Pendiente |

Ya hecho por el usuario:
- rol `web_readonly` + políticas RLS ([db/readonly-role.sql](db/readonly-role.sql), [db/readonly-policies.sql](db/readonly-policies.sql));
- `DATABASE_URL` en Vercel y en `.env.local` con el Transaction Pooler (6543), Sensitive;
- claves sin uso borradas de Vercel;
- redirecciones del sitio viejo validadas.

## 3. Próximos pasos sugeridos (en orden)

1. **Webhooks** (punto 2.2) y verificación conjunta de la actualización instantánea.
2. **Deploy en AWS São Paulo** según [DEPLOY.md](DEPLOY.md):
   - El `Dockerfile` y Caddy **todavía no se probaron**: hacer un primer `docker build` local (con Docker Desktop corriendo) antes del servidor real.
   - Medir TTFB y el HTML completo en AWS. Cierra PERF-08: el listado hoy tarda ~1,9 s en Vercel porque las funciones corren en Washington y la base está en São Paulo.
   - Cambio de DNS, Search Console y sitemap, y actualizar la URL de los 4 webhooks al dominio final.
   - Correr `E2E_BASE_URL=https://www.uccipropiedades.com npm run test:e2e` contra el sitio nuevo.
3. **Bloque de 3 meses** (sección 6 de la auditoría):
   - cambios de modelo en la app de agentes (moneda por precio, amenities, barrios normalizados, slug, `isPublished` en `false` por defecto, fotos redimensionadas al subir);
   - índices compuestos (SQL en la sección 4.6 de la auditoría);
   - URLs con slug;
   - feed a portales / fuente de verdad frente a Tokko;
   - formulario de contacto;
   - menos JS (PERF-09);
   - tokens de diseño.
4. **Landings por búsqueda** cuando crezca el inventario.
5. **Sentry**, si se crea una cuenta.

## 4. Decisiones tomadas (no re-discutir sin motivo)

- **Hosting final:** una instancia en AWS São Paulo (Lightsail/EC2) con Docker + Caddy, sin Amplify (soporta hasta Next 15 y no hace streaming) ni App Runner (cerrado a clientes nuevos). Vercel queda como staging.
- **Base de datos:** el sitio solo usa el rol `web_readonly`, cuyo RLS limita la lectura a las propiedades publicadas de UCCI, a través del **Transaction Pooler `:6543` con `pgbouncer=true`**. En Vercel `connection_limit=1`; en AWS `5`.
- **Estados:**
  - disponibles y **reservadas** en el listado (badge "Reservada");
  - **vendidas** solo con el filtro "Ver vendidas" (`vendidas=1`), en favoritos y por link directo, siempre con badge y aviso;
  - **alquiladas** y **en construcción** no se listan (por decisión del cliente).
- **Redirecciones** del sitio viejo: `/temporario` y `/sumate` → `/contacto`; `/novedades` y `/novedad/*` → `/`; `/venta` y `/alquiler` → listado filtrado; `/servicios` → `/nosotros`; `/emprendimientos` → `/propiedades`.
- **Landings por búsqueda:** pospuestas mientras haya poco inventario.
- **Flujo de trabajo:**
  - verificar en local (build + tests contra una base de prueba);
  - commit en `main` y push, que despliega en Vercel;
  - verificar en producción.

## 5. Cómo verificar

```bash
npm run typecheck && npm run lint
```

Tests end-to-end contra el sitio publicado (solo lectura):

```bash
E2E_BASE_URL=https://ucciweb.vercel.app PW_CHANNEL=chrome npm run test:e2e
```

Tests completos en local: necesitan un build hecho contra una base de prueba, **nunca** la real. La forma más simple replica CI:
1. Postgres en Docker;
2. `npx prisma db push --skip-generate`;
3. `psql -f e2e/seed.sql`;
4. `ORGANIZATION_ID=ucci-org npm run build`;
5. copiar `public` y `.next/static` a `.next/standalone`;
6. `PW_CHANNEL=chrome npm run test:e2e`.

Sin Docker se usó PGlite (ver [auditoria/scripts-bd/](auditoria/scripts-bd/)).

Rol de solo lectura contra la base real (solo `SELECT`):

```bash
node db/verify-readonly.js
```

## 6. Lecciones y trampas conocidas

- **Session Pooler (5432):** tiene un tope de 15 clientes para toda la base, compartidos con la app de agentes. Un build de Vercel falló con `EMAXCONNSESSION`. Usar siempre el 6543.
- **`next-env.d.ts` está en `.gitignore`:** el script `typecheck` corre `next typegen` antes de `tsc` (si no, fallan los imports de imágenes en CI).
- **Next 16:**
  - las rutas dinámicas necesitan `generateStaticParams` (aunque devuelva `[]`) para tener ISR;
  - desde un webhook, `revalidateTag(tag, { expire: 0 })`;
  - `priority` se reemplazó por `preload` en `next/image`;
  - la metadata va en el `<body>` para navegadores y Googlebot (es por diseño).
- **El servidor `standalone` no lee `.env.local`:** hay que pasarle las variables, y copiar `public` y `.next/static`.
- **Saltos de línea:** el working copy usa CRLF (`core.autocrlf=true`). Los scripts que editan archivos tienen que normalizar los saltos de línea.
- **Lighthouse no puede bloquear lo que carga dentro de un iframe:** para medir terceros, mirar la traza de red.
- **Arranques en frío en Vercel:** favoritos (server action) puede tardar varios segundos la primera vez; el test tiene 15 s de margen.
- **Reglas de la auditoría** que siguen vigentes:
  - nunca consultar producción con el usuario `postgres`;
  - nada de pruebas de carga contra producción.
