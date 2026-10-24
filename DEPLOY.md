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
   La clave SSH por defecto de la región se crea junto con la primera instancia: se descarga desde la pestaña **Connect** de la instancia ("Download default key").
4. Conectate por SSH, instalá Docker y agregá swap (con 2 GB de RAM el build de Next necesita swap):
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER   # cerrar y abrir la sesión SSH
   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
5. Copiá el código a la instancia, en `~/ucci`. Desde tu máquina (sube solo lo commiteado):
   ```bash
   git archive --format=tar.gz -o ucci-src.tgz HEAD
   ```
   ```bash
   scp -i ~/.ssh/ucci-lightsail.pem ucci-src.tgz ubuntu@<ip-estatica>:/tmp/ && ssh -i ~/.ssh/ucci-lightsail.pem ubuntu@<ip-estatica> 'mkdir -p ~/ucci && tar -xzf /tmp/ucci-src.tgz -C ~/ucci'
   ```

## 3. Construir la imagen

`next build` genera la home y el sitemap con datos de la base, así que **el build necesita `DATABASE_URL`**. Se pasa como *secreto* de BuildKit y no queda guardado en la imagen.

Se construye **en el servidor** (con el swap del paso 2 tarda ~2 minutos), dentro de `~/ucci`. La imagen usa Node 22: con Node 20, Turbopack falla al procesar `next/font/google` ("next/font/google queries have exactly one entry").

```bash
printf '%s' 'postgresql://web_readonly.<ref>:<pass>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' > db_url.secret
```

```bash
docker build --platform linux/amd64 --secret id=database_url,src=db_url.secret --build-arg NEXT_PUBLIC_SITE_URL=https://www.uccipropiedades.com --build-arg ORGANIZATION_ID=<org_id> --build-arg SUPABASE_STORAGE_HOST=<ref>.supabase.co --build-arg NEXT_PUBLIC_GA_ID=<G-XXXX> -t ucci-web:latest .
```

```bash
rm db_url.secret
```

Alternativa si algún día se construye en otra máquina (sin registry):

```bash
docker save ucci-web:latest | gzip | ssh ubuntu@<ip-estatica> 'gunzip | docker load'
```

> Las variables `NEXT_PUBLIC_*` y `SUPABASE_STORAGE_HOST` quedan **fijas en el build**: si cambian, hay que reconstruir la imagen.

## 4. Configurar y levantar

En el servidor, en la carpeta del repo:

```bash
cp .env.example .env.production
nano .env.production   # completar DATABASE_URL (rol web_readonly), ORGANIZATION_ID, NEXT_PUBLIC_SITE_URL, REVALIDATE_SECRET, DOMAIN, APEX_DOMAIN, ACME_EMAIL
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

Así se hizo el 24/10/2026. El dominio está registrado en Route 53 de la cuenta de UCCI, y el DNS estaba en un Cloudflare sin acceso. Se pasó a una **zona DNS de Lightsail**, que es gratis.

1. Lightsail → Domains & DNS → **Create DNS zone** → **"Use a domain from another registrar"** → `uccipropiedades.com`.
   > **No** elijas "Use a domain that is registered with Amazon Route 53": con esa opción Lightsail cambia los nameservers del dominio **en el acto**, con la zona todavía vacía, y se cortan el sitio y el mail.
2. Cargá los registros:
   - **A** de `@` y `www` → IP estática.
   - **MX** del mail (Google Workspace): `1 aspmx.l.google.com`, `5 alt1.aspmx.l.google.com`, `5 alt2.aspmx.l.google.com`, `10 alt3.aspmx.l.google.com` y `10 alt4.aspmx.l.google.com`.
   - **TXT**: el SPF `v=spf1 include:_spf.google.com -all` y el `google-site-verification=…` de Search Console.
3. Verificá preguntando directo a uno de los nameservers de la zona, antes del cambio: `nslookup -type=MX uccipropiedades.com ns-224.awsdns-28.com`.
4. En la ficha del **dominio** (ícono 53) → **Edit name servers** → los 4 de la zona:
   - `ns-1372.awsdns-43.org`
   - `ns-1826.awsdns-36.co.uk`
   - `ns-224.awsdns-28.com`
   - `ns-783.awsdns-33.net`

   Para volver atrás, se ponen de nuevo los de Cloudflare: `austin.ns.cloudflare.com` y `carrera.ns.cloudflare.com`.
5. Levantá Caddy recién después del cambio (`docker compose --env-file .env.production up -d`). Si arranca antes, sus intentos de certificado fallan contra el DNS viejo. El 24/10 la delegación se vio en minutos y Caddy obtuvo los certificados en 5 segundos.
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
- **Límite de pedidos (Caddy):** 600 páginas por minuto por IP. Excluye `/_next/*` (estáticos e imágenes optimizadas), porque una sola vista dispara decenas de esos pedidos. Con el límite anterior (300, imágenes incluidas), los tests e2e recibían 429. Además, muchas conexiones móviles en Argentina comparten IP (CGNAT).
- **Tests de solo lectura contra el sitio publicado:**
  ```bash
  E2E_BASE_URL=https://www.uccipropiedades.com npm run test:e2e
  ```

## Webhooks de Supabase

Hacen que los cambios de la app de agentes se vean al instante en el sitio. Sin webhooks, la caché se renueva cada 5 minutos.

1. Generá un secreto largo y cargalo como `REVALIDATE_SECRET`: en `.env.production` del servidor y en Vercel (Production y Preview, marcado *Sensitive*). Después hacé redeploy.
   ```bash
   openssl rand -hex 32
   ```
2. En Supabase → **Database → Webhooks** → *Create a new hook*, uno por cada tabla: `properties`, `property_images`, `property_videos` y `agents`.
   - Events: **Insert, Update, Delete**.
   - Type: **HTTP Request**, method **POST**.
   - URL: `https://www.uccipropiedades.com/api/revalidate`.
   - El secreto de producción ya está generado en el servidor; se ve con `grep REVALIDATE_SECRET ~/ucci/.env.production`.
   - HTTP Headers: `Authorization: Bearer <REVALIDATE_SECRET>` y `Content-Type: application/json`.
3. Probalo editando una propiedad en la app de agentes: el cambio tiene que verse en el sitio con solo recargar.

Notas:
- Los webhooks son triggers en la base compartida, así que afectan a todas las inmobiliarias. El endpoint ignora los cambios de propiedades de otras organizaciones, pero cada cambio igual genera un request.
- Si cambia el secreto, hay que actualizarlo en los 4 webhooks.

## 8. Actualizar y volver atrás

**Nueva versión:**
1. Commitear y subir el código al servidor (paso 2.5).
2. En el servidor, `cd ~/ucci && bash deploy/build.sh`:
   - construye con los valores de `.env.production`;
   - etiqueta la imagen con fecha y hora (`ucci-web:AAAAMMDD-HHMM`) y además como `latest`;
   - reinicia el contenedor del sitio, con un corte de 1 o 2 segundos.

   Si cambia la configuración de Caddy, además: `docker compose --env-file .env.production up -d --build caddy`.

**Volver atrás:**

```bash
docker tag ucci-web:<tag-anterior> ucci-web:latest && docker compose --env-file .env.production up -d web
```

Conviene conservar las últimas 2 o 3 imágenes (`docker image ls ucci-web`) y borrar las viejas con `docker image rm`.

**Caché:** las páginas ISR y las imágenes optimizadas viven en el volumen `next_cache` y sobreviven a los redeploys. Para vaciarlo:

```bash
docker compose --env-file .env.production down && docker volume rm ucci_next_cache
```

(el nombre del volumen depende de la carpeta; verificalo con `docker volume ls`).

## 9. Operación

- **Backups:** el servidor no guarda datos propios. Se reconstruye con este documento, el repo y `.env.production`. Guardá una copia de `.env.production` en un gestor de contraseñas. Un snapshot manual de la instancia después de cada cambio de configuración cuesta centavos. La base vive en Supabase y tiene sus propios backups.
- **Fotos precalentadas:** [deploy/warm-images.sh](deploy/warm-images.sh) genera de antemano las variantes WebP de cada foto publicada (64 a 1920 px). Corre después de cada deploy y cada 30 minutos por cron. Las fotos que suben los agentes pesan ~3 MB y la primera conversión tarda ~0,6 s por variante, así que el cron evita que un visitante espere en las fotos nuevas. Log en `/tmp/warm-images.log`. Si se rehace el servidor, hay que reinstalar el cron:
  ```bash
  (crontab -l 2>/dev/null; echo '*/30 * * * * bash $HOME/ucci/deploy/warm-images.sh >> /tmp/warm-images.log 2>&1') | crontab -
  ```
- **Acceso:** `ssh -i ~/.ssh/ucci-lightsail.pem ubuntu@54.207.116.159`. La clave es la default de Lightsail en São Paulo y se puede volver a descargar desde la consola.
- **Monitoreo:** un chequeo de disponibilidad externo (por ejemplo UptimeRobot) sobre `/` y `/propiedades`.
- **Staging en Vercel (si se mantiene):**
  - `NEXT_PUBLIC_SITE_URL` con la URL de staging;
  - el header `noindex` para `*.vercel.app` ya está en `next.config.ts`;
  - `DATABASE_URL` también con el rol `web_readonly`.
