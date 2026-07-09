import { PredictionClient } from "@/components/PredictionClient";
import { TopNav } from "@/components/TopNav";
import { currentPhase, getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function PredictPage() {
  const state = getState();
  const phase = currentPhase(state);
  const matches = state.matches
    .filter((match) => match.phase_id === phase?.id)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <TopNav />
      <PredictionClient
        phase={phase}
        matches={matches}
        participants={state.participants
          .filter((participant) => participant.active)
          .map(({ id, name }) => ({ id, name }))}
      />
    </>
  );
}
