// =============================================================================
// MÓDULO 2 · Motor de análisis (Fase 7)
// Cálculo determinista (nunca "de cabeza") aplicando:
//   - reglas-recomendacion.md §5 (rentabilidades) y §3.2 (horizonte)
//   - supuestos.md (fiscalidad, inflación, umbrales)
// Las cifras van con la etiqueta más débil de sus insumos; si un dato
// imprescindible está pendiente, no se proyecta (informe parcial).
// =============================================================================

// --- Constantes (fuente: reglas-recomendacion.md §5.2 / §3.1 / supuestos.md) ---
const CLASE = { rv: 7.0, rf: 2.0, liq: 1.0 }; // reglas §5.2 (pendiente aprobación)
const VOL = { rv: 15, rf: 5, liq: 1 }; // volatilidad anual — SUPUESTO del motor, pendiente del asesor
const ISK_UMBRAL = 300000; // supuestos.md
const SCHABLON = 1.065; // % anual sobre el exceso ISK/KF > umbral
const SPARKONTO_TAX = 0.3; // 30% sobre intereses de sparkonto
const TOPE_PRUDENTE = 0.85; // 80–90% del flujo libre (reglas §2) → uso 85%
const BANDA = 1.2; // sensibilidad ± para escenarios de cartera intermedia (pendiente)
const ANIO_ACTUAL = 2026;

export type Etiqueta = "confirmado" | "estimado" | "pendiente";
type Answer = {
  variable: string;
  value_text: string | null;
  value_numeric: number | null;
  label: Etiqueta;
  details?: Record<string, unknown> | null;
};

type Perfil = "conservador" | "moderado" | "dinamico";

export type Diagnostico =
  | {
      parcial: true;
      faltan: string[];
      clientName: string | null;
    }
  | {
      parcial: false;
      clientName: string | null;
      etiqueta: Etiqueta;
      // Entradas
      capital: number;
      ahorro: number;
      meta: number;
      anioMeta: number;
      meses: number;
      perfil: Perfil;
      // Cartera (regla de horizonte)
      cartera: { rv: number; rf: number; liq: number };
      rentBruta: number;
      rentNeta: number;
      // Resultados
      caminoPct: number;
      proyeccion: { prudente: number; central: number; favorable: number };
      gap: number;
      aportacionNecesaria: number;
      topePrudente: number;
      viabilidad: "viable a ritmo actual" | "viable con ajustes" | "no viable a ritmo actual";
      probabilidad: number; // % de alcanzar la meta al ritmo actual
      senales: string[];
    };

// --- utilidades ---
const num = (a?: Answer) =>
  a && typeof a.value_numeric === "number" ? a.value_numeric : null;
const milesRound = (x: number) => Math.round(x / 1000) * 1000;

function normPerfil(txt: string | null): Perfil | null {
  const t = (txt ?? "").toLowerCase();
  if (t.includes("conserv")) return "conservador";
  if (t.includes("dinam") || t.includes("dinám") || t.includes("agres")) return "dinamico";
  if (t.includes("moder")) return "moderado";
  return null;
}

function debil(labels: Etiqueta[]): Etiqueta {
  if (labels.includes("pendiente")) return "pendiente";
  if (labels.includes("estimado")) return "estimado";
  return "confirmado";
}

// Cartera según el horizonte manda sobre el perfil (reglas §3.2).
function cartera(years: number, perfil: Perfil): { rv: number; rf: number; liq: number } {
  if (years > 10) {
    if (perfil === "conservador") return { rv: 30, rf: 60, liq: 10 };
    if (perfil === "dinamico") return { rv: 88, rf: 12, liq: 0 };
    return { rv: 60, rf: 35, liq: 5 };
  }
  let rv: number;
  if (years >= 5) rv = 45;
  else if (years >= 3) rv = 25;
  else if (years >= 1) rv = 10;
  else rv = 0;
  // Ajusta si el perfil es más prudente que el techo de horizonte
  if (perfil === "conservador") rv = Math.min(rv, 30);
  const liq = 10;
  return { rv, rf: Math.max(0, 100 - rv - liq), liq };
}

function rentabilidades(c: { rv: number; rf: number; liq: number }, capital: number) {
  const bruta = (c.rv * CLASE.rv + c.rf * CLASE.rf + c.liq * CLASE.liq) / 100;
  // Fiscalidad (supuestos.md): 30% sobre intereses de sparkonto (RF+liq),
  // schablonskatt sobre el exceso ISK/KF (RV en ISK).
  const dragSpar = ((c.rf * CLASE.rf + c.liq * CLASE.liq) / 100) * SPARKONTO_TAX;
  const excesoFrac = capital > ISK_UMBRAL ? (capital - ISK_UMBRAL) / capital : 0;
  const dragIsk = SCHABLON * excesoFrac;
  const neta = Math.max(0, bruta - dragSpar - dragIsk);
  return { bruta, neta };
}

// Valor futuro: capital inicial capitalizado + aportación mensual (fin de mes).
function fv(capital: number, pmt: number, annualPct: number, meses: number): number {
  const rm = Math.pow(1 + annualPct / 100, 1 / 12) - 1;
  const fvCapital = capital * Math.pow(1 + rm, meses);
  const fvPmt = rm === 0 ? pmt * meses : pmt * ((Math.pow(1 + rm, meses) - 1) / rm);
  return fvCapital + fvPmt;
}

// Aportación mensual necesaria para alcanzar la meta al ritmo/rent. central.
function pmtNecesaria(capital: number, meta: number, annualPct: number, meses: number): number {
  const rm = Math.pow(1 + annualPct / 100, 1 / 12) - 1;
  const restante = meta - capital * Math.pow(1 + rm, meses);
  if (restante <= 0) return 0;
  const factor = rm === 0 ? meses : (Math.pow(1 + rm, meses) - 1) / rm;
  return restante / factor;
}

// RNG determinista (LCG) + Box-Muller, para que la misma ficha dé la misma probabilidad.
function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function gauss(r: () => number): number {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Probabilidad de alcanzar la meta al ritmo actual (Monte Carlo).
function probabilidad(
  capital: number,
  pmt: number,
  netaPct: number,
  volPct: number,
  meta: number,
  meses: number,
  seed: number
): number {
  const rm = Math.pow(1 + netaPct / 100, 1 / 12) - 1;
  const volM = volPct / 100 / Math.sqrt(12);
  const N = 3000;
  const rng = makeRng(seed);
  let ok = 0;
  for (let i = 0; i < N; i++) {
    let v = capital;
    for (let m = 0; m < meses; m++) {
      const r = rm + volM * gauss(rng);
      v = v * (1 + r) + pmt;
    }
    if (v >= meta) ok++;
  }
  return Math.round((ok / N) * 100);
}

export function calcular(answers: Answer[], clientName: string | null): Diagnostico {
  const by = (v: string) => answers.find((a) => a.variable === v);
  const aCapital = by("capital_actual");
  const aAhorro = by("capacidad_ahorro");
  const aMeta = by("meta");
  const aPerfil = by("perfil_riesgo");

  const capital = num(aCapital);
  const ahorro = num(aAhorro);
  const meta = num(aMeta);
  const anioMeta = aMeta?.details && typeof (aMeta.details as any).anio === "number"
    ? ((aMeta.details as any).anio as number)
    : null;
  const perfil = normPerfil(aPerfil?.value_text ?? null);

  // Imprescindibles: meta (importe+año), capital, ahorro, perfil.
  const faltan: string[] = [];
  if (capital == null || aCapital?.label === "pendiente") faltan.push("capital actual");
  if (ahorro == null || aAhorro?.label === "pendiente") faltan.push("capacidad de ahorro");
  if (meta == null) faltan.push("importe de la meta");
  if (anioMeta == null) faltan.push("año de la meta");
  if (!perfil) faltan.push("perfil de riesgo");

  if (faltan.length > 0 || capital == null || ahorro == null || meta == null || anioMeta == null || !perfil) {
    return { parcial: true, faltan, clientName };
  }

  const meses = Math.max(1, Math.round((anioMeta - ANIO_ACTUAL) * 12));
  const cart = cartera((anioMeta - ANIO_ACTUAL), perfil);
  const { bruta, neta } = rentabilidades(cart, capital);

  const rPrudente = Math.max(0, neta - BANDA);
  const rFavorable = neta + BANDA;

  const proyeccion = {
    prudente: milesRound(fv(capital, ahorro, rPrudente, meses)),
    central: milesRound(fv(capital, ahorro, neta, meses)),
    favorable: milesRound(fv(capital, ahorro, rFavorable, meses)),
  };

  const caminoPct = Math.round((capital / meta) * 100);
  const gap = milesRound(meta - proyeccion.central);
  const aportacionNecesaria = Math.round(pmtNecesaria(capital, meta, neta, meses) / 50) * 50;
  const topePrudente = Math.round((ahorro * TOPE_PRUDENTE) / 50) * 50;

  let viabilidad: "viable a ritmo actual" | "viable con ajustes" | "no viable a ritmo actual";
  if (aportacionNecesaria <= topePrudente) viabilidad = "viable a ritmo actual";
  else if (aportacionNecesaria <= ahorro) viabilidad = "viable con ajustes";
  else viabilidad = "no viable a ritmo actual";

  const volP = (cart.rv * VOL.rv + cart.rf * VOL.rf + cart.liq * VOL.liq) / 100;
  const seed = Math.round(capital + ahorro * 7 + meta * 13 + meses * 101);
  const prob = probabilidad(capital, ahorro, neta, volP, meta, meses, seed);

  // Señales (reglas §1 y supuestos.md)
  const senales: string[] = [];
  const aDeudas = by("deudas");
  if (aDeudas && /consumo/i.test(aDeudas.value_text ?? "") && aDeudas.label === "pendiente")
    senales.push("Deuda de consumo sin cuantificar: si el interés supera el 6% se antepone a la inversión (reglas §1).");
  const aBuffert = by("buffert");
  if (aBuffert && (num(aBuffert) ?? 99) < 2)
    senales.push("Buffert por debajo de la referencia (2–3 meses).");

  const etiqueta = debil([
    aCapital!.label,
    aAhorro!.label,
    aMeta!.label,
    aPerfil!.label,
  ]);

  return {
    parcial: false,
    clientName,
    etiqueta,
    capital,
    ahorro,
    meta,
    anioMeta,
    meses,
    perfil,
    cartera: cart,
    rentBruta: Math.round(bruta * 100) / 100,
    rentNeta: Math.round(neta * 100) / 100,
    caminoPct,
    proyeccion,
    gap,
    aportacionNecesaria,
    topePrudente,
    viabilidad,
    probabilidad: prob,
    senales,
  };
}

// Para las alertas (S5): % en renta variable de un cliente, según su perfil y
// horizonte, reutilizando la regla de cartera. null si faltan datos.
export function pesoRentaVariable(
  answers: {
    variable: string;
    value_text: string | null;
    value_numeric: number | null;
    details?: Record<string, unknown> | null;
  }[]
): { perfil: Perfil; rv: number } | null {
  const by = (v: string) => answers.find((a) => a.variable === v);
  const perfil = normPerfil(by("perfil_riesgo")?.value_text ?? null);
  const aMeta = by("meta");
  const anio =
    aMeta?.details && typeof (aMeta.details as { anio?: unknown }).anio === "number"
      ? ((aMeta.details as { anio: number }).anio)
      : null;
  if (!perfil || anio == null) return null;
  return { perfil, rv: cartera(anio - ANIO_ACTUAL, perfil).rv };
}
