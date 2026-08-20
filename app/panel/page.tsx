import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServiceClient } from "@/lib/supabase";
import { expectedToken, COOKIE } from "@/lib/auth";
import { logout, revisarMercado, generarInforme } from "./actions";

export const runtime = "nodejs";

const ESTADO: Record<string, string> = {
  en_curso: "En curso",
  resumen_pendiente: "Resumen pendiente",
  confirmada: "Confirmada",
  cerrada: "Cerrada",
};

export default async function PanelPage() {
  const c = await cookies();
  if (c.get(COOKIE)?.value !== expectedToken()) redirect("/panel/login");

  const supabase = getServiceClient();
  const [{ data: interviews }, { data: answers }] = await Promise.all([
    supabase
      .from("interviews")
      .select("id, client_name, status, idioma, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("answers").select("interview_id"),
  ]);

  // Alertas (S5). Tolerante a que la tabla aún no exista (antes de la migración 0004).
  const alertRes = await supabase
    .from("alerts")
    .select("interview_id, mensaje, severidad, leida, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const alerts = alertRes.error ? [] : alertRes.data ?? [];

  const counts = new Map<string, number>();
  (answers ?? []).forEach((a) =>
    counts.set(a.interview_id, (counts.get(a.interview_id) ?? 0) + 1)
  );

  const rows = interviews ?? [];
  const nombrePorId = new Map<string, string>();
  rows.forEach((r) => nombrePorId.set(r.id, r.client_name ?? "Sin nombre"));
  const sinLeer = alerts.filter((a) => !a.leida).length;

  return (
    <main className="panel">
      <div className="panel-top">
        <div>
          <p className="phase">Panel del asesor</p>
          <h1>Clientes</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <form action={revisarMercado}>
            <button className="panel-logout" type="submit">
              Revisar mercado ahora
            </button>
          </form>
          <form action={generarInforme}>
            <button className="panel-logout" type="submit">
              Enviar informe mensual
            </button>
          </form>
          <form action={logout}>
            <button className="panel-logout" type="submit">
              Salir
            </button>
          </form>
        </div>
      </div>

      {sinLeer > 0 && (
        <div className="panel-banner">
          {sinLeer} alerta{sinLeer === 1 ? "" : "s"} sin leer
        </div>
      )}

      {alerts.length > 0 && (
        <div className="panel-alerts">
          <h2>Alertas recientes</h2>
          <ul>
            {alerts.map((a, i) => (
              <li key={i} className={a.leida ? "leida" : ""}>
                <span
                  className={`chip ${a.severidad === "urgente" ? "pendiente" : "estimado"}`}
                >
                  {a.severidad}
                </span>
                <span className="alert-cliente">{nombrePorId.get(a.interview_id) ?? "—"}</span>
                <span className="alert-msg">{a.mensaje}</span>
                <span className="alert-fecha">
                  {new Date(a.created_at).toLocaleDateString("es-ES")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="lead">Aún no hay entrevistas.</p>
      ) : (
        <table className="panel-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Ficha</th>
              <th>Idioma</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const n = counts.get(r.id) ?? 0;
              const fecha = new Date(r.created_at).toLocaleDateString("es-ES");
              return (
                <tr key={r.id}>
                  <td>{r.client_name ?? <span className="panel-muted">Sin nombre</span>}</td>
                  <td>
                    <span className={`chip ${r.status === "confirmada" ? "confirmado" : r.status === "en_curso" ? "estimado" : "pendiente"}`}>
                      {ESTADO[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>{n}/13</td>
                  <td>{(r.idioma ?? "es").toUpperCase()}</td>
                  <td className="panel-muted">{fecha}</td>
                  <td>
                    {r.status === "confirmada" ? (
                      <Link href={`/entrevista/${r.id}/diagnostico`} className="panel-link">
                        Ver diagnóstico →
                      </Link>
                    ) : (
                      <Link href={`/entrevista/${r.id}`} className="panel-link">
                        Abrir →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
