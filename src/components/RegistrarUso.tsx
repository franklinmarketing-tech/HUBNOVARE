"use client";

import { useEffect } from "react";
import { registrarUso } from "@/lib/uso";

/**
 * Marca que uma tela foi aberta.
 *
 * Componente, e não um `useEffect` solto em cada página, porque a maioria das
 * telas do Hub é Server Component — e Server Component não tem efeito. Este
 * fica no fim do JSX, não renderiza nada e some do HTML.
 *
 * Uso:
 *   <RegistrarUso modulo="fincash" />
 *
 * ⚠️ O `modulo` é o SLUG, igual ao do catálogo em `apps.ts` — "fincash",
 * "orcamento", "iris". Com título ("FINCASH", "Orçamento mensal") o ranking
 * quebra em duas linhas no dia em que alguém reescrever o nome na tela.
 */
export function RegistrarUso({ modulo }: { modulo: string }) {
  useEffect(() => {
    registrarUso(modulo, "abriu");
  }, [modulo]);

  return null;
}
