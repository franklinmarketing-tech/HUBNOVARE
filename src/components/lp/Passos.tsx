"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Eye,
  Layers,
  PenLine,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ETAPAS } from "@/lib/hub-lp";
import { ROTULO_DESCONTO } from "@/lib/lp-precos";
import {
  MaqueteConsultoria,
  MaqueteContasFixas,
  MaqueteFinCash,
  MaqueteLancamento,
} from "@/components/lp/maquetes";

/* Os ícones vêm de `ETAPAS[].icone`, em `hub-lp.ts`. */
const ICONES: Record<string, LucideIcon> = { Layers, PenLine, Eye, Users };

const FUNDOS = [
  "linear-gradient(180deg,#6fb8dd 0%,#bfe2f2 38%,#e8f5fb 58%,#2f7fae 100%)",
  "linear-gradient(180deg,#7fc6cf 0%,#cfeaee 40%,#eef8f9 60%,#2e8d97 100%)",
  "linear-gradient(180deg,#7aa8e0 0%,#cadcf5 40%,#eef4fc 60%,#2b5fa8 100%)",
  "linear-gradient(180deg,#6ea9d8 0%,#c7e0f2 38%,#ecf5fb 58%,#1f4f7d 100%)",
];

/**
 * Uma maquete por etapa, na ordem de `ETAPAS`.
 *
 * As quatro contam a mesma história do texto ao lado: o trabalho do
 * primeiro dia (as contas que se repetem), o do dia a dia (um lançamento em
 * segundos), o da semana (o número) e o que não é trabalho nenhum (a
 * revisão que alguém escreve para você).
 */
const MAQUETES = [
  <MaqueteContasFixas key="fixas" />,
  <MaqueteLancamento key="lancamento" />,
  <MaqueteFinCash key="painel" />,
  <MaqueteConsultoria key="consultor" desconto={ROTULO_DESCONTO} />,
];

/** As barras claras que ficam atrás do cartão no painel colorido. */
function Barras({ lado }: { lado: "esq" | "dir" }) {
  const alturas = lado === "esq" ? [92, 150, 118, 168] : [168, 118, 150, 92];
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-y-16 flex items-center gap-2.5 opacity-40 ${
        lado === "esq" ? "left-6" : "right-6"
      }`}
    >
      {alturas.map((h, k) => (
        <span
          key={k}
          className="block w-[14px] rounded-full bg-white"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}

function Painel({ i }: { i: number }) {
  return (
    <div
      className="relative flex h-[33rem] items-center justify-center overflow-hidden rounded-[34px] p-12 transition-[background] duration-700"
      style={{ background: FUNDOS[i] }}
    >
      <Barras lado="esq" />
      <Barras lado="dir" />
      <div key={i} className="nv-troca-painel relative w-full max-w-[23rem]">
        {MAQUETES[i]}
      </div>
    </div>
  );
}

export function Passos() {
  const [ativo, setAtivo] = useState(0);
  const trilho = useRef<HTMLDivElement>(null);

  // O passo ativo vem da POSIÇÃO do trilho na tela, não de um observer por
  // item: é o que permite o bloco ficar preso enquanto os quatro textos se
  // trocam, em vez de a lista inteira rolar junto.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    let pedido = 0;
    const medir = () => {
      pedido = 0;
      const r = el.getBoundingClientRect();
      const curso = r.height - window.innerHeight;
      if (curso <= 0) return;
      const p = Math.min(Math.max(-r.top / curso, 0), 0.9999);
      setAtivo(Math.floor(p * ETAPAS.length));
    };
    const aoRolar = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  const e = ETAPAS[ativo];
  const Icone = ICONES[e.icone] ?? Layers;

  return (
    <>
      {/* ═════════════════════════════════════════════════════ desktop ==== */}
      {/*
          O trilho tem uma tela de altura por passo. O conteúdo fica `sticky`
          dentro dele: a página continua rolando, mas o que se vê parado é o
          bloco, e o que muda é o texto e o painel. É o "pin" clássico, sem
          sequestrar a roda do mouse (nada de `scrollTo` forçado, que é o que
          faz esse tipo de seção brigar com o trackpad).
      */}
      <div
        ref={trilho}
        className="relative hidden lg:block"
        style={{ height: `${ETAPAS.length * 100}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center">
          <div className="grid w-full items-center gap-20 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="nv-pill nv-pill-capitulo nv-chapeu">
                Como começa
              </span>
              <h2 className="nv-d2 mt-6 max-w-[16ch]">
                O trabalho é no primeiro dia. Depois é um número por semana.
              </h2>
              <p className="nv-lead mt-5 max-w-lg">
                O medo real nunca foi o preço, é o trabalho. A planilha de
                janeiro morre em fevereiro porque cobra que você lembre de
                abrir. Aqui a conta vem uma vez só.
              </p>

              {/* a régua de progresso e o aviso de que a seção pede rolagem */}
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-2" aria-hidden>
                  {ETAPAS.map((p, i) => (
                    <span
                      key={p.numero}
                      className={`block h-[3px] rounded-full transition-all duration-500 ${
                        i === ativo ? "w-12 bg-[#2596be]" : "w-5 bg-[#cfd9e3]"
                      }`}
                    />
                  ))}
                </div>

                <p
                  aria-hidden
                  className="flex items-center gap-2 text-[0.9375rem] font-medium tracking-[-0.01em] text-[#5b6d81] transition-opacity duration-500"
                  style={{ opacity: ativo === ETAPAS.length - 1 ? 0 : 1 }}
                >
                  <ChevronDown className="nv-role h-4 w-4 text-[#17789c]" strokeWidth={2.2} />
                  Continue rolando, {ativo + 1} de {ETAPAS.length}
                </p>
              </div>

              {/* o passo atual, um por vez */}
              <div
                key={e.numero}
                className="nv-troca mt-8 border-t border-[#dfe5ec] pt-8"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="nv-numero text-[0.9375rem] text-[#17789c]">
                      Passo {e.numero}
                    </p>
                    <h3 className="mt-3 flex items-center gap-3">
                      <Icone
                        className="h-6 w-6 shrink-0 text-[#0a1521]"
                        strokeWidth={1.7}
                      />
                      <span className="nv-h3 !text-[1.5rem]">{e.titulo}</span>
                    </h3>
                    <p className="nv-corpo mt-4 max-w-md">{e.texto}</p>
                  </div>

                  <span
                    aria-hidden
                    className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#0a1521]/[0.05] text-[#46586e]"
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
              </div>
            </div>

            <Painel i={ativo} />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ celular ==== */}
      {/* Sem pin: numa tela de telefone prender a rolagem é um convite para a
          pessoa achar que o site travou. Os quatro passos ficam empilhados. */}
      <div className="lg:hidden">
        <span className="nv-pill nv-pill-capitulo nv-chapeu">Como começa</span>
        <h2 className="nv-d2 mt-6 max-w-[16ch]">
          O trabalho é no primeiro dia. Depois é um número por semana.
        </h2>
        <p className="nv-lead mt-5 max-w-lg">
          O medo real nunca foi o preço, é o trabalho. A planilha de janeiro
          morre em fevereiro porque cobra que você lembre de abrir. Aqui a
          conta vem uma vez só.
        </p>

        <ol className="mt-12">
          {ETAPAS.map((p, i) => {
            const IconePasso = ICONES[p.icone] ?? Layers;
            return (
              <li
                key={p.numero}
                className="border-t border-[#dfe5ec] py-9 first:border-t-0 first:pt-0"
              >
                <p className="nv-numero text-[0.9375rem] text-[#17789c]">
                  Passo {p.numero}
                </p>
                <h3 className="mt-3 flex items-center gap-3">
                  <IconePasso
                    className="h-5 w-5 shrink-0 text-[#0a1521]"
                    strokeWidth={1.8}
                  />
                  <span className="nv-h4 !text-[1.1875rem]">{p.titulo}</span>
                </h3>
                <p className="nv-corpo mt-3">{p.texto}</p>

                <div
                  className="mt-6 flex items-center justify-center rounded-[24px] p-6"
                  style={{ background: FUNDOS[i] }}
                >
                  <div className="w-full max-w-[22rem]">{MAQUETES[i]}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
