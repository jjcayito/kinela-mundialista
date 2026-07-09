import { NextResponse } from "next/server";
import { buildGoogleSheetDashboardData } from "@/lib/google-sheet-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await buildGoogleSheetDashboardData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
