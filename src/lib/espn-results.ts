import type { MatchResult, PredictionMethod } from "./types";

export interface EpsnMatchConfig {
  id: string;
  teamA: string;
  teamB: string;
}

const ESPN_SCOREBOARD_URL =
  process.env.KINELA_ESPN_SCOREBOARD_URL ??
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_DATES = process.env.KINELA_ESPN_DATES ?? "20260709-20260716";
const ESPN_LIMIT = process.env.KINELA_ESPN_LIMIT ?? "120";

const teamAliases: Record<string, string> = {
  argentina: "Argentina",
  belgium: "Bélgica",
  brazil: "Brasil",
  canada: "Canadá",
  colombia: "Colombia",
  egypt: "Egipto",
  england: "Inglaterra",
  france: "Francia",
  mexico: "México",
  morocco: "Marruecos",
  norway: "Noruega",
  paraguay: "Paraguay",
  portugal: "Portugal",
  spain: "España",
  switzerland: "Suiza",
  "united states": "Estados Unidos",
};

type EpsnCompetitor = {
  score?: string | number;
  winner?: boolean;
  team?: {
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
  };
};

type EpsnEvent = {
  id?: string;
  status?: {
    type?: {
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: Array<{
    competitors?: EpsnCompetitor[];
    status?: {
      type?: {
        completed?: boolean;
        description?: string;
        detail?: string;
        shortDetail?: string;
      };
    };
  }>;
};

function normalizeText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function localizedTeamName(value: string | undefined) {
  const normalized = normalizeText(value);
  return teamAliases[normalized] ?? (value ?? "").trim();
}

function sameTeam(a: string | undefined, b: string | undefined) {
  return normalizeText(a) === normalizeText(b);
}

function parseScore(value: string | number | undefined) {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusText(event: EpsnEvent) {
  const status = event.competitions?.[0]?.status?.type ?? event.status?.type;
  return [status?.detail, status?.shortDetail, status?.description].filter(Boolean).join(" ");
}

function methodFromStatus(event: EpsnEvent): PredictionMethod {
  const normalized = normalizeText(statusText(event));
  if (normalized.includes("pen")) return "Penales";
  if (normalized.includes("aet") || normalized.includes("extra")) return "Suplementario";
  return "90 minutos";
}

function completed(event: EpsnEvent) {
  return Boolean(event.competitions?.[0]?.status?.type?.completed ?? event.status?.type?.completed);
}

function competitorsForEvent(event: EpsnEvent) {
  return (event.competitions?.[0]?.competitors ?? []).map((competitor) => ({
    name: localizedTeamName(
      competitor.team?.displayName ?? competitor.team?.shortDisplayName ?? competitor.team?.name,
    ),
    score: parseScore(competitor.score),
    winner: Boolean(competitor.winner),
  }));
}

function eventMatchesConfig(event: EpsnEvent, config: EpsnMatchConfig) {
  const names = competitorsForEvent(event).map((competitor) => competitor.name);
  return names.some((name) => sameTeam(name, config.teamA)) && names.some((name) => sameTeam(name, config.teamB));
}

export function parseEpsnWorldCupResults(payload: unknown, matchConfigs: EpsnMatchConfig[]): MatchResult[] {
  const events = Array.isArray((payload as { events?: unknown[] }).events)
    ? ((payload as { events: EpsnEvent[] }).events ?? [])
    : [];

  return matchConfigs.flatMap((config, index): MatchResult[] => {
    const event = events.find((item) => eventMatchesConfig(item, config));
    if (!event || !completed(event)) return [];

    const competitors = competitorsForEvent(event);
    const teamA = competitors.find((competitor) => sameTeam(competitor.name, config.teamA));
    const teamB = competitors.find((competitor) => sameTeam(competitor.name, config.teamB));
    const winner = competitors.find((competitor) => competitor.winner);

    if (!teamA || !teamB || !winner) return [];

    return [
      {
        id: `ESPN-${event.id ?? config.id}-${index + 1}`,
        match_id: config.id,
        source: "api",
        goals_a_90: teamA.score,
        goals_b_90: teamB.score,
        qualifier: sameTeam(winner.name, config.teamA) ? config.teamA : config.teamB,
        method: methodFromStatus(event),
        confirmed: true,
        confirmed_by: "ESPN",
        confirmed_at: new Date().toISOString(),
        raw_payload_json: {
          provider: "espn",
          event_id: event.id,
          status: statusText(event),
        },
      },
    ];
  });
}

export async function fetchEpsnWorldCupResults(matchConfigs: EpsnMatchConfig[]) {
  const url = new URL(ESPN_SCOREBOARD_URL);
  url.searchParams.set("limit", ESPN_LIMIT);
  url.searchParams.set("dates", ESPN_DATES);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "kinela-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo leer ESPN: ${response.status}`);
  }

  return parseEpsnWorldCupResults(await response.json(), matchConfigs);
}
