import { buildDashboardData } from "./store";
import { fetchEpsnWorldCupResults } from "./espn-results";
import { defaultScoringRules } from "./scoring";
import type {
  AppState,
  Match,
  MatchResult,
  Participant,
  Phase,
  Prediction,
  PredictionMethod,
  PredictionSubmission,
} from "./types";

const SHEET_ID = "1OkowhSrhW751BF8ioQmtRRJjmgXetYr3IDL8LUzbocg";
const RESPONSES_CSV_URL =
  process.env.KINELA_RESPONSES_CSV_URL ??
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

const participantNames = [
  "Freddy",
  "Gabriela",
  "Jean",
  "Juan",
  "Jesús",
  "Diego",
  "Aldo",
  "Javier",
  "Gino",
  "Manuel",
  "Jorge",
  "Daniel",
  "Arthur",
  "José Luis",
  "Marcelo",
  "Anny",
  "Moisés",
  "Alex",
  "Omar",
  "Fernando",
  "Diana",
  "Óscar",
];

const aliases: Record<string, string> = {
  "gabriela orrillo": "Gabriela",
  "daniel fernando vega meza": "Daniel",
  "diego saloma": "Diego",
  "jesus arias ochoa": "Jesús",
  "anny pacheco": "Anny",
  "freddy pacheco": "Freddy",
  "alex": "Alex",
  "alex montalvo": "Alex",
};

const matchConfigs = [
  {
    id: "QF1",
    order: 1,
    teamA: "Francia",
    teamB: "Marruecos",
    startsAt: "2026-07-09T14:00:00-05:00",
    qualifierIndex: 3,
    methodIndex: 4,
    goalsAIndex: 5,
    goalsBIndex: 6,
  },
  {
    id: "QF2",
    order: 2,
    teamA: "España",
    teamB: "Bélgica",
    startsAt: "2026-07-10T14:00:00-05:00",
    qualifierIndex: 7,
    methodIndex: 8,
    goalsAIndex: 9,
    goalsBIndex: 10,
  },
  {
    id: "QF3",
    order: 3,
    teamA: "Noruega",
    teamB: "Inglaterra",
    startsAt: "2026-07-11T10:00:00-05:00",
    qualifierIndex: 11,
    methodIndex: 12,
    goalsAIndex: 13,
    goalsBIndex: 14,
  },
  {
    id: "QF4",
    order: 4,
    teamA: "Argentina",
    teamB: "Suiza",
    startsAt: "2026-07-11T14:00:00-05:00",
    qualifierIndex: 15,
    methodIndex: 16,
    goalsAIndex: 17,
    goalsBIndex: 18,
  },
];

const previousStandings: Record<string, { points: number; exact: number; qualifiers: number; methods: number }> = {
  Jean: { points: 75, exact: 1, qualifiers: 6, methods: 7 },
  Freddy: { points: 70, exact: 0, qualifiers: 6, methods: 7 },
  Jorge: { points: 61, exact: 1, qualifiers: 5, methods: 6 },
  Gabriela: { points: 61, exact: 0, qualifiers: 7, methods: 5 },
  Jesús: { points: 59, exact: 0, qualifiers: 6, methods: 6 },
  Anny: { points: 59, exact: 0, qualifiers: 5, methods: 6 },
  Diego: { points: 56, exact: 0, qualifiers: 6, methods: 5 },
  Aldo: { points: 50, exact: 0, qualifiers: 4, methods: 6 },
  Alex: { points: 49, exact: 0, qualifiers: 7, methods: 3 },
  Javier: { points: 44, exact: 0, qualifiers: 4, methods: 5 },
  Gino: { points: 42, exact: 0, qualifiers: 6, methods: 4 },
  Manuel: { points: 39, exact: 1, qualifiers: 5, methods: 2 },
  Juan: { points: 36, exact: 0, qualifiers: 5, methods: 3 },
  Arthur: { points: 35, exact: 0, qualifiers: 5, methods: 4 },
  Óscar: { points: 32, exact: 0, qualifiers: 5, methods: 2 },
  Daniel: { points: 32, exact: 0, qualifiers: 2, methods: 3 },
  Moisés: { points: 27, exact: 0, qualifiers: 5, methods: 1 },
  Fernando: { points: 25, exact: 0, qualifiers: 3, methods: 3 },
  Diana: { points: 25, exact: 0, qualifiers: 3, methods: 2 },
  "José Luis": { points: 0, exact: 0, qualifiers: 0, methods: 0 },
  Marcelo: { points: 0, exact: 0, qualifiers: 0, methods: 0 },
  Omar: { points: 0, exact: 0, qualifiers: 0, methods: 0 },
};

const previousMatches = [
  { match_id: "O1", label: "Canadá 0-3 Marruecos", qualifier: "Marruecos", method: "90 minutos" as const },
  { match_id: "O2", label: "Paraguay 0-1 Francia", qualifier: "Francia", method: "90 minutos" as const },
  { match_id: "O3", label: "Brasil 1-2 Noruega", qualifier: "Noruega", method: "90 minutos" as const },
  { match_id: "O4", label: "México 2-3 Inglaterra", qualifier: "Inglaterra", method: "90 minutos" as const },
  { match_id: "O5", label: "Estados Unidos 1-4 Bélgica", qualifier: "Bélgica", method: "90 minutos" as const },
  { match_id: "O6", label: "Portugal 0-1 España", qualifier: "España", method: "90 minutos" as const },
  { match_id: "O7", label: "Suiza 0-0 Colombia", qualifier: "Suiza", method: "Penales" as const },
  { match_id: "O8", label: "Argentina 3-2 Egipto", qualifier: "Argentina", method: "90 minutos" as const },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonicalParticipant(rawName: string) {
  const normalized = normalizeText(rawName);
  if (aliases[normalized]) return aliases[normalized];

  const exact = participantNames.find((name) => normalizeText(name) === normalized);
  if (exact) return exact;

  const contained = participantNames.find((name) => {
    const token = normalizeText(name);
    return normalized.split(" ").includes(token) || normalized.includes(token);
  });

  return contained ?? rawName.trim();
}

function canonicalTeam(rawValue: string, teamA: string, teamB: string) {
  const normalized = normalizeText(rawValue);
  if (normalized.includes(normalizeText(teamA))) return teamA;
  if (normalized.includes(normalizeText(teamB))) return teamB;
  return rawValue.trim();
}

function normalizeMethod(rawValue: string): PredictionMethod {
  const normalized = normalizeText(rawValue);
  if (normalized.includes("penal")) return "Penales";
  if (normalized.includes("suplement") || normalized.includes("prorroga") || normalized.includes("alargue")) {
    return "Suplementario";
  }
  return "90 minutos";
}

function parseScore(rawValue: string | undefined) {
  const normalized = (rawValue ?? "").replace(/[^\d-]/g, "");
  const value = Number.parseInt(normalized, 10);
  return Number.isFinite(value) ? value : 0;
}

function parseTimestamp(rawValue: string | undefined, fallbackIndex: number) {
  const match = (rawValue ?? "").match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
  );

  if (!match) return new Date(Date.UTC(2026, 6, 8, 12, fallbackIndex, 0)).toISOString();

  const [, day, month, year, hour, minute, second] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}-05:00`;
}

async function fetchCsv(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "kinela-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo leer Google Sheets: ${response.status}`);
  }

  return response.text();
}

function buildParticipants(extraNames: string[]): Participant[] {
  const uniqueNames = new Set([...participantNames, ...extraNames.filter(Boolean)]);
  return Array.from(uniqueNames).map((name, index) => ({
    id: `P${String(index + 1).padStart(3, "0")}`,
    name,
    code: `${normalizeText(name).replace(/\s+/g, "").toUpperCase()}2026`,
    active: true,
    role: "player",
  }));
}

function phaseStatus(results: MatchResult[]): Phase["status"] {
  const closeAt = new Date("2026-07-09T10:00:00-05:00").getTime();
  if (Date.now() <= closeAt) return "open";
  if (results.some((result) => result.confirmed)) return "finished";
  return "closed";
}

function buildMatches(resultsById: Map<string, MatchResult>): Match[] {
  return matchConfigs.map((config) => ({
    id: config.id,
    phase_id: "PH002",
    order: config.order,
    team_a: config.teamA,
    team_b: config.teamB,
    starts_at: config.startsAt,
    api_provider: "google-sheet",
    api_fixture_id: config.id,
    status: resultsById.get(config.id)?.confirmed ? "confirmed" : "scheduled",
  }));
}

function parseSubmissions(rows: string[][], participants: Participant[]) {
  const participantByName = new Map(participants.map((participant) => [participant.name, participant]));
  const latestRows = new Map<string, { row: string[]; submittedAt: string; timestamp: number }>();

  rows.slice(1).forEach((row, index) => {
    const name = canonicalParticipant(row[2] ?? "");
    if (!name) return;

    const submittedAt = parseTimestamp(row[0], index);
    const timestamp = new Date(submittedAt).getTime();
    const current = latestRows.get(name);
    if (!current || timestamp >= current.timestamp) {
      latestRows.set(name, { row, submittedAt, timestamp });
    }
  });

  const predictionSubmissions: PredictionSubmission[] = [];
  const predictions: Prediction[] = [];

  Array.from(latestRows.entries()).forEach(([participantName, entry], submissionIndex) => {
    const participant = participantByName.get(participantName);
    if (!participant) return;

    const submissionId = `S${String(submissionIndex + 1).padStart(3, "0")}`;
    predictionSubmissions.push({
      id: submissionId,
      participant_id: participant.id,
      phase_id: "PH002",
      submitted_at: entry.submittedAt,
      validation_status: "valid",
      notes: "Google Forms",
      is_counted: true,
    });

    matchConfigs.forEach((config) => {
      const goalsA = parseScore(entry.row[config.goalsAIndex]);
      const goalsB = parseScore(entry.row[config.goalsBIndex]);

      predictions.push({
        id: `PR${String(predictions.length + 1).padStart(4, "0")}`,
        submission_id: submissionId,
        participant_id: participant.id,
        phase_id: "PH002",
        match_id: config.id,
        team_a: config.teamA,
        team_b: config.teamB,
        goals_a_90: goalsA,
        goals_b_90: goalsB,
        predicted_qualifier: canonicalTeam(entry.row[config.qualifierIndex] ?? "", config.teamA, config.teamB),
        predicted_method: normalizeMethod(entry.row[config.methodIndex] ?? ""),
        is_valid: true,
      });
    });
  });

  return { predictionSubmissions, predictions };
}

export async function buildGoogleSheetDashboardData() {
  const [responsesText, results] = await Promise.all([
    fetchCsv(RESPONSES_CSV_URL),
    fetchEpsnWorldCupResults(matchConfigs),
  ]);

  const responseRows = parseCsv(responsesText);
  const canonicalNames = responseRows.slice(1).map((row) => canonicalParticipant(row[2] ?? ""));
  const resultsById = new Map(results.filter((result) => result.confirmed).map((result) => [result.match_id, result]));
  const participants = buildParticipants(canonicalNames);
  const matches = buildMatches(resultsById);
  const { predictionSubmissions, predictions } = parseSubmissions(responseRows, participants);

  const phase: Phase = {
    id: "PH002",
    name: "Cuartos de final",
    slug: "cuartos",
    status: phaseStatus(results),
    opens_at: "2026-07-08T19:00:00-05:00",
    closes_at: "2026-07-09T10:00:00-05:00",
    order: 2,
  };

  const state: AppState = {
    participants,
    phases: [phase],
    matches,
    predictionSubmissions,
    predictions,
    results,
    scoringRules: defaultScoringRules,
    syncLogs: [],
  };

  const dashboard = buildDashboardData(state);

  dashboard.standings.forEach((row) => {
    const base = previousStandings[row.participant_name] ?? {
      points: 0,
      exact: 0,
      qualifiers: 0,
      methods: 0,
    };
    row.base_points = base.points;
    row.phase_points = row.points;
    row.points += base.points;
    row.exact_scores += base.exact;
    row.qualifiers += base.qualifiers;
    row.methods += base.methods;
  });

  dashboard.standings.sort((a, b) => {
    return (
      b.points - a.points ||
      b.exact_scores - a.exact_scores ||
      b.qualifiers - a.qualifiers ||
      b.methods - a.methods ||
      a.unanswered - b.unanswered ||
      a.participant_name.localeCompare(b.participant_name)
    );
  });

  dashboard.standings.forEach((row, index) => {
    row.rank = index + 1;
  });

  dashboard.metrics.top_exact_scores = dashboard.standings
    .filter((row) => row.exact_scores > 0)
    .slice()
    .sort((a, b) => b.exact_scores - a.exact_scores || b.points - a.points)
    .slice(0, 5);
  dashboard.metrics.top_qualifiers = dashboard.standings
    .filter((row) => row.qualifiers > 0)
    .slice()
    .sort((a, b) => b.qualifiers - a.qualifiers || b.points - a.points)
    .slice(0, 5);
  dashboard.metrics.biggest_riser = dashboard.standings[0];

  return {
    ...dashboard,
    title: "Kinela Mundialista - Cuartos de final",
    last_updated: new Date().toISOString(),
    previousMatches,
  };
}
