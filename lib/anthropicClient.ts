import Anthropic from "@anthropic-ai/sdk";

// Limpia la clave de Anthropic aunque venga duplicada o con espacios/saltos
// (p. ej. "sk-ant-…AA sk-ant-…AA" o "sk-ant-…AAsk-ant-…AA").
export function limpiarKey(raw: string): string {
  let k = (raw || "").trim().split(/\s+/)[0];
  const segunda = k.indexOf("sk-ant", 3); // ¿aparece una segunda vez pegada?
  if (segunda > 0) k = k.slice(0, segunda);
  return k;
}

export function getAnthropic(): Anthropic {
  return new Anthropic({ apiKey: limpiarKey(process.env.ANTHROPIC_API_KEY || "") });
}

// Nunca devolver una clave en un mensaje de error hacia el cliente.
export function limpiarError(msg: string): string {
  return (msg || "").replace(/sk-ant[\w-]+/g, "[clave oculta]");
}
