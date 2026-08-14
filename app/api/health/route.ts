import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// GET /api/health — comprobación simple de conexión a la base de datos.
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
