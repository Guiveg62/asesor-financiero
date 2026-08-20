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

// S6 — Informe mensual: puesta al día breve y cálida, incluyendo lo pasado en el mes.
export const SYSTEM_INFORME = `Eres un asesor financiero escribiendo la puesta al día MENSUAL de una persona, en tono cálido y cercano (tuteo). Es un mensaje breve de seguimiento, no un diagnóstico nuevo.

Reglas estrictas:
1. Nada de jerga. Explica en media frase cualquier término sueco necesario.
2. NUNCA garantices rentabilidades; las proyecciones son estimaciones ("si las cosas van como esperamos"). No hables de timing de mercado.
3. No recomiendes productos concretos ni des consejo fiscal o legal.
4. Si este mes hubo movimientos de mercado relevantes para la persona, menciónalos con calma y sin alarmar: qué pasó y por qué no cambia el plan de fondo (o sí, con suavidad).
5. Cierra recordando que sigues a su lado y que cualquier duda la veis juntos.
6. Muy breve: 2 o 3 párrafos cortos. Sin títulos, sin tablas, sin viñetas.

Responde SOLO con el texto para la persona.`;

export function userInforme(d: Diagnostico, alertasMes: string[], lang: string): string {
  const idioma = idiomaNombre(lang);
  if (d.parcial) {
    return `Escribe en ${idioma}. Este mes aún no podemos dar cifras porque falta completar datos (${d.faltan.join(
      ", "
    )}). Escríbele una nota breve y cálida diciendo que en cuanto completéis esos datos tendrá su puesta al día, y que sigues a su disposición.`;
  }
  const eventos = alertasMes.length
    ? alertasMes.join(" | ")
    : "sin movimientos de mercado relevantes para esta persona este mes";
  return `Escribe el texto EN ${idioma.toUpperCase()}. Es la puesta al día mensual de ${d.clientName ?? "el cliente"}.

Situación (tradúcelo a lenguaje claro, no lo cites como datos):
- Meta: ${kr(d.meta)} para ${d.anioMeta}. A este ritmo, probabilidad de alcanzarla: ${d.probabilidad}% (${probaEnPalabras(
    d.probabilidad
  )}).
- Si todo va como esperamos, hacia ${d.anioMeta} tendría en torno a ${kr(d.proyeccion.central)}.
- Lo que pasó este mes: ${eventos}.
- Recuerda que las cifras son estimaciones y que su asesor está a su lado.`;
}
