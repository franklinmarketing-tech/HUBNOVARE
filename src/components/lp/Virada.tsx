"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus } from "lucide-react";

import { VIRADA } from "@/lib/hub-lp";
import { ASSINATURA_GARANTIA_DIAS } from "@/lib/lp-precos";

/**
 * O antes e o depois, na composição do "Real customers. Real results." do
 * Calendly: aurora na largura toda, título branco centralizado, um cartão
 * grande no meio e as outras histórias espiando como pastilhas altas dos
 * dois lados.
 *
 * ┌── POR QUE NÃO É UM TRILHO QUE ROLA ───────────────────────────────────┐
 * │ A primeira versão era `overflow-x` com `scroll-snap`. Com cartões de  │
 * │ larguras diferentes o snap centraliza errado: o cartão ativo ficava   │
 * │ deslocado e a régua de progresso não batia com ele.                    │
 * │                                                                        │
 * │ Aqui o cartão ativo é ÚNICO e fica no centro do container; as         │
 * │ pastilhas são posicionadas a partir das bordas dele (`right-full` e   │
 * │ `left-full`). A centragem passa a ser um fato do layout, não o        │
 * │ resultado de uma conta de rolagem.                                     │
 * └────────────────────────────────────────────────────────────────────────┘
 */
export function Virada() {
  const [ativo, setAtivoBruto] = useState(0);
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const total = VIRADA.length;
  const v = VIRADA[ativo];

  const setAtivo = (i: number) => {
    const alvo = (i + total) % total;
    if (alvo === ativo) return;
    setDirecao(alvo > ativo ? 1 : -1);
    setAtivoBruto(alvo);
  };

  /** As duas histórias de cada lado, na ordem em que espiam. */
  const vizinhas = (lado: -1 | 1) =>
    [1, 2].map((d) => (ativo + d * lado + total * 2) % total);

  const Pastilha = ({ i, ordem }: { i: number; ordem: number }) => (
    <button
      type="button"
      onClick={() => setAtivo(i)}
      aria-label={`Ver: ${VIRADA[i].depois}`}
      className="relative block shrink-0 overflow-hidden rounded-[22px] bg-white/20 transition-[filter,transform] duration-500 hover:scale-[1.03] hover:brightness-110"
      style={{
        width: ordem === 0 ? "5.5rem" : "4rem",
        height: ordem === 0 ? "19rem" : "13rem",
      }}
    >
      <Image
        key={VIRADA[i].imagem}
        src={VIRADA[i].imagem}
        alt=""
        fill
        sizes="6rem"
        className="nv-troca-fade object-cover"
      />
    </button>
  );

  return (
    <>
      <div className="nv-caixa text-center">
        <p className="nv-chapeu text-white/70">O que muda na prática</p>

        <h2 className="nv-d2 mx-auto mt-6 max-w-[17ch] !text-white">
          A mesma renda. Uma vida financeira completamente outra.
        </h2>
      </div>

      {/* ------------------------------------------------------- o palco -- */}
      <div className="relative mt-12 px-4 sm:mt-16 sm:px-5">
        <div className="relative mx-auto w-full max-w-[60rem]">
          {/* pastilhas da esquerda */}
          <div className="absolute right-full top-1/2 mr-4 hidden -translate-y-1/2 items-center gap-3 lg:flex">
            {vizinhas(-1)
              .reverse()
              .map((i, k) => (
                <Pastilha key={`e-${k}`} i={i} ordem={k === 1 ? 0 : 1} />
              ))}
          </div>

          {/* o cartão */}
          <article className="overflow-hidden rounded-[30px] bg-white shadow-[0_44px_100px_-50px_rgba(0,0,0,0.75)]">
            <div
              key={v.antes}
              className="grid sm:grid-cols-[1fr_1fr]"
              style={{ animation: `nv-desliza-${direcao === 1 ? "esq" : "dir"} 560ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className="flex flex-col justify-between p-6 sm:p-11">
                <div>
                  <span className="nv-pill nv-pill-capitulo text-[0.9375rem]">
                    {v.marca}
                  </span>

                  <p className="nv-chapeu mt-7 flex items-center gap-2 text-[#17789c]">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-[#2596be] text-white">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    Agora
                  </p>

                  <h3 className="nv-h3 mt-4 max-w-[16ch] text-balance">
                    {v.depois}
                  </h3>
                </div>

                <div className="mt-10 flex items-start gap-3 border-t border-[#e8e4dc] pt-7">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#f3ece7] text-[#a53a12]">
                    <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="nv-chapeu text-[#5b6d81]">Antes</p>
                    <p className="nv-corpo mt-1.5">{v.antes}</p>
                  </div>
                </div>
              </div>

              <div className="relative order-first min-h-[13rem] overflow-hidden bg-[#e9eef4] sm:order-none sm:min-h-[26rem]">
                <Image
                  src={v.imagem}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 30rem"
                  className="object-cover"
                />
              </div>
            </div>
          </article>

          {/* pastilhas da direita */}
          <div className="absolute left-full top-1/2 ml-4 hidden -translate-y-1/2 items-center gap-3 lg:flex">
            {vizinhas(1).map((i, k) => (
              <Pastilha key={`d-${k}`} i={i} ordem={k === 0 ? 0 : 1} />
            ))}
          </div>
        </div>
      </div>

      {/* setas e régua de progresso */}
      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setAtivo(ativo - 1)}
          aria-label="Item anterior"
          className="grid h-12 w-12 place-items-center rounded-full border border-white/35 text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
        {VIRADA.map((item, i) => (
          <button
            key={item.antes}
            type="button"
            onClick={() => setAtivo(i)}
            aria-label={`Ir para o item ${i + 1} de ${total}`}
            aria-current={i === ativo}
            className={`h-[5px] rounded-full transition-all duration-500 ${
              i === ativo ? "w-12 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
        </div>
        <button
          type="button"
          onClick={() => setAtivo(ativo + 1)}
          aria-label="Próximo item"
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#0b1626] transition-colors hover:bg-[#eaf3f8]"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="nv-caixa mt-14">
        <div className="flex flex-col items-center gap-6 rounded-[28px] border border-white/15 bg-[#0b1626]/70 px-7 py-9 text-center backdrop-blur-md sm:flex-row sm:justify-between sm:text-left">
          <p className="nv-h4 max-w-lg !text-white">
            {ASSINATURA_GARANTIA_DIAS} dias de garantia incondicional. Não
            gostou, devolvemos o valor.
          </p>
          <a href="#preco" className="nv-btn nv-btn-branco shrink-0">
            Ver a assinatura
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  );
}
