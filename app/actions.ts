"use server";

import { getServiceClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

/**
 * Crea una nueva entrevista y lleva al usuario a su pantalla. Recibe el idioma
 * elegido en la landing; lo registra en la ficha cuando la BD lo admite (es/sv)
 * y siempre lo propaga por la URL para que el chat arranque en ese idioma.
 */
export async function crearEntrevista(formData: FormData) {
  const supabase = getServiceClient();

  const lang = (formData.get("lang") as string) || "es";
  // La columna idioma solo admite 'es'/'sv' por ahora; 'en' viaja por la URL.
  const idioma = lang === "sv" ? "sv" : "es";

  const { data, error } = await supabase
    .from("interviews")
    .insert({ status: "en_curso", current_question: 1, idioma })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      "No se pudo crear la entrevista: " + (error?.message ?? "sin datos")
    );
  }

  redirect(`/entrevista/${data.id}?lang=${lang}`);
}
