"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import type { Match, Participant, Phase, PredictionMethod } from "@/lib/types";

interface PredictionDraft {
  match_id: string;
  goals_a_90: number;
  goals_b_90: number;
  predicted_qualifier: string;
  predicted_method: PredictionMethod;
}

function normalizeDraft(match: Match, draft: PredictionDraft): PredictionDraft {
  const isDraw = draft.goals_a_90 === draft.goals_b_90;

  if (!isDraw) {
    return {
      ...draft,
      predicted_method: "90 minutos",
      predicted_qualifier: draft.goals_a_90 > draft.goals_b_90 ? match.team_a : match.team_b,
    };
  }

  return {
    ...draft,
    predicted_method: draft.predicted_method === "90 minutos" ? "Penales" : draft.predicted_method,
  };
}

export function PredictionClient({
  participants,
  phase,
  matches,
}: {
  participants: Pick<Participant, "id" | "name">[];
  phase?: Phase;
  matches: Match[];
}) {
  const [participantId, setParticipantId] = useState(participants[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<PredictionDraft[]>(
    matches.map((match) => ({
      match_id: match.id,
      goals_a_90: 1,
      goals_b_90: 0,
      predicted_qualifier: match.team_a,
      predicted_method: "90 minutos",
    })),
  );

  const participantName = useMemo(
    () => participants.find((participant) => participant.id === participantId)?.name ?? "",
    [participants, participantId],
  );

  function updateDraft(match: Match, partial: Partial<PredictionDraft>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.match_id === match.id ? normalizeDraft(match, { ...draft, ...partial }) : draft,
      ),
    );
  }

  async function submit() {
    if (!phase) return;

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_id: participantId,
        code,
        phase_id: phase.id,
        predictions: drafts,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage({ type: "error", text: result.error ?? "No se pudo guardar la predicción" });
      return;
    }

    setMessage({
      type: "ok",
      text: `Predicción guardada para ${participantName}. Cuenta la última válida antes del cierre.`,
    });
    setCode("");
  }

  if (!phase || phase.status !== "open") {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-md border border-[#d8d0c1] bg-white p-6">
          <h1 className="text-2xl font-semibold text-[#151c25]">Predicciones cerradas</h1>
          <p className="mt-2 text-[#5c6570]">No hay una fase abierta para nuevos envíos.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="border-b border-[#d8d0c1] pb-6">
        <p className="mb-2 text-sm font-semibold uppercase text-[#b45309]">{phase.name}</p>
        <h1 className="text-3xl font-semibold text-[#151c25]">Formulario de predicciones</h1>
      </section>

      <section className="grid gap-4 py-6 lg:grid-cols-[1fr_1fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#24313f]">Participante</span>
          <select
            value={participantId}
            onChange={(event) => setParticipantId(event.target.value)}
            className="h-11 w-full rounded-md border border-[#b9ad9d] bg-white px-3 text-sm"
          >
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#24313f]">Código de validación</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            type="password"
            autoComplete="off"
            className="h-11 w-full rounded-md border border-[#b9ad9d] bg-white px-3 text-sm"
          />
        </label>
      </section>

      <section className="overflow-x-auto rounded-md border border-[#d8d0c1] bg-white">
        <table className="min-w-[920px] text-sm">
          <thead className="bg-[#24313f] text-left text-white">
            <tr>
              <th className="px-3 py-3">Partido</th>
              <th className="px-3 py-3 text-center">Goles A</th>
              <th className="px-3 py-3 text-center">Goles B</th>
              <th className="px-3 py-3">Clasificado</th>
              <th className="px-3 py-3">Vía</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const draft = drafts.find((item) => item.match_id === match.id)!;
              const isDraw = draft.goals_a_90 === draft.goals_b_90;

              return (
                <tr key={match.id} className="border-t border-[#ebe4d8]">
                  <td className="px-3 py-3 font-medium text-[#151c25]">
                    {match.team_a} vs {match.team_b}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      value={draft.goals_a_90}
                      onChange={(event) =>
                        updateDraft(match, { goals_a_90: Number(event.target.value) })
                      }
                      type="number"
                      min={0}
                      className="mx-auto h-10 w-20 rounded-md border border-[#b9ad9d] px-2 text-center"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      value={draft.goals_b_90}
                      onChange={(event) =>
                        updateDraft(match, { goals_b_90: Number(event.target.value) })
                      }
                      type="number"
                      min={0}
                      className="mx-auto h-10 w-20 rounded-md border border-[#b9ad9d] px-2 text-center"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={draft.predicted_qualifier}
                      onChange={(event) =>
                        updateDraft(match, { predicted_qualifier: event.target.value })
                      }
                      className="h-10 w-full min-w-40 rounded-md border border-[#b9ad9d] bg-white px-2"
                    >
                      <option value={match.team_a}>{match.team_a}</option>
                      <option value={match.team_b}>{match.team_b}</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={draft.predicted_method}
                      onChange={(event) =>
                        updateDraft(match, {
                          predicted_method: event.target.value as PredictionMethod,
                        })
                      }
                      disabled={!isDraw}
                      className="h-10 w-full min-w-44 rounded-md border border-[#b9ad9d] bg-white px-2 disabled:bg-[#f1ede5]"
                    >
                      <option value="90 minutos">90 minutos</option>
                      <option value="Suplementario">Suplementario</option>
                      <option value="Penales">Penales</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        {message ? (
          <div
            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${
              message.type === "ok"
                ? "border-[#0f766e] bg-[#e0f2f1] text-[#0f766e]"
                : "border-[#b91c1c] bg-[#fee2e2] text-[#991b1b]"
            }`}
          >
            {message.type === "ok" ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
            {message.text}
          </div>
        ) : (
          <span className="text-sm text-[#5c6570]">Fase abierta hasta {new Date(phase.closes_at).toLocaleString("es-PE")}.</span>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving || !code.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
        >
          <Save size={18} aria-hidden="true" />
          {saving ? "Guardando" : "Guardar predicción"}
        </button>
      </section>
    </main>
  );
}
