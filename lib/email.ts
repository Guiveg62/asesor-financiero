import { Resend } from "resend";

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Envía el plan (texto en párrafos) por email vía Resend.
export async function enviarPlan(
  to: string,
  asunto: string,
  texto: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");

  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "Asesor Financiero <onboarding@resend.dev>";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b3a4b;max-width:560px">
${texto
  .split(/\n\n+/)
  .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapar(p)}</p>`)
  .join("\n")}
<hr style="border:none;border-top:1px solid #eee;margin:20px 0">
<p style="font-size:12px;color:#8a97a4">Este es un borrador orientativo para preparar tu reunión, no un consejo automático ni una garantía de rentabilidad.</p>
</div>`;

  const { error } = await resend.emails.send({ from, to, subject: asunto, html, text: texto });
  if (error) throw new Error(error.message || "No se pudo enviar el email.");
}

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

// S6 — Informe mensual del cliente (con un visual simple + el texto en su tono).
export async function enviarInformeMensual(
  to: string,
  clientName: string,
  asunto: string,
  texto: string,
  vis: { probabilidad: number; proyeccion: number; meta: number; anioMeta: number } | null
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");
  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "Asesor Financiero <onboarding@resend.dev>";

  const parrafos = texto
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapar(p)}</p>`)
    .join("\n");

  const visual = vis
    ? `<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse">
<tr>
  <td style="background:#fdeef4;border-radius:12px;padding:16px 18px;width:45%" valign="top">
    <div style="font-size:34px;font-weight:700;color:#ec2f7b;line-height:1">${vis.probabilidad}%</div>
    <div style="font-size:12px;color:#6b7a89;margin-top:4px">probabilidad de alcanzar tu meta</div>
  </td>
  <td style="width:12px"></td>
  <td style="background:#f6f8fa;border-radius:12px;padding:16px 18px" valign="top">
    <div style="font-size:20px;font-weight:700;color:#2b3a4b;line-height:1.1">${kr(vis.proyeccion)}</div>
    <div style="font-size:12px;color:#6b7a89;margin-top:4px">proyección estimada para ${vis.anioMeta} (meta: ${kr(vis.meta)})</div>
  </td>
</tr>
</table>
<div style="height:10px;background:#eef1f4;border-radius:999px;overflow:hidden;margin:0 0 22px">
  <div style="height:10px;width:${Math.max(4, Math.min(100, vis.probabilidad))}%;background:#ec2f7b"></div>
</div>`
    : "";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b3a4b;max-width:600px">
<p style="color:#ec2f7b;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 4px">Puesta al día mensual</p>
<h2 style="font-size:20px;margin:0 0 18px;color:#2b3a4b">${escapar(clientName)}</h2>
${visual}
${parrafos}
<hr style="border:none;border-top:1px solid #eee;margin:20px 0">
<p style="font-size:12px;color:#8a97a4">Resumen orientativo para preparar tu revisión, no un consejo automático ni una garantía de rentabilidad. Las cifras son estimaciones.</p>
</div>`;

  const { error } = await resend.emails.send({ from, to, subject: asunto, html, text: texto });
  if (error) throw new Error(error.message || "No se pudo enviar el email.");
}

// Resumen diario de alertas para el asesor (S5).
export async function enviarEmailAsesor(
  to: string,
  asunto: string,
  filas: { cliente: string; severidad: string; mensaje: string }[]
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");
  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "Asesor Financiero <onboarding@resend.dev>";

  const items = filas
    .map(
      (f) =>
        `<li style="margin:0 0 12px"><strong>${escapar(f.cliente)}</strong> <span style="font-size:12px;color:#8a97a4">(${escapar(
          f.severidad
        )})</span><br>${escapar(f.mensaje)}</li>`
    )
    .join("\n");

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b3a4b;max-width:600px">
<p>Buenos días. El mercado se ha movido lo suficiente para avisar a ${filas.length} cliente(s):</p>
<ul style="padding-left:18px">${items}</ul>
<p style="font-size:12px;color:#8a97a4">Aviso automático del sistema. Entra en el panel para el detalle y para decidir qué comunicar a cada cliente.</p>
</div>`;

  const texto =
    "Alertas del día:\n\n" +
    filas.map((f) => `- ${f.cliente} (${f.severidad}): ${f.mensaje}`).join("\n");

  const { error } = await resend.emails.send({ from, to, subject: asunto, html, text: texto });
  if (error) throw new Error(error.message || "No se pudo enviar el email.");
}

// S6 — Resumen para el asesor de los informes mensuales enviados directamente
// a los clientes: quién lo recibió y quién quedó fuera (y por qué).
export async function enviarResumenInformeMensual(
  to: string,
  asunto: string,
  enviados: { cliente: string; email: string }[],
  omitidos: { cliente: string; motivo: string }[]
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");
  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "Asesor Financiero <onboarding@resend.dev>";

  const filasEnviados = enviados
    .map(
      (e) =>
        `<li style="margin:0 0 6px">${escapar(e.cliente)} <span style="font-size:12px;color:#8a97a4">(${escapar(
          e.email
        )})</span></li>`
    )
    .join("\n");
  const filasOmitidos = omitidos
    .map(
      (o) =>
        `<li style="margin:0 0 6px">${escapar(o.cliente)} <span style="font-size:12px;color:#8a97a4">— ${escapar(
          o.motivo
        )}</span></li>`
    )
    .join("\n");

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b3a4b;max-width:600px">
<p>Se enviaron ${enviados.length} informe(s) mensual(es) directamente a los clientes.</p>
${
  enviados.length
    ? `<p style="margin:16px 0 6px;font-weight:600">Enviados (${enviados.length})</p><ul style="padding-left:18px">${filasEnviados}</ul>`
    : ""
}
${
  omitidos.length
    ? `<p style="margin:16px 0 6px;font-weight:600">Omitidos (${omitidos.length})</p><ul style="padding-left:18px">${filasOmitidos}</ul>`
    : ""
}
<p style="font-size:12px;color:#8a97a4">Resumen automático del cron mensual. Los clientes listados arriba ya recibieron su informe; este correo es solo para tu registro, no requiere acción.</p>
</div>`;

  const texto =
    `Informes enviados (${enviados.length}):\n` +
    enviados.map((e) => `- ${e.cliente} (${e.email})`).join("\n") +
    (omitidos.length
      ? `\n\nOmitidos (${omitidos.length}):\n` +
        omitidos.map((o) => `- ${o.cliente}: ${o.motivo}`).join("\n")
      : "");

  const { error } = await resend.emails.send({ from, to, subject: asunto, html, text: texto });
  if (error) throw new Error(error.message || "No se pudo enviar el email.");
}
