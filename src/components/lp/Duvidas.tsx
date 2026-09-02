"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { DUVIDAS } from "@/lib/hub-lp";

/**
 * As dúvidas, na composição da referência de "perguntas e respostas".
 *
 * A REFERÊNCIA, DESMONTADA
 *   • O título fica no alto à esquerda, em duas linhas, e à direita — bem
 *     longe — um texto curto de apoio com um link sublinhado. Os dois flutuam
 *     sobre o vazio; não há caixa nenhuma em volta.
 *   • Atrás de tudo, UMA palavra gigante sangrando pelas duas bordas da tela,
 *     em duas cores que se cruzam no meio. Ela é cortada pelo cartão, e é
 *     esse corte que dá a profundidade.
 *   • No centro, um único cartão branco de cantos bem arredondados, com
 *     sombra larga e baixa, trazendo UMA pergunta por vez e um botão circular
 *     de avanço no canto inferior direito.
 *
 * O QUE FOI ADAPTADO, E POR QUÊ
 * A referência mostra uma pergunta e não diz quantas existem — o que numa
 * página de venda deixa a pessoa sem saber se a dúvida dela está ali. Então
 * entrou um contador ("03 / 07") e uma trilha de pontos clicáveis: mesmo
 * gesto, mesma composição, mas ninguém fica preso procurando.
 *
 * O conteúdo inteiro continua no DOM, um item por vez visível — leitor de
 * tela e busca do navegador enxergam o que está aberto, e as setas navegam
 * pelo resto.
 */
export function Duvidas() {
  const [i, setI] = useState(0);
  const total = DUVIDAS.length;
  const atual = DUVIDAS[i];

  const anda = (passo: 1 | -1) => setI((v) => (v + passo + total) % total);

  return (
    <div className="relative">
      {/* --------------------------------------------------- o cabeçalho -- */}
      <div className="nv-caixa relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="nv-h2 max-w-[9ch] text-[#0f1b2b]">
          Perguntas
          <br />e respostas
        </h2>

        <p className="max-w-xs text-[0.9375rem] leading-relaxed tracking-[-0.022em] text-[#5b6d81] sm:text-right">
          Ficou com uma dúvida que não está aqui? A gente responde antes de
          você assinar qualquer coisa.
          <br />
          <a
            href="#preco"
            className="mt-1 inline-block font-semibold text-[#17789c] underline underline-offset-4"
          >
            Ver o que está incluído
          </a>
        </p>
      </div>

      {/* --------------------------------------------- a palavra de fundo -- */}
      {/* Sangra pelas duas bordas e é cortada pelo cartão: o corte é o efeito.
          `aria-hidden` porque é ornamento, e `select-none` porque ninguém
          deveria conseguir selecioná-la sem querer ao arrastar na página. */}
      <span
        aria-hidden
        className="nv-palavra-fundo pointer-events-none absolute left-1/2 top-[46%] z-0 w-max -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          // Menor que o display padrão: a palavra tem de sangrar pelas duas
          // bordas SEM engolir o "D" e o "s" das pontas, que é o que faz o
          // olho reconhecer a palavra por trás do cartão.
          fontSize: "clamp(4rem, 11.5vw, 11rem)",
          backgroundImage:
            "linear-gradient(90deg, #e8f1f6 0%, #dceaf3 42%, #e9dfd8 58%, #f2e6de 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Dúvidas e respostas
      </span>

      {/* ---------------------------------------------------- o cartão ----- */}
      <div className="nv-caixa relative z-10 mt-16 sm:mt-20">
        <div className="mx-auto max-w-xl rounded-[26px] bg-white p-7 shadow-[0_34px_80px_-34px_rgba(15,27,43,0.4)] sm:p-9">
          {/* `ciano-forte` e não o ciano da marca: em 11px o #2596be dá 3,3:1
              sobre branco e reprova na régua de texto pequeno. */}
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#17789c]">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>

          <h3 className="mt-4 text-[1.1875rem] font-semibold leading-snug tracking-[-0.035em] text-[#0f1b2b] sm:text-[1.375rem]">
            {atual.p}
          </h3>

          {/* Altura mínima para o cartão não pular de tamanho a cada resposta —
              o salto é o que faz um carrossel parecer quebrado. */}
          <p
            aria-live="polite"
            className="nv-corpo mt-4 min-h-[7.5rem] sm:min-h-[6.5rem]"
          >
            {atual.r}
          </p>

          <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#eef2f7] pt-6">
            {/* A trilha de pontos: mostra quantas existem e leva direto. */}
            <div className="flex flex-wrap gap-2">
              {DUVIDAS.map((d, k) => (
                <button
                  key={d.p}
                  type="button"
                  onClick={() => setI(k)}
                  aria-label={`Pergunta ${k + 1}: ${d.p}`}
                  aria-current={k === i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    k === i ? "w-7 bg-[#2596be]" : "w-2 bg-[#d4dfe9] hover:bg-[#a9bccd]"
                  }`}
                />
              ))}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => anda(-1)}
                aria-label="Pergunta anterior"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#e2e8f0] text-[#5b6d81] transition-colors hover:border-[#2596be] hover:text-[#17789c]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => anda(1)}
                aria-label="Próxima pergunta"
                className="grid h-11 w-11 place-items-center rounded-full bg-[#152a44] text-white transition-colors hover:bg-[#1d3a58]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
