import type { Metadata } from "next";
import {
  Check,
  Eye,
  Flag,
  Layers,
  PenLine,
  SlidersHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";

import { RevelarAoRolar } from "@/components/RevelarAoRolar";

import { Anuncio } from "@/components/lp/Anuncio";
import { BarraLP } from "@/components/lp/BarraLP";
import { HeroVitrine } from "@/components/lp/HeroVitrine";
import { Problema } from "@/components/lp/Problema";
import { Conta } from "@/components/lp/Conta";
import { Modulos } from "@/components/lp/Modulos";
import { Passos } from "@/components/lp/Passos";
import { Prova } from "@/components/lp/Prova";
import { Virada } from "@/components/lp/Virada";
import { Fecho } from "@/components/lp/Fecho";
import { Rodape } from "@/components/lp/Rodape";
import { Comparativo } from "@/components/lp/Comparativo";
import { Gratuito } from "@/components/lp/Gratuito";
import { Duvidas } from "@/components/lp/Duvidas";
import { MaqueteFinCash, MaqueteMarco } from "@/components/lp/maquetes";
import { TelaWorkspace } from "@/components/lp/Telas";

import {
} from "@/lib/lp-precos";
import {
  DIMENSOES,
  FATOS,
  FIN_CASH,
  MANIFESTO,
  MECANISMOS,
  MODULOS,
  N_FERRAMENTAS,
  PARA_VOCE_SE,
} from "@/lib/hub-lp";

import "./lp.css";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A LANDING DE VENDA DO WORKSPACE NOVARE                              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ┌── DE ONDE VEM A ARQUITETURA ──────────────────────────────────────────┐
 * │ A ordem das seções vem do framework de diagnóstico de LP do Richard   │
 * │ (`RICHARD.TXT`):                                                       │
 * │                                                                        │
 * │   problema → consequência → oportunidade → mecanismo → solução →      │
 * │   prova → oferta → redução de risco → CTA                              │
 * │                                                                        │
 * │ E o nível de consciência define o ÂNGULO: o ICP desta página está em  │
 * │ "consciência do problema" (sabe que o dinheiro some, já tentou        │
 * │ planilha). Para esse estágio a regra do Richard é "headline fala com  │
 * │ o estágio atual, prova empurra um estágio à frente", por isso o      │
 * │ herói fala do mês que não fecha e a prova mostra MECANISMO.           │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── DE ONDE VEM A FORMA ────────────────────────────────────────────────┐
 * │ Três referências, cada uma emprestando o que faz melhor:              │
 * │                                                                        │
 * │  VISOR      herói centrado com as polaroides pregadas, o bento de     │
 * │             problemas, o FAQ numerado em duas colunas e o fecho com   │
 * │             o traço de cor sob a última frase.                        │
 * │  SHOTBASE   a página como PILHA de painéis de cantos arredondados, a  │
 * │             faixa escura de manifesto, o zigue-zague de mecanismo com │
 * │             etiqueta colorida, os passos com régua vertical e painel  │
 * │             parado ao lado, o preço em cartão-dentro-de-cartão.       │
 * │  CALENDLY   a pilha de módulos de produto sobre auroras que trocam de │
 * │             cor, com a fita de ícones pairando sobre o cartão; o      │
 * │             paredão de prova sobre gradiente; o rodapé como painel.   │
 * │                                                                        │
 * │ O que NÃO foi copiado: a cor. As três são royal blue puro; aqui a     │
 * │ paleta é a da Novare (navy, ciano, laranja em dose pequena) sobre um  │
 * │ creme quente. Copiar a cor seria trocar a marca pela referência.      │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── O RITMO ────────────────────────────────────────────────────────────┐
 * │ O Richard reclama de páginas onde toda seção tem a mesma composição   │
 * │ ("imagem à direita, texto à esquerda"), a experiência vira previsível│
 * │ e o olho desliga. Aqui a alternância é deliberada:                    │
 * │                                                                        │
 * │   centrado → escuro → bento → pilha → zigue-zague → duas colunas →    │
 * │   escuro → trilho → três cartões → oferta → acordeão → centrado       │
 * │                                                                        │
 * │ E o fundo alterna creme / branco / navy, para cada seção ter começo   │
 * │ e fim visíveis sem precisar de uma linha divisória.                   │
 * └────────────────────────────────────────────────────────────────────────┘
 */

/*
   O título e a descrição repetem a promessa da headline, palavra por
   palavra, porque o resultado de busca e o card compartilhado são a PRIMEIRA
   dobra de quem chega por ali. Prometer uma coisa no anúncio e outra na
   página é o desalinhamento mais caro que existe.
*/
export const metadata: Metadata = {
  /* ⚠️ CABE EM 60, que é onde o buscador corta. Tinha 76, e a parte que
     sumia era o fim da pergunta — o título aparecia truncado no meio. */
  title: `${FIN_CASH}: quanto dá para gastar hoje`,
  description: `O saldo mostra o que você tem. O ${FIN_CASH} desconta o que ainda vai sair e mostra o que sobra — sem conectar banco. De graça, sem cartão.`,
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: "Quanto você pode gastar hoje sem estourar o mês?",
    description: `O ${FIN_CASH}, a Íris e as ${N_FERRAMENTAS} ferramentas da Novare. Tudo de graça, sem cartão e sem pegadinha.`,
    url: "/assinar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

/* -------------------------------------------------------------------------- */

/* Os dois mapas são indexados pelo campo `icone` de `MANIFESTO.verbos` e
   `MECANISMOS`, em `hub-lp.ts`. Um nome que não está aqui não quebra a
   build: cai no fallback, e a seção inteira fica com o mesmo desenho
   repetido cinco vezes — que foi exatamente o que aconteceu quando a copy
   trocou os verbos do Ciclo Novare e este mapa ficou para trás. */
const ICONES_VERBO: Record<string, LucideIcon> = {
  Layers,
  Target,
  PenLine,
  Eye,
  SlidersHorizontal,
};

const ICONES_MECANISMO: Record<string, LucideIcon> = { PenLine, Flag };

const MAQUETE_MECANISMO = [<MaqueteFinCash key="a" />, <MaqueteMarco key="b" />];

/* -------------------------------------------------------------------------- */

export default function AssinarPage() {
  return (
    <div className="lp-novare" id="topo">
      {/* A Satoshi (corpo) e a General Sans (o substituto da TWK Everett
          enquanto os arquivos licenciados não estiverem em /public/fonts)
          vêm da Fontshare. O `precedence` faz o React içar a folha para o
          <head>, ela é carregada só nesta rota. */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&f[]=general-sans@500,600&display=swap"
      />

      <RevelarAoRolar />
      <Anuncio />
      <BarraLP />

      <main>
        {/* ═══════════════════════════════════════════════ 1. O HERÓI ═══ */}
        <HeroVitrine />

        {/* ═════════════════════════════════════════════ 2. OS FATOS ════ */}
        {/*
            A prova de confiança que o Richard pede no herói, logo depois da
            promessa, para responder "por que eu deveria acreditar em vocês?"
            antes que a dúvida vire saída. Quatro números, nenhum estimado.
        */}
        <section className="pb-6">
          <div className="nv-caixa">
            <ul className="revelar-escada grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-[#e8e4dc] bg-[#e8e4dc] sm:grid-cols-4">
              {FATOS.map((f) => (
                <li key={f.rotulo} className="bg-[#fdfcfa] px-5 py-8 text-center">
                  <p className="nv-numero text-[2.5rem] text-[#0a1521] sm:text-[3rem]">
                    {f.valor}
                  </p>
                  <p className="mx-auto mt-3 max-w-[18ch] text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#5b6d81]">
                    {f.rotulo}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══════════════════════════════════════ 3. O MANIFESTO ═══════ */}
        {/*
            O gesto do Shotbase: uma faixa escura, uma frase só, e os verbos
            do produto embaixo. Ela responde em uma linha a pergunta que
            nasce junto com a promessa, "tá, mas o que ISSO é?", e serve de
            respiro escuro antes da página clarear de novo.
        */}
        <section className="nv-painel nv-painel-navy nv-grade mt-4 overflow-hidden">
          <div className="nv-caixa relative py-20 text-center sm:py-28">
            <h2 className="revelar nv-d2 mx-auto max-w-[22ch] !text-white">
              {MANIFESTO.frase1}{" "}
              <span className="text-[#6dc6e6]">{MANIFESTO.frase2}</span>
            </h2>

            <ul className="revelar-escada mt-14 flex flex-wrap items-start justify-center gap-x-10 gap-y-9 sm:gap-x-16">
              {MANIFESTO.verbos.map((v) => {
                const Icone = ICONES_VERBO[v.icone] ?? Eye;
                return (
                  <li key={v.rotulo} className="w-24 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center text-white/85">
                      <Icone className="h-7 w-7" strokeWidth={1.4} />
                    </span>
                    <p className="mt-3 text-[1.1875rem] font-medium tracking-[-0.015em] text-white/85">
                      {v.rotulo}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* o letreiro fecha a faixa escura, listando o que existe dentro */}
          <div className="relative overflow-hidden border-t border-white/10 py-5">
            <div className="nv-letreiro">
              {[0, 1].map((copia) => (
                <ul
                  key={copia}
                  aria-hidden={copia === 1}
                  className="flex shrink-0 items-center"
                >
                  {DIMENSOES.map((d) => (
                    <li
                      key={`${copia}-${d}`}
                      className="flex items-center whitespace-nowrap px-6 text-[0.9375rem] font-medium tracking-[-0.01em] text-white/58"
                    >
                      {d}
                      <span className="ml-6 h-1 w-1 rounded-full bg-[#2596be]" />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════ 4. O PROBLEMA ═══════ */}
        {/*
            O acordeão horizontal do Calendly: quatro painéis altos, o aberto
            ocupando o dobro da largura. Ele é a peça de "agitar a dor" da
            página, e o formato importa, porque obriga a pessoa a ESCOLHER
            qual das quatro dores é a dela. Quem clica já se reconheceu.
        */}
        <section
          id="problema"
          className="nv-painel nv-painel-creme mt-4 scroll-mt-28 py-20 sm:py-28"
        >
          <div className="nv-caixa">
            <span className="revelar nv-pill nv-pill-capitulo nv-chapeu">
              O problema
            </span>

            <div className="mt-7 grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <h2 className="revelar nv-d2 max-w-[17ch]">
                O dinheiro não some. Ele{" "}
                <span className="nv-traco">vaza</span>, e sempre pelo mesmo
                lugar.
              </h2>
              <p className="revelar nv-lead max-w-lg lg:pb-2">
                Ninguém organiza o que não consegue ver. Escolha a que mais
                parece a sua, provavelmente são as quatro.
              </p>
            </div>

            <div className="revelar mt-14">
              <Problema />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ 5. A CONTA ═══════ */}
        {/* O exemplo trabalhado, desenhado como placa e chip. Ver `Conta`. */}
        <Conta />

        {/* ══════════════════════════════════ 6. É PARA VOCÊ SE ═════════ */}
        {/*
            A auto-seleção. O Richard separa ICP de persona: persona é
            biografia, ICP é critério de compra. A lista é o critério, escrito
            para a pessoa SE RECONHECER item a item em vez de ser descrita —
            e para quem não se reconhece ir embora agora, que é melhor para
            os dois lados.
        */}
        <section className="nv-painel nv-painel-gelo mt-4 py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div>
                <span className="revelar nv-pill nv-pill-capitulo nv-chapeu">
                  Para quem é
                </span>
                <h2 className="revelar nv-d2 mt-7 max-w-[14ch]">
                  O {FIN_CASH} é para você se
                </h2>
              </div>

              <ul className="revelar-escada grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:pt-4">
                {PARA_VOCE_SE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#2596be] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="nv-corpo !text-[#0a1521]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════ 7. OS MÓDULOS ══════ */}
        <section id="produto" className="mt-4 scroll-mt-28">
          <div className="nv-caixa pb-12 pt-20 text-center sm:pb-16 sm:pt-28">
            <span className="revelar nv-pill nv-pill-capitulo nv-chapeu">
              O que é
            </span>
            <h2 className="revelar nv-d2 mx-auto mt-7 max-w-[20ch]">
              Você não está comprando um app
            </h2>
            <p className="revelar nv-lead mx-auto mt-6 max-w-2xl">
              São {MODULOS.length} coisas, todas de graça, e a última não é
              software: é o método que a Novare usa na consultoria, aberto para
              quem nunca vai contratar uma.
            </p>
          </div>

          <Modulos />
        </section>

        {/* ═══════════════════════ 7b. O WORKSPACE, EM TELA REAL ═══════ */}
        {/*
            ONDE A PÁGINA FINALMENTE MOSTRA O PRODUTO.

            Até aqui a landing inteira argumentava com ilustração: maquetes
            desenhadas em CSS, fotos dos sócios, logos. Nenhuma tela do app
            de verdade aparecia em lugar nenhum — quem chegava via a
            promessa, nunca o produto.

            A seção vem DEPOIS dos módulos de propósito: o leitor acabou de
            conhecer as cinco peças uma a uma, e esta é a única imagem em
            que elas aparecem juntas, no lugar onde de fato vão estar. É a
            resposta visual para 'onde é que isso tudo mora'.

            ⚠️ Não leva CTA. Ela fica entre o catálogo (7) e o mecanismo
            (8), duas seções que explicam; um botão aqui interromperia a
            explicação no meio para pedir a compra, e o preço já tem a
            seção 13 inteira para isso.
        */}
        <section className="nv-painel nv-painel-gelo mt-4 py-20 sm:py-28">
          <div className="nv-caixa text-center">
            <span className="revelar nv-pill nv-pill-ciano nv-chapeu">
              Por dentro da assinatura
            </span>
            <h2 className="revelar nv-d2 mx-auto mt-7 max-w-[20ch]">
              Tudo isso abre na mesma tela
            </h2>
            <p className="revelar nv-lead mx-auto mt-6 max-w-2xl">
              Um cadastro só, e de graça. O {FIN_CASH} no primeiro card, a
              Íris ao lado e as {N_FERRAMENTAS} ferramentas separadas por
              assunto — nada para instalar, nada para configurar.
            </p>
          </div>

          <div className="nv-caixa-larga revelar mt-14 sm:mt-16">
            <TelaWorkspace />
          </div>
        </section>

        {/* ══════════════════════════════════════ 8. O MECANISMO ════════ */}
        {/*
            O zigue-zague do Shotbase, aplicado ao que mais diferencia a casa.
            O Richard é explícito: para quem está consciente do problema, a
            prova que converte é o MECANISMO, não o benefício repetido com
            outras palavras. Aqui a página para de dizer O QUE faz e mostra
            COMO faz.
        */}
        <section className="nv-painel nv-painel-papel mt-4 py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="text-center">
              <span className="revelar nv-pill nv-pill-capitulo nv-chapeu">
                Por dentro
              </span>
              <h2 className="revelar nv-d2 mx-auto mt-7 max-w-[18ch]">
                Como é que ele enxerga o que você não enxerga
              </h2>
              <p className="revelar nv-lead mx-auto mt-6 max-w-2xl">
                A página para de dizer o que faz e mostra como faz.
              </p>
            </div>

            <div className="mt-20 space-y-24 sm:mt-24 sm:space-y-32">
              {MECANISMOS.map((m, i) => {
                const Icone = ICONES_MECANISMO[m.icone] ?? PenLine;
                const invertido = i % 2 === 1;
                return (
                  <div
                    key={m.titulo}
                    className="revelar grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
                  >
                    {/* ------------------------------------------ texto -- */}
                    <div className={invertido ? "lg:order-2" : ""}>
                      <span
                        className={`nv-pill ${
                          m.tom === "ciano"
                            ? "bg-[#eaf6fb] text-[#17789c]"
                            : "bg-[#fdf0e9] text-[#a53a12]"
                        }`}
                      >
                        <Icone className="h-4 w-4" strokeWidth={2} />
                        {m.etiqueta}
                      </span>

                      <h3 className="nv-h3 mt-6 max-w-[16ch]">{m.titulo}</h3>

                      <ul className="mt-7 space-y-3.5">
                        {m.itens.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-white ${
                                m.tom === "ciano" ? "bg-[#2596be]" : "bg-[#c9491a]"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                            <span className="nv-corpo !text-[#0a1521]">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="mt-7 border-l-2 border-[#e3eaf2] pl-5 text-[1.1875rem] leading-relaxed tracking-[-0.008em] text-[#5b6d81]">
                        {m.nota}
                      </p>
                    </div>

                    {/* ---------------------------------------- maquete -- */}
                    <div
                      className={`relative -mx-1 flex items-center justify-center overflow-hidden rounded-[28px] px-3 py-8 sm:mx-0 sm:min-h-[30rem] sm:rounded-[34px] sm:p-14 ${
                        invertido ? "lg:order-1" : ""
                      }`}
                      style={{
                        background:
                          m.tom === "ciano"
                            ? "linear-gradient(180deg,#6fb8dd 0%,#bfe2f2 38%,#e8f5fb 58%,#2f7fae 100%)"
                            : "linear-gradient(180deg,#e7a884 0%,#f6dcc9 38%,#fdf1e8 58%,#b0561f 100%)",
                      }}
                    >
                      {[0, 1].map((lado) => (
                        <span
                          key={lado}
                          aria-hidden
                          className={`pointer-events-none absolute inset-y-14 hidden items-center gap-2.5 opacity-40 sm:flex ${
                            lado === 0 ? "left-5" : "right-5"
                          }`}
                        >
                          {(lado === 0
                            ? [88, 142, 112, 160]
                            : [160, 112, 142, 88]
                          ).map((h, k) => (
                            <span
                              key={k}
                              className="block w-[13px] rounded-full bg-white"
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </span>
                      ))}
                      <div className="relative w-full max-w-[23rem]">
                        {MAQUETE_MECANISMO[i]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════ 9. O PROCESSO ══════ */}
        <section
          id="processo"
          // `overflow-visible` não é enfeite: `overflow: hidden` no ancestral
          // quebra o `position: sticky` do bloco preso lá dentro, e a seção
          // inteira vira uma faixa em branco de quatro telas de altura.
          className="nv-painel nv-painel-gelo mt-4 scroll-mt-28 overflow-visible py-20 sm:py-28"
        >
          <div className="nv-caixa">
            <Passos />
          </div>
        </section>

        {/* ═══════════════════════════════════════ 10. A VIRADA ═════════ */}
        <section className="nv-painel nv-aurora-virada mt-4 py-20 sm:py-28">
          <Virada />
        </section>

        {/* ══════════════════════════════════════════ 11. A PROVA ═══════ */}
        <section className="mt-4 overflow-hidden py-20 sm:py-28">
          <Prova />
        </section>

        {/* ════════════════════════════════════ 12. A COMPARAÇÃO ════════ */}
        <section className="nv-painel nv-painel-papel mt-4 py-20 sm:py-28">
          <div className="nv-caixa text-center">
            <span className="revelar nv-pill nv-pill-ciano nv-chapeu">
              Comparando
            </span>
            <h2 className="revelar nv-d2 mx-auto mt-7 max-w-[18ch]">
              Você já tentou as outras duas colunas
            </h2>
            <p className="revelar nv-lead mx-auto mt-6 max-w-2xl">
              O extrato é um retrovisor. A planilha faz a conta certa, mas cobra
              que você lembre de abrir. As três últimas linhas são as que a
              gente perde, e elas ficam na tabela.
            </p>
          </div>

          <div className="nv-caixa-larga revelar">
            <Comparativo />
          </div>
        </section>

        {/* ═══════════════════════════════════════ 13. É DE GRAÇA ═══════

            ⚠️ ERA A SEÇÃO DO PREÇO, com dois planos e garantia de 7 dias.
            Saiu em 18/10/2026, quando o Hub deixou de ser vendido. Note que
            a âncora `#preco` FICOU: ela está em links espalhados pelo site
            e em material já divulgado, e trocá-la quebraria esses links sem
            ganhar nada. O que mudou é o que a pessoa encontra ao chegar. */}
        <section
          id="preco"
          className="nv-painel nv-painel-creme mt-4 scroll-mt-28 overflow-visible py-20 sm:py-28"
        >
          <div className="nv-caixa">
            <div className="mb-14 text-center">
              <span className="nv-pill nv-pill-ciano nv-chapeu">Quanto custa</span>
              <h2 className="nv-d2 mx-auto mt-7 max-w-[19ch]">
                Nada.{" "}
                <span className="text-[#17789c]">
                  É de graça mesmo.
                </span>
              </h2>
              <p className="nv-lead mx-auto mt-6 max-w-2xl">
                Sem cartão e sem comissão embutida. A Novare
                vive da consultoria que faz com quem pede — as ferramentas
                daqui são o nosso cartão de visita.
              </p>
            </div>

            <Gratuito />
          </div>
        </section>

        {/* ════════════════════════════════════════ 14. AS DÚVIDAS ══════ */}
        <section
          id="duvidas"
          className="nv-painel nv-painel-papel mt-4 scroll-mt-28 py-20 sm:py-28"
        >
          <Duvidas />
        </section>

        {/* ═════════════════════════════════════════ 15. O FECHO ════════ */}
        <section className="relative py-24 sm:py-28">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(48% 44% at 50% 26%, rgba(37,150,190,0.13), transparent 70%)",
            }}
          />
          <Fecho />
        </section>

        {/* ══════════════════════════════════════════ 16. O RODAPÉ ═════ */}
        <Rodape />

      </main>
    </div>
  );
}
