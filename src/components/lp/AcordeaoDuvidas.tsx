"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DUVIDAS } from "@/lib/diagnostico-lp";

/**
 * O acordeão de objeções (print 120724).
 *
 * Detalhes da referência que estavam fáceis de simplificar e não foram:
 *   • a pergunta é NUMERADA ("01.", "02.") e o número faz parte do texto,
 *     não é um badge separado;
 *   • o item aberto muda de cor — pergunta em azul, fundo levemente tingido —
 *     e não apenas revela a resposta;
 *   • a seta gira, não troca de ícone;
 *   • a altura anima de verdade (grid-template-rows 0fr→1fr em lp.css), em
 *     vez do pulo seco de `hidden`.
 *
 * O primeiro item nasce aberto: mostra que os itens abrem, e a primeira
 * objeção — "vou ter que transferir meu dinheiro?" — é a que mais trava.
 */
export function AcordeaoDuvidas() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {DUVIDAS.map((d, i) => {
        const estaAberta = aberta === i;
        return (
          <div
            key={d.p}
            className={`overflow-hidden rounded-[18px] border transition-colors duration-300 ${
              estaAberta
                ? "border-[#c9e3ef] bg-[#f3fafd]"
                : "border-[#e6ecf3] bg-white hover:border-[#cfdce8]"
            }`}
          >
            <button
              type="button"
              onClick={() => setAberta(estaAberta ? null : i)}
              aria-expanded={estaAberta}
              className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
            >
              <span
                className={`flex-1 text-[0.9375rem] font-semibold leading-snug tracking-[-0.028em] transition-colors sm:text-[1.0625rem] ${
                  estaAberta ? "text-[#17789c]" : "text-[#0f1b2b]"
                }`}
              >
                {String(i + 1).padStart(2, "0")}. {d.p}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                  estaAberta ? "rotate-180 text-[#2596be]" : "text-[#5b6d81]"
                }`}
              />
            </button>

            <div className="nv-resposta" data-aberta={estaAberta ? "sim" : "nao"}>
              <div>
                <p className="nv-corpo px-5 pb-5 pr-12 sm:px-6 sm:pb-6">{d.r}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
