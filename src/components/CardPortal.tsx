"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconeDe } from "@/lib/icones";
import type { Portal } from "@/lib/categorias";

/**
 * A porta de entrada de uma área, no formato "vitrine": a foto da área como
 * palco, o nome grande e centrado, e o botão Acessar FORA da imagem, num
 * rodapé branco. A separação palco/rodapé é o que dá a limpeza — o olho lê a
 * área primeiro e encontra a ação depois, sempre no mesmo lugar.
 *
 * A FOTO ESTAVA PREVISTA DESDE O COMEÇO e nunca tinha sido ligada. O tipo
 * `Portal` (categorias.ts) documenta `capa` como "imagem oficial da Novare
 * usada como fundo" e `h`/`s` como "matiz e saturação da área, para o véu de
 * cor" — e este componente ignorava os três, desenhando um gradiente navy
 * igual para todas. Quatro cartões idênticos não são vitrine: são um menu.
 *
 * O véu de cor por área é o que impede a foto de virar ruído: cada área ganha
 * o próprio matiz por cima da imagem, então o cartão continua legível e as
 * quatro continuam parecendo da mesma casa.
 */
export function CardPortal({ portal }: { portal: Portal }) {
  const href = `/aplicativos?area=${portal.chave}`;
  const IconePrincipal = iconeDe(portal.destaques[0] ?? portal.chave);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* O palco: a foto da área sob o véu da cor dela. */}
      <span
        className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 group-hover:brightness-[1.12]"
        style={{
          background:
            "linear-gradient(160deg, hsl(216 44% 27%) 0%, hsl(218 50% 16%) 60%, hsl(220 55% 12%) 100%)",
          boxShadow: "inset 0 1px 0 hsl(210 60% 80% / 0.18)",
        }}
      >
        {/* `sizes` conta ao Next que o cartão é um quarto da largura no
            desktop e a tela inteira no celular — sem isso ele baixaria a
            imagem grande também no telefone. */}
        <Image
          src={portal.capa}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* O véu na cor da área. Escuro o bastante para o texto branco manter
            contraste sobre QUALQUER parte da foto — o cartão não pode depender
            de a imagem ser escura no lugar certo. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, hsl(${portal.h} ${portal.s}% 24% / 0.68) 0%, hsl(${portal.h} ${Math.round(portal.s * 0.8)}% 13% / 0.84) 55%, hsl(220 55% 8% / 0.92) 100%)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 50% -20%, hsl(208 75% 62% / 0.25), transparent 65%)",
          }}
        />
        <span className="absolute right-3 top-3 text-2xs font-extrabold uppercase tracking-wider text-white/55">
          Grátis
        </span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.10] ring-1 ring-white/[0.14]">
          <IconePrincipal className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          {portal.curto}
        </span>
        <span className="relative text-xs leading-snug text-white/70">
          {portal.descricao}
        </span>
      </span>

      {/* O rodapé branco com a ação, como no padrão de hub limpo. */}
      <span className="flex items-center justify-between border-t border-primary/5 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-primary transition-colors group-hover:text-accent-strong">
          Acessar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="text-2xs font-medium text-muted-foreground">
          {portal.total} ferramentas
        </span>
      </span>
    </Link>
  );
}
