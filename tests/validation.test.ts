import { beforeEach, describe, expect, it } from "vitest";
import { getState, resetStateForTests, submitPredictionSubmission } from "../src/lib/store";

function basePayload() {
  const state = getState();
  const phase = state.phases[0];
  const participant = state.participants[0];
  const matches = state.matches.filter((match) => match.phase_id === phase.id);

  return {
    participant_id: participant.id,
    code: participant.code,
    phase_id: phase.id,
    predictions: matches.map((match) => ({
      match_id: match.id,
      goals_a_90: 1,
      goals_b_90: 0,
      predicted_qualifier: match.team_a,
      predicted_method: "90 minutos",
    })),
  };
}

describe("submission validations", () => {
  beforeEach(() => {
    resetStateForTests();
  });

  it("rechaza codigo incorrecto", () => {
    const payload = basePayload();
    expect(() => submitPredictionSubmission({ ...payload, code: "MAL" })).toThrow(
      /Codigo de validacion incorrecto/,
    );
  });

  it("rechaza fase cerrada", () => {
    const state = getState();
    state.phases[0].status = "closed";

    expect(() => submitPredictionSubmission(basePayload())).toThrow(/fase no esta abierta/);
  });

  it("rechaza empate con metodo 90 minutos", () => {
    const payload = basePayload();
    payload.predictions[0] = {
      ...payload.predictions[0],
      goals_a_90: 1,
      goals_b_90: 1,
      predicted_method: "90 minutos",
    };

    expect(() => submitPredictionSubmission(payload)).toThrow(/empate en 90 minutos/);
  });

  it("acepta marcador no empatado con metodo penales como tanda", () => {
    const payload = basePayload();
    payload.predictions[0] = {
      ...payload.predictions[0],
      goals_a_90: 2,
      goals_b_90: 1,
      predicted_method: "Penales",
    };

    expect(() => submitPredictionSubmission(payload)).not.toThrow();
  });

  it("rechaza clasificado fuera de los equipos", () => {
    const payload = basePayload();
    payload.predictions[0] = {
      ...payload.predictions[0],
      predicted_qualifier: "Equipo X",
    };

    expect(() => submitPredictionSubmission(payload)).toThrow(/no pertenece al partido/);
  });

  it("cuenta la ultima respuesta valida antes del cierre", () => {
    const state = getState();
    const payload = basePayload();
    const result = submitPredictionSubmission(payload);
    const counted = state.predictionSubmissions.filter(
      (submission) =>
        submission.participant_id === payload.participant_id &&
        submission.phase_id === payload.phase_id &&
        submission.is_counted,
    );

    expect(counted).toHaveLength(1);
    expect(counted[0].id).toBe(result.submission_id);
  });
});
