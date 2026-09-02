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

    // Ligar `pronto` muda o estilo de todo `.revelar`/`.cine` de uma vez, e
    // essa mudança é ela própria uma transição: as palavras animavam de
    // visível para invisível, e a entrada real só revertia esse fade pela
    // metade. Congelar por um quadro — e forçar o reflow no meio — faz o
    // estado inicial ser aplicado seco, virando o "antes" da animação.
    raiz.classList.add("revelar-congelado");
    raiz.dataset.revelar = "pronto";
    void raiz.offsetHeight;
    raiz.classList.remove("revelar-congelado");

    const alvos = document.querySelectorAll<HTMLElement>(
      ".revelar, .revelar-escada, .cine, .cortina",
    );

    // A `.cortina` precisa de um observer PRÓPRIO, com threshold 0.
    //
    // Ela se esconde com `clip-path: inset(100% 0 0 0)`, e isso zera a área
    // renderizada do elemento: o `intersectionRatio` fica em 0 para sempre e
    // um threshold de 0.12 nunca é alcançado. Resultado: a foto e o vídeo
    // ficavam invisíveis na página inteira. Com threshold 0 basta o elemento
    // tocar a viewport.
    const observadorCortina = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("visivel");
          observadorCortina.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

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
      const caixa = alvo.getBoundingClientRect();
      if (caixa.top < window.innerHeight * 0.9) {
        // O `.cine` do herói é a exceção: ele DEVE animar na primeira carga,
        // que é quando a pessoa chega e ainda não leu nada. Os dois quadros
        // de espera existem para o navegador pintar o estado inicial antes
        // da transição — sem eles a classe entra no mesmo quadro e o efeito
        // não roda.
        //
        // O `.revelar` comum continua entrando seco: animar um bloco que a
        // pessoa já leu parece travamento, não elegância.
        if (alvo.classList.contains("cine")) {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => alvo.classList.add("visivel")),
          );
        } else {
          alvo.classList.add("visivel");
        }
        continue;
      }
      if (alvo.classList.contains("cortina")) observadorCortina.observe(alvo);
      else observador.observe(alvo);
    }

    return () => {
      observador.disconnect();
      observadorCortina.disconnect();
      delete raiz.dataset.revelar;
    };
  }, []);

  return null;
}
