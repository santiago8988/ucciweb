# Estado del proyecto — para retomar

> Última actualización: **24/10/2026** · rama `main` · **producción: https://www.uccipropiedades.com (AWS Lightsail São Paulo)** · staging: https://ucciweb.vercel.app
> Contexto completo: [AUDITORIA_UCCI.md](AUDITORIA_UCCI.md) (84 hallazgos con IDs, métricas antes/después, roadmap) · Deploy: [DEPLOY.md](DEPLOY.md) · Desarrollo y tests: [README.md](README.md)

## 1. Dónde estamos

Se hizo una auditoría técnica completa y se implementaron los **quick wins**, el **bloque inmediato** y el **bloque de 1 mes** (salvo landings por búsqueda y Sentry, pospuestos a propósito). El estado por hallazgo está en la sección 4.9 de la auditoría.

**El 24/10/2026 el sitio nuevo reemplazó al viejo en `www.uccipropiedades.com`:**
- **Servidor:** Lightsail São Paulo `ucci-web`, 2 GB, USD 12 por mes, IP estática `54.207.116.159`, Docker + Caddy, certificados de Let's Encrypt a nombre de santiago.mdp@gmail.com.
- **DNS:** pasó del Cloudflare sin acceso a una zona DNS de Lightsail.
- **Verificación:** 39/39 tests e2e de solo lectura contra el dominio. HTML completo del listado en ~0,4 s (en Vercel tardaba ~1,9 s), lo que cierra PERF-08.
- **Cómo operarlo:** acceso, actualización y vuelta atrás están en [DEPLOY.md](DEPLOY.md), secciones 8 y 9. Para actualizar: subir el código y correr `bash deploy/build.sh` en el servidor.

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
| 1 | 4 Database Webhooks (`properties`, `property_images`, `property_videos`, `agents`) → `POST https://www.uccipropiedades.com/api/revalidate` con `Authorization: Bearer <secreto>`. El secreto ya está en el servidor (`grep REVALIDATE_SECRET ~/ucci/.env.production`). | Supabase → Database → Webhooks ([DEPLOY.md](DEPLOY.md#webhooks-de-supabase)) | **Pendiente**. Después, probar juntos: editar una propiedad y ver el cambio al instante. Sin webhooks, la caché se renueva cada 5 min. |
| 2 | **Search Console**: la verificación TXT del dominio se mantuvo. Enviar `https://www.uccipropiedades.com/sitemap.xml` y revisar en unas semanas las URLs viejas con 404 (fichas de Tokko) | search.google.com/search-console | **Pendiente** |
| 3 | `NEXT_PUBLIC_GA_ID` (`G-…`): cargarlo en `.env.production` del servidor y correr `bash deploy/build.sh`, porque queda fijo en el build | analytics.google.com y el servidor | **Pendiente**. El código de eventos `whatsapp_click` / `call_click` ya está. |
| 4 | Renovación automática del dominio (vence el 29/08/2027) y bloqueo de transferencia | Route 53 → Dominios registrados | Confirmar que quedaron activados |
| 5 | Rotar la contraseña del usuario `postgres` (estuvo en Vercel y en `.env.local`) | Supabase | **Coordinar con la app de agentes**, que casi seguro usa ese usuario |
| 6 | Validar el texto de [/privacidad](src/app/privacidad/page.tsx) con un asesor legal | — | Pendiente |

Ya hecho por el usuario:
- rol `web_readonly` + políticas RLS ([db/readonly-role.sql](db/readonly-role.sql), [db/readonly-policies.sql](db/readonly-policies.sql));
- `DATABASE_URL` en Vercel y en `.env.local` con el Transaction Pooler (6543), Sensitive;
- claves sin uso borradas de Vercel;
- redirecciones del sitio viejo validadas.

## 3. Próximos pasos sugeridos (en orden)

1. **Webhooks** (punto 2.1) y verificación conjunta de la actualización instantánea.
2. **Cierre del deploy en AWS:**
   - Lighthouse mobile en el dominio nuevo, para comparar con la línea base.
   - Snapshot manual de la instancia.
   - Monitoreo de disponibilidad (por ejemplo UptimeRobot).
   - Restringir el puerto 22 del firewall de Lightsail a tu IP.
3. **Sitio viejo:** el bucket S3 está en una cuenta ajena; no hay nada que apagar de nuestro lado. Si aparece el dueño, pedirle que lo borre: permite listar archivos públicamente.
4. **Bloque de 3 meses** (sección 6 de la auditoría):
   - cambios de modelo en la app de agentes (moneda por precio, amenities, barrios normalizados, slug, `isPublished` en `false` por defecto, fotos redimensionadas al subir);
   - índices compuestos (SQL en la sección 4.6 de la auditoría);
   - URLs con slug;
   - feed a portales / fuente de verdad frente a Tokko;
   - formulario de contacto;
   - menos JS (PERF-09);
   - tokens de diseño.
5. **Landings por búsqueda** cuando crezca el inventario.
6. **Sentry**, si se crea una cuenta.

## 4. Decisiones tomadas (no re-discutir sin motivo)

- **Dominio y DNS (relevado el 24/10/2026):**
  - El dominio `uccipropiedades.com` está registrado en **Route 53 de la cuenta AWS de UCCI** (desde 2012, vence el 29/08/2027). Sin DNSSEC.
  - Los nameservers apuntan a un **Cloudflare al que nadie tiene acceso**.
  - El sitio viejo (Gatsby) está en un bucket S3 `www.uccipropiedades.com` (us-east-1) de **otra cuenta de AWS**. El bucket permite listar sus archivos públicamente.
  - **Decisión:** crear una zona alojada en Route 53 y cambiar los nameservers ahí. Antes hay que copiar los registros del mail (Google Workspace):
    - MX: `1 aspmx.l.google.com`, `5 alt1/alt2.aspmx.l.google.com`, `10 alt3/alt4.aspmx.l.google.com`;
    - TXT: SPF `v=spf1 include:_spf.google.com -all` y el `google-site-verification` de Search Console.
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
  - commit en `main` y push, que despliega **staging** en Vercel y corre CI;
  - deploy a producción: copiar el código y correr `bash deploy/build.sh` en el servidor (DEPLOY.md, sección 8);
  - verificar en producción con `E2E_BASE_URL=https://www.uccipropiedades.com`.

## 5. Cómo verificar

```bash
npm run typecheck && npm run lint
```

Tests end-to-end contra el sitio publicado (solo lectura):

```bash
E2E_BASE_URL=https://www.uccipropiedades.com PW_CHANNEL=chrome npm run test:e2e
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
- **Node 22 en el Dockerfile:** con Node 20, Turbopack falla en `next/font/google` ("queries have exactly one entry"). Además, Node 20 ya no tiene soporte.
- **Rate limit de Caddy:** con 300 pedidos por minuto, imágenes incluidas, los tests recibían 429. Ahora son 600 páginas por minuto por IP y `/_next/*` queda excluido. Hay que tener en cuenta el CGNAT de las conexiones móviles.
- **Zona DNS de Lightsail:** crearla con "another registrar". La opción "registered with Route 53" cambia los nameservers en el acto.
- **Lighthouse no puede bloquear lo que carga dentro de un iframe:** para medir terceros, mirar la traza de red.
- **Arranques en frío en Vercel:** favoritos (server action) puede tardar varios segundos la primera vez; el test tiene 15 s de margen.
- **Reglas de la auditoría** que siguen vigentes:
  - nunca consultar producción con el usuario `postgres`;
  - nada de pruebas de carga contra producción.
