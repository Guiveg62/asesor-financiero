"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { passwordOk, expectedToken, COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const pw = String(formData.get("password") ?? "");
  if (!passwordOk(pw)) redirect("/panel/login?error=1");
  const c = await cookies();
  c.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/panel");
}

export async function logout() {
  const c = await cookies();
  c.delete(COOKIE);
  redirect("/panel/login");
}

// El asesor dispara la revisión del mercado a mano (además del cron diario).
export async function revisarMercado() {
  const c = await cookies();
  if (c.get(COOKIE)?.value !== expectedToken()) redirect("/panel/login");
  const { runAlertas } = await import("@/lib/runAlertas");
  await runAlertas();
  redirect("/panel");
}

// El asesor genera y se envía el informe mensual a mano (además del cron del día 1).
export async function generarInforme() {
  const c = await cookies();
  if (c.get(COOKIE)?.value !== expectedToken()) redirect("/panel/login");
  const { runInformeMensual } = await import("@/lib/runInforme");
  await runInformeMensual();
  redirect("/panel");
}
