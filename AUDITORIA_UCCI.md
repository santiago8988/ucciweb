# Auditoría técnica — Sitio UCCI Propiedades

> **Estado:** completa (Fases 0 a 5).
> **Fecha de medición:** 14/10/2026 · **Producción auditada:** https://ucciweb.vercel.app · **Commit:** `a78542b`
> **Alcance:** solo análisis, sin cambios de código. Sin pruebas de carga. Sin consultas a la base de producción.

---

## 1. Resumen ejecutivo

**Estado general:** el sitio tiene una base técnica moderna y bien encaminada:
- Next.js 16 con render en servidor;
- filtros guardados en la URL;
- consultas parametrizadas y aisladas por organización;
- desktop rápido (Lighthouse 92–98).

Pero **no está listo para lanzarse** como reemplazo del sitio actual:
- **en el celular, la ficha de propiedad está rota**;
- **el buscador de la home no filtra**;
- **se exponen datos que el negocio decidió ocultar**;
- **mobile carga lento**: LCP de 8 a 11 s.

Casi todo se corrige con cambios chicos. La mayoría de los problemas graves son de esfuerzo **S** (menos de medio día).

**Los 5 problemas más importantes:**

1. **Mobile roto (MOB-01 a MOB-03, crítica).**
   - A 360 px, la ficha mide hasta 2304 px de ancho: en la primera pantalla solo se ve una foto difuminada, sin título, precio ni WhatsApp. Pasa en toda ficha con 3 fotos o más.
   - La home y el listado también desbordan (408 px).
   - Es lo que se ve en las capturas del Galaxy S22. Se arregla con 3 cambios de CSS.
2. **La búsqueda devuelve resultados equivocados (UX-01 crítica; UX-02, UX-04 y UX-11 alta).**
   - "Comprar/Alquilar" y la caja de texto de la home se ignoran (parámetros con otro nombre).
   - La mitad del inventario (PH y chalets) no se puede filtrar por tipo.
   - El filtro de moneda muestra "ARS" pero devuelve propiedades en dólares.
   - "Alquilar" no tiene salida, aunque el negocio alquila (UX-11).
3. **Seguridad y datos del negocio (SEC-01 a SEC-06, FE-01).**
   - El precio "a consultar", las coordenadas y la dirección viajan en el HTML de todas las cards, y el precio oculto se puede deducir ordenando.
   - El sitio se conecta a una base **compartida con otros clientes** usando el usuario `postgres`, que salta el RLS.
   - `next` 16.2.0 tiene una vulnerabilidad **crítica** de denegación de servicio.
   - Faltan headers de seguridad y el optimizador de imágenes es un proxy abierto.
4. **Rendimiento mobile (PERF-01 a PERF-07, BE-01, BE-05).**
   - Los logos SVG pesan ~1,3 MB: bloqueándolos, el LCP baja entre 2,5 y 4,1 s (medido).
   - La ficha no se cachea nunca y hace 8 consultas en serie por visita.
   - El hero es una imagen de 524 KB y el mapa embebido suma 1,5 MB de terceros.
5. **Conversión y visibilidad (UX-03, UX-15, SEO-01 a SEO-04).**
   - En la ficha mobile, el WhatsApp está a más de 3 pantallas de scroll.
   - No se mide ninguna conversión.
   - El sitemap no tiene ninguna ficha válida y el `og:image` que se ve al compartir por WhatsApp pesa 1,5 MB.
   - No hay plan de redirecciones para migrar desde el dominio actual.

**Recomendación:** antes de cambiar el DNS, aplicar los **quick wins** (sección 5) y el bloque **Inmediato** del roadmap: arreglos de mobile y búsqueda, DTO público, rol de solo lectura, actualizar `next`, ISR de la ficha, logos y mapa de redirecciones. El deploy en AWS São Paulo resuelve por sí solo buena parte de la latencia del servidor medida en Vercel (falta medirlo), pero no los problemas del navegador.

---

## 2. Contexto y arquitectura (Fase 0)

### Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js **16.2.0** (App Router, Server Components, Server Actions), React 19.2.4, TypeScript 5.9 |
| UI | Tailwind v4, shadcn (`base-nova`) sobre `@base-ui/react` 1.3, framer-motion 12, lucide-react; fuente Source Sans 3 con `next/font` |
| Datos | Prisma 6.19 → PostgreSQL en Supabase (`sa-east-1`) por el Session Pooler `:5432`, usuario `postgres` |
| Base | Compartida con la app de agentes: 31 modelos, incluido el módulo de consorcios. La web usa 4: `Property`, `PropertyImage`, `PropertyVideo`, `Agent` |
| Imágenes | Fotos en Supabase Storage (bucket público `property-images`), stock de Unsplash, `next/image` con `remotePatterns: hostname "**"` |
| Hosting actual | Vercel: edge `gru1`, funciones en `iad1` (Washington) |
| Hosting final | AWS del cliente en São Paulo (recomendación: instancia Lightsail/EC2 + Docker + Caddy, con CloudFront opcional) |
| Integraciones | WhatsApp (`wa.me`), `tel:`, Google Maps por iframe, YouTube/Vimeo embebidos. **No hay** formulario, analytics, CRM ni sincronización con portales |
| Sitio actual del cliente | `www.uccipropiedades.com`: Gatsby + Tokko Broker detrás de Cloudflare |

### Rutas y estrategia de render (medida)

| Ruta | Render | Caché en producción |
|---|---|---|
| `/` | ISR 60 s | HIT/STALE |
| `/propiedades` | Dinámico (lee `searchParams`) | `private, no-store`, MISS |
| `/propiedades/[id]` | **Dinámico**, aunque declara `revalidate = 60` | MISS en 3 de 3 pedidos |
| `/contacto`, `/nosotros` | Estáticos | HIT |
| `/favoritos` | Client component + server action `fetchFavoriteProperties` | — |
| `/sitemap.xml`, `/robots.txt` | Generados en el build | Estáticos |

Superficie pública: páginas RSC, 1 server action (favoritos), optimizador `/_next/image`. No hay rutas `/api` ni middleware.

**Flujo de búsqueda:**
1. El hero ([hero.tsx:37](src/components/home/hero.tsx:37)) navega a `/propiedades`.
2. La página ([page.tsx:63](src/app/propiedades/page.tsx:63)) valida los parámetros.
3. `getProperties` ([queries.ts:100](src/lib/queries.ts:100)) ejecuta:
   - `ILIKE` sobre `amenities`, solo si hay texto libre;
   - `findMany` (propiedades + 1 imagen) y `count`.
4. Las filas se renderizan con `PropertyRow`, que es client component.
5. Los filtros, el orden y la paginación hacen `router.replace` / `router.push`.

---

## 3. Scorecard — línea base (antes de cualquier cambio)

| Área | Métrica clave | Valor medido | Estado |
|---|---|---|---|
| Rendimiento mobile | Lighthouse perf (home / listado / ficha / contacto) | 72 / 72 / 58 / 62 | 🔴 |
| Rendimiento mobile | LCP (home / listado / ficha / contacto) | 8,8 s / 8,2 s / 10,5 s / 11,1 s | 🔴 (objetivo ≤ 2,5 s) |
| Rendimiento desktop | Lighthouse perf | 98 / 94 / 92 / 93 | 🟢 |
| Rendimiento | CLS / TBT mobile | 0 / 45–67 ms | 🟢 |
| Rendimiento | Peso de página mobile | 1,8 / 2,1 / 3,6 / 2,2 MB | 🔴 |
| Servidor (staging Vercel) | HTML completo de listado y ficha | ~2,4 s (sin caché) | 🔴 en Vercel / ⚪ en AWS sin medir |
| Datos de campo | CrUX | Sin datos | ⚪ |
| Mobile | Páginas con desborde horizontal a 360 px | 3 de 5 (ficha hasta 2304 px) | 🔴 |
| Accesibilidad | Lighthouse a11y | 91–96 | 🟡 (no detecta labels faltantes ni la galería) |
| Buenas prácticas | Lighthouse | 100 | 🟢 |
| Dependencias | `npm audit` | 36 (2 críticas, 26 altas) | 🔴 |
| Código | `tsc` / ESLint en código propio | 0 errores / 3 errores, 5 warnings | 🟡 |
| UX / conversión | Buscador de la home funcional | No (ignora operación y localidad) | 🔴 |
| UX / conversión | CTA de WhatsApp en la ficha mobile | A 3,2–3,6 pantallas de scroll, sin barra fija | 🔴 |
| UX / conversión | Medición de conversiones | Ninguna (sin analytics ni eventos) | 🔴 |
| UX / conversión | Inventario encontrable por tipo | 6 de 12 (ph/chalet no filtrables) | 🟡 |
| Backend / BD | Consultas SQL por vista (listado / ficha) | 3–4 / 8 | 🔴 |
| Backend / BD | Tiempo en BD por consulta (volumen proyectado) | < 4 ms (local, PGlite) | 🟢 |
| Backend / BD | Sobre-lectura: payload de 12 cards / filas de imágenes leídas | 26,3 KB (DTO: 6,4 KB) / 149 para 12 | 🟡 |
| Backend / BD | Caché de datos + invalidación on-demand | No / No | 🔴 |
| SEO | Fichas válidas en el sitemap | 0 de 12 (la única URL da 404) | 🔴 |
| SEO | Meta descriptions correctas | 6 de 12 ("undefined en venta") | 🔴 |
| SEO | `og:image` de la ficha | 1,5 MB (objetivo < 300 KB); home sin `og:image` | 🔴 |
| SEO | Canonical / JSON-LD / slugs | No / No / No | 🟡 |
| SEO | Lighthouse SEO | 92–100 (no detecta lo anterior) | 🟡 |
| Seguridad | Datos ocultos (precio, coordenadas) en el HTML | Sí | 🔴 |
| Seguridad | Rol de base del sitio público | `postgres` (salta RLS) → **corregido 14/10:** `web_readonly` (solo `SELECT` en 4 tablas, RLS limitado a propiedades publicadas de UCCI, `statement_timeout` 5 s) | 🟢 |
| Seguridad | Headers de seguridad | 1 de 6 (solo HSTS, puesto por Vercel) | 🔴 |
| Seguridad | Optimizador de imágenes abierto | Sí (proxy de dominios ajenos) | 🟡 |
| Seguridad | Secretos en el repo o el historial | No | 🟢 |

Metodología de rendimiento: Lighthouse 13.5.0 local, Chrome headless, 3 corridas por página y form factor, mediana. Validado con PageSpeed Insights (home mobile: 73 / LCP 8,0 s). Páginas: `/`, `/propiedades?op=venta&mon=USD&tipo=casa,departamento,terreno`, `/propiedades/4b15730f-…` (22 fotos), `/contacto`.

---

## 4. Hallazgos

Severidad: **crítica** (rompe uso, negocio o seguridad) · **alta** · **media** · **baja**.
Esfuerzo: **S** (< ½ día) · **M** (½–2 días) · **L** (> 2 días).

### 4.1 Mobile / responsive (Fase 2)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| MOB-01 | **La ficha desborda en mobile.** A 360 px el documento mide entre 537 y 2304 px (≈ 24 + 104 px por foto). Toda ficha con 3 fotos o más está rota. | Playwright 360×780, mobile+touch: 5 fotos → 537 px, 13 → 1368, 22 → 2304. La grilla sin columnas en mobile ([page.tsx:122](src/app/propiedades/[id]/page.tsx:122)) crece al ancho de la tira de miniaturas ([image-gallery.tsx:115](src/components/property/image-gallery.tsx:115)). Captura: [ficha_360_primera-pantalla.png](auditoria/capturas/ficha_360_primera-pantalla.png) | **Crítica** | En el celular la primera pantalla muestra solo la foto difuminada: no se ven título, precio ni WhatsApp. Pega directo en la conversión de la página más importante. | S | `grid-cols-1` (equivale a `minmax(0,1fr)`) en mobile, o `min-w-0` en las columnas. |
| MOB-02 | **La home desborda (408 px a 360).** | Las cards de destacadas miden 384 px: la grilla `grid gap-7 sm:grid-cols-2` no define columnas en mobile ([featured-properties.tsx:49](src/components/home/featured-properties.tsx:49)). Probado en vivo: con `grid-template-columns: minmax(0,1fr)` el ancho vuelve a 360 px. | Alta | Scroll horizontal. El header fijo se estira y el botón de menú queda fuera de pantalla (capturas del S22). | S | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. |
| MOB-03 | **El listado desborda (408 px a 360).** | El selector de orden tiene `min-w-52` + "Ordenar por:" + "Última actualización" ([sort-select.tsx:40](src/components/property/sort-select.tsx:40)) en una fila flex sin salto de línea ([page.tsx:127](src/app/propiedades/page.tsx:127)). Se sale 72 px. | Alta | Ídem MOB-02; el control de orden aparece cortado. | S | Ocultar la etiqueta en mobile, permitir `flex-wrap`, sacar `min-w-52` o usar etiquetas cortas. |
| MOB-04 | Los esqueletos de carga de `/nosotros` y `/contacto` desbordan mientras se muestran. | `w-96` (384 px) en [nosotros/loading.tsx:22](src/app/nosotros/loading.tsx:22) y [contacto/loading.tsx:40](src/app/contacto/loading.tsx:40). | Baja | Salto horizontal transitorio. | S | Sacar `loading.tsx` de estas rutas estáticas (ver PERF-10). |

### 4.2 Rendimiento (Fase 1)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| PERF-01 | **Logos SVG de ~1,3 MB en todas las páginas.** | `logo-ucci.svg` 472 KB (345 KB br, header, precargado), `logo-ucci-margen.svg` 947 KB (686 KB br, footer), `favicon-ucci.svg` 392 KB (295 KB br). Son vectorizaciones automáticas (101 paths). **Prueba bloqueándolos:** el LCP mobile baja 2,5 s (home), 3,5 s (listado) y 4,1 s (contacto); el peso del listado baja de 2,1 MB a 0,8 MB. | **Alta** | Es la mayor causa del LCP mobile en todo el sitio. | S | Re-exportar el logo como SVG limpio y optimizado con SVGO (objetivo < 20 KB) o PNG/WebP @2x. Favicon como `.ico` 32 px + PNG 180 px. Borrar `logo-ucci-margin.svg` (duplicado byte a byte). |
| PERF-02 | **La ficha no se cachea nunca y consulta la base dos veces por visita.** | `x-vercel-cache: MISS` y `private, no-store` en 3 de 3 pedidos. HTML completo ~2,4 s. Next 16 exige `generateStaticParams` (aunque devuelva `[]`) para hacer ISR en rutas dinámicas (`node_modules/next/dist/docs/.../generate-static-params.md:302`). `getPropertyById` se llama desde `generateMetadata` y desde la página, sin `React.cache` ([page.tsx:42](src/app/propiedades/[id]/page.tsx:42), [:61](src/app/propiedades/[id]/page.tsx:61)). | **Alta** | Cada visita y cada precarga va a la base. En AWS, todo eso cae sobre una sola instancia. | S | Agregar `generateStaticParams` que devuelva `[]` (o los IDs publicados) y envolver `getPropertyById` con `cache()`. Invalidar con `revalidateTag` cuando se edite una propiedad. |
| PERF-03 | El listado precarga cada ficha visible con un render dinámico. | En el navegador: 12 requests `_rsc` de fichas para 6 cards, de 1,2 a 2,7 s cada una (30 requests RSC en una visita). | Media | Amplifica la carga del servidor y de la base en cada visita al listado. | S | Se resuelve con PERF-02 (pasan a ser HIT de caché). Alternativa: `prefetch={false}` o precargar al pasar el mouse. |
| PERF-04 | **Hero de la home: imagen de 524 KB y 2461 px como fondo CSS.** | Es el elemento de LCP de la home. `lcp-discovery-insight` falla. No pasa por `next/image` y se sirve con `max-age=0` ([hero.tsx:48](src/components/home/hero.tsx:48)). | Alta | Peor LCP de la home; mobile baja 2461 px de imagen. | S | `next/image` con `preload` + `sizes="100vw"` + `fill`, imagen fuente comprimida (~150–200 KB) e import estático (nombre con hash, caché inmutable). |
| PERF-05 | Listado: la imagen LCP (primera card) tiene `loading="lazy"`. | `resourceLoadDelay` de 1718 ms. Ninguna card tiene `preload` ([property-row.tsx:55](src/components/property/property-row.tsx:55)). Además framer-motion arranca las cards con `opacity: 0`. | Media | LCP del listado 8,2 s en mobile. | S | `preload`/`fetchPriority="high"` en las primeras 1–2 cards y sacar la animación de opacidad inicial de lo que está arriba del pliegue. |
| PERF-06 | **Mapa de Google embebido: 133 requests y 1,5 MB de terceros.** | Waterfall de la ficha mobile: 181 requests / 3,57 MB en total, de los cuales 133 / 1,54 MB son terceros. En mobile se carga aunque está debajo del pliegue. Lo mismo en `/contacto`. | Media | Pesa sobre LCP/SI (ficha SI 10,3 s) y consume datos móviles. | S–M | Fachada: imagen estática del mapa o botón "Ver mapa" que cargue el iframe al tocarlo. Alternativa: link a Google Maps. |
| PERF-07 | **Fotos originales pesadas y sin caché.** | Originales de Supabase de 0,76 a 2,9 MB (1200×1000 a 4000×3000), `cache-control: no-cache`. `next/image` solo genera WebP (no hay `formats` con AVIF). | Media | Más costo y CPU del optimizador (en AWS corre en tu instancia) y primeras cargas más lentas. El `og:image` usa la original (ver Fase 5). | M | Redimensionar al subir en la app de agentes (máx. ~2000 px, q≈80). `images.formats: ['image/avif','image/webp']`. Subir `minimumCacheTTL`. |
| PERF-08 | Listado y ficha tardan ~2,1–2,4 s en entregar el contenido en Vercel. | curl, 5 pedidos: TTFB del esqueleto ~190 ms, HTML completo 2,08–2,42 s. Funciones en `iad1` y base en `sa-east-1`: cada consulta cruza el continente. | Alta (staging) | En AWS São Paulo debería mejorar mucho (**no verificado**). | M | Desplegar en la misma región que la base. Cachear datos del listado (`unstable_cache` por combinación de filtros, o al menos la vista sin filtros). |
| PERF-09 | JS de 350–400 KB comprimido por página; framer-motion en todas. | Analizador de Turbopack: `/propiedades` 399 KB (next+react 228, @base-ui 62, framer-motion + motion-dom 54, código propio 14). TBT 45–67 ms (bien). | Baja | Margen de mejora moderado. | M | Animaciones decorativas con CSS. Cards como server components con una isla cliente solo para el favorito (también resuelve SEC-01). |
| PERF-10 | Las páginas estáticas muestran el esqueleto de carga antes del contenido. | El HTML prerenderizado de `/nosotros`, `/contacto` y `/favoritos` trae el fallback de `loading.tsx` (52/92/96 bloques `.animate-pulse`) y el contenido oculto en `<div hidden id="S:0">`, que se intercambia por script. | Baja | Parpadeo de esqueleto y HTML más pesado en páginas sin datos. | S | Sacar `loading.tsx` de las rutas que no consultan datos. |
| PERF-11 | Los archivos de `public/` no tienen caché largo. | `logo-ucci.svg`, `hero-playa-grande.jpg`, `favicon-ucci.svg`: `cache-control: public, max-age=0, must-revalidate`. | Baja | Revalidación en cada visita. | S | Imports estáticos (con hash), o regla de caché en CloudFront/Caddy para `/public`. |
| PERF-12 | `/placeholder-property.jpg` no existe. | HTTP 404, referenciado en [format.ts:22](src/lib/format.ts:22). | Baja | Una propiedad sin fotos mostraría una imagen rota. | S | Agregar el placeholder. |
| PERF-13 | Prop `priority` deprecada en Next 16. | `image.md:293` (docs de Next 16). Usada en header, contacto, nosotros y galería. | Baja | Deuda técnica. | S | Reemplazar por `preload`. |

**Bien resuelto:** fuente (un solo woff2 de 28 KB precargado, `display: swap`), `/_next/static` con `max-age=31536000, immutable` + Brotli, HTTP/2, CLS 0.

### 4.3 Front-end — calidad de código y dependencias (Fase 2)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| FE-01 | **`next` 16.2.0 tiene una vulnerabilidad crítica de denegación de servicio.** | `npm audit`: GHSA-q4gf-8mx6-v5v3 / GHSA-8h8q-6873-q5fj (DoS con Server Components). También arrastra `sharp` (CVEs de libvips) y `postcss`. Corregido en 16.4.1 (sin cambio de versión mayor). | **Crítica** | Un tercero puede tirar el sitio. | S | Actualizar a `next@16.4.1` y `eslint-config-next@16.4.1`. |
| FE-02 | `shadcn` (CLI) está en `dependencies`. | Arrastra a producción `@modelcontextprotocol/sdk`, `hono`, `express`, `proxy-addr` (crítica), `ts-morph`. Solo se usa en el build para `@import "shadcn/tailwind.css"` ([globals.css:3](src/app/globals.css:3)). | Media | Superficie de ataque y tamaño de la imagen Docker. | S | Moverlo a `devDependencies`. |
| FE-03 | No hay `not-found.tsx`, `error.tsx` ni `global-error.tsx`. | El 404 muestra "404: This page could not be found." **en inglés**. Si la base falla, se ve la pantalla de error genérica de Next. | Media | Mala experiencia ante errores y propiedades dadas de baja; no hay salida hacia el listado. | S | 404 en español con link a propiedades y buscador; `error.tsx` con botón de reintentar y WhatsApp. |
| FE-04 | Favoritos queda "Cargando…" para siempre si falla la server action. | `fetchFavoriteProperties(...).then(...)` sin `catch` ([favoritos/page.tsx:28](src/app/favoritos/page.tsx:28)). | Baja | Pantalla colgada. | S | Manejar el error con un estado de error. |
| FE-05 | ESLint: 3 errores en código propio y el lint del proyecto no excluye el código generado. | `react-hooks/set-state-in-effect` en [header.tsx:51](src/components/layout/header.tsx:51), [property-filters.tsx:443](src/components/property/property-filters.tsx:443), [:489](src/components/property/property-filters.tsx:489). 5 imports/variables sin usar. `npm run lint` da 2773 problemas porque analiza `src/generated`. | Baja | Ruido; los errores reales quedan tapados. | S | Agregar `src/generated/**` a `globalIgnores` y corregir los 3 efectos. |
| FE-06 | Duplicación de código y datos. | `PropertyWithRelations` definido 4 veces; `PropertyCard` y `PropertyRow` casi iguales; SVG de WhatsApp duplicado (footer y nosotros); número de WhatsApp a mano en 5 lugares; tipos de propiedad en 3 listas distintas ([page.tsx:45](src/app/propiedades/page.tsx:45), [constants.ts:6](src/lib/constants.ts:6), [hero.tsx:122](src/components/home/hero.tsx:122)). | Baja | Inconsistencias: las listas ya divergieron (faltan `ph`/`chalet`, ver UX). | M | Fuente única en `constants.ts`; componente de card único con variantes. |
| FE-07 | Serialización por `JSON.parse(JSON.stringify())` y 6 casts `as any`. | [queries.ts:43](src/lib/queries.ts:43). Los Decimal pasan a string y se tapan con `as any`. | Media | Tipos falsos y filas completas enviadas al cliente (SEC-01). | M | DTOs explícitos (mapear a `{ price: number, … }` solo con los campos públicos). |
| FE-08 | Sin tests, CI, `.env.example`; el README es el de plantilla. | `git ls-files`: no hay tests ni workflows. El README menciona Geist y `create-next-app`. | Media | Riesgo de regresiones (por ejemplo, MOB-01 pasó sin detectarse) y onboarding difícil. | M | CI con `tsc` + lint + un test e2e de Playwright mínimo (listado, ficha y ancho a 360 px). |
| FE-09 | Dependencias desactualizadas. | `npm outdated`: next 16.2.0→16.4.1, react 19.2.4→19.3.1, @base-ui/react 1.3→1.9, tailwind 4.2→4.3, prisma 6.19.2→6.19.3. | Baja | — | S | Actualizar dentro de la misma versión mayor. |

**Bien resuelto:** filtros como estado en la URL (compartibles) con `useOptimistic`; favoritos con `useSyncExternalStore` y sincronización entre pestañas; estados de carga y vacíos en listado y favoritos; `tsc` sin errores.

### 4.4 Accesibilidad (Fase 2)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| A11Y-01 | Contraste insuficiente, incluido el **precio en la ficha**. | Lighthouse `color-contrast`: `#3fa9d8` sobre blanco 2,66:1 (precio `text-3xl`, eyebrows); `ink/50` 3,27:1; `ink/60` 4,47:1. | Media | El precio, el dato principal, se lee con dificultad al sol en el celular. | S | Precio en `ink`; usar `brand-dark` solo como acento con un tono ≥ 4,5:1. |
| A11Y-02 | La home no tiene `<h1>` y el listado tiene `<main>` anidado. | `motion.div` vacío en [hero.tsx:58-65](src/components/home/hero.tsx:58); `<main>` en [layout.tsx:66](src/app/layout.tsx:66) y en [propiedades/page.tsx:125](src/app/propiedades/page.tsx:125). | Media | Lectores de pantalla y SEO. | S | Agregar un H1 visible ("Propiedades en venta y alquiler en Mar del Plata"); cambiar el `<main>` interno por `<section>`. |
| A11Y-03 | Controles de formulario sin nombre ni estado accesible. | Ningún `<label>` en filtros ni hero; 0 atributos `aria-*` en [property-filters.tsx](src/components/property/property-filters.tsx) y [pagination.tsx](src/components/property/pagination.tsx). Lighthouse `button-name` en los selects (hero y orden). Chips sin `aria-pressed`, secciones sin `aria-expanded`. | Media | Inusable con lector de pantalla. | S–M | `aria-label` / `<label className="sr-only">`, `aria-pressed`, `aria-expanded`, `aria-current="page"`. |
| A11Y-04 | **Galería no operable con teclado ni cómoda en touch.** | Imagen principal `div onClick` sin `tabindex` ni rol ([image-gallery.tsx:51](src/components/property/image-gallery.tsx:51)); flechas `opacity-0 group-hover:opacity-100` (líneas 91, 99): invisibles en celular y con foco de teclado; sin swipe. | Alta | En mobile no hay forma evidente de pasar fotos; hay que adivinar que se toca la imagen. | M | Flechas siempre visibles en touch y con foco, soporte de swipe, imagen principal como `<button>`. |
| A11Y-05 | Botón de favorito anidado dentro del link de la card. | `<button>` dentro de `<Link>` ([property-card.tsx:44](src/components/property/property-card.tsx:44)/[75](src/components/property/property-card.tsx:75), [property-row.tsx:48](src/components/property/property-row.tsx:48)/[77](src/components/property/property-row.tsx:77)). HTML inválido (contenido interactivo dentro de `<a>`). | Baja | Comportamiento errático en lectores de pantalla. | M | Card con link "estirado" (`::after`) y el botón fuera del `<a>`. |
| A11Y-06 | Paginación sin links reales ni etiquetas. | `Button onClick → router.push` ([pagination.tsx:19-54](src/components/property/pagination.tsx:19)). Flechas sin `aria-label`. | Media | Los crawlers no siguen la paginación (ver SEO) y es confusa con lector de pantalla. | S | `<Link href="?page=N">` con `aria-label` y `aria-current`. |
| A11Y-07 | No respeta `prefers-reduced-motion`. | Sin `MotionConfig` ni `useReducedMotion` en `src`. | Baja | Molestias vestibulares. | S | `<MotionConfig reducedMotion="user">` en el layout. |
| A11Y-08 | El nombre accesible del botón de favorito no coincide con el texto visible. | Lighthouse `label-content-name-mismatch`: `aria-label="Agregar a favoritos"` vs texto "Guardar en favoritos". | Baja | Control por voz. | S | Igualar textos o quitar el `aria-label` cuando hay texto visible. |

### 4.5 UX / UI y conversión (Fase 3)

Inventario publicado al 14/10/2026: **12 propiedades, todas en venta y en USD; 0 alquileres; ninguna con agente asignado**. Recorridos hechos a 360 px (perfil S22) y a 1440 px, más pruebas de filtros por URL contra producción.

| ID | Hallazgo | Evidencia | Sev. | Impacto en conversión | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| UX-01 | **El buscador de la home ignora la operación y la localidad.** | El hero envía `operacion` y `localidad` ([hero.tsx:39-41](src/components/home/hero.tsx:39)), pero el listado lee `op` y `loc` ([page.tsx:82-86](src/app/propiedades/page.tsx:82)). `?operacion=alquiler` → 12 resultados (todos en venta); `?op=alquiler` → 0. | **Crítica** | La primera acción del usuario devuelve resultados que no pidió. Quien busca alquilar ve ventas y se va. | S | Usar `op` y mandar el texto libre como `q` (que ya busca en título, descripción, barrio y dirección). |
| UX-02 | **Los tipos "chalet" y "ph" se muestran en crudo y no se pueden filtrar.** | 6 de 12 propiedades muestran "chalet"/"ph" en minúscula. Faltan en `PROPERTY_TYPE_LABELS` ([constants.ts:6](src/lib/constants.ts:6)), en la whitelist ([page.tsx:45](src/app/propiedades/page.tsx:45)) y en el select del hero ([hero.tsx:122](src/components/home/hero.tsx:122)). `?tipo=ph` devuelve las 12 (se ignora). | Alta | La mitad del inventario es inencontrable por tipo y se ve poco cuidada. | S | Fuente única de tipos con `ph`, `chalet` y `ph_chalet`. |
| UX-03 | **En la ficha mobile, el botón de WhatsApp queda a 3,2–3,6 pantallas de scroll.** | Medido a 360×780 simulando la corrección de MOB-01: H1 en y=460, precio en y=624 (visibles), WhatsApp en y=2477–2787, detrás de características, descripción y mapa. No hay barra de contacto fija. Captura: [ficha_360_corregida_4b15730f.png](auditoria/capturas/ficha_360_corregida_4b15730f.png) | **Alta** | El CTA principal no se ve en el momento de interés. En mobile es el mayor freno a la conversión después de MOB-01. | S | Barra inferior fija en mobile con "WhatsApp" y "Llamar" (y "Agendar visita"). En desktop la tarjeta sticky ya funciona. |
| UX-04 | **Filtro de moneda engañoso.** | "ARS" aparece seleccionado por defecto, pero sin `mon` no se filtra por moneda ([property-filters.tsx:81](src/components/property/property-filters.tsx:81)). Tocar "ARS" borra el parámetro: **no hay forma de filtrar ARS** ([:216](src/components/property/property-filters.tsx:216)). Con "Hasta 200000" y ARS resaltado → 8 propiedades en USD (medido). | Alta | Resultados equivocados en el filtro más usado (precio). | S | Moneda explícita: sin selección = "Cualquiera"; si hay rango de precio, exigir moneda. Opcional: equivalencia con cotización de referencia. |
| UX-05 | Chips de operación confusos. | Sin filtro, "Venta" y "Alquiler" se ven ambos activos ([property-filters.tsx:138](src/components/property/property-filters.tsx:138)); tocar "Venta" (que ya se ve activa) desactiva "Alquiler". | Media | Comportamiento contraintuitivo en el primer filtro. | S | Selector de un solo valor: "Todas / Venta / Alquiler". |
| UX-06 | Los chips de ambientes y dormitorios dicen "3", pero filtran "3 o más". | `?amb=3` → 7 resultados: 2 de 3 amb., 3 de 4 amb. y 2 de 5 amb. Solo el último chip dice "5+" ([property-filters.tsx:374](src/components/property/property-filters.tsx:374)). | Media | El usuario cree que el filtro falla. | S | Etiquetas "1+", "2+", "3+"… o filtro exacto. |
| UX-07 | Opciones de orden incorrectas. | "Última actualización" ordena por `createdAt` ([queries.ts:194](src/lib/queries.ts:194)). Por precio ordena solo por `salePrice` ([:189-193](src/lib/queries.ts:189)): los alquileres quedan sin orden y se mezclan ARS y USD sin convertir. | Media | Hoy no se nota (todo es venta en USD); se rompe con el primer alquiler. | M | "Más recientes" = `publishedAt`; precio según la operación filtrada y la moneda. |
| UX-08 | Filtros en mobile: sin "Ver resultados" y con título duplicado. | El panel ([mobile-filters.tsx:27-35](src/components/property/mobile-filters.tsx:27)) aplica cada cambio detrás del panel sin mostrar cuántos resultados hay. "FILTROS" aparece dos veces. "Características" (pileta, parrilla) está colapsado al final. Hay un buscador para elegir entre 1 sola localidad. | Media | El usuario no sabe si su combinación da resultados hasta cerrar el panel. | S–M | Botón fijo "Ver N propiedades", quitar el título duplicado y mostrar los chips activos arriba del listado. |
| UX-09 | "Volver a propiedades" pierde los filtros. | `href="/propiedades"` fijo ([page.tsx:115](src/app/propiedades/[id]/page.tsx:115)). | Media | Comparar varias fichas obliga a rehacer la búsqueda. | S | `router.back()` si se vino del listado, o preservar el querystring. |
| UX-10 | Estado vacío sin salida. | `?tipo=galpon` → "No se encontraron propiedades" sin botón para limpiar filtros ni CTA de contacto ([page.tsx:154-162](src/app/propiedades/page.tsx:154)). | Media | Callejón sin salida. | S | Botones "Limpiar filtros" y "Avisame por WhatsApp cuando haya algo así" (mensaje prearmado con los filtros). |
| UX-11 | **"Alquilar" lleva a 0 resultados aunque el negocio alquila.** | 0 alquileres publicados (y, por UX-01, hoy muestra ventas). `/contacto` ofrece dos áreas de alquiler (permanentes y temporarios). | Alta | Quien busca alquilar (probablemente el grueso del tráfico) no encuentra nada ni una salida al área de alquileres. | S | Mientras no haya alquileres publicados: la pestaña "Alquilar" lleva a un bloque con WhatsApp del área de alquileres, o se oculta. |
| UX-12 | Las cards muestran datos poco útiles o incompletos. | En casas y chalets el "m²" de la card es la superficie total (lote): el chalet 1017 muestra "576 m²" y sus 200 m² cubiertos no aparecen ([property-row.tsx:35](src/components/property/property-row.tsx:35)). La ubicación agrega "Provincia de Buenos Aires" en todas. Títulos largos truncados a 1 línea. Datos faltantes: PH 1019 sin ambientes ni dormitorios; 3 propiedades sin barrio. | Media | Menos información para decidir el clic; comparación difícil. | S (código) / M (datos) | Mostrar m² cubiertos + total, barrio primero y sin provincia. Hacer obligatorios en la app de agentes: barrio, ambientes, m² cubiertos. |
| UX-13 | "Destacada" pierde sentido y usa un rojo fuera de la marca. | 5 de 12 propiedades (42 %) están destacadas; badge `#ED1B24` hardcodeado ([property-card.tsx:64](src/components/property/property-card.tsx:64), [property-row.tsx:69](src/components/property/property-row.tsx:69)). | Baja | Ruido visual. | S | Limitar destacadas (2–3) y usar un color de la paleta (arena o ink). |
| UX-14 | A la ficha le faltan funciones esperables en un portal. | Sin botón de compartir (WhatsApp / copiar link), sin propiedades similares, sin precio por m². El mensaje prearmado de WhatsApp incluye título y código pero **no el link** de la ficha. La galería no tiene swipe (A11Y-04). Si la propiedad tiene agente, se muestra dos veces (tarjeta de contacto y tarjeta de agente). | Media | Menos difusión boca a boca (compartir es clave en WhatsApp) y menos navegación interna. | M | Botón compartir (Web Share API con fallback), bloque "Similares" (mismo tipo/barrio/rango), link de la ficha en el mensaje y una sola tarjeta de agente. |
| UX-15 | **No hay forma de medir la conversión.** | Sin analytics ni eventos: los clics a WhatsApp y a llamar no se registran. Tampoco hay formulario alternativo (para quien navega de noche o desde desktop). | **Alta** | No se puede saber qué propiedades o páginas generan consultas, ni evaluar ninguna mejora de esta auditoría. | S–M | Analytics liviano (GA4 o Plausible) con eventos `whatsapp_click` / `call_click` con código de propiedad + formulario corto (nombre, teléfono, mensaje) con confirmación. |
| UX-16 | La primera pantalla de la home no comunica nada. | Sin titular ni propuesta de valor (bloque vacío en [hero.tsx:58-65](src/components/home/hero.tsx:58)); el contador de propiedades se recibe y no se usa ([hero.tsx:31](src/components/home/hero.tsx:31)). En mobile se ve un "mouse" de scroll. Captura: `home_fold_360` (anexo). | Media | Sin contexto ni señales de confianza (años, matrícula, cantidad de propiedades) arriba del pliegue. | S | H1 + subtítulo ("Inmobiliaria familiar en Playa Grande desde 1970 · N propiedades"), acceso directo a WhatsApp y sin el ícono de mouse en touch. |
| UX-17 | Inconsistencias de contenido. | Footer: "Más de 60 años" vs Nosotros "desde 1970" (56 años). Teléfono de footer y contacto: +54 9 223 537-5248; línea de las áreas: 223 451-2205. Tarjeta "Teléfono" dice "9 a 18hs" y el horario dice 9–13 y 15–18:30. Header "UCCI Propiedades" vs logo del footer "Atilio Ucci e Hijos · Reg. 2627". | Baja | Confianza y claridad sobre a qué número llamar. | S | Unificar datos de contacto en `constants.ts` y revisar los textos con el cliente. |
| UX-18 | Consistencia visual. | Dos paletas de grises mezcladas: Tailwind `gray-*` (131 usos) y la marca `ink` (156), en 11 archivos a la vez. 22 textos de 10–11 px (`text-[10px]`/`text-[11px]`), chicos para mobile. Seis radios de borde distintos. `title-h2` en `pt` (29 pt) y el resto en px/rem. | Baja | Sensación de poco cuidado; legibilidad baja en etiquetas. | M | Tokens de diseño: `ink/xx` como único gris, escala tipográfica mínima de 12 px, 2–3 radios. |
| UX-19 | Expensas formateadas con la moneda de la propiedad. | `formatPrice(prop.expenses, property.currency)` ([page.tsx:166](src/app/propiedades/[id]/page.tsx:166)): una propiedad en USD mostraría "US$ … expensas". Latente: hoy ninguna propiedad tiene expensas cargadas. | Baja | Dato incorrecto cuando se carguen expensas. | S | Expensas siempre en ARS, o un campo de moneda propio. |

**Bien resuelto:** precio y título arriba del pliegue en la ficha (una vez corregido MOB-01); mensaje de WhatsApp prearmado con título y código; enrutamiento a la línea de compra-venta o de alquiler según la operación; favoritos sin registro; filtros persistidos en la URL (se pueden compartir); en `/contacto`, áreas y canales claros con horarios.

### 4.6 Backend y base de datos (Fase 4)

**Metodología:**
- **Base local, nunca producción:** PGlite 0.5.10 (Postgres compilado a WebAssembly) con el DDL generado desde `prisma/schema.prisma` (`prisma migrate diff --from-empty`), los mismos índices que hoy declara el schema.
- **Datos sintéticos multi-cliente:** 300 organizaciones, 25.000 propiedades (500 de "UCCI" para simular crecimiento), 312.000 imágenes. Más una prueba de escala con una organización de 20.000 propiedades.
- **Consultas:** se reprodujeron con el **cliente Prisma generado del repo** (mismos `where` / `include` / `orderBy` que [queries.ts](src/lib/queries.ts) y las páginas). Se capturó el SQL real y se midió con `EXPLAIN (ANALYZE, BUFFERS)`, mediana de 5 ejecuciones.
- **Alcance de los tiempos:** los absolutos son de WebAssembly local y no equivalen a Supabase; sirven para comparar planes y órdenes de magnitud.

**Consultas por operación (SQL capturado):**

| Operación | Consultas SQL | Tiempo en BD (500 props/org) | Observación |
|---|---|---|---|
| Listado (página 1) | 3: propiedades + imágenes + `count` | 1,9 + 0,3 + 1,0 ms | Imágenes: lee **149 filas para mostrar 12** (`take: 1` se aplica en memoria) |
| Listado con texto libre (`q`) | 4: `ILIKE` de amenities **en serie** + las 3 anteriores | 1,1 + 3,7 ms | La primera consulta agrega una ida y vuelta extra antes de las demás |
| Ficha | **8**: (propiedad + imágenes + videos + agente) × 2 por `generateMetadata` y la página | < 0,1 ms c/u | Duplicado por falta de `React.cache` |
| Localidades | 1, **sin `DISTINCT` en SQL** | 1,2 ms | Trae 281 filas y deduplica en memoria |

**Conclusión de rendimiento:** con el volumen actual o proyectado, cada consulta tarda menos de 4 ms en la base. Los ~2,4 s medidos en producción salen de **la cantidad de idas y vueltas en serie × la latencia Washington ↔ São Paulo** (PERF-08), no de la base. Por eso el orden de prioridades es: (1) menos consultas y caché, (2) misma región, (3) índices para cuando crezca el volumen.

**Prueba de escala (una organización con 20.000 propiedades):**

| Consulta | Índices actuales | + índice compuesto propuesto |
|---|---|---|
| Listado por defecto (12 más recientes) | 34,0 ms (Bitmap Heap Scan de 11.766 filas + top-N sort) | **0,11 ms** (Index Scan, corta en 12) |
| Página 50 (`OFFSET 588`) | 35,8 ms | 1,6 ms |
| Texto libre `OR ILIKE` | 155,9 ms | 0,8 ms |
| `count` | 16,7 ms | 22,0 ms (sin cambio: Bitmap) |
| Filtros tipo + precio + ambientes | 7,4 ms | 9,2 ms (sigue usando `property_type_idx`) |

Nota: un **índice parcial** `WHERE is_published AND status='disponible'` **no lo usa el planner**, porque Prisma envía el enum como `CAST($3::text AS "PropertyStatus")` y esa expresión no se resuelve en tiempo de planificación (verificado). Por eso se propone un índice compuesto normal.

**Índices propuestos.** Coordinar con la app de agentes, que es la dueña del schema; este repo solo lo introspecta.

```sql
-- Listado público, home y conteo: filtra por organización + estado + publicado, ordena por fecha
CREATE INDEX CONCURRENTLY properties_org_status_pub_created_idx
  ON properties (organization_id, status, is_published, created_at DESC);

-- Fotos ordenadas por propiedad (galería y portada)
CREATE INDEX CONCURRENTLY property_images_property_order_idx
  ON property_images (property_id, "order");

-- Futuro, solo si la búsqueda de texto crece (miles de propiedades por organización):
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX CONCURRENTLY properties_text_trgm_idx ON properties
--   USING gin ((title || ' ' || coalesce(description,'') || ' ' || coalesce(neighborhood,'') || ' ' || address) gin_trgm_ops);
```

Los índices simples sobre columnas de baja cardinalidad (`status`, `operation_type`, `property_type`) aportan poco: el de `status` recorre 17.420 entradas para devolver 281. Antes de borrarlos hay que revisar si la app de agentes los usa.

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| BE-01 | **Demasiadas consultas en serie por página.** | SQL capturado: listado 3 (4 con `q`, con la de amenities en serie antes), ficha 8 ([page.tsx:42](src/app/propiedades/[id]/page.tsx:42), [:61](src/app/propiedades/[id]/page.tsx:61)). Cada una cuesta una ida y vuelta (~130 ms en Vercel) y casi nada de base. | Alta | Explica la mayor parte de los ~2,4 s de PERF-08. | S–M | `React.cache` en `getPropertyById`; meter la condición de amenities en el mismo `WHERE` (un `OR` con `amenities::text ILIKE`); traer la portada con un JOIN (`previewFeatures = ["relationJoins"]` o una columna `cover_image_url`); ISR y caché (BE-05). |
| BE-02 | **Se traen muchos más datos de los necesarios.** | Las ~45 columnas de `properties` (descripción completa, `internal_code`, coordenadas, `agent_id`, banderas): 26,3 KB para 12 cards contra 6,4 KB con un DTO (**−76 %**). Imágenes: 149 filas para mostrar 12. Localidades: `distinct` en memoria. | Media | Más tiempo de serialización y de red; además causa SEC-01. | S | `select` explícito (DTO de card y de ficha); `SELECT DISTINCT` / `groupBy` para localidades y barrios. |
| BE-03 | Índices pensados para columnas sueltas, no para la consulta real. | `EXPLAIN`: `BitmapAnd` de `organization_id_idx` + `status_idx` y sort. A 20.000 props por organización, el listado pasa de 34 ms a 0,11 ms con el índice compuesto (tabla de arriba). | Baja hoy / Media a escala | La tabla es compartida: otras inmobiliarias más grandes ya pueden estar en esa escala. | S | Índices propuestos arriba, vía migración de la app de agentes. |
| BE-04 | **Inputs sin validar ni acotar.** | `q` sin largo máximo y sin escapar `%`/`_`: con `q="%"` Prisma `contains` devuelve todo (281/281) y la consulta de amenities devuelve **todas** las propiedades de la organización, incluso no publicadas, que vuelven como lista `IN (...)` gigante ([queries.ts:161-168](src/lib/queries.ts:161)). `page` sin tope y `pmin > pmax` sin validar ([page.tsx:91-103](src/app/propiedades/page.tsx:91)). La server action de favoritos acepta cualquier array: 10.000 IDs = 381 KB de body y 101 ms locales ([actions.ts:5](src/app/favoritos/actions.ts:5)). | Media | Consultas caras disparables desde una URL o la action pública. Con muchas propiedades, el `IN` puede superar el límite de 32.767 parámetros de Postgres (inferido, no probado). | S | Validar con zod: `q` ≤ 80 caracteres y escapado; `page` ≤ `totalPages`; `ids` como `uuid[]` de máximo 50. Mover el `ILIKE` de amenities al `WHERE` principal (BE-01). |
| BE-05 | **No hay caché de datos ni invalidación on-demand.** | `getProperties` y `getPropertyById` sin caché. `unstable_cache` usa el tag `properties` ([queries.ts:242](src/lib/queries.ts:242)), pero **no existe ningún `revalidateTag`/`revalidatePath`** en el repo. La ficha no tiene ISR (PERF-02). | Alta | Cada visita va a la base. Los cambios de la app de agentes tardan en verse o nunca se cachean. | M | Caché por tags en las funciones de datos + endpoint `POST /api/revalidate` con secreto, disparado por un Database Webhook de Supabase al cambiar `properties` o `property_images`. Así se pueden usar TTL largos. |
| BE-06 | Pool de conexiones sin configurar, compartido con la app de agentes. | `DATABASE_URL` al Session Pooler `:5432` sin `connection_limit` ni `pool_timeout` (pool por defecto de Prisma = 2 × CPUs + 1 por instancia). En Vercel, cada instancia de función abre su propio pool contra el mismo pooler que usa la app de agentes. | Media | Picos de tráfico en la web podrían agotar conexiones y afectar a los agentes (**no verificado**). | S | En AWS (proceso Node persistente): `connection_limit=5&pool_timeout=10`, mantener el pooler (la conexión directa de Supabase es solo IPv6 salvo el add-on IPv4) y `statement_timeout` en el rol de solo lectura (SEC-02). |
| BE-07 | Limitaciones del modelo de datos para un portal en Argentina. | Una sola `currency` para `sale_price` y `rent_price`: una propiedad `venta_alquiler` no puede tener venta en USD y alquiler en ARS. `expenses` sin moneda (UX-19). `amenities`/`services` son JSON libre y `locality`/`neighborhood` texto libre, así que filtrar requiere `ILIKE` y hay riesgo de duplicados ("Mar del Plata" / "Mar Del Plata"). Sin `slug` (URLs con UUID). Imágenes solo con URL (sin ancho, alto ni texto alternativo). | Media | Datos mal representados, filtros por amenities imprecisos y SEO más débil. | L | En la app de agentes: moneda por precio, catálogo de amenities (o `text[]` con GIN), localidades y barrios normalizados, `slug` único y metadatos de imagen. |
| BE-08 | **La ficha muestra propiedades vendidas, alquiladas o reservadas como si estuvieran disponibles.** | `getPropertyById` no filtra por `status` ([queries.ts:216-221](src/lib/queries.ts:216)) y **ningún componente muestra el estado** (el listado sí filtra `disponible`). | Media | Un link viejo compartido por WhatsApp lleva a una propiedad vendida que parece disponible: consultas perdidas y mala imagen. | S | Mostrar un badge "Vendida / Reservada / Alquilada" y similares disponibles, o un 410 con redirección al listado filtrado. |
| BE-09 | `isPublished` es `true` por defecto en la base. | `isPublished Boolean @default(true)` ([schema.prisma:126](prisma/schema.prisma:126)); `publishedAt` es independiente y opcional. | Media | Si la app de agentes no fuerza el valor, una propiedad recién creada (borrador) queda pública al instante (**no verificado** en la otra app). | S | Default `false` y publicación explícita que setee `published_at`. |
| BE-10 | Sin manejo de errores, timeouts ni observabilidad en el acceso a datos. | Ningún `try/catch` en [queries.ts](src/lib/queries.ts), sin `statement_timeout`, sin logging ni APM (Sentry/OpenTelemetry). | Media | Una caída o lentitud de Supabase se ve como error genérico (FE-03) y nadie se entera. | M | `error.tsx` + logging estructurado + Sentry (o OpenTelemetry, que Next 16 soporta con `instrumentation.ts`). |
| BE-11 | `isMain` se ignora en las cards. | El listado trae solo la primera foto por `order` ([queries.ts:36-41](src/lib/queries.ts:36)) y después `getMainImage` busca `isMain` dentro de esa única foto ([format.ts:20](src/lib/format.ts:20)). Latente: hoy, en las 12 propiedades, la foto `isMain` es la de `order = 0`. | Baja | Si un agente marca otra foto como portada, el sitio no la respeta. | S | Ordenar por `isMain desc, order asc` o resolver la portada en la base (`cover_image_url`). |
| BE-12 | Sin integraciones ni feed hacia portales; posible doble carga. | No hay sincronización con Zonaprop, Argenprop, MercadoLibre ni Tokko. El sitio actual del cliente usa Tokko Broker. | Media | Si UCCI sigue publicando en portales vía Tokko, va a cargar dos veces y los datos van a divergir (**no verificado**: es una pregunta de proceso). | M–L | Definir la fuente de verdad. Si es la app de agentes, generar un feed (XML/JSON) compatible con los portales. |

**Bien resuelto:** todas las consultas filtran por `organizationId` (aislamiento multi-cliente en la app); consultas parametrizadas, incluido el `$queryRaw` con template tag (sin inyección SQL); whitelist de enums para operación y tipo; paginación en el servidor con `skip`/`take` (no filtra en memoria); sin claves en los bundles del cliente (verificado en los chunks de producción).

### 4.7 SEO (Fase 5)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| SEO-01 | **El sitemap tiene 1 URL de propiedad, que da 404, y apunta a otro dominio.** | `/sitemap.xml` generado el 11/05: 4 páginas + 1 propiedad (`4a0853db…` → "Propiedad no encontrada"). Las 12 publicadas no están. URLs y `robots.txt` sobre `uccipropiedades.com` (hoy sitio Gatsby/Tokko) porque falta `NEXT_PUBLIC_SITE_URL` ([constants.ts:4](src/lib/constants.ts:4)). [sitemap.ts](src/app/sitemap.ts) no tiene `revalidate`. | Alta | Google no descubre las fichas. | S | `export const revalidate = 3600` en `sitemap.ts` (o revalidar por webhook) y configurar `NEXT_PUBLIC_SITE_URL`. |
| SEO-02 | **Migración de dominio sin plan: secciones y URLs del sitio actual que no existen en el nuevo.** | El sitemap de `www.uccipropiedades.com` (Gatsby + Tokko) publica 12 URLs: `/venta`, `/alquiler`, `/temporario`, `/emprendimientos`, `/novedades`, `/novedad`, `/servicios`, `/sumate`, `/nosotros`, `/contacto`, `/favoritos` y `/`. El sitio nuevo no tiene equivalentes para temporario, emprendimientos, novedades, servicios ni "sumate" (captación de propietarios). | **Alta** | Al cambiar el dominio se pierden rankings y backlinks de esas URLs, y se pierde la captación de propietarios. | M | Mapa de redirecciones 301 (por ejemplo `/venta` → `/propiedades?op=venta`, `/alquiler` → `/propiedades?op=alquiler`, `/sumate` → una página de tasación nueva). Decidir con el cliente qué secciones migrar. Dar de alta el dominio en Search Console y enviar el sitemap nuevo. |
| SEO-03 | **La meta description dice "undefined en venta" en 6 de 12 fichas.** | `<meta name="description" content="undefined en venta - Mar del Plata. US$ 470.000…">` en todas las de tipo chalet y PH, porque `PROPERTY_TYPE_LABELS[type]` no existe para esos tipos ([page.tsx:50](src/app/propiedades/[id]/page.tsx:50), ver UX-02). La operación sale cruda (`venta_alquiler`). | Media | Snippet de Google poco profesional en la mitad del inventario. | S | Se arregla con la fuente única de tipos (UX-02) y etiquetas de operación. |
| SEO-04 | **Open Graph incompleto y con imagen de 1,5 MB: afecta cómo se ven los links compartidos por WhatsApp.** | En la ficha solo hay `og:title`, `og:description` y `og:image`: el `openGraph` de la página reemplaza al del layout y se pierden `og:type`, `og:site_name`, `og:locale` y `og:url`. `og:image` es la foto original: **1.549.076 bytes, 1200×1000**. Home, contacto y nosotros **no tienen `og:image`**. No hay `metadataBase`. | **Alta** | WhatsApp es el canal principal de difusión y de consulta. Una imagen pesada puede no mostrarse en la vista previa (**no verificado** en un celular real: se recomienda < 300 KB) y la home se comparte sin imagen. | S | `og:image` 1200×630 JPEG < 300 KB (vía `/_next/image?...&w=1200` o `opengraph-image.tsx`), imagen OG por defecto en el layout, `metadataBase` + `alternates.canonical`, y repetir `siteName`/`locale`/`type` en la ficha. |
| SEO-05 | Sin `canonical` y con combinaciones de filtros indexables. | Ninguna página emite `<link rel="canonical">`. Cada combinación de `?op=&tipo=&loc=…` es una URL distinta con el mismo título ("Propiedades") y la misma description. | Media | Contenido duplicado y presupuesto de rastreo desperdiciado. | S–M | Canonical en todas las páginas. En el listado: canonical a la versión sin filtros (o `noindex,follow` en combinaciones). Crear landings indexables para las búsquedas clave ("Casas en venta en Los Troncos", "Departamentos en alquiler en Mar del Plata"). |
| SEO-06 | Sin datos estructurados (JSON-LD). | No hay `application/ld+json` en ninguna página (verificado con UA de Googlebot, WhatsApp y Facebook). | Media | Menos contexto para buscadores; sin breadcrumbs ni ficha de negocio local enriquecida. | S–M | `RealEstateAgent` (dirección, teléfono, horarios, `sameAs`) en layout/contacto; en la ficha, `RealEstateListing` / `Offer` respetando `hideSalePrice`/`hideLocation`, más `BreadcrumbList`. |
| SEO-07 | URLs con UUID, sin palabras clave. | `/propiedades/4b15730f-fab7-48bc-9f5e-8edbc8fd2730`; no hay columna `slug` (BE-07). | Media | URLs poco descriptivas para buscadores y al compartir. | M–L | `/propiedades/chalet-5-ambientes-los-troncos-4b15730f` (slug + ID corto) con 301 desde la URL actual. |
| SEO-08 | Títulos demasiado largos. | 11 de 12 `<title>` de fichas superan 60 caracteres (75–145): títulos cargados por los agentes con barras ("… \| Los Troncos \| Saavedra 1400 \| UCCI Propiedades"). | Baja | Google los trunca. | S | Plantilla `{Tipo} en {operación} en {barrio} · {amb} amb · {m²} m²` y el título del agente como H1. |
| SEO-09 | Una propiedad inexistente responde HTTP 200 (soft 404). | `/propiedades/00000000-…` → 200 + `<meta name="robots" content="noindex">`. Comportamiento documentado de Next con streaming (`loading.md:105-113`). | Baja | Mitigado por `noindex`. | S | Validar la existencia antes de que empiece el streaming, o sacar `loading.tsx` de la ficha cuando pase a ISR. |
| SEO-10 | El staging está abierto a indexación. | `ucciweb.vercel.app/robots.txt` permite todo, sin `X-Robots-Tag`. | Baja | Riesgo de contenido duplicado con el dominio final. | S | `noindex` en todo host que no sea el dominio de producción (header condicional por host). |
| SEO-11 | La metadata llega dentro del `<body>` para navegadores y Googlebot. | Comportamiento de Next 16 ("streaming metadata"): con UA de Chrome y Googlebot, `<title>`, description y OG llegan en el body. Con WhatsApp y Facebook llegan en el `<head>` (están en `HTML_LIMITED_BOT_UA_RE`, que incluye Bingbot). Lighthouse lo marca como "sin meta description" en la ficha. | Baja | Por diseño: Google ejecuta JS. Solo es ruido en herramientas de auditoría. | — | Sin acción, salvo agregar bots puntuales a `htmlLimitedBots`. |

Además, la home no tiene `<h1>` (A11Y-02) y la paginación no usa links rastreables (A11Y-06).

**Bien resuelto:** las fichas se renderizan en el servidor (título, precio y descripción en el HTML); `lang="es"`; `robots.ts` y `sitemap.ts` existen (falta configurarlos bien); los crawlers de WhatsApp, Facebook y Bing reciben la metadata en el `<head>`.

### 4.8 Seguridad (Fase 5)

| ID | Hallazgo | Evidencia | Sev. | Impacto | Esf. | Recomendación |
|---|---|---|---|---|---|---|
| SEC-01 | **Precio oculto, dirección, coordenadas y código interno van dentro del HTML.** | `PropertyRow`/`PropertyCard` son client components y reciben la fila completa de la base. En `/propiedades`, la propiedad cód. 1006 muestra "Consultar valor" en pantalla, pero `salePrice` está en el payload. También van `latitude`, `longitude`, `address`, `streetNumber`, `internalCode` y `agentId` de todas las propiedades. | **Crítica** | Expone información que el negocio decidió ocultar (precios "a consultar", direcciones con `hideLocation`). | M | DTO público que omita los campos ocultos según `hideSalePrice`/`hideLocation`; cards como server components. |
| SEC-03 | El precio oculto se puede inferir ordenando o filtrando por precio. | Con `?sort=price_asc`, la propiedad cód. 1006 ("Consultar valor") queda entre US$ 95.000 y US$ 138.000. Los filtros `pmin`/`pmax` también la incluyen o excluyen según su precio real (filtro en [queries.ts:94](src/lib/queries.ts:94)). | Media | Aun corrigiendo SEC-01, una búsqueda binaria con `pmax` revela el precio exacto. | S | Excluir de orden y filtros de precio las propiedades con `hideSalePrice` (o tratarlas como "sin precio"). |
| SEC-02 | **El sitio público se conecta a la base con el usuario `postgres`.** | `DATABASE_URL` usa `postgres.<ref>@…pooler.supabase.com:5432`. Ese rol se saltea el RLS. La base contiene datos de otros clientes (CBU, CUIT, movimientos bancarios). | Alta | Si se filtra la credencial del servidor web, queda expuesta toda la base multi-cliente. | M | Rol de solo lectura limitado a `properties`, `property_images`, `property_videos` y `agents` (o vistas filtradas). |
| SEC-04 | **Faltan headers de seguridad y se expone la tecnología.** | La respuesta de la home solo trae `strict-transport-security` (lo pone Vercel) y `x-powered-by: Next.js`. Faltan `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`. **En AWS ni siquiera va a estar HSTS.** | Media | Clickjacking (el sitio se puede embeber en otro), menor defensa ante XSS, y la versión vulnerable de Next (FE-01) es fácil de detectar. | S | `headers()` en `next.config.ts` (o en Caddy): CSP con `img-src` (self, Supabase, Unsplash), `frame-src` (Google Maps, YouTube, Vimeo); `frame-ancestors 'none'`; `nosniff`; `strict-origin-when-cross-origin`; HSTS; `poweredByHeader: false`. |
| SEC-05 | **El optimizador de imágenes funciona como proxy abierto.** | `images.remotePatterns: [{ protocol: "https", hostname: "**" }]` ([next.config.ts:5-10](next.config.ts:5)). Prueba con 1 request: `/_next/image?url=https://www.google.com/…/googlelogo….png&w=640` → **200 image/png**: el sitio optimiza imágenes de dominios ajenos. | Media | En AWS, cualquiera puede usar la CPU, el disco de caché y el ancho de banda de tu instancia para procesar imágenes arbitrarias (costo y denegación de servicio). | S | Restringir a `ozkgdwemrszodajnqvcz.supabase.co` (path `/storage/v1/object/public/**`) e `images.unsplash.com`, o bajar las fotos de Unsplash a `public/`. |
| SEC-06 | **Secretos innecesarios en el entorno de la web.** | `.env.local` incluye `SUPABASE_SERVICE_ROLE_KEY` (salta todo el RLS), `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, y **ninguno se usa en `src/`**. Verificado: ninguno está en los bundles del cliente y `.env*` nunca se commiteó (búsqueda en las 11 revisiones del historial). | Media | Si esas variables se cargan en el servidor de AWS, una fuga (logs, SSRF, dependencia comprometida) entrega una llave maestra de la base multi-cliente. | S | Dejar en el entorno de producción solo `DATABASE_URL` (rol de solo lectura, SEC-02), `ORGANIZATION_ID`, `NEXT_PUBLIC_SITE_URL` y el secreto del webhook. Rotar la service role key si alguna vez estuvo en Vercel. |
| SEC-07 | Sin rate limiting ni protección ante abuso. | El listado es dinámico y sin caché (cada querystring distinto = 3–4 consultas), la server action de favoritos no tiene límites (BE-04) y el optimizador está abierto (SEC-05). No hay formularios, así que no hay spam de contacto. | Media | Con una sola instancia en AWS, un scraping o flood simple degrada el sitio **y la base que comparte la app de agentes**. | S–M | Caché (BE-05) + rate limit por IP en el proxy (Caddy `rate_limit` o CloudFront + AWS WAF con regla basada en tasa). |
| SEC-08 | Dependencias vulnerables. | Ver FE-01 (`next` 16.2.0, DoS crítica) y FE-02 (`shadcn` CLI en producción con `proxy-addr` crítica). | Crítica | — | S | Actualizar `next` a 16.4.1 y mover `shadcn` a `devDependencies`. |

**Bien resuelto:**
- no hay formularios ni datos personales de visitantes (favoritos en `localStorage`);
- React escapa todo y no hay `dangerouslySetInnerHTML`;
- los videos embebidos pasan por una whitelist de YouTube/Vimeo ([video.ts](src/lib/video.ts));
- los links externos usan `rel="noopener noreferrer"`;
- las server actions tienen la protección CSRF por Origin que trae Next;
- no hay paneles de administración ni rutas `/api` expuestas;
- los datos de los agentes que se muestran son los públicos (nombre, matrícula, celular de WhatsApp); el email no se renderiza.

**Al sumar analytics (UX-15):** publicar una política de privacidad (Ley 25.326) y, si se usan cookies de terceros, un aviso de consentimiento.

---

## 5. Quick wins

Alto impacto y esfuerzo S (menos de medio día cada uno), ordenados por impacto/esfuerzo.

| # | Qué hacer | IDs | Efecto esperado |
|---|---|---|---|
| 1 | `grid-cols-1` en la grilla de la ficha y en destacadas; selector de orden sin `min-w-52` y con `flex-wrap` | MOB-01, MOB-02, MOB-03 | Ficha, home y listado usables en celular (ancho = 360 px). Verificado en vivo para la home. |
| 2 | Hero: enviar `op` (no `operacion`) y el texto como `q` (no `localidad`) | UX-01 | El buscador principal funciona. |
| 3 | Fuente única de tipos con `ph`, `chalet` y `ph_chalet` (labels, whitelist y hero) | UX-02, SEO-03 | 6 de 12 propiedades pasan a ser filtrables; se corrige "undefined en venta". |
| 4 | `next@16.4.1` y `shadcn` a `devDependencies` | FE-01, FE-02, SEC-08 | Se cierran las vulnerabilidades críticas. |
| 5 | Re-exportar logos con SVGO o como PNG/WebP; favicon `.ico`/PNG | PERF-01 | LCP mobile −2,5 s (home), −3,5 s (listado), −4,1 s (contacto), medido bloqueando los SVG. |
| 6 | `generateStaticParams` → `[]` en la ficha + `React.cache` en `getPropertyById` | PERF-02, PERF-03, BE-01 | La ficha pasa a ISR (HIT de caché); de 8 a 4 consultas por render, y 0 si está cacheada. |
| 7 | Barra fija "WhatsApp / Llamar" en la ficha mobile | UX-03 | El CTA queda visible siempre (hoy está a 3,2–3,6 pantallas). |
| 8 | `remotePatterns` solo para Supabase + Unsplash | SEC-05 | Cierra el proxy abierto de imágenes. |
| 9 | Headers de seguridad + `poweredByHeader: false` | SEC-04 | Protección básica (clickjacking, sniffing, referrer) y HSTS en AWS. |
| 10 | `revalidate` en `sitemap.ts` + `NEXT_PUBLIC_SITE_URL` | SEO-01 | Google descubre las 12 fichas. |
| 11 | `og:image` 1200×630 < 300 KB + imagen OG por defecto + `metadataBase` | SEO-04 | Vista previa confiable al compartir por WhatsApp. |
| 12 | Moneda explícita, operación de selección única y chips "3+" | UX-04, UX-05, UX-06 | Filtros que hacen lo que dicen. |
| 13 | Sacar del entorno de producción las claves no usadas | SEC-06 | Menos superficie ante una fuga. |
| 14 | Hero con `next/image` + `preload`; `preload` en la primera card del listado | PERF-04, PERF-05 | Mejor LCP en home y listado. |
| 15 | Precio en color `ink`; `<h1>` en la home | A11Y-01, A11Y-02, UX-16 | Precio legible y página principal con titular. |
| 16 | "Alquilar" → WhatsApp del área de alquileres mientras no haya alquileres publicados | UX-11 | Quien busca alquilar tiene una salida. |
| 17 | Excluir de orden y filtros de precio las propiedades con `hideSalePrice` | SEC-03 | El precio oculto deja de poder deducirse. |
| 18 | `not-found.tsx` y `error.tsx` en español con salida al listado y a WhatsApp | FE-03 | Errores y bajas sin callejón sin salida. |

## 6. Roadmap

### Inmediato (semanas 1–2, antes de cambiar el DNS)

- **Quick wins 1–18.**
- **Datos:**
  - DTO público para cards y ficha, sin campos ocultos; cards como server components (SEC-01, BE-02, FE-07);
  - rol de Postgres de solo lectura sobre las 4 tablas, con `statement_timeout` (SEC-02);
  - validación de inputs con zod: `q`, `page` e `ids` de favoritos (BE-04).
- **Medición:** analytics con eventos `whatsapp_click` / `call_click` por código de propiedad (UX-15); política de privacidad.
- **Deploy en AWS São Paulo:**
  - imagen Docker `output: "standalone"`;
  - Caddy con HTTPS, HSTS, headers, rate limit por IP y sin buffering (para el streaming);
  - variables de entorno mínimas;
  - `connection_limit=5&pool_timeout=10` contra el pooler (BE-06, SEC-07).
  - **Medir TTFB y el HTML completo en AWS** con los mismos scripts, para cerrar PERF-08.
- **Migración:** mapa de redirecciones 301 desde el sitio actual; decidir qué pasa con temporario, emprendimientos, novedades y "sumate"; `noindex` en el staging (SEO-02, SEO-10).

### 1 mes

- **Caché:** caché de datos por tags + endpoint `/api/revalidate` disparado por un Database Webhook de Supabase (BE-05); portada con JOIN o `cover_image_url` (BE-01, BE-11).
- **Performance:**
  - fachada para el mapa (PERF-06);
  - AVIF y `minimumCacheTTL` alto (PERF-07);
  - sacar `loading.tsx` de las rutas estáticas (PERF-10, MOB-04);
  - caché larga para `public/` (PERF-11).
- **UX:**
  - filtros mobile con "Ver N propiedades" (UX-08);
  - volver al listado sin perder los filtros (UX-09);
  - estados vacíos con acciones (UX-10);
  - cards con m² cubiertos y barrio (UX-12);
  - compartir, propiedades similares y link en el mensaje de WhatsApp (UX-14);
  - badge de estado vendida/reservada (BE-08).
- **Accesibilidad:** labels y atributos ARIA (A11Y-03), galería con swipe y flechas visibles (A11Y-04), paginación con links (A11Y-06), `reducedMotion` (A11Y-07).
- **SEO:** canonical, landings indexables por búsqueda clave y JSON-LD (SEO-05, SEO-06); plantilla de títulos (SEO-08).
- **Calidad:**
  - CI con `tsc`, lint (excluyendo `src/generated`) y un test e2e de Playwright que verifique ancho = viewport a 360 px en listado y ficha (FE-05, FE-08);
  - limpieza de duplicaciones (FE-06);
  - actualizar dependencias menores (FE-09);
  - Sentry/OpenTelemetry (BE-10).

### 3 meses

- **Modelo de datos, en la app de agentes:**
  - moneda por precio y para expensas;
  - catálogo de amenities;
  - localidades y barrios normalizados;
  - `slug`;
  - metadatos de imagen;
  - `isPublished` en `false` por defecto con publicación explícita (BE-07, BE-09, UX-19).
  - Redimensionar las fotos al subirlas.
- **Índices compuestos** propuestos, vía migraciones de la app de agentes (BE-03).
- **URLs con slug** y redirecciones 301 desde las URLs con UUID (SEO-07).
- **Fuente de verdad y feed hacia portales** (Zonaprop, Argenprop, MercadoLibre) para no cargar dos veces (BE-12).
- **Formulario de contacto / agendar visita** con confirmación, como alternativa a WhatsApp (UX-15).
- **Menos JavaScript:** animaciones con CSS y menos client components (PERF-09).
- **Diseño:** tokens (una sola paleta de grises, tipografía mínima de 12 px, radios) y revisión de contenidos con el cliente (UX-13, UX-17, UX-18).
- **Datos de campo:** RUM de Core Web Vitals con `web-vitals` para reemplazar la línea base de laboratorio por datos reales (CrUX propio).

## 7. Lo no verificado

| Tema | Por qué no se verificó | Qué haría falta |
|---|---|---|
| Datos de campo (CrUX / Core Web Vitals reales) | El dominio `ucciweb.vercel.app` no tiene datos en CrUX; la cuota anónima de la API de PageSpeed estaba agotada. | Analytics propio con `web-vitals` (o Vercel Speed Insights) tras el lanzamiento, o una API key de CrUX. |
| Tiempos de servidor en AWS São Paulo | Todavía no existe el entorno. | Medir TTFB y HTML completo en el entorno de AWS con los mismos 5 pedidos por URL. |
| INP en dispositivos reales | No hay datos de campo; el laboratorio da TBT 45–67 ms y Event Timing 16–32 ms en CPU de escritorio. | RUM con `web-vitals` (`onINP`). |
| Planes y tiempos de consulta en la base real | Regla de la auditoría: no consultar producción. Se usó PGlite local con datos sintéticos. | Una copia (dump) de la base o un branch de Supabase: correr los mismos `EXPLAIN (ANALYZE, BUFFERS)` (scripts en el anexo) y ver `pg_stat_statements`. |
| Volumen real de `properties` / `property_images` (todos los clientes) e índices extra no declarados en Prisma | Sin acceso a la base. | `SELECT count(*)` por organización e `\di properties*` en un entorno con acceso. |
| Límites del pooler de Supabase y uso de conexiones de la app de agentes (BE-06) | Sin acceso al dashboard de Supabase. | Ver "Database → Connection pooling" (pool size, max client connections) y métricas de conexiones. |
| ~~RLS sobre `properties` y exposición vía la API de Supabase (anon key)~~ | **Verificado el 14/10/2026:** RLS activo en `properties`, `property_images`, `property_videos` y `agents`, sin políticas para `anon`/`authenticated`, así que la API pública no lee nada. Se agregaron políticas solo para `web_readonly` ([db/readonly-policies.sql](db/readonly-policies.sql)). | — |
| Default de `isPublished` en la app de agentes (BE-09) | Es otro repositorio. | Revisar el formulario de alta de la app de agentes. |
| Flujo de publicación en portales / Tokko (BE-12) | Es una pregunta de proceso. | Consultar al cliente. |
| Vista previa real en WhatsApp con el `og:image` de 1,5 MB (SEO-04) | Requiere compartir el link desde un teléfono; no se envían mensajes desde la auditoría. | Pegar el link de una ficha en un chat de WhatsApp antes y después de achicar la imagen. |
| Estado de indexación en Google (staging y dominio actual) | Sin acceso a Search Console. | Acceso a Search Console de `uccipropiedades.com` (y verificar `ucciweb.vercel.app`). |
| URLs internas del sitio actual (fichas de Tokko) y sus backlinks | El sitemap actual solo lista 12 secciones; las fichas se generan del lado del cliente. | Export de Search Console (páginas con impresiones y enlaces externos) para armar el mapa de 301. |
| Uso real de `SUPABASE_SERVICE_ROLE_KEY` en el entorno de Vercel | Solo se vio `.env.local`. | Revisar las variables de entorno del proyecto en Vercel y en el futuro servidor de AWS. |
| Causa raíz del esqueleto en páginas estáticas (PERF-10) | Se midió el efecto, no el motivo interno de Next/React. | Build local con `next build --debug` y prueba sacando `loading.tsx`. |

---

## Anexo — Evidencia

- Capturas responsive: [auditoria/capturas/](auditoria/capturas/) (`<página>_<ancho>.png|jpg`, más `ficha_360_primera-pantalla.png` y `ficha_768_primera-pantalla.png`).
- Capturas del S22 aportadas por el cliente: el desborde se reprodujo a 360 px (MOB-01 a MOB-03).
- Base de datos: [auditoria/scripts-bd/](auditoria/scripts-bd/) (PGlite + seed sintético, SQL capturado de Prisma en `queries.json`, resultados de EXPLAIN en `explain_before.json` / `explain_after.json`).
- UX mobile: `ficha_360_corregida_<id>.png` (ficha con MOB-01 corregido por CSS inyectado, solo en el navegador de prueba), `home_360_primera-pantalla.png`, `footer_360.png`.
