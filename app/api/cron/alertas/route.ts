import { NextResponse } from "next/server";
import { runAlertas } from "@/lib/runAlertas";

export const runtime = "nodejs";
export const maxDuration = 60;

// Tarea diaria (Vercel Cron, 08:15). Vercel añade el header Authorization con
// CRON_SECRET automáticamente si esa variable está definida.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "no autorizado" }, { status: 401 });
    }
  }
  try {
    // ?test=-8 fuerza un movimiento (solo con el secreto correcto) para pruebas.
    const test = new URL(req.url).searchParams.get("test");
    const forzado = test !== null ? Number(test) : undefined;
    const r = await runAlertas(
      forzado !== undefined && isFinite(forzado) ? forzado : undefined
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
