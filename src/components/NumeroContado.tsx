"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que conta até o valor, uma vez, quando entra na tela.
 *
 * Não é enfeite gratuito: num painel com seis números grandes, a contagem
 * conduz o olho de um para o outro em vez de despejar tudo de uma vez. E o
 * movimento faz a pessoa *olhar* para o número — que é o ponto de um painel
 * financeiro.
 *
 * ACESSIBILIDADE: o valor final vai para o DOM desde o primeiro quadro, num
 * `<span>` só para leitor de tela. Quem usa leitor não ouve "um… dois…
 * três…", ouve o número. E com `prefers-reduced-motion` a contagem não
 * acontece: o valor entra pronto.
 */
export function NumeroContado({
  valor,
  formatar = (v: number) => String(Math.round(v)),
  duracao = 900,
  className = "",
}: {
  valor: number;
  formatar?: (v: number) => string;
  /** Milissegundos da contagem inteira. */
  duracao?: number;
  className?: string;
}) {
  const [mostrado, setMostrado] = useState(valor);
  const caixa = useRef<HTMLSpanElement>(null);
  const jaContou = useRef(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMostrado(valor);
      return;
    }

    // Só conta quando aparece: contar fora da tela é gastar quadro à toa e,
    // pior, a pessoa chega e o número já está parado no fim.
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting || jaContou.current) return;
        jaContou.current = true;
        obs.disconnect();

        const inicio = performance.now();
        // Desacelera no fim (easeOutCubic): a chegada é o que dá a sensação
        // de "assentar" em vez de parar no meio do movimento.
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          const suave = 1 - Math.pow(1 - t, 3);
          setMostrado(valor * suave);
          if (t < 1) requestAnimationFrame(passo);
        };
        setMostrado(0);
        requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [valor, duracao]);

  return (
    <span ref={caixa} className={className}>
      <span aria-hidden>{formatar(mostrado)}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </span>
  );
}
