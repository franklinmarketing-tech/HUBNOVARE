import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { BotaoComecar } from "@/components/BotaoComecar";
import { MaqueteFinCash } from "@/components/lp/maquetes";
import { Palco } from "@/components/lp/Palco";
import { HEROI, OBJETIVOS_HEROI } from "@/lib/hub-lp";

/**
 * O HERÓI, a composição centrada do Visor.
 *
 * ┌── A REFERÊNCIA, DESMONTADA ───────────────────────────────────────────┐
 * │ Tudo centralizado e estreito: a pastilha de confiança com os rostos,  │
 * │ a headline enorme em duas ou três linhas, o subtítulo curto, dois     │
 * │ botões lado a lado e uma linha miúda de tranquilização embaixo.       │
 * │                                                                        │
 * │ E aí o gesto que faz a página: em volta do bloco central, POLAROIDES  │
 * │ PREGADAS com alfinete, cada uma com uma ilustração e uma palavra,    │
 * │ casa própria, viagem, filho, período sabático. Elas estão tortas, em  │
 * │ alturas diferentes, e algumas são cortadas pela borda da tela.        │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── POR QUE AS POLAROIDES FUNCIONAM (e não são enfeite) ────────────────┐
 * │ Porque elas mostram o DESTINO antes de mostrar a ferramenta. Ninguém  │
 * │ acorda querendo uma calculadora de financiamento; a pessoa quer a     │
 * │ casa. É o "personagem e desejo" do framework de narrativa que o       │
 * │ Richard cita, e é também a "estranheza" dele: num setor onde toda    │
 * │ landing mostra gráfico, mostrar um alfinete e uma foto torta é o que  │
 * │ faz a página ser lembrada.                                            │
 * │                                                                        │
 * │ Aqui elas são os objetivos que existem DE VERDADE dentro do           │
 * │ Planejamento, com os ícones 3D que o produto já usa nessas telas.     │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * No celular as polaroides saem de cena: seis cartões tortos numa tela de
 * 390px viram poluição, e o que importa ali é a headline e o botão. Em vez
 * delas entra uma fila simples com os mesmos objetivos.
 */

/** Onde cada polaroide fica. Ângulo e posição escritos à mão, um a um,
    distribuição automática dá exatamente o resultado que se quer evitar:
    simétrico, e portanto morto. */
const POSICOES = [
  { top: "0%", left: "0%", giro: "-7deg", dx: "370px", dy: "240px" },
  { top: "34%", left: "-4%", giro: "5deg", dx: "420px", dy: "40px" },
  { top: "68%", left: "5%", giro: "-4deg", dx: "330px", dy: "-180px" },
  { top: "1%", right: "1%", giro: "6deg", dx: "-370px", dy: "230px" },
  { top: "35%", right: "-4%", giro: "-5deg", dx: "-420px", dy: "40px" },
  { top: "69%", right: "4%", giro: "4deg", dx: "-330px", dy: "-180px" },
] as const;

export function HeroVitrine() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
      {/* O halo de luz atrás do bloco central. Ele existe para o olho ter um
          centro: sem ele o creme fica uniforme e a headline flutua. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]"
        style={{
          background:
            "radial-gradient(52% 46% at 50% 22%, rgba(37,150,190,0.13), transparent 70%)",
        }}
      />

      <div className="nv-caixa relative">
        {/* ------------------------------------------------- a confiança -- */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-3 rounded-full border border-[#e8e4dc] bg-white/80 py-2 pl-2 pr-5 backdrop-blur-sm">
            {/* ⚠️ ERAM DOIS AVATARES SOBREPOSTOS (-space-x-2.5). Com a saída
                do Leonardo sobrou um, e sobreposição de um elemento só é
                código que não faz nada — por isso o wrapper de flex saiu
                junto, em vez de ficar segurando um filho só. */}
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#e9eef4]">
              <Image
                src="/lp/socio-jefferson.webp"
                alt=""
                fill
                sizes="32px"
                className="object-cover object-[center_18%]"
              />
            </span>
            <span className="text-[0.9375rem] font-medium tracking-[-0.012em] text-[#46586e]">
              {HEROI.selo}
            </span>
          </span>
        </div>

        {/* --------------------------------------------------- a promessa -- */}
        <h1 className="nv-d1 mx-auto mt-8 max-w-[17ch] text-center text-balance">
          {/* A primeira palavra de `titulo2` fica fora do traço: quando a
              frase quebra (no celular sempre quebra), ela sobrava sozinha no
              fim da linha de cima com um pedacinho de sublinhado embaixo,
              que lia como defeito e não como gesto. */}
          {HEROI.titulo1} {HEROI.titulo2.split(" ")[0]}{" "}
          <span className="nv-traco">
            {HEROI.titulo2.split(" ").slice(1).join(" ")}
          </span>
        </h1>

        <p className="nv-lead mx-auto mt-8 max-w-[52ch] text-center text-pretty">
          {HEROI.lead}
        </p>

        {/* A recusa dita como argumento: é ela que faz o app servir a
            qualquer banco, e é a primeira objeção que a pessoa tem. */}
        <p className="mt-5 text-center text-[1.1875rem] font-semibold tracking-[-0.015em] text-[#17789c]">
          {HEROI.reforco}
        </p>

        {/* ------------------------------------------------------ a ação --- */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BotaoComecar tamanho="grande" destaque rotulo={HEROI.cta} />
          <a href="#produto" className="nv-btn nv-btn-linha">
            {HEROI.ctaSecundario}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[1.1875rem] tracking-[-0.012em] text-[#5b6d81]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#17789c]" strokeWidth={1.9} />
          {HEROI.microcopia}
        </p>
      </div>

      {/* ================================================== a vitrine ===== */}
      <div className="nv-caixa-larga relative mt-16 sm:mt-20">
        {/* --- desktop: o palco com as polaroides pregadas --- */}
        {/* A altura do palco não é estética: as três polaroides de cada lado
            ocupam ~11rem cada, e é essa medida que garante que a de cima não
            engula o rótulo da de baixo. */}
        <Palco className="nv-palco relative mx-auto hidden min-h-[36rem] max-w-[1120px] place-items-center md:grid">
          {OBJETIVOS_HEROI.map((o, i) => {
            const p = POSICOES[i];
            return (
              <div
                key={o.rotulo}
                aria-hidden
                className="nv-fixado w-[9.5rem]"
                style={
                  {
                    top: p.top,
                    left: "left" in p ? p.left : undefined,
                    right: "right" in p ? p.right : undefined,
                    "--nv-giro": p.giro,
                    "--nv-dx": p.dx,
                    "--nv-dy": p.dy,
                    "--nv-atraso": `${i * 70}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="nv-alfinete" />
                <div className="grid h-[7.5rem] place-items-center overflow-hidden rounded-[12px] bg-[#f4f7fa]">
                  <Image
                    src={o.icone}
                    alt=""
                    width={220}
                    height={220}
                    className="h-[5.5rem] w-auto object-contain"
                  />
                </div>
                <p className="mt-2.5 text-center text-[0.875rem] font-semibold tracking-[-0.015em] text-[#46586e]">
                  {o.rotulo}
                </p>
              </div>
            );
          })}

          {/* O cartão central fica POR CIMA das polaroides: é ele que ancora
              a composição, e a sobreposição é o que dá a profundidade.

              E ele mostra o PAINEL DO FIN CASH, não outra tela do produto: a
              headline promete um número, e o cartão ao lado dela tem de ser
              onde esse número aparece. Antes era o cartão da Íris, e a
              primeira dobra prometia uma coisa e ilustrava outra. */}
          <div className="relative z-10 flex justify-center">
            <MaqueteFinCash />
          </div>
        </Palco>

        {/* --- celular: a mesma ideia, sem a bagunça --- */}
        <div className="md:hidden">
          <div className="flex justify-center">
            <MaqueteFinCash />
          </div>

          <ul className="mt-12 flex flex-wrap justify-center gap-2.5">
            {OBJETIVOS_HEROI.map((o) => (
              <li
                key={o.rotulo}
                className="inline-flex items-center gap-2 rounded-full border border-[#e8e4dc] bg-white px-3.5 py-2"
              >
                <Image
                  src={o.icone}
                  alt=""
                  width={64}
                  height={64}
                  className="h-5 w-5 object-contain"
                />
                <span className="text-[0.9375rem] font-medium tracking-[-0.012em] text-[#46586e]">
                  {o.rotulo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
