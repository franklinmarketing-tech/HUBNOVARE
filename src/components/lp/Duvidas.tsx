"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";

import { DUVIDAS } from "@/lib/hub-lp";
import { falarNoWhatsApp } from "@/lib/contato";
import { ASSINATURA_GARANTIA_DIAS } from "@/lib/lp-precos";

/**
 * AS DÚVIDAS, o FAQ do Visor, peça por peça.
 *
 * ┌── A REFERÊNCIA, DESMONTADA ───────────────────────────────────────────┐
 * │ ESQUERDA (fica parada enquanto a direita rola)                        │
 * │   · o chapéu "FAQ +", miúdo, na cor de ação, com um "+" solto;        │
 * │   · o título curto, em duas palavras;                                 │
 * │   · o botão primário CHEIO, logo abaixo;                              │
 * │   · e, lá no rodapé da coluna, o rosto de quem responde com um balão  │
 * │     branco flutuando à direita dele: "Clique aqui e fale conosco".    │
 * │                                                                        │
 * │ DIREITA                                                                │
 * │   · as perguntas numeradas (01., 02., …) com o número na cor de ação; │
 * │   · a pergunta em corpo grande, quase do tamanho de um subtítulo;     │
 * │   · um "+" solto na ponta direita, que vira "−" quando abre;          │
 * │   · e fios finíssimos separando uma da outra, sem caixa, sem sombra. │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── O QUE NÃO É CÓPIA, E POR QUÊ ───────────────────────────────────────┐
 * │ 1. Acordeão, e não carrossel. A versão anterior desta página mostrava │
 * │    UMA pergunta por vez com setas: quem chega aqui tem UMA dúvida     │
 * │    específica e precisa varrer a lista com o olho. Num carrossel ela  │
 * │    clica oito vezes torcendo para a dela aparecer, e o Ctrl+F do      │
 * │    navegador não acha o que não está no DOM.                          │
 * │                                                                        │
 * │ 2. A abertura anima por `grid-template-rows: 0fr → 1fr` (ver          │
 * │    `lp.css`): é a única técnica que anima ALTURA AUTOMÁTICA sem medir │
 * │    nada em JavaScript, e sem o `max-height` chutado que ou corta a    │
 * │    resposta longa ou faz a curta abrir com meio segundo de vazio.     │
 * └────────────────────────────────────────────────────────────────────────┘
 */
/** O glifo do WhatsApp. A lucide não tem marcas, e um balão genérico no
    lugar faz a pessoa não reconhecer para onde o botão leva. */
function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.91-9.91A9.85 9.85 0 0 0 19.06 4.9 9.83 9.83 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c-.01 4.54-3.7 8.23-8.24 8.23z" />
    </svg>
  );
}

export function Duvidas() {
  const [aberta, setAberta] = useState<number | null>(0);
  const base = useId();

  const zap = falarNoWhatsApp(
    "Olá! Vi a página do Workspace Novare e queria tirar uma dúvida antes de assinar.",
  );

  return (
    <div className="nv-caixa grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
      {/* ═══════════════════════════════════════════════ a coluna parada == */}
      <div className="lg:flex lg:flex-col">
        <p className="nv-chapeu flex items-center gap-2 text-[#17789c]">
          Dúvidas
          <Plus className="h-3 w-3" strokeWidth={3} />
        </p>

        <h2 className="nv-d2 mt-5 max-w-[11ch]">Ainda tem dúvidas?</h2>

        <div className="mt-8">
          <a href="#preco" className="nv-btn nv-btn-navy">
            Ver o que tem aqui
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* ------------------------------------------ quem responde ------- */}
        {/*
            O rosto no pé da coluna é o gesto que fecha a composição da
            referência: a página inteira argumenta e, no fim, aparece uma
            pessoa. A foto ocupa a altura inteira do cartão, recortá-la num
            quadrado pequeno ao lado do balão deixava a cabeça cortada.
        */}
        <a
          href={zap}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-14 block w-full max-w-sm overflow-hidden rounded-[24px] border border-[#e8e4dc] bg-white shadow-[0_18px_44px_-26px_rgba(10,21,33,0.4)] transition-transform hover:-translate-y-0.5 lg:sticky lg:bottom-8 lg:mt-auto"
        >
          {/* ⚠️ O RECORTE MUDOU COM A FOTO. Em 16/9 cabiam dois bustos lado
              a lado; a foto nova é um retrato, e 16/9 nela corta a cabeça ou
              deixa só mesa. Em 4/3, com o foco um pouco mais alto, o rosto
              fica inteiro e o enquadramento continua largo. */}
          <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[#e9eef4]">
            <Image
              src="/lp/hero-socios.webp"
              alt="Jefferson Freitas, fundador da Novare"
              fill
              sizes="384px"
              className="object-cover object-[center_25%]"
            />
          </span>

          <span className="flex items-center gap-4 px-5 py-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#25D366] text-white shadow-[0_10px_24px_-12px_rgba(37,211,102,0.9)]">
              <IconeWhatsApp className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-[1.1875rem] font-semibold leading-snug tracking-[-0.018em] text-[#0a1521]">
                Clique aqui e fale conosco
              </span>
              <span className="mt-0.5 block text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#5b6d81]">
                Jefferson Freitas, pelo WhatsApp
              </span>
            </span>
          </span>
        </a>
      </div>

      {/* ═══════════════════════════════════════════════════ o acordeão === */}
      <ul>
        {DUVIDAS.map((d, i) => {
          const abertaAgora = aberta === i;
          const idResposta = `${base}-r-${i}`;
          return (
            <li
              key={d.p}
              className={i === 0 ? "" : "border-t border-[#e8e4dc]"}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => setAberta(abertaAgora ? null : i)}
                  aria-expanded={abertaAgora}
                  aria-controls={idResposta}
                  className="group flex w-full items-start gap-4 py-7 text-left sm:gap-6"
                >
                  <span className="nv-numero mt-1.5 shrink-0 text-[1rem] text-[#17789c]">
                    {String(i + 1).padStart(2, "0")}.
                  </span>

                  <span className="nv-h4 flex-1 !text-[1.1875rem] transition-colors group-hover:text-[#17789c] sm:!text-[1.375rem]">
                    {d.p}
                  </span>

                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-[#17789c] transition-transform duration-300 group-hover:scale-110"
                  >
                    {abertaAgora ? (
                      <Minus className="h-5 w-5" strokeWidth={2.2} />
                    ) : (
                      <Plus className="h-5 w-5" strokeWidth={2.2} />
                    )}
                  </span>
                </button>
              </h3>

              <div
                id={idResposta}
                className="nv-resposta"
                data-aberta={abertaAgora ? "sim" : "nao"}
              >
                <div>
                  <p className="nv-corpo max-w-[62ch] pb-8 pl-[2.75rem] pr-10 sm:pl-[3.75rem]">
                    {d.r}
                  </p>
                </div>
              </div>
            </li>
          );
        })}

        {/* O fecho responde a pergunta que sobra depois de todas as outras:
            "e se eu não gostar?". Não é uma dúvida a mais, é a saída, e por
            isso não fica escondida atrás de um clique. */}
        <li className="flex flex-col gap-5 border-t border-[#e8e4dc] py-9 sm:flex-row sm:items-center sm:justify-between">
          <p className="nv-corpo max-w-md !text-[#0a1521]">
            Você tem {ASSINATURA_GARANTIA_DIAS} dias para usar tudo e pedir o
            valor de volta, sem explicar o motivo.
          </p>
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="nv-btn nv-btn-linha shrink-0"
          >
            <IconeWhatsApp className="h-4 w-4 text-[#25D366]" />
            Falar com a Novare
          </a>
        </li>
      </ul>
    </div>
  );
}
