import fs from "node:fs";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");

console.log("URL:", url);
console.log("key length:", key.length);
console.log("key prefix:", key.slice(0, 8));
console.log("¿sigue el placeholder?:", key.includes("PEGA_AQUI"));

if (!url || !key || key.includes("PEGA_AQUI")) {
  console.log("\n>> La clave no está puesta correctamente en .env.local");
  process.exit(0);
}

const res = await fetch(`${url}/rest/v1/interviews?select=id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log("\nHTTP", res.status, res.statusText);
console.log("body:", await res.text());
