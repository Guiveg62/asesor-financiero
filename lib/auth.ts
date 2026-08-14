import { createHash } from "node:crypto";

// Contraseña del asesor. Por defecto "asesor" para poder probar sin configurar
// nada; en producción se define ASESOR_PASSWORD en el entorno.
function password(): string {
  return process.env.ASESOR_PASSWORD || "asesor";
}

export function passwordOk(input: string): boolean {
  return input === password();
}

// Token que se guarda en la cookie httpOnly (no reversible a la contraseña).
export function expectedToken(): string {
  return createHash("sha256").update("asesor::" + password()).digest("hex");
}

export const COOKIE = "panel_auth";
