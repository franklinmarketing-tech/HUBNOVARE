import Image from "next/image";
import { Sparkles } from "lucide-react";

import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import {
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/lp-precos";
import { ROTULO_DESCONTO } from "@/lib/lp-precos";
import { FECHO, FECHO_CENAS } from "@/lib/hub-lp";

/**
 * O fecho, antes do rodapé: a composição de despedida do Calendly.
 *
 * Três telas em gradiente, com as pessoas RECORTADAS saindo pela borda de
 * cima da tela, e no meio uma fita de duas pastilhas ligadas ao ícone da
 * Íris. As pessoas são os sócios da casa, de verdade, não banco de imagem:
 * uma página que vende confiança financeira fechando com foto de catálogo é
 * a definição de sinal trocado.
 *
 * A tela e a pessoa são camadas separadas: a tela é um bloco arredondado
 * que começa mais baixo; a pessoa fica numa caixa que só recorta os cantos
 * de BAIXO (`rounded-b`), então ela pode subir acima da tela sem ser
 * cortada no topo.
 */

function Barras({ quantidade, altura }: { quantidade: number; altura: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-5 top-1/2 flex -translate-y-1/2 items-center justify-between gap-[3px]"
    >
      {Array.from({ length: quantidade }, (_, k) => (
        <span
          key={k}
          className="block w-[4px] rounded-full bg-white/70"
          style={{ height: `${altura * (0.35 + ((k * 37) % 61) / 100)}px` }}
        />
      ))}
    </span>
  );
}

export function Fecho() {
  return (
    <>
      <div className="nv-caixa relative text-center">
        <p className="revelar nv-chapeu text-[#17789c]">{FECHO.chapeu}</p>

        <h2 className="revelar nv-d1 mx-auto mt-7 max-w-[16ch] text-balance">
          {/* O traço fica só nas duas últimas palavras: a frase quebra em
              duas linhas no celular, e o sublinhado da linha de cima
              encostava nas ascendentes da de baixo. */}
          {FECHO.titulo1}{" "}
          {FECHO.titulo2.split(" ").slice(0, -2).join(" ")}{" "}
          <span className="nv-traco whitespace-nowrap">
            {FECHO.titulo2.split(" ").slice(-2).join(" ")}
          </span>
        </h2>

        <p className="revelar nv-lead mx-auto mt-8 max-w-[44ch] text-pretty">
          {FECHO.lead}
        </p>

        <div className="revelar mt-10 flex justify-center">
          <BotaoAssinarPlano
            contexto="workspace"
            tamanho="grande"
            destaque
            direto
            rotulo="Começar agora"
          />
        </div>

        <p className="revelar mt-6 text-[1.1875rem] tracking-[-0.012em] text-[#5b6d81]">
          A partir de {ASSINATURA_PRECO_ROTULO}/mês no anual ·{" "}
          {ASSINATURA_GARANTIA_DIAS} dias de garantia · {ROTULO_DESCONTO}
        </p>
      </div>

      {/* --------------------------------------------------- as três telas */}
      <div className="nv-caixa-larga relative mt-1">
        <ul className="revelar-escada grid items-end gap-6 sm:grid-cols-[1fr_1.25fr_1fr] sm:gap-8 lg:gap-12">
          {FECHO_CENAS.map((c, i) => {
            const meio = i === 1;
            const alturaTela = meio ? "h-[16rem]" : "h-[17rem]";
            const alturaPessoa = meio ? "h-[21rem]" : "h-[20.5rem]";
            return (
              <li
                key={c.imagem}
                // No celular as três telas empilhadas davam mil pixels de foto
                // antes do rodapé; fica só a do meio, que é a que tem a fita.
                className={`relative ${alturaPessoa} ${meio ? "" : "hidden sm:block"}`}
              >
                {/* a tela */}
                <div
                  className={`absolute inset-x-0 bottom-0 overflow-hidden rounded-[24px] ${alturaTela}`}
                  style={{ background: c.fundo }}
                >
                  <Barras quantidade={meio ? 46 : 34} altura={meio ? 150 : 120} />
                </div>

                {/* a pessoa, livre em cima e recortada só embaixo */}
                <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-b-[24px]">
                  <Image
                    src={c.imagem}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 90vw, 30vw"
                    className={`object-contain object-bottom ${meio ? "scale-[1.15] origin-bottom" : ""}`}
                  />
                </div>

                {/* a fita: ícone + duas pastilhas ligadas */}
                {c.fita && (
                  <div className="absolute inset-x-0 bottom-7 z-10 flex items-center justify-center">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border-[3px] border-white bg-[#c9491a] text-white shadow-[0_8px_20px_-8px_rgba(10,21,33,0.5)]">
                      <Sparkles className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <span aria-hidden className="h-[2px] w-3 bg-white" />
                    <span className="rounded-[10px] bg-white px-3.5 py-1.5 text-[1.5rem] font-medium tracking-[-0.03em] text-[#0a1521] shadow-[0_8px_20px_-8px_rgba(10,21,33,0.5)]"
                      style={{ fontFamily: "var(--nv-titulo)" }}
                    >
                      {c.fita[0]}
                    </span>
                    <span aria-hidden className="h-[2px] w-2.5 bg-white" />
                    <span className="rounded-[10px] bg-white px-3.5 py-1.5 font-serif text-[1.5rem] tracking-[-0.02em] text-[#0a1521] shadow-[0_8px_20px_-8px_rgba(10,21,33,0.5)]">
                      {c.fita[1]}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
