import { describe, expect, it } from "vitest";
import { calculateMatchScore } from "../src/lib/scoring";

const rules = undefined;

describe("calculateMatchScore", () => {
  it("puntua cuando gana Equipo A en 90", () => {
    const score = calculateMatchScore(
      { goals_a_90: 2, goals_b_90: 1, predicted_qualifier: "A", predicted_method: "90 minutos" },
      { goals_a_90: 3, goals_b_90: 0, qualifier: "A", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_qualifier).toBe(3);
    expect(score.pts_method).toBe(2);
  });

  it("puntua cuando gana Equipo B en 90", () => {
    const score = calculateMatchScore(
      { goals_a_90: 0, goals_b_90: 2, predicted_qualifier: "B", predicted_method: "90 minutos" },
      { goals_a_90: 1, goals_b_90: 4, qualifier: "B", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_qualifier).toBe(3);
  });

  it("puntua empate y penales", () => {
    const score = calculateMatchScore(
      { goals_a_90: 1, goals_b_90: 1, predicted_qualifier: "B", predicted_method: "Penales" },
      { goals_a_90: 1, goals_b_90: 1, qualifier: "B", method: "Penales", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_method).toBe(2);
    expect(score.pts_exact_score).toBe(4);
  });

  it("puntua empate y suplementario", () => {
    const score = calculateMatchScore(
      { goals_a_90: 2, goals_b_90: 2, predicted_qualifier: "A", predicted_method: "Suplementario" },
      { goals_a_90: 2, goals_b_90: 2, qualifier: "A", method: "Suplementario", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_qualifier).toBe(3);
    expect(score.pts_method).toBe(2);
  });

  it("trata suplementario con marcador ganador como empate en 90 sin puntos de marcador", () => {
    const score = calculateMatchScore(
      { goals_a_90: 3, goals_b_90: 2, predicted_qualifier: "A", predicted_method: "Suplementario" },
      { goals_a_90: 3, goals_b_90: 2, qualifier: "A", method: "Suplementario", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_qualifier).toBe(3);
    expect(score.pts_method).toBe(2);
    expect(score.pts_exact_score).toBe(0);
    expect(score.pts_goal_difference).toBe(0);
  });

  it("acepta penales con marcador de tanda pero no entrega puntos por goles", () => {
    const score = calculateMatchScore(
      { goals_a_90: 4, goals_b_90: 3, predicted_qualifier: "A", predicted_method: "Penales" },
      { goals_a_90: 0, goals_b_90: 0, qualifier: "A", method: "Penales", confirmed: true },
      rules,
    );

    expect(score.pts_result_90).toBe(5);
    expect(score.pts_qualifier).toBe(3);
    expect(score.pts_method).toBe(2);
    expect(score.pts_exact_score).toBe(0);
    expect(score.pts_goals_team_a).toBe(0);
    expect(score.pts_goals_team_b).toBe(0);
  });

  it("puntua marcador exacto", () => {
    const score = calculateMatchScore(
      { goals_a_90: 3, goals_b_90: 1, predicted_qualifier: "A", predicted_method: "90 minutos" },
      { goals_a_90: 3, goals_b_90: 1, qualifier: "A", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.pts_exact_score).toBe(4);
    expect(score.total).toBe(18);
  });

  it("puntua diferencia correcta", () => {
    const score = calculateMatchScore(
      { goals_a_90: 2, goals_b_90: 0, predicted_qualifier: "A", predicted_method: "90 minutos" },
      { goals_a_90: 3, goals_b_90: 1, qualifier: "A", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.pts_goal_difference).toBe(2);
  });

  it("puntua goles exactos por equipo", () => {
    const score = calculateMatchScore(
      { goals_a_90: 2, goals_b_90: 1, predicted_qualifier: "A", predicted_method: "90 minutos" },
      { goals_a_90: 2, goals_b_90: 0, qualifier: "A", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.pts_goals_team_a).toBe(1);
    expect(score.pts_goals_team_b).toBe(0);
  });

  it("devuelve cero cuando la prediccion no acierta nada relevante", () => {
    const score = calculateMatchScore(
      { goals_a_90: 2, goals_b_90: 0, predicted_qualifier: "A", predicted_method: "90 minutos" },
      { goals_a_90: 0, goals_b_90: 3, qualifier: "B", method: "90 minutos", confirmed: true },
      rules,
    );

    expect(score.total).toBe(2);
    expect(score.pts_method).toBe(2);
  });
});
