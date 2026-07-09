# Kinela Mundialista

Aplicacion web demo para administrar una kinela mundialista desde octavos de final en adelante. La version actual corre localmente con datos demo, formulario propio, panel admin, motor de puntajes, exportacion Excel y pruebas.

## Demo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

Rutas principales:

- `/`: dashboard publico.
- `/predict`: formulario de predicciones.
- `/admin`: panel admin.
- `/admin/phases`: abrir o cerrar fases.
- `/admin/results`: confirmar resultados.
- `/admin/scoring`: editar reglas de puntaje.
- `/admin/export`: descargar Excel.

## Credenciales demo

- Clave admin: `DEMOADMIN`
- Cron demo: `DEMOCRON`
- Codigo de participante: nombre sin tildes ni espacios + `2026`

Ejemplos:

- Freddy: `FREDDY2026`
- Jean: `JEAN2026`
- José Luis: `JOSELUIS2026`
- Óscar: `OSCAR2026`

## Participantes seed

El seed incluye 22 participantes con IDs `P001` a `P022`: Freddy, Gabriela, Jean, Juan, Jesús, Diego, Aldo, Javier, Gino, Manuel, Jorge, Daniel, Arthur, José Luis, Marcelo, Anny, Moisés, Alex, Omar, Fernando, Diana y Óscar.

## Comandos

```bash
npm run dev
npm run build
npm run test
npm run db:migrate
npm run db:seed
npm run sync:demo
npm run sync:results
npm run export:excel
npm run export:google-sheet
```

`npm run export:excel` genera `exports/kinela-mundialista-demo.xlsx`.
`npm run export:google-sheet` lee respuestas desde Google Sheets, resultados desde ESPN y genera `docs/kinela_actualizada.xlsx`.

## Variables de entorno

```env
ADMIN_KEY=DEMOADMIN
CRON_SECRET=DEMOCRON
SPORTS_API_PROVIDER=demo
SPORTS_API_KEY=
SPORTS_API_BASE_URL=
SPORTS_API_COMPETITION_ID=
AUTO_CONFIRM_RESULTS=false
FORM_INPUT_MODE=custom
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

## Supabase/Postgres

La demo usa memoria local para funcionar sin credenciales externas. La fase siguiente es mover las entidades de `src/lib/types.ts` a tablas Postgres y reemplazar `src/lib/store.ts` por Prisma o Drizzle.

Tablas previstas: `participants`, `phases`, `matches`, `prediction_submissions`, `predictions`, `match_results`, `scoring_rules` y `sync_logs`.

## API deportiva

La version publica usa ESPN FIFA World Cup como fuente automatica de resultados, sin API key. La demo local mantiene `demoFixtures` para pruebas.

## Exportacion Excel

El endpoint `/api/admin/export-excel` genera un `.xlsx` con hojas: Inicio, Participantes, Fases, Partidos, Predicciones, Resultados, Calculo_Puntos, Posiciones y Metricas.

La version publica descarga `docs/kinela_actualizada.xlsx`, que se regenera con GitHub Actions cada 10 minutos desde Google Sheets y ESPN. Ver `docs/excel-automatico.md`.

## Operacion diaria

1. Abrir fase en `/admin/phases`.
2. Participantes envian predicciones en `/predict`.
3. Cerrar fase antes del primer partido.
4. Esperar la sincronizacion automatica de ESPN despues de cada partido.
5. Revisar dashboard publico.
6. Exportar Excel desde `/admin/export`.
