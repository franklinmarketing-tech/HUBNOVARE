"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * A barra de ação que sobe depois do herói.
 *
 * Ela existe porque a página é longa e o CTA principal está no fim: quem se
 * convence no meio do caminho não deveria ter que procurar onde clicar.
 *
 * Duas regras de educação:
 *   • só aparece depois que a pessoa passou do herói (senão duplica o botão
 *     que já está na tela);
 *   • some quando o formulário entra em cena — barra fixa cobrindo o próprio
 *     formulário é o clássico tiro no pé de landing page em celular.
 */
export function BarraLP() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("preco");

    const aoRolar = () => {
      const passouDoHeroi = window.scrollY > window.innerHeight * 0.9;
      const formNaTela = alvo
        ? alvo.getBoundingClientRect().top < window.innerHeight - 80
        : false;
      setVisivel(passouDoHeroi && !formNaTela);
    };

    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return (
    <div
      className="nv-barra-fixa fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden"
      data-visivel={visivel ? "sim" : "nao"}
      // `inert` e não `aria-hidden`: a barra é só transladada para fora da
      // tela, então os dois links continuavam no caminho do Tab. `aria-hidden`
      // sozinho esconde do leitor de tela um botão que ainda recebe foco — o
      // pior dos dois mundos, e é exatamente o que o axe acusa.
      inert={!visivel}
    >
      <div className="nv-navy-fundo flex items-center gap-2.5 rounded-[20px] border border-white/12 p-2.5 shadow-[0_-8px_40px_-12px_rgba(11,22,38,0.6)]">
        <a
          href={falarNoWhatsApp(
            "Olá! Vi a página do Workspace Novare e queria tirar uma dúvida antes de assinar.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          tabIndex={visivel ? 0 : -1}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
        <a
          href="#preco"
          tabIndex={visivel ? 0 : -1}
          className="nv-btn nv-btn-branco !h-12 !min-h-0 flex-1 !text-[0.875rem]"
        >
          Começar grátis
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
