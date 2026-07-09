# Arquitectura

## Stack actual

- Frontend: Next.js App Router, React, TypeScript y Tailwind CSS.
- Backend: Route handlers de Next.js.
- Validacion: Zod.
- Calculo: funciones puras en `src/lib/scoring.ts`.
- Persistencia demo: estado en memoria inicializado desde `src/lib/demo-data.ts`.
- Exportacion: `xlsx` desde `src/lib/export-excel.ts`.

## Modulos

- `src/lib/types.ts`: contratos del dominio.
- `src/lib/demo-data.ts`: seed local.
- `src/lib/store.ts`: operaciones de demo, validaciones de negocio y dashboard.
- `src/components`: UI publica, formulario y admin.
- `src/app/api`: endpoints publicos, admin y cron.

## Fase siguiente

Reemplazar el store en memoria por Postgres/Supabase con Prisma o Drizzle, manteniendo la misma forma de datos para no reescribir pantallas ni motor.
