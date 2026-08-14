import fs from "node:fs";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
};
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");

// Borra solo entrevistas de prueba: sin nombre de cliente.
const res = await fetch(`${url}/rest/v1/interviews?client_name=is.null`, {
  method: "DELETE",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: "return=representation",
  },
});
console.log("HTTP", res.status, res.statusText);
const rows = await res.json();
console.log("Filas borradas:", Array.isArray(rows) ? rows.length : rows);
