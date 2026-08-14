import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calcular } from "@/lib/motor";
import PlanCristiano from "./PlanCristiano";

export const runtime = "nodejs";

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

// Página del asesor (Fase 7). Corre el motor sobre la ficha confirmada.
export default async function DiagnosticoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceClient();

  const [{ data: interview }, { data: answers }] = await Promise.all([
    supabase.from("interviews").select("client_name, status").eq("id", id).single(),
    supabase
      .from("answers")
      .select("variable, value_text, value_numeric, label, details")
      .eq("interview_id", id),
  ]);

  if (!interview) notFound();

  if (interview.status !== "confirmada") {
    return (
      <main className="diag">
        <p className="phase">Diagnóstico · asesor</p>
        <h1>Ficha no confirmada</h1>
        <p className="lead">
          El motor solo calcula sobre una ficha confirmada por el cliente (Fase 6).
          Estado actual: <code>{interview.status}</code>.
        </p>
        <Link href={`/entrevista/${id}`} className="back">← Volver a la entrevista</Link>
      </main>
    );
  }

  const d = calcular((answers ?? []) as never, interview.client_name);

  return (
    <main className="diag">
      <div className="diag-warn">BORRADOR para el asesor · no entregar al cliente</div>
      <p className="phase">Diagnóstico · asesor</p>
      <h1>{d.clientName ?? "Cliente"} — dónde está</h1>

      {d.parcial ? (
        <div className="card">
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Informe parcial</p>
          <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>
            No se puede proyectar: faltan datos imprescindibles.
          </p>
          <ul>
            {d.faltan.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="diag-hero">
            <div className="diag-prob">
              <span className="diag-prob-num">{d.probabilidad}%</span>
              <span className="diag-prob-lbl">probabilidad de alcanzar la meta al ritmo actual</span>
            </div>
            <div className={`diag-verdict v-${d.viabilidad.startsWith("viable a") ? "ok" : d.viabilidad.startsWith("viable con") ? "warn" : "bad"}`}>
              {d.viabilidad}
            </div>
          </div>

          <h2>Dónde está</h2>
          <table className="diag-table">
            <tbody>
              <tr><td>Capital actual</td><td>{kr(d.capital)}</td></tr>
              <tr><td>Meta</td><td>{kr(d.meta)} · año {d.anioMeta} ({Math.round(d.meses / 12 * 10) / 10} años)</td></tr>
              <tr><td>Camino recorrido</td><td>{d.caminoPct}% <span className="diag-note">(capital ÷ meta; si el capital es asignable la meta ya estaría cubierta — pendiente de criterio del asesor)</span></td></tr>
              <tr><td>Proyección (neto, 3 escenarios)</td><td>{kr(d.proyeccion.prudente)} · <strong>{kr(d.proyeccion.central)}</strong> · {kr(d.proyeccion.favorable)}</td></tr>
              <tr><td>Gap frente a la meta</td><td>{d.gap <= 0 ? "sin gap (la proyección supera la meta)" : kr(d.gap)}</td></tr>
            </tbody>
          </table>

          <h2>Aportación</h2>
          <table className="diag-table">
            <tbody>
              <tr><td>Necesaria para la meta</td><td>{kr(d.aportacionNecesaria)}/mes</td></tr>
              <tr><td>Actual (capacidad declarada)</td><td>{kr(d.ahorro)}/mes</td></tr>
              <tr><td>Tope prudente (≈85% del flujo libre)</td><td>{kr(d.topePrudente)}/mes</td></tr>
            </tbody>
          </table>

          <h2>Cartera propuesta (la regla de horizonte manda)</h2>
          <table className="diag-table">
            <tbody>
              <tr><td>Renta variable</td><td>{d.cartera.rv}%</td></tr>
              <tr><td>Renta fija</td><td>{d.cartera.rf}%</td></tr>
              <tr><td>Liquidez / sparkonto</td><td>{d.cartera.liq}%</td></tr>
              <tr><td>Rentabilidad esperada</td><td>{d.rentBruta}% bruta · <strong>{d.rentNeta}% neta</strong></td></tr>
            </tbody>
          </table>

          {d.senales.length > 0 && (
            <>
              <h2>Señales</h2>
              <ul>{d.senales.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}

          <h2>Supuestos aplicados</h2>
          <ul className="diag-supuestos">
            <li>Rentabilidad por clase: RV 7,0% · RF 2,0% · liquidez 1,0% (<code>reglas-recomendacion.md §5.2</code>, pendiente de aprobación).</li>
            <li>Regla de horizonte: el tiempo a la meta limita la renta variable (<code>§3.2</code>).</li>
            <li>Fiscalidad: schablonskatt 1,065% sobre el exceso de 300 000 kr en ISK/KF; 30% sobre intereses de sparkonto (<code>supuestos.md</code>).</li>
            <li>Bandas de escenarios (±1,2%) y volatilidad por clase (RV 15% · RF 5% · liq 1%): <strong>supuestos del motor, pendientes de aprobación del asesor</strong>.</li>
            <li>Capitalización mensual; resultados redondeados a miles de kr.</li>
          </ul>

          <h2>Calidad del dato</h2>
          <p>
            Etiqueta heredada (la más débil de los insumos):{" "}
            <span className={`chip ${d.etiqueta}`}>{d.etiqueta}</span>.{" "}
            {d.etiqueta !== "confirmado" && "Los resultados son orientativos: hay datos estimados o pendientes que el asesor debe verificar."}
          </p>

          <PlanCristiano interviewId={id} />
        </>
      )}

      <p style={{ marginTop: 28 }}>
        <Link href={`/entrevista/${id}`} className="back">← Volver a la entrevista</Link>
      </p>
    </main>
  );
}
