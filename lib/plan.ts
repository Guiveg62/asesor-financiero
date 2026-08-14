import type { Diagnostico } from "@/lib/motor";

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

// Fase 8 — "El plan en cristiano": traducir el diagnóstico técnico a lenguaje
// claro para la persona, respetando los límites de las reglas.
export const SYSTEM_PLAN = `Eres un asesor financiero explicando a una persona normal, sin conocimientos técnicos, el resultado de su diagnóstico. Traduces los números a lenguaje claro y cálido (tuteo, cercano).

Reglas estrictas:
1. Nada de jerga. Si necesitas un término sueco (ISK, tjänstepension, buffert), explícalo en media frase.
2. NUNCA garantices rentabilidades ni presentes las proyecciones como certezas: son estimaciones. Habla de rangos y de "si las cosas van como esperamos".
3. No recomiendes productos concretos (fondos o valores con nombre) ni des consejo fiscal o legal.
4. Deja claro que esto es un punto de partida y que lo revisaréis juntos con calma.
5. Breve: 3 a 5 párrafos cortos, frases sencillas. Nada de tablas ni encabezados técnicos.
6. Empieza por lo más importante: si va bien encaminado o no, y la probabilidad dicha en palabras (p. ej. "prácticamente seguro", "muy probable", "ajustado").
7. Si hay señales (deuda por revisar, colchón corto), menciónalas con suavidad como cosas a mirar, sin alarmar.

Responde SOLO con el texto dirigido a la persona. Sin títulos, sin "Aquí tienes…", sin viñetas técnicas.`;

function probaEnPalabras(p: number): string {
  if (p >= 95) return "prácticamente seguro";
  if (p >= 80) return "muy probable";
  if (p >= 60) return "probable pero no garantizado";
  if (p >= 40) return "en la cuerda floja";
  return "difícil por este camino";
}

export function idiomaNombre(lang: string): string {
  return lang === "sv" ? "sueco" : lang === "en" ? "inglés" : "español";
}

// Construye el mensaje de usuario con el diagnóstico ya resuelto.
export function userPlan(d: Diagnostico, lang: string): string {
  const idioma = idiomaNombre(lang);
  if (d.parcial) {
    return `Escribe en ${idioma}. Todavía no se puede calcular el plan porque faltan datos: ${d.faltan.join(
      ", "
    )}. Explícale con calma a la persona que necesitamos completar esos datos antes de darle una idea clara, y que su asesor los repasará con ella.`;
  }

  const senales = d.senales.length ? d.senales.join(" | ") : "ninguna relevante";
  return `Escribe el texto EN ${idioma.toUpperCase()}.

Datos del diagnóstico (tradúcelos a lenguaje claro, no los cites como tabla):
- Persona: ${d.clientName ?? "el cliente"}
- Meta: ${kr(d.meta)} para el año ${d.anioMeta} (dentro de ${Math.round((d.meses / 12) * 10) / 10} años).
- Lo que ya tiene ahorrado/invertido: ${kr(d.capital)}.
- Lo que puede apartar cada mes: ${kr(d.ahorro)}.
- Probabilidad de alcanzar la meta a este ritmo: ${d.probabilidad}% (${probaEnPalabras(
    d.probabilidad
  )}).
- Veredicto: ${d.viabilidad}.
- Si las cosas van como esperamos, hacia el año ${d.anioMeta} tendría en torno a ${kr(
    d.proyeccion.central
  )} (en un escenario prudente ${kr(d.proyeccion.prudente)}, en uno favorable ${kr(
    d.proyeccion.favorable
  )}).
- Para llegar a la meta necesitaría apartar unos ${kr(
    d.aportacionNecesaria
  )} al mes (comparado con los ${kr(d.ahorro)} que puede).
- Cómo repartir el dinero (según el tiempo hasta la meta): ${d.cartera.rv}% en bolsa, ${d.cartera.rf}% en renta fija, ${d.cartera.liq}% en liquidez. Rentabilidad esperada: alrededor del ${d.rentNeta}% al año, ya descontados impuestos (es una estimación, no una promesa).
- Señales a mirar: ${senales}.
- Calidad de los datos: ${d.etiqueta} (si es "estimado" o "pendiente", recuérdale con suavidad que algunas cifras son aproximadas y hay que verificarlas).`;
}
