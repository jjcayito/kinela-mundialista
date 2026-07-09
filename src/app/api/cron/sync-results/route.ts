import { NextResponse } from "next/server";
import { KinelaError, syncDemoResults } from "@/lib/store";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof KinelaError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: false, error: "Error inesperado" }, { status: 500 });
}

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const expected = process.env.CRON_SECRET || "DEMOCRON";
    const secret = request.headers.get("x-cron-secret") ?? url.searchParams.get("secret");

    if (secret !== expected) {
      throw new KinelaError("CRON_SECRET invalido", 401);
    }

    const result = syncDemoResults();

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
