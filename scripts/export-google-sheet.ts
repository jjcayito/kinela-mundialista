import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDashboardExcelBuffer } from "../src/lib/export-excel";
import { buildGoogleSheetDashboardData } from "../src/lib/google-sheet-dashboard";

async function main() {
  const docsDir = join(process.cwd(), "docs");
  const dataDir = join(docsDir, "data");
  mkdirSync(dataDir, { recursive: true });

  const dashboard = await buildGoogleSheetDashboardData();
  const excelPath = join(docsDir, "kinela_actualizada.xlsx");
  const statusPath = join(dataDir, "excel_actualizado.json");

  writeFileSync(excelPath, buildDashboardExcelBuffer(dashboard));
  writeFileSync(
    statusPath,
    `${JSON.stringify(
      {
        updated_at: dashboard.last_updated,
        standings_count: dashboard.standings.length,
        leader: dashboard.metrics.biggest_riser?.participant_name ?? null,
        leader_points: dashboard.metrics.biggest_riser?.points ?? 0,
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
