import { getServiceClient } from "@/lib/supabase";
import { movimientoDelDia, MERCADO_NOMBRE } from "@/lib/market";
import { pesoRentaVariable } from "@/lib/motor";

// Umbral de "movimiento relevante" por perfil (reglas del asesor).
const UMBRAL: Record<string, number> = {
  conservador: 3,
  moderado: 4,
  dinamico: 6,
};

type Fila = {
  variable: string;
  value_text: string | null;
  value_numeric: number | null;
  details: Record<string, unknown> | null;
};

export type ResultadoAlertas = {
  mercadoPct: number;
  revisados: number;
  nuevas: number;
};

// Revisa el mercado y registra una alerta por cada cliente al que le afecta hoy.
// Por ahora solo actúa con CAÍDAS del día. Dedup: máximo una alerta de umbral
// por cliente y día.
export async function runAlertas(cambioForzado?: number): Promise<ResultadoAlertas> {
  const mov =
    cambioForzado !== undefined
      ? { fecha: new Date().toISOString().slice(0, 10), cambioPct: cambioForzado }
      : await movimientoDelDia();
  const supabase = getServiceClient();

  // Solo caídas relevantes (por ahora).
  if (mov.cambioPct >= 0) {
    return { mercadoPct: mov.cambioPct, revisados: 0, nuevas: 0 };
  }

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, status")
    .eq("status", "confirmada");
  const clientes = interviews ?? [];
  if (clientes.length === 0) {
    return { mercadoPct: mov.cambioPct, revisados: 0, nuevas: 0 };
  }

  const ids = clientes.map((c) => c.id);
  const { data: answers } = await supabase
    .from("answers")
    .select("interview_id, variable, value_text, value_numeric, details")
    .in("interview_id", ids);

  const porId = new Map<string, Fila[]>();
  (answers ?? []).forEach((a) => {
    const arr = porId.get(a.interview_id) ?? [];
    arr.push(a as unknown as Fila);
    porId.set(a.interview_id, arr);
  });

  // Dedup: quién ya tiene alerta de umbral hoy.
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: existentes } = await supabase
    .from("alerts")
    .select("interview_id")
    .eq("tipo", "umbral")
    .gte("created_at", `${hoy}T00:00:00Z`);
  const yaHoy = new Set((existentes ?? []).map((a) => a.interview_id));

  let revisados = 0;
  const insertar: Record<string, unknown>[] = [];

  for (const iv of clientes) {
    revisados++;
    if (yaHoy.has(iv.id)) continue;
    const w = pesoRentaVariable(porId.get(iv.id) ?? []);
    if (!w) continue;

    const impacto = mov.cambioPct * (w.rv / 100); // negativo
    const umbral = UMBRAL[w.perfil] ?? 4;
    if (Math.abs(impacto) >= umbral) {
      const severidad = Math.abs(impacto) >= umbral * 1.5 ? "urgente" : "aviso";
      const mensaje = `${MERCADO_NOMBRE} cayó ${mov.cambioPct.toFixed(
        1
      )}% hoy. Con su cartera (~${w.rv}% en renta variable), el impacto estimado es ~${impacto.toFixed(
        1
      )}%, por encima de su umbral (${umbral}% · perfil ${w.perfil}).`;
      insertar.push({ interview_id: iv.id, tipo: "umbral", severidad, mensaje });
    }
  }

  if (insertar.length > 0) {
    await supabase.from("alerts").insert(insertar);
  }
  return { mercadoPct: mov.cambioPct, revisados, nuevas: insertar.length };
}
