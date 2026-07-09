# API Deportiva

## Variables

```env
SPORTS_API_PROVIDER=espn
SPORTS_API_KEY=
SPORTS_API_BASE_URL=https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
SPORTS_API_COMPETITION_ID=fifa.world
AUTO_CONFIRM_RESULTS=false
CRON_SECRET=DEMOCRON
```

La version publica no requiere `SPORTS_API_KEY`: toma los resultados desde el marcador publico de ESPN para FIFA World Cup.

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

La demo original usa datos locales. La automatizacion publica usa ESPN desde GitHub Actions y no expone claves en frontend.
