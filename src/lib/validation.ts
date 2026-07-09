import { z } from "zod";
import { phaseStatuses, predictionMethods, scoringKeys } from "./types";

export const predictionRowSchema = z.object({
  match_id: z.string().min(1),
  goals_a_90: z.coerce.number().int().min(0).max(30),
  goals_b_90: z.coerce.number().int().min(0).max(30),
  predicted_qualifier: z.string().min(1),
  predicted_method: z.enum(predictionMethods),
});

export const predictionSubmissionSchema = z.object({
  participant_id: z.string().min(1),
  code: z.string().min(3).max(40),
  phase_id: z.string().min(1),
  predictions: z.array(predictionRowSchema).min(1),
});

export const phaseStatusUpdateSchema = z.object({
  phase_id: z.string().min(1),
  status: z.enum(phaseStatuses),
});

export const matchResultSchema = z.object({
  match_id: z.string().min(1),
  goals_a_90: z.coerce.number().int().min(0).max(30),
  goals_b_90: z.coerce.number().int().min(0).max(30),
  goals_a_extra: z.coerce.number().int().min(0).max(30).optional(),
  goals_b_extra: z.coerce.number().int().min(0).max(30).optional(),
  penalties_a: z.coerce.number().int().min(0).max(30).optional(),
  penalties_b: z.coerce.number().int().min(0).max(30).optional(),
  qualifier: z.string().min(1),
  method: z.enum(predictionMethods),
});

export const scoringUpdateSchema = z.object({
  key: z.enum(scoringKeys),
  points: z.coerce.number().int().min(0).max(50),
  active: z.coerce.boolean(),
});

export function isMethodValidForScore(
  goalsA: number,
  goalsB: number,
  method: (typeof predictionMethods)[number],
): boolean {
  if (method === "90 minutos") return goalsA !== goalsB;
  return method === "Suplementario" || method === "Penales";
}
