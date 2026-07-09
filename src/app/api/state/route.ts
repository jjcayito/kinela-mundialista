import { NextResponse } from "next/server";
import { buildDashboardData, getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const state = getState();
  const participants = state.participants.map(({ id, name, active, role }) => ({
    id,
    name,
    active,
    role,
  }));

  return NextResponse.json({
    participants,
    phases: state.phases,
    matches: state.matches,
    scoringRules: state.scoringRules,
    dashboard: buildDashboardData(state),
  });
}
