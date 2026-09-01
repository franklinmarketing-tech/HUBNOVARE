"use client";

import { useEffect, useState } from "react";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import {
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";

/**
 * A barra de assinatura presa no rodapé do celular.
 *
 * No desktop a oferta fica sempre à vista no cartão de preço da capa; no
 * celular ela sai da tela no primeiro rolar e só volta lá no fim. Esta barra
 * é o que devolve o botão para quem se convenceu no meio do caminho — que é
 * onde a maioria decide.
 *
 * Só aparece depois que a capa saiu de vista: mostrá-la por cima do herói
 * seria dois CTAs disputando o mesmo clique.
 */
export function BarraAssinarFixa() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    function aoRolar() {
      // Uma tela cheia rolada: passou da capa, ainda não chegou ao fecho.
      const passouDaCapa = window.scrollY > window.innerHeight * 0.9;
      const chegouAoFim =
        window.scrollY + window.innerHeight >
        document.body.scrollHeight - window.innerHeight * 0.6;

      setVisivel(passouDaCapa && !chegouAoFim);
    }

    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <div
      // Sempre no DOM, só escondido: montar e desmontar a cada rolagem faria
      // o botão piscar na mão de quem ia clicar.
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-white/10 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ background: "hsl(216 58% 11% / 0.94)" }}
      // `inert` junto do aria-hidden: escondida, a barra continuava recebendo
      // Tab, e quem navega por teclado caía num botão fora da tela.
      inert={!visivel}
      aria-hidden={!visivel}
    >
      {/* pl-14: o botão flutuante da Íris mora no canto inferior esquerdo e
          ficava por cima do preço. O espaço é reservado, não disputado. */}
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 pl-14">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold leading-tight text-white">
            {ASSINATURA_TRIAL_DIAS} dias grátis
          </p>
          <p className="truncate text-[11px] text-white/60">
            depois {ASSINATURA_PRECO_ROTULO}/mês
          </p>
        </div>
        <div className="shrink-0 whitespace-nowrap">
          <BotaoAssinarPlano
            contexto="workspace"
            direto
            rotulo="Começar grátis"
          />
        </div>
      </div>
    </div>
  );
}
