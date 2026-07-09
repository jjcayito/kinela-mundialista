import { buildDashboardData } from "./store";
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
const RESULTS_CSV_URL =
  process.env.KINELA_RESULTS_CSV_URL ??
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=RESULTADOS`;

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

function findHeaderIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(normalizeText(header)));
}

function matchIdFromResult(value: string, teamA: string, teamB: string) {
  const normalized = normalizeText(value);
  const byId = matchConfigs.find((config) => normalizeText(config.id) === normalized);
  if (byId) return byId.id;

  const byTeams = matchConfigs.find((config) => {
    const text = `${normalizeText(config.teamA)} ${normalizeText(config.teamB)}`;
    return (
      normalized.includes(normalizeText(config.teamA)) &&
      normalized.includes(normalizeText(config.teamB))
    ) || text === `${normalizeText(teamA)} ${normalizeText(teamB)}`;
  });

  return byTeams?.id;
}

function parseResults(text: string): MatchResult[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const matchIndex = findHeaderIndex(headers, ["partido", "id"]);
  const goalsAIndex = findHeaderIndex(headers, ["marcador a", "goles a", "score a"]);
  const goalsBIndex = findHeaderIndex(headers, ["marcador b", "goles b", "score b"]);
  const methodIndex = findHeaderIndex(headers, ["metodo oficial", "metodo"]);
  const qualifierIndex = findHeaderIndex(headers, ["clasificado oficial", "clasificado"]);
  const statusIndex = findHeaderIndex(headers, ["estado", "status"]);
  const penaltiesAIndex = findHeaderIndex(headers, ["penales a", "penales equipo a"]);
  const penaltiesBIndex = findHeaderIndex(headers, ["penales b", "penales equipo b"]);

  if ([matchIndex, goalsAIndex, goalsBIndex, methodIndex, qualifierIndex].some((index) => index < 0)) {
    return [];
  }

  return rows.slice(1).flatMap((row, index): MatchResult[] => {
    const config =
      matchConfigs.find((item) => item.id === row[matchIndex]) ??
      matchConfigs.find((item) => matchIdFromResult(row[matchIndex] ?? "", item.teamA, item.teamB) === item.id);

    if (!config) return [];

    const status = normalizeText(row[statusIndex] ?? "finalizado");
    const confirmed = ["finalizado", "confirmado", "ok", "finished", "confirmed"].includes(status);
    const method = normalizeMethod(row[methodIndex] ?? "");

    return [
      {
        id: `R${String(index + 1).padStart(3, "0")}`,
        match_id: config.id,
        source: "manual",
        goals_a_90: parseScore(row[goalsAIndex]),
        goals_b_90: parseScore(row[goalsBIndex]),
        penalties_a: penaltiesAIndex >= 0 ? parseScore(row[penaltiesAIndex]) : undefined,
        penalties_b: penaltiesBIndex >= 0 ? parseScore(row[penaltiesBIndex]) : undefined,
        qualifier: canonicalTeam(row[qualifierIndex] ?? "", config.teamA, config.teamB),
        method,
        confirmed,
        confirmed_by: confirmed ? "Google Sheets" : undefined,
        confirmed_at: confirmed ? new Date().toISOString() : undefined,
      },
    ];
  });
}

export async function buildGoogleSheetDashboardData() {
  const [responsesText, resultsText] = await Promise.all([
    fetchCsv(RESPONSES_CSV_URL),
    fetchCsv(RESULTS_CSV_URL).catch(() => ""),
  ]);

  const responseRows = parseCsv(responsesText);
  const canonicalNames = responseRows.slice(1).map((row) => canonicalParticipant(row[2] ?? ""));
  const results = resultsText ? parseResults(resultsText) : [];
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

  return {
    ...buildDashboardData(state),
    title: "Kinela Mundialista - Cuartos de final",
    last_updated: new Date().toISOString(),
  };
}
