"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Portal } from "@/lib/categorias";

/**
 * A porta de entrada de uma área na home: uma FOTO DE GENTE em cima e o texto
 * num corpo branco embaixo.
 *
 * ⚠️ ATÉ 19/10/2026 ERA UM PALCO ESCURO: a capa da área (notebook, medidor,
 * pilha de dinheiro) sob um véu navy, com o nome centrado em maiúsculas.
 * O dono achou a home "com cara de banco e app" e pediu para humanizar. As
 * fotos novas (Magnific, em `public/home/`) mostram pessoas vivendo a
 * situação da área — são ilustrativas, geradas por IA, e NÃO representam
 * clientes; por isso nenhuma frase do card fala por elas.
 *
 * A `capa` de `categorias.ts` continua lá e serve às outras telas; a home usa
 * `FOTO_HOME` e só cai na capa antiga se a área não tiver foto aqui.
 */
const FOTO_HOME: Record<string, string> = {
  ia: "/home/servicos.webp",
  organizacao: "/home/vida.webp",
  investimentos: "/home/invest.webp",
};

export function CardPortal({ portal }: { portal: Portal }) {
  /* O destino vem do portal, não é montado aqui: uma área que vende um
     serviço só aponta direto para a página dele, em vez de cobrar um clique
     numa listagem de um item (ver `destino` em `categorias.ts`). */
  const href = portal.destino;
  const externo = portal.destinoExterno;

  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noopener noreferrer" : undefined}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-suave ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-ciano"
    >
      {/* `sizes` conta ao Next que o cartão é um quarto da largura no
          desktop e a tela inteira no celular — sem isso ele baixaria a
          imagem grande também no telefone. */}
      <span className="relative block aspect-[4/3] overflow-hidden border-t-[3px] border-ciano">
        <Image
          src={FOTO_HOME[portal.chave] ?? portal.capa}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* O selo vem da área — ver a nota em `categorias.ts`. Vazio não
            renderiza. */}
        {portal.selo && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-2xs font-semibold text-primary shadow-sm backdrop-blur-sm">
            {portal.selo}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <span className="font-display text-lg font-semibold tracking-[-0.03em] text-primary">
          {portal.curto}
        </span>
        <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {portal.descricao}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
            Quero ver
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-2xs text-muted-foreground">
            {portal.total} {portal.rotuloTotal}
          </span>
        </span>
      </span>
    </Link>
  );
}
