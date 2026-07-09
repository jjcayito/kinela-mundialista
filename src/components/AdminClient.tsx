"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  KeyRound,
  ListChecks,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import type {
  DashboardData,
  Match,
  MatchResult,
  Phase,
  PhaseStatus,
  PredictionMethod,
  ScoringRule,
  SyncLog,
} from "@/lib/types";

type AdminSection = "overview" | "phases" | "matches" | "results" | "scoring" | "export";

interface AdminSnapshot {
  phases: Phase[];
  matches: Match[];
  results: MatchResult[];
  scoringRules: ScoringRule[];
  syncLogs: SyncLog[];
  dashboard: DashboardData;
}

const sectionLinks: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin", label: "Resumen", section: "overview" },
  { href: "/admin/phases", label: "Fases", section: "phases" },
  { href: "/admin/matches", label: "Partidos", section: "matches" },
  { href: "/admin/results", label: "Resultados", section: "results" },
  { href: "/admin/scoring", label: "Puntajes", section: "scoring" },
  { href: "/admin/export", label: "Exportar", section: "export" },
];

export function AdminClient({
  snapshot,
  section = "overview",
}: {
  snapshot: AdminSnapshot;
  section?: AdminSection;
}) {
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function callApi(path: string, method: string, payload?: unknown) {
    setMessage(null);
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo completar la acción");
      return false;
    }

    setMessage("Cambios guardados");
    window.setTimeout(() => window.location.reload(), 450);
    return true;
  }

  const show = (target: AdminSection) => section === "overview" || section === target;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 border-b border-[#d8d0c1] pb-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase text-[#b45309]">Panel admin</p>
          <h1 className="text-3xl font-semibold text-[#151c25]">Operación de la kinela</h1>
        </div>
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#24313f]">
            <KeyRound size={17} aria-hidden="true" />
            Clave admin
          </span>
          <input
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            type="password"
            placeholder="DEMOADMIN"
            className="h-11 w-full rounded-md border border-[#b9ad9d] bg-white px-3 text-sm"
          />
        </label>
      </section>

      <nav className="flex flex-wrap gap-2 border-b border-[#d8d0c1] py-4">
        {sectionLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              item.section === section
                ? "border-[#0f766e] bg-[#e0f2f1] text-[#0f766e]"
                : "border-[#d8d0c1] bg-white text-[#24313f]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {message ? (
        <div className="mt-4 rounded-md border border-[#b45309] bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412]">
          {message}
        </div>
      ) : null}

      {show("phases") ? (
        <section className="border-b border-[#d8d0c1] py-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={20} aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#151c25]">Fases</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {snapshot.phases.map((phase) => (
              <PhaseEditor key={phase.id} phase={phase} callApi={callApi} />
            ))}
          </div>
        </section>
      ) : null}

      {show("matches") ? (
        <section className="border-b border-[#d8d0c1] py-6">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks size={20} aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#151c25]">Partidos</h2>
          </div>
          <div className="overflow-x-auto rounded-md border border-[#d8d0c1] bg-white">
            <table className="min-w-[900px] text-sm">
              <thead className="bg-[#24313f] text-left text-white">
                <tr>
                  <th className="px-3 py-3">Orden</th>
                  <th className="px-3 py-3">Partido</th>
                  <th className="px-3 py-3">Inicio</th>
                  <th className="px-3 py-3">Sede</th>
                  <th className="px-3 py-3">API</th>
                  <th className="px-3 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.matches.map((match) => (
                  <tr key={match.id} className="border-t border-[#ebe4d8]">
                    <td className="px-3 py-3">{match.order}</td>
                    <td className="px-3 py-3 font-medium">
                      {match.team_a} vs {match.team_b}
                    </td>
                    <td className="px-3 py-3">{new Date(match.starts_at).toLocaleString("es-PE")}</td>
                    <td className="px-3 py-3">{match.venue ?? "N/D"}</td>
                    <td className="px-3 py-3">{match.api_fixture_id}</td>
                    <td className="px-3 py-3">{match.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {show("results") ? (
        <section className="border-b border-[#d8d0c1] py-6">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw size={20} aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#151c25]">Resultados</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {snapshot.matches.map((match) => (
              <ResultEditor
                key={match.id}
                match={match}
                result={snapshot.results.find((item) => item.match_id === match.id)}
                callApi={callApi}
              />
            ))}
          </div>
        </section>
      ) : null}

      {show("scoring") ? (
        <section className="border-b border-[#d8d0c1] py-6">
          <div className="mb-4 flex items-center gap-2">
            <Save size={20} aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#151c25]">Reglas de puntaje</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {snapshot.scoringRules.map((rule) => (
              <ScoringEditor key={rule.key} rule={rule} callApi={callApi} />
            ))}
          </div>
        </section>
      ) : null}

      {show("export") ? (
        <section className="border-b border-[#d8d0c1] py-6">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet size={20} aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#151c25]">Exportación</h2>
          </div>
          <a
            href={`/api/admin/export-excel?key=${encodeURIComponent(adminKey)}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#115e59]"
          >
            <Download size={18} aria-hidden="true" />
            Descargar Excel
          </a>
        </section>
      ) : null}

      {section === "overview" ? (
        <section className="py-6">
          <h2 className="mb-4 text-xl font-semibold text-[#151c25]">Logs de sincronización</h2>
          <div className="overflow-x-auto rounded-md border border-[#d8d0c1] bg-white">
            <table className="min-w-[720px] text-sm">
              <thead className="bg-[#24313f] text-left text-white">
                <tr>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Proveedor</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Mensaje</th>
                  <th className="px-3 py-3 text-right">Partidos</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.syncLogs.map((log) => (
                  <tr key={log.id} className="border-t border-[#ebe4d8]">
                    <td className="px-3 py-3">{new Date(log.ran_at).toLocaleString("es-PE")}</td>
                    <td className="px-3 py-3">{log.provider}</td>
                    <td className="px-3 py-3">{log.status}</td>
                    <td className="px-3 py-3">{log.message}</td>
                    <td className="px-3 py-3 text-right">{log.touched_matches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PhaseEditor({
  phase,
  callApi,
}: {
  phase: Phase;
  callApi: (path: string, method: string, payload?: unknown) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<PhaseStatus>(phase.status);

  return (
    <div className="rounded-md border border-[#d8d0c1] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#151c25]">{phase.name}</h3>
          <p className="text-sm text-[#5c6570]">
            {new Date(phase.opens_at).toLocaleDateString("es-PE")} -{" "}
            {new Date(phase.closes_at).toLocaleDateString("es-PE")}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as PhaseStatus)}
            className="h-10 rounded-md border border-[#b9ad9d] bg-white px-2 text-sm"
          >
            <option value="draft">Borrador</option>
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
            <option value="finished">Finalizada</option>
          </select>
          <button
            type="button"
            onClick={() => callApi("/api/admin/phases", "PATCH", { phase_id: phase.id, status })}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white"
          >
            <Save size={16} aria-hidden="true" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultEditor({
  match,
  result,
  callApi,
}: {
  match: Match;
  result?: MatchResult;
  callApi: (path: string, method: string, payload?: unknown) => Promise<boolean>;
}) {
  const [goalsA, setGoalsA] = useState(result?.goals_a_90 ?? 0);
  const [goalsB, setGoalsB] = useState(result?.goals_b_90 ?? 0);
  const [qualifier, setQualifier] = useState(result?.qualifier ?? match.team_a);
  const [method, setMethod] = useState<PredictionMethod>(result?.method ?? "Penales");
  const isDraw = goalsA === goalsB;
  const computedMethod = isDraw ? method : "90 minutos";
  const computedQualifier = isDraw ? qualifier : goalsA > goalsB ? match.team_a : match.team_b;

  return (
    <div className="rounded-md border border-[#d8d0c1] bg-white p-4">
      <h3 className="text-base font-semibold text-[#151c25]">
        {match.team_a} vs {match.team_b}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm text-[#5c6570]">Goles {match.team_a}</span>
          <input
            value={goalsA}
            onChange={(event) => setGoalsA(Number(event.target.value))}
            type="number"
            min={0}
            className="h-10 w-full rounded-md border border-[#b9ad9d] px-2"
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-[#5c6570]">Goles {match.team_b}</span>
          <input
            value={goalsB}
            onChange={(event) => setGoalsB(Number(event.target.value))}
            type="number"
            min={0}
            className="h-10 w-full rounded-md border border-[#b9ad9d] px-2"
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-[#5c6570]">Clasificado</span>
          <select
            value={computedQualifier}
            onChange={(event) => setQualifier(event.target.value)}
            disabled={!isDraw}
            className="h-10 w-full rounded-md border border-[#b9ad9d] bg-white px-2 disabled:bg-[#f1ede5]"
          >
            <option value={match.team_a}>{match.team_a}</option>
            <option value={match.team_b}>{match.team_b}</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm text-[#5c6570]">Vía</span>
          <select
            value={computedMethod}
            onChange={(event) => setMethod(event.target.value as PredictionMethod)}
            disabled={!isDraw}
            className="h-10 w-full rounded-md border border-[#b9ad9d] bg-white px-2 disabled:bg-[#f1ede5]"
          >
            <option value="90 minutos">90 minutos</option>
            <option value="Suplementario">Suplementario</option>
            <option value="Penales">Penales</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={() =>
          callApi("/api/admin/results", "POST", {
            match_id: match.id,
            goals_a_90: goalsA,
            goals_b_90: goalsB,
            qualifier: computedQualifier,
            method: computedMethod,
          })
        }
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white"
      >
        <Save size={16} aria-hidden="true" />
        Confirmar
      </button>
    </div>
  );
}

function ScoringEditor({
  rule,
  callApi,
}: {
  rule: ScoringRule;
  callApi: (path: string, method: string, payload?: unknown) => Promise<boolean>;
}) {
  const [points, setPoints] = useState(rule.points);
  const [active, setActive] = useState(rule.active);

  return (
    <div className="rounded-md border border-[#d8d0c1] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#151c25]">{rule.label}</h3>
          <p className="text-sm text-[#5c6570]">{rule.key}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={points}
            onChange={(event) => setPoints(Number(event.target.value))}
            type="number"
            min={0}
            className="h-10 w-20 rounded-md border border-[#b9ad9d] px-2 text-center"
          />
          <label className="flex h-10 items-center gap-2 rounded-md border border-[#b9ad9d] px-3 text-sm">
            <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
            Activa
          </label>
          <button
            type="button"
            onClick={() => callApi("/api/admin/scoring", "PATCH", { key: rule.key, points, active })}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white"
          >
            <Save size={16} aria-hidden="true" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
