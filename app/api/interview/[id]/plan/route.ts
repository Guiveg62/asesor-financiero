import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { calcular } from "@/lib/motor";
import { SYSTEM_PLAN, userPlan } from "@/lib/plan";

export const runtime = "nodejs";
export const maxDuration = 60;

// Fase 8: genera el plan en lenguaje claro a partir del diagnóstico.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Falta ANTHROPIC_API_KEY en .env.local." },
        { status: 500 }
      );
    }

    const { lang } = (await req.json().catch(() => ({}))) as { lang?: string };

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

    const anthropic = new Anthropic();
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

    return NextResponse.json({ plan, parcial: diagnostico.parcial });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
