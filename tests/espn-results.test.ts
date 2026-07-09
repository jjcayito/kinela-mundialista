import { describe, expect, it } from "vitest";
import { parseEpsnWorldCupResults } from "../src/lib/espn-results";

const matches = [
  { id: "QF1", teamA: "Francia", teamB: "Marruecos" },
  { id: "QF4", teamA: "Argentina", teamB: "Suiza" },
];

describe("parseEpsnWorldCupResults", () => {
  it("ignora partidos no finalizados", () => {
    const results = parseEpsnWorldCupResults(
      {
        events: [
          {
            id: "760510",
            status: { type: { completed: false, detail: "Scheduled" } },
            competitions: [
              {
                competitors: [
                  { team: { displayName: "France" }, score: "0", winner: false },
                  { team: { displayName: "Morocco" }, score: "0", winner: false },
                ],
              },
            ],
          },
        ],
      },
      matches,
    );

    expect(results).toHaveLength(0);
  });

  it("mapea un resultado finalizado en 90 minutos", () => {
    const results = parseEpsnWorldCupResults(
      {
        events: [
          {
            id: "760510",
            status: { type: { completed: true, detail: "FT", description: "Full Time" } },
            competitions: [
              {
                competitors: [
                  { team: { displayName: "France" }, score: "2", winner: true },
                  { team: { displayName: "Morocco" }, score: "1", winner: false },
                ],
              },
            ],
          },
        ],
      },
      matches,
    );

    expect(results[0]).toMatchObject({
      match_id: "QF1",
      goals_a_90: 2,
      goals_b_90: 1,
      qualifier: "Francia",
      method: "90 minutos",
      confirmed: true,
    });
  });

  it("mapea ganador por penales", () => {
    const results = parseEpsnWorldCupResults(
      {
        events: [
          {
            id: "760513",
            status: { type: { completed: true, detail: "FT-Pens", description: "Final Score - After Penalties" } },
            competitions: [
              {
                competitors: [
                  { team: { displayName: "Argentina" }, score: "1", winner: false },
                  { team: { displayName: "Switzerland" }, score: "1", winner: true },
                ],
              },
            ],
          },
        ],
      },
      matches,
    );

    expect(results[0]).toMatchObject({
      match_id: "QF4",
      goals_a_90: 1,
      goals_b_90: 1,
      qualifier: "Suiza",
      method: "Penales",
    });
  });
});
