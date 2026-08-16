import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { calcular } from "@/lib/motor";
import { SYSTEM_PLAN, userPlan } from "@/lib/plan";
import { getAnthropic, limpiarError } from "@/lib/anthropicClient";
import { enviarPlan } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const ASUNTO: Record<string, string> = {
  es: "Tu diagnóstico financiero",
  sv: "Din ekonomiska kartläggning",
  en: "Your financial check-up",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fase C: genera el plan y lo envía por email al cliente.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { email, lang } = (await req.json()) as { email?: string; lang?: string };
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Correo no válido." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const [{ data: interview }, { data: answers }] = await Promise.all([
      supabase.from("interviews").select("client_name, status").eq("id", id).single(),
      supabase
        .from("answers")
        .select("variable, value_text, value_numeric, label, details")
        .eq("interview_id", id),
    ]);

    if (!interview) return NextResponse.json({ error: "no existe" }, { status: 404 });
    if (interview.status !== "confirmada")
      return NextResponse.json({ error: "ficha no confirmada" }, { status: 409 });

    const diagnostico = calcular((answers ?? []) as never, interview.client_name);

    const anthropic: Anthropic = getAnthropic();
    const resp = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1500,
      // @ts-expect-error output_config es GA en la API aunque los tipos del SDK vayan por detrás.
      output_config: { effort: "low" },
      system: SYSTEM_PLAN,
      messages: [{ role: "user", content: userPlan(diagnostico, lang ?? "es") }],
    });

    const plan = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const asunto = ASUNTO[lang ?? "es"] ?? ASUNTO.es;
    await enviarPlan(email, asunto, plan);

    // Guarda el correo del cliente (para el asesor).
    await supabase.from("interviews").update({ client_email: email }).eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: limpiarError((e as Error).message) }, { status: 500 });
  }
}
