"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Activity, CalendarClock, Medal, Target, UsersRound } from "lucide-react";
import type { DashboardData } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    open: "Abierta",
    closed: "Cerrada",
    finished: "Finalizada",
    scheduled: "Programado",
    live: "En vivo",
    confirmed: "Confirmado",
  };

  return labels[status] ?? status;
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [participantId, setParticipantId] = useState(data.participantViews[0]?.participant_id ?? "");

  const selectedParticipant = useMemo(
    () => data.participantViews.find((participant) => participant.participant_id === participantId),
    [data.participantViews, participantId],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 border-b border-[#d8d0c1] pb-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase text-[#b45309]">
            {data.current_phase?.name ?? "Sin fase activa"}
          </p>
          <h1 className="text-3xl font-semibold text-[#151c25] sm:text-4xl">
            {data.title}
          </h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#d8d0c1] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#5c6570]">
              <CalendarClock size={17} aria-hidden="true" />
              Última actualización
            </div>
            <p className="mt-2 text-base font-semibold text-[#151c25]">{formatDate(data.last_updated)}</p>
          </div>
          <div className="rounded-md border border-[#d8d0c1] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#5c6570]">
              <Activity size={17} aria-hidden="true" />
              Estado de fase
            </div>
            <p className="mt-2 text-base font-semibold text-[#151c25]">
              {statusLabel(data.current_phase?.status ?? "draft")}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-6 md:grid-cols-4">
        <MetricTile
          icon={<Medal size={18} aria-hidden="true" />}
          label="Líder"
          value={data.standings[0]?.participant_name ?? "N/D"}
          detail={`${data.standings[0]?.points ?? 0} pts`}
        />
        <MetricTile
          icon={<Target size={18} aria-hidden="true" />}
          label="Top marcadores"
          value={data.metrics.top_exact_scores[0]?.participant_name ?? "N/D"}
          detail={`${data.metrics.top_exact_scores[0]?.exact_scores ?? 0} exactos`}
        />
        <MetricTile
          icon={<UsersRound size={18} aria-hidden="true" />}
          label="Clasificados"
          value={data.metrics.top_qualifiers[0]?.participant_name ?? "N/D"}
          detail={`${data.metrics.top_qualifiers[0]?.qualifiers ?? 0} aciertos`}
        />
        <MetricTile
          icon={<Activity size={18} aria-hidden="true" />}
          label="Partido más puntuado"
          value={
            data.metrics.match_most_points
              ? `${data.metrics.match_most_points.team_a} vs ${data.metrics.match_most_points.team_b}`
              : "N/D"
          }
          detail={`${data.metrics.match_most_points?.points_distributed ?? 0} pts repartidos`}
        />
      </section>

      <section className="border-t border-[#d8d0c1] py-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#151c25]">Tabla de posiciones</h2>
            <p className="text-sm text-[#5c6570]">Desempates: exactos, clasificados, vías y respuestas.</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-[#d8d0c1] bg-white">
          <table className="min-w-[760px] text-sm">
            <thead className="bg-[#24313f] text-left text-white">
              <tr>
                <th className="px-3 py-3">Puesto</th>
                <th className="px-3 py-3">Participante</th>
                <th className="px-3 py-3 text-right">Puntos</th>
                <th className="px-3 py-3 text-right">Exactos</th>
                <th className="px-3 py-3 text-right">Clasificados</th>
                <th className="px-3 py-3 text-right">Vías</th>
                <th className="px-3 py-3 text-right">Con puntos</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((row) => (
                <tr key={row.participant_id} className="border-t border-[#ebe4d8]">
                  <td className="px-3 py-3 font-semibold">{row.rank}</td>
                  <td className="px-3 py-3">{row.participant_name}</td>
                  <td className="px-3 py-3 text-right font-semibold text-[#0f766e]">{row.points}</td>
                  <td className="px-3 py-3 text-right">{row.exact_scores}</td>
                  <td className="px-3 py-3 text-right">{row.qualifiers}</td>
                  <td className="px-3 py-3 text-right">{row.methods}</td>
                  <td className="px-3 py-3 text-right">{row.matches_with_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-[#d8d0c1] py-6">
        <h2 className="mb-4 text-xl font-semibold text-[#151c25]">Partidos</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.matchInsights.map((match) => (
            <article key={match.match_id} className="rounded-md border border-[#d8d0c1] bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#151c25]">
                    {match.team_a} vs {match.team_b}
                  </h3>
                  <p className="text-sm text-[#5c6570]">
                    {match.result_label} · {match.qualifier_label} · {match.method_label}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-md bg-[#e0f2f1] px-2 py-1 text-xs font-semibold text-[#0f766e]">
                  {statusLabel(match.status)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Equipo A" value={match.picks_team_a} />
                <Stat label="Equipo B" value={match.picks_team_b} />
                <Stat label="Empate" value={match.picks_draw} />
                <Stat label="Puntos" value={match.points_distributed} />
              </dl>
              <div className="mt-4 rounded-md bg-[#f8f6f1] p-3 text-sm">
                <p className="font-medium text-[#24313f]">Predicción más común</p>
                <p className="mt-1 text-[#5c6570]">{match.common_prediction}</p>
              </div>
              <p className="mt-3 text-sm text-[#5c6570]">
                Acertantes exactos:{" "}
                <span className="font-medium text-[#151c25]">
                  {match.exact_scorers.length ? match.exact_scorers.join(", ") : "Pendiente"}
                </span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#d8d0c1] py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[#151c25]">Vista por participante</h2>
          <select
            value={participantId}
            onChange={(event) => setParticipantId(event.target.value)}
            className="h-10 rounded-md border border-[#b9ad9d] bg-white px-3 text-sm"
          >
            {data.participantViews.map((participant) => (
              <option key={participant.participant_id} value={participant.participant_id}>
                {participant.participant_name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto rounded-md border border-[#d8d0c1] bg-white">
          <table className="min-w-[720px] text-sm">
            <thead className="bg-[#24313f] text-left text-white">
              <tr>
                <th className="px-3 py-3">Partido</th>
                <th className="px-3 py-3">Predicción</th>
                <th className="px-3 py-3">Clasificado</th>
                <th className="px-3 py-3">Vía</th>
                <th className="px-3 py-3">Resultado</th>
                <th className="px-3 py-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {selectedParticipant?.matches.map((match) => (
                <tr key={match.match_id} className="border-t border-[#ebe4d8]">
                  <td className="px-3 py-3">
                    {match.team_a} vs {match.team_b}
                  </td>
                  <td className="px-3 py-3">{match.prediction_label}</td>
                  <td className="px-3 py-3">{match.qualifier_label}</td>
                  <td className="px-3 py-3">{match.method_label}</td>
                  <td className="px-3 py-3">{match.result_label}</td>
                  <td className="px-3 py-3 text-right font-semibold">{match.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function MetricTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-h-32 rounded-md border border-[#d8d0c1] bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[#5c6570]">
        {icon}
        {label}
      </div>
      <p className="mt-3 break-words text-lg font-semibold leading-snug text-[#151c25]">{value}</p>
      <p className="mt-1 text-sm text-[#b45309]">{detail}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#7d6d5c]">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-[#151c25]">{value}</dd>
    </div>
  );
}
