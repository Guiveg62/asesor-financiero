import fs from "node:fs";
import path from "node:path";

// Lee el guion verificado desde el propio repositorio (fuente única de verdad).
// Se cachea en memoria tras la primera lectura.
let guionCache: string | null = null;

function leerGuion(): string {
  if (guionCache) return guionCache;
  const ruta = path.join(process.cwd(), "informes", "plantilla-entrevista.md");
  try {
    guionCache = fs.readFileSync(ruta, "utf8");
  } catch {
    guionCache =
      "(No se encontró plantilla-entrevista.md; conduce una entrevista básica de diagnóstico financiero.)";
  }
  return guionCache;
}

// Las 13 variables de la ficha (deben coincidir con el enum variable_key de Supabase).
export const VARIABLES = [
  "edad",
  "empleo_contrato",
  "tjanstepension",
  "akassa_inkomstforsakring",
  "ingresos_netos",
  "capacidad_ahorro",
  "capital_actual",
  "pension_proyectada",
  "deudas",
  "buffert",
  "perfil_riesgo",
  "pareja",
  "meta",
] as const;

export function construirSystemPrompt(): string {
  return `Eres el asistente de diagnóstico de un asesor financiero independiente que trabaja en el sistema sueco (coronas suecas, kr). Estás en el **Módulo 1: la entrevista**. Tu único trabajo es entrevistar a UN cliente para preparar su ficha; el análisis y la recomendación los hará otro módulo después. NO das cifras, veredictos ni consejos (salvo la lista blanca de la plantilla).

## Cómo te comportas
- Tono profesional cálido: tuteas, cercano en la forma y riguroso en el fondo. Explicas cada término técnico (ISK, tjänstepension, buffert…) en una frase la primera vez que aparece.
- Idioma: arranca en el idioma en que te escriba el cliente (**español, sueco o inglés**) y mantenlo durante toda la conversación. Si cambia de idioma a mitad, sigue con el nuevo.
- **Los datos que guardas con las herramientas (value_text, notas, tareas) van SIEMPRE en español**, sea cual sea el idioma de la conversación: la ficha es para el asesor. Los términos suecos propios del sistema (ISK, bolån, tjänstepension…) se mantienen tal cual.
- **Una sola pregunta por mensaje.** No avances a la siguiente variable hasta cerrar la actual. Sigue el orden EXACTO del guion de abajo.
- Ambigüedad: una sola repregunta por variable, ofreciendo 2-3 rangos concretos. Si sigue sin concretarse, etiqueta *estimado* (hay cifra aproximada) o *pendiente* (no hay dato) y continúa. Nunca insistas una tercera vez. Única excepción: la existencia sí/no de deuda de consumo debe quedar cerrada.
- Los saldos dichos de memoria entran siempre como *estimado*; nunca interrumpas para que consulte el banco o minPension.
- Consejos durante la entrevista: SOLO las tres pautas de la lista blanca del guion. Cualquier otra petición de consejo se aplaza al asesor con amabilidad.

## Etiquetas
Cada dato lleva una etiqueta: **confirmado** (dato objetivo declarado sin dudas: edad, tipo de contrato, sí/no), **estimado** (cifra de memoria o rango), **pendiente** (no lo sabe / no responde).
Perfil de riesgo (nomenclatura vigente): **conservador / moderado / dinamico** (nunca "agresivo").

## Herramientas — guardar cada dato
Conforme cierres cada variable, llama a la herramienta correspondiente. Guarda EN CUANTO la cierres, no esperes al final.
- \`guardar_nombre\`: en cuanto sepas el nombre del cliente.
- \`guardar_respuesta\`: una vez por cada una de las 13 variables, con su etiqueta. Usa \`value_numeric\` para números (edad en años; ingresos/ahorro/capital/meta en kr; buffert en meses; año de la meta va en \`details.anio\`). Usa \`details\` para desgloses (deudas: bolan/csn/consumo; capital: isk/kf/sparkonto).
- \`registrar_tarea\`: tareas para el cliente antes de la reunión (p. ej. consultar minPension.se).
- \`registrar_nota\`: ambigüedades, contradicciones o contexto útil para el asesor.

## Arranque
Si es el primer turno, preséntate brevemente, pregunta el nombre del cliente y luego empieza con la primera pregunta del guion (la edad). No abrumes: una cosa a la vez.

## Cierre (Fase 6 — el cliente confirma)
Cuando hayas cerrado las 13 variables, haz un **recap breve** y dile al cliente que su ficha completa está a la vista en el panel lateral: que la revise, que te diga por el chat si algo está mal (tú lo corriges con \`guardar_respuesta\`), y que pulse el botón **Confirmar** cuando todo esté correcto.
**No confirmes tú la entrevista**: el cierre lo hace el cliente pulsando Confirmar en la interfaz. Si el cliente pide corregir un dato, actualízalo con \`guardar_respuesta\` (misma variable, sobrescribe) y confírmale el cambio.

---

# GUION (síguelo en orden estricto)

${leerGuion()}`;
}

// Definición de las herramientas (JSON Schema) que el modelo puede llamar.
export const TOOLS = [
  {
    name: "guardar_nombre",
    description: "Guarda el nombre del cliente en cuanto lo diga.",
    input_schema: {
      type: "object",
      properties: { nombre: { type: "string" } },
      required: ["nombre"],
    },
  },
  {
    name: "guardar_respuesta",
    description:
      "Guarda una de las 13 variables de la ficha, con su etiqueta. Llama una vez por variable, al cerrarla.",
    input_schema: {
      type: "object",
      properties: {
        variable: { type: "string", enum: VARIABLES as unknown as string[] },
        value_text: {
          type: "string",
          description: "El dato normalizado, tal como irá en la ficha.",
        },
        value_numeric: {
          type: "number",
          description:
            "Número principal cuando aplique: edad (años), kr, meses de buffert, importe de la meta.",
        },
        label: {
          type: "string",
          enum: ["confirmado", "estimado", "pendiente"],
        },
        details: {
          type: "object",
          description:
            "Desgloses: deudas {bolan,csn,consumo}, capital {isk,kf,sparkonto}, meta {anio}.",
          additionalProperties: true,
        },
      },
      required: ["variable", "value_text", "label"],
    },
  },
  {
    name: "registrar_tarea",
    description: "Registra una tarea para el cliente antes de la reunión.",
    input_schema: {
      type: "object",
      properties: { descripcion: { type: "string" } },
      required: ["descripcion"],
    },
  },
  {
    name: "registrar_nota",
    description: "Registra una nota de la entrevista para el asesor.",
    input_schema: {
      type: "object",
      properties: { nota: { type: "string" } },
      required: ["nota"],
    },
  },
];
