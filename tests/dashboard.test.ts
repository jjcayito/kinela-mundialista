import { beforeEach, describe, expect, it } from "vitest";
import { buildDashboardData, getState, resetStateForTests } from "../src/lib/store";

describe("dashboard data", () => {
  beforeEach(() => {
    resetStateForTests();
  });

  it("ordena posiciones por puntaje descendente", () => {
    const dashboard = buildDashboardData();

    dashboard.standings.forEach((row, index) => {
      const next = dashboard.standings[index + 1];
      if (next) {
        expect(row.points).toBeGreaterThanOrEqual(next.points);
      }
    });
  });

  it("incluye vista para todos los participantes activos", () => {
    const state = getState();
    const dashboard = buildDashboardData(state);

    expect(dashboard.participantViews).toHaveLength(
      state.participants.filter((participant) => participant.active).length,
    );
  });

  it("calcula el partido con mas puntos repartidos", () => {
    const dashboard = buildDashboardData();
    const maxPoints = Math.max(...dashboard.matchInsights.map((match) => match.points_distributed));

    expect(dashboard.metrics.match_most_points?.points_distributed).toBe(maxPoints);
  });
});
