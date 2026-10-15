@AGENTS.md

## Estado del proyecto

Antes de empezar, leé [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md): dónde quedó el trabajo, pendientes de configuración, próximos pasos, decisiones tomadas y trampas conocidas. El detalle técnico por hallazgo (IDs MOB-, PERF-, FE-, A11Y-, UX-, BE-, SEO-, SEC-) está en [AUDITORIA_UCCI.md](AUDITORIA_UCCI.md).

Reglas que siguen vigentes:
- La base de datos es **producción compartida** con la app de agentes. El sitio solo usa el rol `web_readonly` (Transaction Pooler `:6543`, `pgbouncer=true`). Nunca consultar ni modificar datos con el usuario `postgres`, y nada de pruebas de carga contra producción.
- Antes de pushear a `main` (despliega en Vercel): `npm run typecheck`, `npm run lint` y los tests e2e (ver [README.md](README.md)).
