import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Chat from "./Chat";
import { esLang } from "@/lib/i18n";

// Pantalla de entrevista (Fases 04 + 05): el chat que habla y escucha.
export default async function EntrevistaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return <Chat interviewId={id} initialLang={esLang(lang)} />;
}
