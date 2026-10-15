# Scripts de análisis de base de datos (Fase 4)

Reproducen las consultas del sitio contra un **Postgres local (PGlite)** con datos sintéticos. Nunca se conectan a producción: cada script aborta si la URL no apunta a `127.0.0.1`.

1. `npm i @electric-sql/pglite @electric-sql/pglite-socket` en esta carpeta.
2. Generar el DDL: `prisma migrate diff --from-empty --to-schema-datamodel ../../prisma/schema.prisma --script > schema.sql`.
3. `node server.mjs` aplica `schema.sql` + `seed.sql` y escucha en `127.0.0.1:55432`.
4. `node replay.js` replica las llamadas Prisma del sitio, captura el SQL en `queries.json` y mide tiempos y payload.
5. `node explain.js before|after` corre EXPLAIN ANALYZE sin y con índices propuestos.
6. `node scale.js` hace la prueba con una organización de 20.000 propiedades.
7. `node checks.js` prueba comodines, favoritos con muchos IDs y payload del DTO.

Para correrlo contra una copia real (dump o branch de Supabase), cambiar la URL y quitar la guarda de `127.0.0.1` con cuidado.
