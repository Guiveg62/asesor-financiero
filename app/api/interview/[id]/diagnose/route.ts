import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { calcular } from "@/lib/motor";

export const runtime = "nodejs";

// Devuelve el diagnóstico calculado (JSON) para una ficha confirmada.
// Reutilizable por la Fase 8 (traducir a lenguaje claro).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
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
    return NextResponse.json({ diagnostico });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
