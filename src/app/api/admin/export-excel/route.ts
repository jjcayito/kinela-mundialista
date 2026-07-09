import { buildExcelBuffer } from "@/lib/export-excel";
import { assertAdminKey, KinelaError } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    assertAdminKey(request.headers.get("x-admin-key") ?? url.searchParams.get("key"));
    const buffer = buildExcelBuffer();

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="kinela-mundialista.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
