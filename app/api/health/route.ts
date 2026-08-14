import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/health — comprobación de conexión a la base de datos.
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true });
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          stage: "query",
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      db: "conectada",
      interviews: count ?? 0,
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { ok: false, stage: "exception", message: err.message, name: err.name },
      { status: 500 }
    );
  }
}
