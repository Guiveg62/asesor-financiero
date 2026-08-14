import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getServiceClient();
    const [answers, interview] = await Promise.all([
      supabase
        .from("answers")
        .select("variable, value_text, value_numeric, label, details")
        .eq("interview_id", id),
      supabase
        .from("interviews")
        .select("client_name, status")
        .eq("id", id)
        .single(),
    ]);
    if (answers.error) throw answers.error;
    return NextResponse.json({
      client_name: interview.data?.client_name ?? null,
      status: interview.data?.status ?? "en_curso",
      answers: answers.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
