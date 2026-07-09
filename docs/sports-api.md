# API Deportiva

## Variables

```env
SPORTS_API_PROVIDER=demo
SPORTS_API_KEY=
SPORTS_API_BASE_URL=
SPORTS_API_COMPETITION_ID=
AUTO_CONFIRM_RESULTS=false
CRON_SECRET=DEMOCRON
```

## Interfaz esperada

```ts
interface SportsApiProvider {
  getFixturesByDate(date: string): Promise<unknown[]>;
  getFixtureById(fixtureId: string): Promise<unknown>;
  normalizeFixture(raw: unknown): NormalizedFixture;
}
```

## Cron

Endpoint: `GET /api/cron/sync-results`.

Debe validar `CRON_SECRET`, consultar partidos no confirmados, guardar resultados API, confirmar automaticamente solo si `AUTO_CONFIRM_RESULTS=true`, recalcular dashboard y registrar `sync_logs`.

La demo usa datos locales y no expone API keys en frontend.
