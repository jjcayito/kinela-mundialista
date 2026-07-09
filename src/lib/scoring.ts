import type {
  MatchResult,
  MatchScore,
  Outcome,
  Prediction,
  ScoringKey,
  ScoringRule,
} from "./types";

export const defaultScoringRules: ScoringRule[] = [
  { id: "SR001", key: "result_90", label: "Resultado en 90 minutos", points: 5, active: true },
  { id: "SR002", key: "qualifier", label: "Clasificado", points: 3, active: true },
  { id: "SR003", key: "method", label: "Via de clasificacion", points: 2, active: true },
  { id: "SR004", key: "exact_score", label: "Marcador exacto", points: 4, active: true },
  { id: "SR005", key: "goal_difference", label: "Diferencia de goles", points: 2, active: true },
  { id: "SR006", key: "goals_team_a", label: "Goles exactos Equipo A", points: 1, active: true },
  { id: "SR007", key: "goals_team_b", label: "Goles exactos Equipo B", points: 1, active: true },
];

export function outcomeFromScore(goalsA: number, goalsB: number): Outcome {
  if (goalsA > goalsB) return "team_a";
  if (goalsB > goalsA) return "team_b";
  return "draw";
}

function regulatoryOutcome(method: string, goalsA: number, goalsB: number): Outcome {
  if (method === "90 minutos") return outcomeFromScore(goalsA, goalsB);
  return "draw";
}

function canScoreGoalsBasedCriteria(
  prediction: Pick<Prediction, "goals_a_90" | "goals_b_90" | "predicted_method">,
  officialResult: Pick<MatchResult, "method">,
): boolean {
  if (prediction.predicted_method !== officialResult.method) return false;
  if (prediction.predicted_method === "Suplementario") return false;
  if (prediction.predicted_method === "Penales" && prediction.goals_a_90 !== prediction.goals_b_90) {
    return false;
  }
  return true;
}

function rulePoints(rules: ScoringRule[], key: ScoringKey): number {
  const rule = rules.find((item) => item.key === key);
  return rule?.active ? rule.points : 0;
}

export function calculateMatchScore(
  prediction: Pick<
    Prediction,
    "goals_a_90" | "goals_b_90" | "predicted_qualifier" | "predicted_method"
  >,
  officialResult: Pick<
    MatchResult,
    "goals_a_90" | "goals_b_90" | "qualifier" | "method" | "confirmed"
  >,
  scoringRules: ScoringRule[] = defaultScoringRules,
): MatchScore {
  const detail: string[] = [];

  if (!officialResult.confirmed) {
    return {
      pts_result_90: 0,
      pts_qualifier: 0,
      pts_method: 0,
      pts_exact_score: 0,
      pts_goal_difference: 0,
      pts_goals_team_a: 0,
      pts_goals_team_b: 0,
      total: 0,
      detail: ["Resultado pendiente de confirmacion"],
    };
  }

  const predictedOutcome = regulatoryOutcome(
    prediction.predicted_method,
    prediction.goals_a_90,
    prediction.goals_b_90,
  );
  const officialOutcome = regulatoryOutcome(
    officialResult.method,
    officialResult.goals_a_90,
    officialResult.goals_b_90,
  );
  const predictedDifference = prediction.goals_a_90 - prediction.goals_b_90;
  const officialDifference = officialResult.goals_a_90 - officialResult.goals_b_90;
  const scoreBasedCriteriaAllowed = canScoreGoalsBasedCriteria(prediction, officialResult);

  const pts_result_90 =
    predictedOutcome === officialOutcome ? rulePoints(scoringRules, "result_90") : 0;
  if (pts_result_90) detail.push("Acerto resultado en 90 minutos");

  const pts_qualifier =
    prediction.predicted_qualifier === officialResult.qualifier
      ? rulePoints(scoringRules, "qualifier")
      : 0;
  if (pts_qualifier) detail.push("Acerto clasificado");

  const pts_method =
    prediction.predicted_method === officialResult.method ? rulePoints(scoringRules, "method") : 0;
  if (pts_method) detail.push("Acerto via");

  const pts_exact_score =
    scoreBasedCriteriaAllowed &&
    prediction.goals_a_90 === officialResult.goals_a_90 &&
    prediction.goals_b_90 === officialResult.goals_b_90
      ? rulePoints(scoringRules, "exact_score")
      : 0;
  if (pts_exact_score) detail.push("Acerto marcador exacto");

  const pts_goal_difference =
    scoreBasedCriteriaAllowed && predictedDifference === officialDifference
      ? rulePoints(scoringRules, "goal_difference")
      : 0;
  if (pts_goal_difference) detail.push("Acerto diferencia");

  const pts_goals_team_a =
    scoreBasedCriteriaAllowed && prediction.goals_a_90 === officialResult.goals_a_90
      ? rulePoints(scoringRules, "goals_team_a")
      : 0;
  if (pts_goals_team_a) detail.push("Acerto goles del Equipo A");

  const pts_goals_team_b =
    scoreBasedCriteriaAllowed && prediction.goals_b_90 === officialResult.goals_b_90
      ? rulePoints(scoringRules, "goals_team_b")
      : 0;
  if (pts_goals_team_b) detail.push("Acerto goles del Equipo B");

  const total =
    pts_result_90 +
    pts_qualifier +
    pts_method +
    pts_exact_score +
    pts_goal_difference +
    pts_goals_team_a +
    pts_goals_team_b;

  return {
    pts_result_90,
    pts_qualifier,
    pts_method,
    pts_exact_score,
    pts_goal_difference,
    pts_goals_team_a,
    pts_goals_team_b,
    total,
    detail: detail.length ? detail : ["Sin puntos"],
  };
}
