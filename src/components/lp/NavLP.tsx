"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { ASSINATURA_PRECO_ROTULO } from "@/lib/lp-precos";

/**
 * A NAVEGAÇÃO FLUTUANTE.
 *
 * As três referências chegaram, cada uma por um caminho, à mesma solução: a
 * navegação não é uma barra colada no topo, é uma CÁPSULA que paira sobre o
 * conteúdo com folga nos quatro lados. Visor e Shotbase vão além e quebram a
 * cápsula em três peças soltas, marca, links, ação, separadas por ar.
 *
 * ┌── POR QUE TRÊS PEÇAS, E NÃO UMA BARRA ────────────────────────────────┐
 * │ Porque o conteúdo passa POR BAIXO e aparece nos vãos. É esse detalhe  │
 * │ que faz a página parecer ter profundidade em vez de camadas empilhadas│
 * │, e é por isso que as peças não podem se encostar: colou, virou barra.│
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Ela é sempre CLARA. A tentação era deixá-la transparente no topo e só
 * "materializar" ao rolar; não funciona aqui, porque ela nasce sobre o creme
 * do herói e links brancos ali ficam invisíveis. O tema é fixo (papel e
 * tinta) e o que muda ao rolar é só o peso da sombra.
 */

const LINKS = [
  { href: "#problema", rotulo: "O problema" },
  { href: "#produto", rotulo: "O que é" },
  { href: "#processo", rotulo: "Como começa" },
  { href: "#preco", rotulo: "Preço" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

export function NavLP() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Menu aberto trava a rolagem do fundo: sem isso o conteúdo desliza atrás
  // do painel e a pessoa perde a referência de onde estava.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const sombra = rolou
    ? "shadow-[0_14px_38px_-20px_rgba(10,21,33,0.5)]"
    : "shadow-[0_18px_44px_-26px_rgba(10,21,33,0.45)]";

  return (
    <>
      {/*
          No topo da página a cápsula desce para caber DEBAIXO da faixa de
          anúncio; assim que a rolagem começa, ela sobe para a posição
          normal, a faixa já saiu de cena e o espaço é dela.

          É a transição do Shotbase, e ela precisa ser de `padding` e não de
          `transform`: a cápsula tem `backdrop-blur`, e transformar um
          elemento com filtro de fundo faz o borrão tremer no Chrome.
      */}
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 px-3 transition-[padding] duration-300 sm:px-5 ${
          rolou ? "pt-3 sm:pt-5" : "pt-[3.9rem] sm:pt-[4.1rem]"
        }`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-3">
          {/* --------------------------------------------------- a marca -- */}
          <a
            href="#topo"
            aria-label="Novare, voltar ao topo da página"
            className={`pointer-events-auto flex h-14 shrink-0 items-center rounded-full border border-white/70 bg-white/92 px-5 backdrop-blur-xl transition-shadow duration-300 ${sombra}`}
          >
            <Image
              src="/lp/novare-logo.png"
              alt="Novare"
              width={700}
              height={200}
              priority
              className="h-6 w-auto sm:h-7"
            />
          </a>

          {/* --------------------------------------------------- os links -- */}
          <nav
            aria-label="Seções desta página"
            className={`pointer-events-auto mx-auto hidden h-14 items-center gap-1 rounded-full border border-white/70 bg-white/92 px-2.5 backdrop-blur-xl transition-shadow duration-300 lg:flex ${sombra}`}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2.5 text-[0.9375rem] font-medium tracking-[-0.012em] text-[#46586e] transition-colors hover:bg-[#f1f6fa] hover:text-[#0a1521]"
              >
                {l.rotulo}
              </a>
            ))}
          </nav>

          {/* ---------------------------------------------------- a ação --- */}
          <a
            href="#preco"
            className="nv-btn nv-btn-navy pointer-events-auto ml-auto hidden !h-14 !min-h-0 shrink-0 !px-6 !text-[0.9375rem] lg:ml-0 lg:inline-flex"
          >
            Assinar a partir de {ASSINATURA_PRECO_ROTULO}/mês
            <ArrowRight className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            className={`pointer-events-auto ml-auto grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/70 bg-white/92 text-[#0a1521] backdrop-blur-xl transition-shadow duration-300 lg:hidden ${sombra}`}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Painel do celular: tela cheia navy, links grandes e o CTA no fim,
          quem abriu o menu no telefone quer tocar em algo, não ler. */}
      {aberto && (
        <div className="nv-painel-navy fixed inset-0 z-[60] flex flex-col overflow-y-auto px-6 pb-8 pt-5 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <Image
              src="/lp/novare-logo-branca.png"
              alt="Novare"
              width={700}
              height={200}
              className="h-6 w-auto"
            />
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ul className="mt-10 space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setAberto(false)}
                  className="block border-b border-white/12 py-4 font-[var(--nv-titulo)] text-[1.75rem] tracking-[-0.035em]"
                  style={{ fontFamily: "var(--nv-titulo)", fontWeight: 500 }}
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#preco"
            onClick={() => setAberto(false)}
            className="nv-btn nv-btn-branco mt-auto w-full"
          >
            Ver o que tem aqui
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </>
  );
}
