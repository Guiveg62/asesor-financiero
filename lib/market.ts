// Lectura del mercado (S5). Fuente: Yahoo Finance (JSON, sin API key).
// Índice por defecto: S&P 500 (^GSPC) como proxy de renta variable global.
// Cambia MERCADO_SIMBOLO por otro índice si el asesor lo prefiere
// (p. ej. ^OMX = OMX Stockholm 30, ^STOXX = Euro Stoxx).
export const MERCADO_SIMBOLO = process.env.MERCADO_SIMBOLO || "^GSPC";
export const MERCADO_NOMBRE = process.env.MERCADO_NOMBRE || "la bolsa";

// Cambio porcentual del último día de cotización (cierre vs cierre anterior).
export async function movimientoDelDia(): Promise<{ fecha: string; cambioPct: number }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    MERCADO_SIMBOLO
  )}?range=7d&interval=1d`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 AsesorFinanciero/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo Finance respondió ${res.status}`);

  const j = (await res.json()) as {
    chart?: {
      result?: {
        timestamp?: number[];
        indicators?: { quote?: { close?: (number | null)[] }[] };
      }[];
    };
  };
  const r = j.chart?.result?.[0];
  const closes = (r?.indicators?.quote?.[0]?.close ?? []).filter(
    (x): x is number => typeof x === "number"
  );
  const ts = r?.timestamp ?? [];
  const hoy = new Date().toISOString().slice(0, 10);

  if (closes.length < 2) return { fecha: hoy, cambioPct: 0 };

  const c1 = closes[closes.length - 1];
  const c0 = closes[closes.length - 2];
  const fecha = ts.length
    ? new Date(ts[ts.length - 1] * 1000).toISOString().slice(0, 10)
    : hoy;

  if (!isFinite(c0) || c0 === 0) return { fecha, cambioPct: 0 };
  return { fecha, cambioPct: ((c1 - c0) / c0) * 100 };
}
