import { createDemoState, demoFixtures } from "./demo-data";
import { calculateMatchScore, outcomeFromScore } from "./scoring";
import type {
  AppState,
  DashboardData,
  Match,
  MatchInsight,
  MatchResult,
  ParticipantMatchView,
  ParticipantView,
  Prediction,
  PredictionMethod,
  StandingRow,
} from "./types";
import {
  isMethodValidForScore,
  matchResultSchema,
  phaseStatusUpdateSchema,
  predictionSubmissionSchema,
  scoringUpdateSchema,
} from "./validation";

declare global {
  var __kinelaState: AppState | undefined;
}

export class KinelaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "KinelaError";
    this.status = status;
  }
}

export function getState(): AppState {
  if (!globalThis.__kinelaState) {
    globalThis.__kinelaState = createDemoState();
  }

  return globalThis.__kinelaState;
}

export function resetStateForTests(): AppState {
  globalThis.__kinelaState = createDemoState();
  return globalThis.__kinelaState;
}

export function currentPhase(state = getState()) {
  return (
    state.phases.find((phase) => phase.status === "open") ??
    state.phases.find((phase) => phase.status === "closed") ??
    state.phases[0]
  );
}

export function assertAdminKey(key: string | null | undefined) {
  const expected = process.env.ADMIN_KEY || "DEMOADMIN";
  if (key !== expected) {
    throw new KinelaError("Clave admin invalida", 401);
  }
}

function nextId(prefix: string, count: number, size = 4) {
  return `${prefix}${String(count + 1).padStart(size, "0")}`;
}

function countedSubmissions(state: AppState) {
  return state.predictionSubmissions.filter(
    (submission) => submission.validation_status === "valid" && submission.is_counted,
  );
}

function countedPredictions(state: AppState) {
  const countedIds = new Set(countedSubmissions(state).map((submission) => submission.id));
  return state.predictions.filter((prediction) => countedIds.has(prediction.submission_id));
}

function confirmedResultsByMatch(state: AppState) {
  return new Map(
    state.results
      .filter((result) => result.confirmed)
      .map((result) => [result.match_id, result] as const),
  );
}

function resultForDisplay(state: AppState, matchId: string) {
  return (
    state.results.find((result) => result.match_id === matchId && result.confirmed) ??
    state.results.find((result) => result.match_id === matchId)
  );
}

function resultLabel(result: MatchResult | undefined) {
  if (!result) return "Pendiente";
  const suffix = result.confirmed ? "" : " sin confirmar";
  return `${result.goals_a_90}-${result.goals_b_90}${suffix}`;
}

function validateQualifier(match: Match, qualifier: string) {
  if (qualifier !== match.team_a && qualifier !== match.team_b) {
    throw new KinelaError(`El clasificado de ${match.team_a} vs ${match.team_b} no pertenece al partido`);
  }
}

export function submitPredictionSubmission(input: unknown, state = getState()) {
  const parsed = predictionSubmissionSchema.parse(input);
  const participant = state.participants.find((item) => item.id === parsed.participant_id);
  const phase = state.phases.find((item) => item.id === parsed.phase_id);

  if (!participant?.active) throw new KinelaError("Participante inactivo o inexistente");
  if (participant.code.toUpperCase() !== parsed.code.trim().toUpperCase()) {
    throw new KinelaError("Codigo de validacion incorrecto", 401);
  }
  if (!phase || phase.status !== "open") {
    throw new KinelaError("La fase no esta abierta para predicciones");
  }

  const phaseMatches = state.matches.filter((match) => match.phase_id === phase.id);
  const phaseMatchIds = new Set(phaseMatches.map((match) => match.id));

  if (parsed.predictions.length !== phaseMatches.length) {
    throw new KinelaError("La submission debe incluir todos los partidos de la fase");
  }

  const normalizedPredictions = parsed.predictions.map((predictionInput) => {
    const match = state.matches.find((item) => item.id === predictionInput.match_id);
    if (!match || !phaseMatchIds.has(match.id)) {
      throw new KinelaError("Uno de los partidos no pertenece a la fase seleccionada");
    }

    validateQualifier(match, predictionInput.predicted_qualifier);

    if (
      !isMethodValidForScore(
        predictionInput.goals_a_90,
        predictionInput.goals_b_90,
        predictionInput.predicted_method,
      )
    ) {
      throw new KinelaError(
        predictionInput.goals_a_90 === predictionInput.goals_b_90
          ? "Si hay empate en 90 minutos, la via debe ser Suplementario o Penales"
          : "Si hay ganador en 90 minutos, la via debe ser 90 minutos",
      );
    }

    return { ...predictionInput, match };
  });

  state.predictionSubmissions.forEach((submission) => {
    if (submission.participant_id === participant.id && submission.phase_id === phase.id) {
      submission.is_counted = false;
    }
  });

  const submissionId = nextId("S", state.predictionSubmissions.length, 4);
  state.predictionSubmissions.push({
    id: submissionId,
    participant_id: participant.id,
    phase_id: phase.id,
    submitted_at: new Date().toISOString(),
    validation_status: "valid",
    notes: "Formulario propio",
    is_counted: true,
  });

  normalizedPredictions.forEach((item) => {
    state.predictions.push({
      id: nextId("PR", state.predictions.length, 4),
      submission_id: submissionId,
      participant_id: participant.id,
      phase_id: phase.id,
      match_id: item.match.id,
      team_a: item.match.team_a,
      team_b: item.match.team_b,
      goals_a_90: item.goals_a_90,
      goals_b_90: item.goals_b_90,
      predicted_qualifier: item.predicted_qualifier,
      predicted_method: item.predicted_method,
      is_valid: true,
    });
  });

  return { submission_id: submissionId };
}

export function updatePhaseStatus(input: unknown, state = getState()) {
  const parsed = phaseStatusUpdateSchema.parse(input);
  const phase = state.phases.find((item) => item.id === parsed.phase_id);
  if (!phase) throw new KinelaError("Fase no encontrada", 404);

  phase.status = parsed.status;
  return phase;
}

export function confirmMatchResult(input: unknown, state = getState()) {
  const parsed = matchResultSchema.parse(input);
  const match = state.matches.find((item) => item.id === parsed.match_id);
  if (!match) throw new KinelaError("Partido no encontrado", 404);

  validateQualifier(match, parsed.qualifier);

  if (!isMethodValidForScore(parsed.goals_a_90, parsed.goals_b_90, parsed.method)) {
    throw new KinelaError(
      parsed.goals_a_90 === parsed.goals_b_90
        ? "Si el resultado en 90 es empate, use Suplementario o Penales"
        : "Si hay ganador en 90, el metodo debe ser 90 minutos",
    );
  }

  let result = state.results.find((item) => item.match_id === match.id);
  if (!result) {
    result = {
      id: nextId("R", state.results.length, 3),
      match_id: match.id,
      source: "admin",
      goals_a_90: parsed.goals_a_90,
      goals_b_90: parsed.goals_b_90,
      qualifier: parsed.qualifier,
      method: parsed.method,
      confirmed: true,
    };
    state.results.push(result);
  }

  Object.assign(result, {
    source: "admin",
    goals_a_90: parsed.goals_a_90,
    goals_b_90: parsed.goals_b_90,
    goals_a_extra: parsed.goals_a_extra,
    goals_b_extra: parsed.goals_b_extra,
    penalties_a: parsed.penalties_a,
    penalties_b: parsed.penalties_b,
    qualifier: parsed.qualifier,
    method: parsed.method,
    confirmed: true,
    confirmed_by: "admin",
    confirmed_at: new Date().toISOString(),
  });

  match.status = "confirmed";
  return result;
}

export function updateScoringRule(input: unknown, state = getState()) {
  const parsed = scoringUpdateSchema.parse(input);
  const rule = state.scoringRules.find((item) => item.key === parsed.key);
  if (!rule) throw new KinelaError("Regla no encontrada", 404);

  rule.points = parsed.points;
  rule.active = parsed.active;
  return rule;
}

function predictionLabel(prediction: Prediction | undefined) {
  if (!prediction) return "Sin envio";
  return `${prediction.goals_a_90}-${prediction.goals_b_90}`;
}

function methodDistribution(predictions: Prediction[]) {
  return predictions.reduce<Record<PredictionMethod, number>>(
    (acc, prediction) => {
      acc[prediction.predicted_method] += 1;
      return acc;
    },
    { "90 minutos": 0, Suplementario: 0, Penales: 0 },
  );
}

export function buildDashboardData(state = getState()): DashboardData {
  const phase = currentPhase(state);
  const officialResults = confirmedResultsByMatch(state);
  const predictions = countedPredictions(state);
  const matches = state.matches.sort((a, b) => a.order - b.order);

  const standingMap = new Map<string, StandingRow>();
  state.participants
    .filter((participant) => participant.active)
    .forEach((participant) => {
      standingMap.set(participant.id, {
        rank: 0,
        participant_id: participant.id,
        participant_name: participant.name,
        points: 0,
        exact_scores: 0,
        qualifiers: 0,
        methods: 0,
        matches_with_points: 0,
        unanswered: matches.length,
      });
    });

  const participantPredictionCounts = new Map<string, number>();

  predictions.forEach((prediction) => {
    participantPredictionCounts.set(
      prediction.participant_id,
      (participantPredictionCounts.get(prediction.participant_id) ?? 0) + 1,
    );

    const result = officialResults.get(prediction.match_id);
    if (!result) return;

    const score = calculateMatchScore(prediction, result, state.scoringRules);
    const row = standingMap.get(prediction.participant_id);
    if (!row) return;

    row.points += score.total;
    row.exact_scores += score.pts_exact_score > 0 ? 1 : 0;
    row.qualifiers += score.pts_qualifier > 0 ? 1 : 0;
    row.methods += score.pts_method > 0 ? 1 : 0;
    row.matches_with_points += score.total > 0 ? 1 : 0;
  });

  standingMap.forEach((row, participantId) => {
    row.unanswered = matches.length - (participantPredictionCounts.get(participantId) ?? 0);
  });

  const standings = Array.from(standingMap.values()).sort((a, b) => {
    return (
      b.points - a.points ||
      b.exact_scores - a.exact_scores ||
      b.qualifiers - a.qualifiers ||
      b.methods - a.methods ||
      a.unanswered - b.unanswered ||
      a.participant_name.localeCompare(b.participant_name)
    );
  });

  standings.forEach((row, index) => {
    row.rank = index + 1;
  });

  const participantById = new Map(state.participants.map((participant) => [participant.id, participant]));
  const matchInsights: MatchInsight[] = matches.map((match) => {
    const matchPredictions = predictions.filter((prediction) => prediction.match_id === match.id);
    const confirmedResult = officialResults.get(match.id);
    const visibleResult = resultForDisplay(state, match.id);
    const exactScorers = matchPredictions
      .filter((prediction) => {
        if (!confirmedResult) return false;
        return calculateMatchScore(prediction, confirmedResult, state.scoringRules).pts_exact_score > 0;
      })
      .map((prediction) => participantById.get(prediction.participant_id)?.name ?? prediction.participant_id);

    const groups = new Map<string, number>();
    let picksTeamA = 0;
    let picksTeamB = 0;
    let picksDraw = 0;
    let pointsDistributed = 0;

    matchPredictions.forEach((prediction) => {
      const outcome = outcomeFromScore(prediction.goals_a_90, prediction.goals_b_90);
      if (outcome === "team_a") picksTeamA += 1;
      if (outcome === "team_b") picksTeamB += 1;
      if (outcome === "draw") picksDraw += 1;

      const key = `${prediction.goals_a_90}-${prediction.goals_b_90} / ${prediction.predicted_qualifier} / ${prediction.predicted_method}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);

      if (confirmedResult) {
        pointsDistributed += calculateMatchScore(prediction, confirmedResult, state.scoringRules).total;
      }
    });

    const commonPrediction =
      Array.from(groups.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin predicciones";

    return {
      match_id: match.id,
      team_a: match.team_a,
      team_b: match.team_b,
      status: match.status,
      result_label: resultLabel(visibleResult),
      qualifier_label: visibleResult?.qualifier ?? "Pendiente",
      method_label: visibleResult?.method ?? "Pendiente",
      common_prediction: commonPrediction,
      picks_team_a: picksTeamA,
      picks_team_b: picksTeamB,
      picks_draw: picksDraw,
      exact_scorers: exactScorers,
      points_distributed: pointsDistributed,
    };
  });

  const participantViews: ParticipantView[] = state.participants.map((participant) => {
    const participantPredictions = predictions.filter(
      (prediction) => prediction.participant_id === participant.id,
    );

    const rows: ParticipantMatchView[] = matches.map((match) => {
      const prediction = participantPredictions.find((item) => item.match_id === match.id);
      const result = officialResults.get(match.id);
      const visibleResult = resultForDisplay(state, match.id);
      const points = prediction && result ? calculateMatchScore(prediction, result, state.scoringRules).total : 0;

      return {
        match_id: match.id,
        team_a: match.team_a,
        team_b: match.team_b,
        prediction_label: predictionLabel(prediction),
        qualifier_label: prediction?.predicted_qualifier ?? "Sin envio",
        method_label: prediction?.predicted_method ?? "Sin envio",
        points,
        result_label: resultLabel(visibleResult),
        status: match.status,
      };
    });

    return {
      participant_id: participant.id,
      participant_name: participant.name,
      matches: rows,
    };
  });

  const topExact = standings
    .filter((row) => row.exact_scores > 0)
    .slice()
    .sort((a, b) => b.exact_scores - a.exact_scores || b.points - a.points)
    .slice(0, 5);

  const topQualifiers = standings
    .filter((row) => row.qualifiers > 0)
    .slice()
    .sort((a, b) => b.qualifiers - a.qualifiers || b.points - a.points)
    .slice(0, 5);

  return {
    title: "Kinela Mundialista",
    current_phase: phase,
    last_updated: new Date().toISOString(),
    standings,
    matchInsights,
    participantViews,
    metrics: {
      top_exact_scores: topExact,
      top_qualifiers: topQualifiers,
      match_most_points: matchInsights.slice().sort((a, b) => b.points_distributed - a.points_distributed)[0],
      biggest_riser: standings[0],
      method_distribution: methodDistribution(predictions),
    },
  };
}

export function syncDemoResults(state = getState(), autoConfirm = process.env.AUTO_CONFIRM_RESULTS === "true") {
  let touched = 0;

  demoFixtures.forEach((fixture) => {
    const match = state.matches.find((item) => item.api_fixture_id === fixture.fixture_id);
    if (!match) return;

    const existing = state.results.find((result) => result.match_id === match.id);
    const normalized = {
      source: "api" as const,
      goals_a_90: fixture.goals_a_90,
      goals_b_90: fixture.goals_b_90,
      goals_a_extra: fixture.goals_a_extra,
      goals_b_extra: fixture.goals_b_extra,
      qualifier: fixture.qualifier,
      method: fixture.method as PredictionMethod,
      confirmed: autoConfirm,
      confirmed_by: autoConfirm ? "cron" : undefined,
      confirmed_at: autoConfirm ? new Date().toISOString() : undefined,
      raw_payload_json: fixture,
    };

    if (existing) {
      Object.assign(existing, normalized);
    } else {
      state.results.push({
        id: nextId("R", state.results.length, 3),
        match_id: match.id,
        ...normalized,
      });
    }

    match.status = autoConfirm ? "confirmed" : "finished";
    touched += 1;
  });

  state.syncLogs.unshift({
    id: nextId("L", state.syncLogs.length, 3),
    ran_at: new Date().toISOString(),
    provider: "demo",
    status: "success",
    message: autoConfirm ? "Resultados demo sincronizados y confirmados" : "Resultados demo sincronizados",
    touched_matches: touched,
  });

  return { touched };
}
