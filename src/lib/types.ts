export const phaseStatuses = ["draft", "open", "closed", "finished"] as const;
export const matchStatuses = ["scheduled", "live", "finished", "confirmed"] as const;
export const predictionMethods = ["90 minutos", "Suplementario", "Penales"] as const;
export const scoringKeys = [
  "result_90",
  "qualifier",
  "method",
  "exact_score",
  "goal_difference",
  "goals_team_a",
  "goals_team_b",
] as const;

export type PhaseStatus = (typeof phaseStatuses)[number];
export type MatchStatus = (typeof matchStatuses)[number];
export type PredictionMethod = (typeof predictionMethods)[number];
export type ScoringKey = (typeof scoringKeys)[number];

export type ParticipantRole = "player" | "admin";
export type ValidationStatus = "valid" | "invalid";
export type ResultSource = "api" | "manual" | "admin";
export type Outcome = "team_a" | "draw" | "team_b";

export interface Participant {
  id: string;
  name: string;
  code: string;
  active: boolean;
  role: ParticipantRole;
}

export interface Phase {
  id: string;
  name: string;
  slug: string;
  status: PhaseStatus;
  opens_at: string;
  closes_at: string;
  order: number;
}

export interface Match {
  id: string;
  phase_id: string;
  order: number;
  team_a: string;
  team_b: string;
  starts_at: string;
  venue?: string;
  api_provider: string;
  api_fixture_id: string;
  status: MatchStatus;
  winner_source_match_id?: string;
}

export interface PredictionSubmission {
  id: string;
  participant_id: string;
  phase_id: string;
  submitted_at: string;
  validation_status: ValidationStatus;
  notes?: string;
  is_counted: boolean;
}

export interface Prediction {
  id: string;
  submission_id: string;
  participant_id: string;
  phase_id: string;
  match_id: string;
  team_a: string;
  team_b: string;
  goals_a_90: number;
  goals_b_90: number;
  predicted_qualifier: string;
  predicted_method: PredictionMethod;
  is_valid: boolean;
  validation_error?: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  source: ResultSource;
  goals_a_90: number;
  goals_b_90: number;
  goals_a_extra?: number;
  goals_b_extra?: number;
  penalties_a?: number;
  penalties_b?: number;
  qualifier: string;
  method: PredictionMethod;
  confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  raw_payload_json?: unknown;
}

export interface ScoringRule {
  id: string;
  key: ScoringKey;
  label: string;
  points: number;
  active: boolean;
}

export interface SyncLog {
  id: string;
  ran_at: string;
  provider: string;
  status: "success" | "error";
  message: string;
  touched_matches: number;
}

export interface AppState {
  participants: Participant[];
  phases: Phase[];
  matches: Match[];
  predictionSubmissions: PredictionSubmission[];
  predictions: Prediction[];
  results: MatchResult[];
  scoringRules: ScoringRule[];
  syncLogs: SyncLog[];
}

export interface MatchScore {
  pts_result_90: number;
  pts_qualifier: number;
  pts_method: number;
  pts_exact_score: number;
  pts_goal_difference: number;
  pts_goals_team_a: number;
  pts_goals_team_b: number;
  total: number;
  detail: string[];
}

export interface StandingRow {
  rank: number;
  participant_id: string;
  participant_name: string;
  points: number;
  base_points?: number;
  phase_points?: number;
  exact_scores: number;
  qualifiers: number;
  methods: number;
  matches_with_points: number;
  unanswered: number;
}

export interface MatchInsight {
  match_id: string;
  team_a: string;
  team_b: string;
  status: MatchStatus;
  result_label: string;
  qualifier_label: string;
  method_label: string;
  common_prediction: string;
  picks_team_a: number;
  picks_team_b: number;
  picks_draw: number;
  exact_scorers: string[];
  points_distributed: number;
}

export interface ParticipantMatchView {
  match_id: string;
  team_a: string;
  team_b: string;
  prediction_label: string;
  qualifier_label: string;
  method_label: string;
  points: number;
  result_label: string;
  status: MatchStatus;
}

export interface ParticipantView {
  participant_id: string;
  participant_name: string;
  matches: ParticipantMatchView[];
}

export interface DashboardMetrics {
  top_exact_scores: StandingRow[];
  top_qualifiers: StandingRow[];
  match_most_points?: MatchInsight;
  biggest_riser?: StandingRow;
  method_distribution: Record<PredictionMethod, number>;
}

export interface DashboardData {
  title: string;
  current_phase?: Phase;
  last_updated: string;
  standings: StandingRow[];
  matchInsights: MatchInsight[];
  participantViews: ParticipantView[];
  metrics: DashboardMetrics;
  previousMatches?: Array<{
    match_id: string;
    label: string;
    qualifier: string;
    method: PredictionMethod;
  }>;
}
