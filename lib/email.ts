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
