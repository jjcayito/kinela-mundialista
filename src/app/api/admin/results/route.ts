import { NextResponse } from "next/server";
import { assertAdminKey, confirmMatchResult, KinelaError } from "@/lib/store";

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

export async function POST(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const payload = await request.json();
    const result = confirmMatchResult(payload);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
