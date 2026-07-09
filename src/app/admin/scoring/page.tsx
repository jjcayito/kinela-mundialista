import { AdminClient } from "@/components/AdminClient";
import { TopNav } from "@/components/TopNav";
import { buildDashboardData, getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminScoringPage() {
  const state = getState();

  return (
    <>
      <TopNav />
      <AdminClient
        section="scoring"
        snapshot={{
          phases: state.phases,
          matches: state.matches,
          results: state.results,
          scoringRules: state.scoringRules,
          syncLogs: state.syncLogs,
          dashboard: buildDashboardData(state),
        }}
      />
    </>
  );
}
