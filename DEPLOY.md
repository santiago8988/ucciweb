# Deploy en AWS (São Paulo)

Una sola instancia (Lightsail o EC2) en `sa-east-1`, en la misma región que la base de Supabase, con dos contenedores:

```
Internet ──► Caddy :80/:443 (HTTPS automático, compresión, rate limit por IP)
                 │
                 ▼
            web :3000 (Next.js standalone) ──► Supabase sa-east-1 (transaction pooler :6543, rol web_readonly)
                 │
                 └─ volumen next_cache (páginas ISR + imágenes optimizadas)
```

Archivos involucrados: [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml), [deploy/caddy/](deploy/caddy/), [.env.example](.env.example), [db/readonly-role.sql](db/readonly-role.sql).

---

## 1. Antes de empezar (una sola vez)

1. **Rol de base de solo lectura (SEC-02).**
   - Abrí el SQL editor de Supabase, reemplazá la contraseña en [db/readonly-role.sql](db/readonly-role.sql) y ejecutalo.
   - Después ejecutá [db/readonly-policies.sql](db/readonly-policies.sql), reemplazando `<ORGANIZATION_ID>`. Las 4 tablas tienen RLS activo: sin estas políticas el sitio ve 0 propiedades.
   - Verificá desde el repo con `node db/verify-readonly.js` (solo lee).
   - Armá la URL de conexión con el **Transaction Pooler (puerto 6543)**:
     ```
     postgresql://web_readonly.<project_ref>:<password>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10
     ```
     No uses el Session Pooler (5432): admite como máximo 15 clientes para toda la base, compartidos con la app de agentes. Con ese pooler el build falló el 14/10 con `EMAXCONNSESSION max clients reached in session mode`. `pgbouncer=true` es obligatorio en modo transacción. En Vercel usá `connection_limit=1`.
2. **Valores de configuración:**
   - `ORGANIZATION_ID`: el mismo de `.env.local`.
   - `NEXT_PUBLIC_SITE_URL`: el dominio final (por ejemplo `https://www.uccipropiedades.com`).
   - `NEXT_PUBLIC_GA_ID`: ID de medición de GA4 (`G-…`). Si queda vacío, no se carga analytics.
   - `SUPABASE_STORAGE_HOST`: el host de Supabase donde están las fotos.
3. **No cargar en ningún entorno** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ni `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: el sitio no las usa (SEC-06). Si alguna vez estuvieron en Vercel, borralas y rotá la service role key.

## 2. Crear la instancia

1. En Lightsail, región **São Paulo**: instancia Linux con **Ubuntu 24.04**, plan de **2 GB de RAM** o más.
2. Asignale una **IP estática**.
3. En el firewall de la instancia, abrí los puertos **22** (solo desde tu IP), **80** y **443** (TCP), y **443 UDP** para HTTP/3.
4. Conectate por SSH e instalá Docker:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER   # cerrar y abrir la sesión SSH
   ```
5. Copiá el repo a la instancia: `git clone`, o solo `docker-compose.yml`, `deploy/` y `.env.example` si la imagen se construye en otro lado.

## 3. Construir la imagen

`next build` genera la home y el sitemap con datos de la base, así que **el build necesita `DATABASE_URL`**. Se pasa como *secreto* de BuildKit y no queda guardado en la imagen.

Construí en tu máquina o en CI (compilar en una instancia de 2 GB suele quedarse sin memoria) y pasá la imagen al servidor:

```bash
printf '%s' 'postgresql://web_readonly.<ref>:<pass>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' > db_url.secret
```

```bash
docker build --platform linux/amd64 --secret id=database_url,src=db_url.secret --build-arg NEXT_PUBLIC_SITE_URL=https://www.uccipropiedades.com --build-arg ORGANIZATION_ID=<org_id> --build-arg SUPABASE_STORAGE_HOST=<ref>.supabase.co --build-arg NEXT_PUBLIC_GA_ID=<G-XXXX> -t ucci-web:latest .
```

```bash
rm db_url.secret
```

Pasar la imagen al servidor sin usar un registry:

```bash
docker save ucci-web:latest | gzip | ssh ubuntu@<ip-estatica> 'gunzip | docker load'
```

> Las variables `NEXT_PUBLIC_*` y `SUPABASE_STORAGE_HOST` quedan **fijas en el build**: si cambian, hay que reconstruir la imagen.

## 4. Configurar y levantar

En el servidor, en la carpeta del repo:

```bash
cp .env.example .env.production
nano .env.production   # completar DATABASE_URL (rol web_readonly), ORGANIZATION_ID, NEXT_PUBLIC_SITE_URL, DOMAIN, APEX_DOMAIN, ACME_EMAIL
```

```bash
docker compose --env-file .env.production up -d --build
```

```bash
docker compose logs -f --tail=100
```

`--build` construye solo la imagen de Caddy (incluye el plugin de rate limit). La del sitio (`ucci-web:latest`) ya la cargaste en el paso 3.

## 5. Probar antes de cambiar el DNS

Desde tu máquina, apuntando el dominio a la IP nueva solo localmente:

```bash
curl -sS -o /dev/null -D - --resolve www.uccipropiedades.com:443:<ip-estatica> https://www.uccipropiedades.com/ -k
```

Tiene que responder `200` con `content-security-policy` y `strict-transport-security`, y **sin** `x-powered-by`. El certificado real se emite recién cuando el DNS apunta a la instancia, por eso el `-k`.

## 6. Cambiar el DNS

1. Registros **A** de `www.uccipropiedades.com` y `uccipropiedades.com` → IP estática. Bajá antes el TTL a 300 s.
2. Caddy obtiene el certificado de Let's Encrypt solo, en el primer request.
3. El apex redirige a `www`, y las URLs del sitio actual (`/venta`, `/alquiler`, `/temporario`, `/sumate`, etc.) redirigen con 308 (ver `redirects()` en [next.config.ts](next.config.ts)).

## 7. Verificación post-deploy

- **Tiempos del servidor en AWS (cierra PERF-08 de la auditoría):** 5 pedidos por URL. Antes, en Vercel, la ficha y el listado tardaban ~2,4 s en entregar el HTML completo.
  ```bash
  for u in / /propiedades /propiedades/<id-de-una-ficha>; do for i in 1 2 3 4 5; do curl -sS -o /dev/null -w "$u ttfb=%{time_starttransfer}s total=%{time_total}s\n" "https://www.uccipropiedades.com$u"; done; done
  ```
- **Lighthouse mobile** sobre home, listado, ficha y contacto, para comparar con la línea base de [AUDITORIA_UCCI.md](AUDITORIA_UCCI.md).
- **Search Console:** dar de alta el dominio y enviar `https://www.uccipropiedades.com/sitemap.xml`.
- **WhatsApp:** pegar el link de una ficha en un chat y confirmar que aparece la vista previa con foto.
- **Analytics:** en GA4 → Tiempo real, tocar WhatsApp en una ficha y ver el evento `whatsapp_click`.

## 8. Actualizar y volver atrás

**Nueva versión:**
1. Construir y cargar la imagen (paso 3) con un tag nuevo, por ejemplo `ucci-web:2026-10-20`, y retaguearla como `latest`.
2. En el servidor:
   ```bash
   docker compose --env-file .env.production up -d web
   ```

**Volver atrás:** retaguear la imagen anterior como `latest` y repetir el `up -d web`. Conviene conservar las últimas 2 o 3 imágenes (`docker image ls ucci-web`).

**Caché:** las páginas ISR y las imágenes optimizadas viven en el volumen `next_cache` y sobreviven a los redeploys. Para vaciarlo:

```bash
docker compose --env-file .env.production down && docker volume rm ucciweb_next_cache
```

(el nombre del volumen depende de la carpeta; verificalo con `docker volume ls`).

## 9. Operación

- **Backups:** snapshots automáticos de la instancia en Lightsail. La base vive en Supabase y tiene sus propios backups.
- **Monitoreo:** un chequeo de disponibilidad externo (por ejemplo UptimeRobot) sobre `/` y `/propiedades`.
- **Staging en Vercel (si se mantiene):**
  - `NEXT_PUBLIC_SITE_URL` con la URL de staging;
  - el header `noindex` para `*.vercel.app` ya está en `next.config.ts`;
  - `DATABASE_URL` también con el rol `web_readonly`.
