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
import { defaultScoringRules } from "./scoring";

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

function validationCode(name: string): string {
  return `${name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "")
    .toUpperCase()}2026`;
}

export const demoParticipants: Participant[] = participantNames.map((name, index) => ({
  id: `P${String(index + 1).padStart(3, "0")}`,
  name,
  code: validationCode(name),
  active: true,
  role: "player",
}));

export const demoPhases: Phase[] = [
  {
    id: "PH001",
    name: "Octavos",
    slug: "octavos",
    status: "open",
    opens_at: "2026-07-01T09:00:00-05:00",
    closes_at: "2026-07-04T09:00:00-05:00",
    order: 1,
  },
  {
    id: "PH002",
    name: "Cuartos",
    slug: "cuartos",
    status: "draft",
    opens_at: "2026-07-05T09:00:00-05:00",
    closes_at: "2026-07-08T09:00:00-05:00",
    order: 2,
  },
  {
    id: "PH003",
    name: "Semifinales",
    slug: "semifinales",
    status: "draft",
    opens_at: "2026-07-09T09:00:00-05:00",
    closes_at: "2026-07-12T09:00:00-05:00",
    order: 3,
  },
  {
    id: "PH004",
    name: "Tercer puesto",
    slug: "tercer-puesto",
    status: "draft",
    opens_at: "2026-07-13T09:00:00-05:00",
    closes_at: "2026-07-15T09:00:00-05:00",
    order: 4,
  },
  {
    id: "PH005",
    name: "Final",
    slug: "final",
    status: "draft",
    opens_at: "2026-07-13T09:00:00-05:00",
    closes_at: "2026-07-16T09:00:00-05:00",
    order: 5,
  },
];

export const demoMatches: Match[] = [
  {
    id: "M001",
    phase_id: "PH001",
    order: 1,
    team_a: "Brasil",
    team_b: "Colombia",
    starts_at: "2026-07-04T12:00:00-05:00",
    venue: "Ciudad de Mexico",
    api_provider: "demo",
    api_fixture_id: "DEMO-M001",
    status: "confirmed",
  },
  {
    id: "M002",
    phase_id: "PH001",
    order: 2,
    team_a: "España",
    team_b: "Portugal",
    starts_at: "2026-07-04T15:00:00-05:00",
    venue: "Guadalajara",
    api_provider: "demo",
    api_fixture_id: "DEMO-M002",
    status: "confirmed",
  },
  {
    id: "M003",
    phase_id: "PH001",
    order: 3,
    team_a: "Francia",
    team_b: "Croacia",
    starts_at: "2026-07-05T12:00:00-05:00",
    venue: "Toronto",
    api_provider: "demo",
    api_fixture_id: "DEMO-M003",
    status: "confirmed",
  },
  {
    id: "M004",
    phase_id: "PH001",
    order: 4,
    team_a: "Argentina",
    team_b: "Uruguay",
    starts_at: "2026-07-05T15:00:00-05:00",
    venue: "Miami",
    api_provider: "demo",
    api_fixture_id: "DEMO-M004",
    status: "confirmed",
  },
  {
    id: "M005",
    phase_id: "PH001",
    order: 5,
    team_a: "Alemania",
    team_b: "Marruecos",
    starts_at: "2026-07-06T12:00:00-05:00",
    venue: "Dallas",
    api_provider: "demo",
    api_fixture_id: "DEMO-M005",
    status: "finished",
  },
  {
    id: "M006",
    phase_id: "PH001",
    order: 6,
    team_a: "Inglaterra",
    team_b: "Estados Unidos",
    starts_at: "2026-07-06T15:00:00-05:00",
    venue: "Los Angeles",
    api_provider: "demo",
    api_fixture_id: "DEMO-M006",
    status: "scheduled",
  },
  {
    id: "M007",
    phase_id: "PH001",
    order: 7,
    team_a: "Países Bajos",
    team_b: "Italia",
    starts_at: "2026-07-07T12:00:00-05:00",
    venue: "Vancouver",
    api_provider: "demo",
    api_fixture_id: "DEMO-M007",
    status: "scheduled",
  },
  {
    id: "M008",
    phase_id: "PH001",
    order: 8,
    team_a: "México",
    team_b: "Japón",
    starts_at: "2026-07-07T15:00:00-05:00",
    venue: "Monterrey",
    api_provider: "demo",
    api_fixture_id: "DEMO-M008",
    status: "scheduled",
  },
];

export const demoResults: MatchResult[] = [
  {
    id: "R001",
    match_id: "M001",
    source: "admin",
    goals_a_90: 2,
    goals_b_90: 0,
    qualifier: "Brasil",
    method: "90 minutos",
    confirmed: true,
    confirmed_by: "admin",
    confirmed_at: "2026-07-04T15:05:00-05:00",
  },
  {
    id: "R002",
    match_id: "M002",
    source: "admin",
    goals_a_90: 1,
    goals_b_90: 1,
    penalties_a: 4,
    penalties_b: 5,
    qualifier: "Portugal",
    method: "Penales",
    confirmed: true,
    confirmed_by: "admin",
    confirmed_at: "2026-07-04T18:20:00-05:00",
  },
  {
    id: "R003",
    match_id: "M003",
    source: "admin",
    goals_a_90: 3,
    goals_b_90: 1,
    qualifier: "Francia",
    method: "90 minutos",
    confirmed: true,
    confirmed_by: "admin",
    confirmed_at: "2026-07-05T14:10:00-05:00",
  },
  {
    id: "R004",
    match_id: "M004",
    source: "admin",
    goals_a_90: 0,
    goals_b_90: 0,
    penalties_a: 5,
    penalties_b: 4,
    qualifier: "Argentina",
    method: "Penales",
    confirmed: true,
    confirmed_by: "admin",
    confirmed_at: "2026-07-05T18:30:00-05:00",
  },
  {
    id: "R005",
    match_id: "M005",
    source: "api",
    goals_a_90: 2,
    goals_b_90: 2,
    goals_a_extra: 3,
    goals_b_extra: 2,
    qualifier: "Alemania",
    method: "Suplementario",
    confirmed: false,
    raw_payload_json: { provider: "demo", fixture: "DEMO-M005" },
  },
];

const scoreTemplates = [
  [2, 0],
  [1, 1],
  [3, 1],
  [0, 0],
  [2, 2],
  [2, 1],
  [1, 0],
  [1, 1],
  [1, 0],
  [2, 1],
  [2, 2],
  [1, 1],
] as const;

function predictionMethodForScore(goalsA: number, goalsB: number, seed: number): PredictionMethod {
  if (goalsA !== goalsB) return "90 minutos";
  return seed % 2 === 0 ? "Penales" : "Suplementario";
}

function qualifierForPrediction(match: Match, goalsA: number, goalsB: number, seed: number): string {
  if (goalsA > goalsB) return match.team_a;
  if (goalsB > goalsA) return match.team_b;
  return seed % 2 === 0 ? match.team_a : match.team_b;
}

function buildDemoPredictions(): {
  predictionSubmissions: PredictionSubmission[];
  predictions: Prediction[];
} {
  const predictionSubmissions: PredictionSubmission[] = [];
  const predictions: Prediction[] = [];
  const phase = demoPhases[0];

  demoParticipants.forEach((participant, participantIndex) => {
    const submissionId = `S${String(participantIndex + 1).padStart(3, "0")}`;
    predictionSubmissions.push({
      id: submissionId,
      participant_id: participant.id,
      phase_id: phase.id,
      submitted_at: `2026-07-03T${String(9 + (participantIndex % 9)).padStart(2, "0")}:15:00-05:00`,
      validation_status: "valid",
      notes: "Seed demo local",
      is_counted: true,
    });

    demoMatches.forEach((match, matchIndex) => {
      const template = scoreTemplates[(participantIndex + matchIndex) % scoreTemplates.length];
      const goalsA = template[0];
      const goalsB = template[1];
      const seed = participantIndex + matchIndex;

      predictions.push({
        id: `PR${String(predictions.length + 1).padStart(4, "0")}`,
        submission_id: submissionId,
        participant_id: participant.id,
        phase_id: phase.id,
        match_id: match.id,
        team_a: match.team_a,
        team_b: match.team_b,
        goals_a_90: goalsA,
        goals_b_90: goalsB,
        predicted_qualifier: qualifierForPrediction(match, goalsA, goalsB, seed),
        predicted_method: predictionMethodForScore(goalsA, goalsB, seed),
        is_valid: true,
      });
    });
  });

  return { predictionSubmissions, predictions };
}

export const demoFixtures = [
  {
    fixture_id: "DEMO-M005",
    status: "finished",
    goals_a_90: 2,
    goals_b_90: 2,
    goals_a_extra: 3,
    goals_b_extra: 2,
    qualifier: "Alemania",
    method: "Suplementario",
  },
];

export function createDemoState(): AppState {
  const { predictionSubmissions, predictions } = buildDemoPredictions();

  return {
    participants: structuredClone(demoParticipants),
    phases: structuredClone(demoPhases),
    matches: structuredClone(demoMatches),
    predictionSubmissions,
    predictions,
    results: structuredClone(demoResults),
    scoringRules: structuredClone(defaultScoringRules),
    syncLogs: [
      {
        id: "L001",
        ran_at: "2026-07-05T18:35:00-05:00",
        provider: "demo",
        status: "success",
        message: "Datos demo iniciales cargados",
        touched_matches: 5,
      },
    ],
  };
}
