"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";
import { COOKIE_SUPORTE, emitirFicha, senhaConfere } from "@/lib/suporte-acesso";

/** Confere a senha e abre o Suporte por 8 horas. Só para o papel `admin`. */
export async function entrarNoSuporte(formData: FormData) {
  const perfil = await getPerfil();
  if (!perfil || perfil.role !== "admin") redirect("/admin");

  const senha = String(formData.get("senha") ?? "");
  if (!senhaConfere(senha)) redirect("/admin/suporte?erro=1");

  (await cookies()).set(COOKIE_SUPORTE, emitirFicha(perfil.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/suporte",
    maxAge: 8 * 60 * 60,
  });
  redirect("/admin/suporte");
}

export async function sairDoSuporte() {
  (await cookies()).delete({ name: COOKIE_SUPORTE, path: "/admin/suporte" });
  redirect("/admin");
}
