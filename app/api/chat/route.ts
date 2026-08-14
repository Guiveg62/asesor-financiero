import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { construirSystemPrompt, TOOLS } from "@/lib/interviewer";
import { getAnthropic, limpiarError } from "@/lib/anthropicClient";

export const runtime = "nodejs";
export const maxDuration = 60;

type ClientMessage = { role: "user" | "assistant"; content: string };

const NOMBRE_IDIOMA: Record<string, string> = {
  es: "español",
  sv: "sueco",
  en: "inglés",
};

function kickoff(lang: string): string {
  const idioma = NOMBRE_IDIOMA[lang] ?? "español";
  return `[El cliente acaba de abrir la entrevista y ha elegido conversar en ${idioma}. Salúdalo con calidez EN ${idioma.toUpperCase()}, preséntate en una frase, pregúntale su nombre y arranca el guion. Recuerda: conversa en ${idioma}, pero los datos que guardes con las herramientas van en español.]`;
}

// Ejecuta una herramienta contra Supabase. Devuelve un texto de confirmación
// para el modelo (nunca datos sensibles nuevos).
async function ejecutarHerramienta(
  supabase: ReturnType<typeof getServiceClient>,
  interviewId: string,
  name: string,
  input: Record<string, unknown>
): Promise<{ text: string; finalizada: boolean }> {
  switch (name) {
    case "guardar_nombre": {
      await supabase
        .from("interviews")
        .update({ client_name: String(input.nombre ?? "") })
        .eq("id", interviewId);
      return { text: "Nombre guardado.", finalizada: false };
    }
    case "guardar_respuesta": {
      await supabase.from("answers").upsert(
        {
          interview_id: interviewId,
          variable: input.variable,
          value_text: input.value_text ?? null,
          value_numeric:
            typeof input.value_numeric === "number" ? input.value_numeric : null,
          label: input.label,
          details: (input.details as object) ?? {},
        },
        { onConflict: "interview_id,variable" }
      );
      return { text: `Guardada la variable "${input.variable}".`, finalizada: false };
    }
    case "registrar_tarea": {
      await supabase.from("client_tasks").insert({
        interview_id: interviewId,
        descripcion: String(input.descripcion ?? ""),
      });
      return { text: "Tarea registrada.", finalizada: false };
    }
    case "registrar_nota": {
      await supabase.from("interview_notes").insert({
        interview_id: interviewId,
        nota: String(input.nota ?? ""),
      });
      return { text: "Nota registrada.", finalizada: false };
    }
    case "finalizar_entrevista": {
      await supabase
        .from("interviews")
        .update({ status: "confirmada" })
        .eq("id", interviewId);
      return { text: "Entrevista marcada como confirmada.", finalizada: true };
    }
    default:
      return { text: `Herramienta desconocida: ${name}`, finalizada: false };
  }
}

export async function POST(req: Request) {
  try {
    const { interviewId, messages, lang } = (await req.json()) as {
      interviewId: string;
      messages: ClientMessage[];
      lang?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Falta ANTHROPIC_API_KEY en .env.local." },
        { status: 500 }
      );
    }

    const supabase = getServiceClient();
    const anthropic = getAnthropic();

    // Historial visible → mensajes de la API. Si está vacío, inyecta el arranque.
    const convo: Anthropic.MessageParam[] =
      messages && messages.length > 0
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: "user", content: kickoff(lang ?? "es") }];

    let finalizada = false;

    // Bucle agéntico manual: repetir mientras el modelo pida herramientas.
    for (let i = 0; i < 8; i++) {
      const resp = await anthropic.messages.create({
        model: "claude-opus-5",
        max_tokens: 3000,
        // @ts-expect-error output_config es GA en la API aunque los tipos del SDK puedan ir por detrás.
        output_config: { effort: "low" },
        system: construirSystemPrompt(),
        tools: TOOLS as unknown as Anthropic.Tool[],
        messages: convo,
      });

      if (resp.stop_reason === "tool_use") {
        // Devuelve el turno del asistente tal cual (preserva thinking/tool_use).
        convo.push({ role: "assistant", content: resp.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of resp.content) {
          if (block.type === "tool_use") {
            const r = await ejecutarHerramienta(
              supabase,
              interviewId,
              block.name,
              block.input as Record<string, unknown>
            );
            if (r.finalizada) finalizada = true;
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: r.text,
            });
          }
        }
        convo.push({ role: "user", content: toolResults });
        continue;
      }

      // Turno final: extrae el texto para el cliente.
      const reply = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return NextResponse.json({ reply, done: finalizada });
    }

    return NextResponse.json(
      { reply: "Disculpa, hubo un enredo procesando la conversación. ¿Podrías repetir?", done: false },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: limpiarError((e as Error).message) },
      { status: 500 }
    );
  }
}
