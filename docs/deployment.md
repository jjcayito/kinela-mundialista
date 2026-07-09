# Despliegue

## Vercel

1. Configurar variables de entorno.
2. Conectar Postgres/Supabase en fase productiva.
3. Configurar Vercel Cron hacia `/api/cron/sync-results`.
4. Definir dominio propio.

## VPS

1. Ejecutar build con `npm run build`.
2. Servir con `npm run start`.
3. Configurar proxy HTTPS.
4. Programar cron externo para llamar `/api/cron/sync-results`.

## Seguridad

- No exponer `SPORTS_API_KEY`.
- Cambiar `ADMIN_KEY` y `CRON_SECRET`.
- Activar rate limiting en endpoints sensibles.
- En Supabase, preparar RLS por participante y rol admin.
