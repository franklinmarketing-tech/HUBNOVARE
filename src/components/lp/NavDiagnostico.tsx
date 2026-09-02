"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

/**
 * A cápsula de navegação que flutua sobre o herói (print 120600).
 *
 * Duas decisões da referência que precisam ser reproduzidas, e não
 * aproximadas:
 *
 * 1. **Ela sobrepõe o herói.** Não é um cabeçalho com o conteúdo embaixo: a
 *    pílula branca fica POR CIMA do painel navy, e é esse recorte que dá a
 *    sensação de camada. Por isso o herói tem respiro no topo e a nav é
 *    `fixed`, nunca `sticky` dentro de uma seção.
 *
 * 2. **Ela é sempre clara.** A tentação era deixá-la transparente no topo e
 *    só "materializar" ao rolar. Não funciona aqui: a cápsula nasce sobre a
 *    faixa BRANCA da página, não sobre o navy — links brancos ali ficam
 *    invisíveis. Então o tema é fixo (papel + tinta) e o que muda ao rolar é
 *    só o peso: de sombra difusa para sombra assentada, com borda.
 */

const LINKS = [
  { href: "#problema", rotulo: "O problema" },
  { href: "#diagnostico", rotulo: "O diagnóstico" },
  { href: "#processo", rotulo: "Como funciona" },
  { href: "#socios", rotulo: "Quem analisa" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

export function NavDiagnostico() {
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

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:pt-5">
        <nav
          className={`pointer-events-auto mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-full border bg-white/95 pl-5 pr-2 backdrop-blur-xl transition-shadow duration-300 sm:pl-7 ${
            rolou
              ? "border-[#e6ecf3] shadow-[0_16px_44px_-24px_rgba(15,27,43,0.5)]"
              : "border-white/60 shadow-[0_20px_50px_-28px_rgba(15,27,43,0.55)]"
          }`}
        >
          <a href="#topo" aria-label="Novare Consultoria de Investimentos" className="flex shrink-0 items-center">
            <Image
              src="/lp/novare-logo.png"
              alt="Novare Consultoria de Investimentos"
              width={700}
              height={200}
              priority
              className="h-7 w-auto sm:h-[34px]"
            />
          </a>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-[#46586e] transition-colors hover:bg-[#f1f6fa] hover:text-[#152a44]"
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#solicitar"
            className="nv-btn nv-btn-navy ml-auto hidden !h-12 !min-h-0 !px-5 !text-[0.8125rem] lg:ml-0 lg:inline-flex"
          >
            Solicitar diagnóstico
            <ArrowUpRight className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            className="ml-auto grid h-12 w-12 place-items-center rounded-full bg-[#f1f6fa] text-[#152a44] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Painel do celular: tela cheia navy, links grandes e o CTA no fim —
          quem abriu o menu no telefone quer tocar em algo, não ler. */}
      {aberto && (
        <div className="nv-navy-fundo fixed inset-0 z-[60] flex flex-col px-6 pb-8 pt-5 text-white lg:hidden">
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
                  className="block border-b border-white/10 py-4 text-[1.6rem] font-medium tracking-[-0.035em]"
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#solicitar"
            onClick={() => setAberto(false)}
            className="nv-btn nv-btn-branco mt-auto w-full"
          >
            Solicitar diagnóstico
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </>
  );
}
