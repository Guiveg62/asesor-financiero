import fs from "node:fs";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
};
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
const H = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// 1) Crear entrevista (con nombre, para simular una completa)
const iRes = await fetch(`${url}/rest/v1/interviews`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ client_name: "Alberto", status: "confirmada", current_question: 14 }),
});
const [interview] = await iRes.json();
console.log("Entrevista:", interview.id);

// 2) Sembrar las 13 respuestas
const answers = [
  ["edad", "64 años", 64, "confirmado"],
  ["empleo_contrato", "Jefe en una ONG · tillsvidareanställning", null, "confirmado"],
  ["tjanstepension", "Sí — el empleador tiene kollektivavtal", null, "confirmado"],
  ["akassa_inkomstforsakring", "A-kassa: sí · inkomstförsäkring: sí", null, "confirmado"],
  ["ingresos_netos", "~40 000 kr/mes", 40000, "estimado"],
  ["capacidad_ahorro", "~5 000 kr/mes", 5000, "estimado"],
  ["capital_actual", "~300 000 kr, mayoría en ISK", 300000, "estimado"],
  ["pension_proyectada", "~34 000 kr/mes (minPension)", 34000, "estimado"],
  ["deudas", "Bolån: sí, sin amortizar · CSN: no · consumo: pequeño", null, "pendiente"],
  ["buffert", "~3 meses de gastos", 3, "estimado"],
  ["perfil_riesgo", "moderado", null, "confirmado"],
  ["pareja", "Gift (casado) · economía mixta", null, "confirmado"],
  ["meta", "~100 000 kr para 2029", 100000, "estimado"],
];

const rows = answers.map(([variable, value_text, value_numeric, label]) => ({
  interview_id: interview.id,
  variable,
  value_text,
  value_numeric,
  label,
  details: variable === "meta" ? { anio: 2029 } : {},
}));

const aRes = await fetch(`${url}/rest/v1/answers`, {
  method: "POST",
  headers: H,
  body: JSON.stringify(rows),
});
console.log("Respuestas insertadas:", aRes.status, (await aRes.json()).length);
console.log(`\nAbre: http://localhost:3000/entrevista/${interview.id}?lang=es`);
