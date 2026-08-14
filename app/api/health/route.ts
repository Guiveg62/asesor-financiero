import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// GET /api/health — diagnóstico de entorno + conexión a la base de datos.
// Devuelve 200 siempre (con ok:false y el detalle) para poder leerlo desde fuera.
// No expone valores secretos: solo si están presentes, su longitud y prefijo.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: url
      ? { present: true, len: url.length, starts: url.slice(0, 12) }
      : { present: false },
    SUPABASE_SERVICE_ROLE_KEY: key
      ? { present: true, len: key.length, starts: key.slice(0, 8) }
      : { present: false },
    ANTHROPIC_API_KEY_present: !!process.env.ANTHROPIC_API_KEY,
    ASESOR_PASSWORD_present: !!process.env.ASESOR_PASSWORD,
  };

  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({ ok: false, stage: "query", env, message: error.message, code: error.code });
    }
    return NextResponse.json({ ok: true, db: "conectada", interviews: count ?? 0, env });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ ok: false, stage: "exception", env, message: err.message, name: err.name });
  }
}
