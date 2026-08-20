import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { calcular } from "@/lib/motor";
import { SYSTEM_INFORME, userInforme } from "@/lib/plan";
import { getAnthropic } from "@/lib/anthropicClient";
import { enviarInformeMensual, enviarResumenInformeMensual } from "@/lib/email";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type ResultadoInforme = {
  enviados: number;
  omitidos: number;
  clientes: number;
};

// S6: genera y envía AL CLIENTE el informe mensual de cada cliente confirmado.
// El asesor no revisa cada informe antes del envío; recibe un resumen al
// terminar (quién lo recibió y quién quedó fuera, y por qué).
export async function runInformeMensual(): Promise<ResultadoInforme> {
  if (!process.env.RESEND_API_KEY) return { enviados: 0, omitidos: 0, clientes: 0 };

  const supabase = getServiceClient();
  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, client_name, client_email, idioma, status")
    .eq("status", "confirmada");
  const clientes = interviews ?? [];
  if (clientes.length === 0) return { enviados: 0, omitidos: 0, clientes: 0 };

  const ids = clientes.map((c) => c.id);
  const { data: answers } = await supabase
    .from("answers")
    .select("interview_id, variable, value_text, value_numeric, label, details")
    .in("interview_id", ids);
  const porId = new Map<string, unknown[]>();
  (answers ?? []).forEach((a) => {
    const arr = porId.get(a.interview_id) ?? [];
    arr.push(a);
    porId.set(a.interview_id, arr);
  });

  // Alertas del último mes por cliente.
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 1);
  const { data: alerts } = await supabase
    .from("alerts")
    .select("interview_id, mensaje")
    .gte("created_at", desde.toISOString());
  const alertasPorId = new Map<string, string[]>();
  (alerts ?? []).forEach((a) => {
    const arr = alertasPorId.get(a.interview_id) ?? [];
    arr.push(a.mensaje);
    alertasPorId.set(a.interview_id, arr);
  });

  const anthropic = getAnthropic();
  const nombreMes = MESES[new Date().getMonth()];
  let enviados = 0;
  const enviadosLista: { cliente: string; email: string }[] = [];
  const omitidosLista: { cliente: string; motivo: string }[] = [];

  for (const c of clientes) {
    const nombre = c.client_name ?? "Cliente";
    const email = (c as { client_email?: string | null }).client_email;

    // Sin correo del cliente registrado: se omite este mes, no se manda al asesor.
    if (!email) {
      omitidosLista.push({ cliente: nombre, motivo: "sin client_email registrado" });
      continue;
    }

    const ans = (porId.get(c.id) ?? []) as never;
    const d = calcular(ans, c.client_name);
    const lang = c.idioma ?? "es";
    const alertasMes = alertasPorId.get(c.id) ?? [];
    try {
      const resp = await anthropic.messages.create({
        model: "claude-opus-5",
        max_tokens: 1200,
        // @ts-expect-error output_config es GA aunque los tipos del SDK vayan por detrás.
        output_config: { effort: "low" },
        system: SYSTEM_INFORME,
        messages: [{ role: "user", content: userInforme(d, alertasMes, lang) }],
      });
      const texto = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      const vis = d.parcial
        ? null
        : {
            probabilidad: d.probabilidad,
            proyeccion: d.proyeccion.central,
            meta: d.meta,
            anioMeta: d.anioMeta,
          };
      await enviarInformeMensual(
        email,
        nombre,
        `Tu puesta al día — ${nombreMes}`,
        texto,
        vis
      );
      enviados++;
      enviadosLista.push({ cliente: nombre, email });
    } catch {
      // Un fallo con un cliente no debe frenar los demás.
      omitidosLista.push({ cliente: nombre, motivo: "fallo al generar o enviar el informe" });
    }
  }

  // Resumen para el asesor: qué se envió y qué quedó fuera. No bloquea el
  // resultado si falla — los envíos a clientes ya se hicieron.
  const asesorEmail = process.env.ASESOR_EMAIL;
  if (asesorEmail && (enviadosLista.length || omitidosLista.length)) {
    try {
      await enviarResumenInformeMensual(
        asesorEmail,
        `Resumen informes mensuales — ${nombreMes}`,
        enviadosLista,
        omitidosLista
      );
    } catch {
      // idem: un fallo del resumen no debe marcar la tarea como fallida.
    }
  }

  return { enviados, omitidos: omitidosLista.length, clientes: clientes.length };
}
