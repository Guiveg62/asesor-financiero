import { NextResponse } from "next/server";
import { runInformeMensual } from "@/lib/runInforme";

export const runtime = "nodejs";
export const maxDuration = 60;

// Tarea mensual (Vercel Cron, día 1 a las 08:00). Vercel añade el header
// Authorization con CRON_SECRET automáticamente si esa variable está definida.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "no autorizado" }, { status: 401 });
    }
  }
  try {
    const r = await runInformeMensual();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
