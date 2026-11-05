"use client";

import { usePathname } from "next/navigation";

import { Icone3D } from "./Icone3D";
import { telaDaRota } from "./menu";

/**
 * O ícone 3D ao lado do título de cada tela (o `Cabecalho` de `pecas.tsx`).
 * Descobre a tela pelo caminho, para nenhuma tela precisar passar o ícone à mão.
 * Desenhado também no servidor: chega pronto, sem piscar.
 */
export function IconeDaTela() {
  const tela = telaDaRota(usePathname());
  if (!tela) return null;
  return <Icone3D nome={tela.icone} tamanho={46} className="h-10 w-10 sm:h-[46px] sm:w-[46px]" />;
}
