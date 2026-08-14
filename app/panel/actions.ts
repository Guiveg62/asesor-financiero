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
