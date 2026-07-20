import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDashboardExcelBuffer } from "../src/lib/export-excel";
import { buildGoogleSheetDashboardData } from "../src/lib/google-sheet-dashboard";

function fingerprintDashboard(dashboard: Awaited<ReturnType<typeof buildGoogleSheetDashboardData>>) {
  const payload = {
    current_phase: dashboard.current_phase,
    standings: dashboard.standings,
    matchInsights: dashboard.matchInsights,
    participantViews: dashboard.participantViews,
    metrics: dashboard.metrics,
    previousMatches: dashboard.previousMatches,
    nextMatches: dashboard.nextMatches,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function readPreviousFingerprint(path: string) {
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf8")).fingerprint ?? null;
  } catch {
    return null;
  }
}

function readStatus(path: string) {
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as { closed?: boolean };
  } catch {
    return null;
  }
}

async function main() {
  const docsDir = join(process.cwd(), "docs");
  const dataDir = join(docsDir, "data");
  mkdirSync(dataDir, { recursive: true });

  const excelPath = join(docsDir, "kinela_actualizada.xlsx");
  const statusPath = join(dataDir, "excel_actualizado.json");
  const previousStatus = readStatus(statusPath);

  if (previousStatus?.closed) {
    console.log("Torneo cerrado. Se conserva el Excel final de auditoria.");
    return;
  }

  const dashboard = await buildGoogleSheetDashboardData();
  const fingerprint = fingerprintDashboard(dashboard);
  const previousFingerprint = readPreviousFingerprint(statusPath);

  if (fingerprint === previousFingerprint) {
    console.log("Sin cambios en la data. No se regenera el Excel.");
    return;
  }

  dashboard.last_updated = new Date().toISOString();

  writeFileSync(excelPath, buildDashboardExcelBuffer(dashboard));
  writeFileSync(
    statusPath,
    `${JSON.stringify(
      {
        updated_at: dashboard.last_updated,
        standings_count: dashboard.standings.length,
        leader: dashboard.metrics.biggest_riser?.participant_name ?? null,
        leader_points: dashboard.metrics.biggest_riser?.points ?? 0,
        fingerprint,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Excel actualizado: ${excelPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
