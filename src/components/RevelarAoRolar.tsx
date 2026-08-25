"use client";

import { useEffect } from "react";

/**
 * Liga a revelação ao rolar da página de assinatura.
 *
 * Duas decisões que importam:
 *
 * 1. **O estado inicial é ligado por JS, não por CSS.** O `globals.css` só
 *    esconde `.revelar` quando o `<html>` tem `data-revelar="pronto"` — marca
 *    que este componente aplica. Sem isso, um visitante com JS bloqueado (ou
 *    um crawler mal-humorado) veria a página de venda inteira invisível. É o
 *    tipo de defeito que ninguém percebe em desenvolvimento e custa vendas.
 *
 * 2. **O observer desiste do elemento assim que ele aparece.** A animação é de
 *    entrada, não de ida e volta: reanimar a cada rolagem embrulha o estômago
 *    e distrai de um conteúdo que a pessoa já leu.
 */
export function RevelarAoRolar() {
  useEffect(() => {
    const raiz = document.documentElement;

    // Quem pediu menos movimento não precisa nem do observer.
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento || typeof IntersectionObserver === "undefined") return;

    raiz.dataset.revelar = "pronto";

    const alvos = document.querySelectorAll<HTMLElement>(".revelar, .revelar-escada");

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      },
      {
        // Dispara um pouco antes de encostar na borda: o elemento termina de
        // aparecer quando já está confortavelmente na tela, e não no exato
        // instante em que cruza o limite.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    for (const alvo of alvos) {
      // O que já está visível no primeiro quadro entra sem animação — animar o
      // herói depois que a pessoa já o leu parece travamento, não elegância.
      const caixa = alvo.getBoundingClientRect();
      if (caixa.top < window.innerHeight * 0.9) {
        alvo.classList.add("visivel");
        continue;
      }
      observador.observe(alvo);
    }

    return () => {
      observador.disconnect();
      delete raiz.dataset.revelar;
    };
  }, []);

  return null;
}
