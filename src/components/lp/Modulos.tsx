import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Target,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { MODULOS } from "@/lib/hub-lp";
import { ROTULO_DESCONTO_SELO } from "@/lib/lp-precos";
import {
  MaqueteConsultoria,
  MaqueteFerramentas,
  MaqueteFinCash,
  MaqueteIris,
  MaquetePlano,
} from "@/components/lp/maquetes";

/**
 * ┌── OS TRÊS MAPAS ABAIXO SÃO INDEXADOS POR `MODULOS[].chave` ───────────┐
 * │ São cinco módulos, e a ORDEM deles é o argumento (ver `hub-lp.ts`):   │
 * │ o mês que já está correndo, os próximos anos, a IA, o tamanho da casa │
 * │ e, por último, o humano.                                              │
 * │                                                                        │
 * │ Uma chave que não existe aqui não quebra a build: só deixa o painel   │
 * │ do módulo VAZIO, porque `MAQUETES[chave]` vira `undefined` e o React  │
 * │ não renderiza nada. Mexeu na chave lá, mexa nos três mapas aqui.      │
 * └────────────────────────────────────────────────────────────────────────┘
 */
const ICONES: Record<string, LucideIcon> = { Wallet, Target, Bot, Wrench, Users };

const MAQUETES: Record<string, React.ReactNode> = {
  fincash: <MaqueteFinCash />,
  finplan: <MaquetePlano />,
  iris: <MaqueteIris />,
  ferramentas: <MaqueteFerramentas />,
  consultor: <MaqueteConsultoria desconto={ROTULO_DESCONTO_SELO} />,
};

const TOM_ICONE: Record<string, string> = {
  fincash: "bg-[#dcecf8] text-[#17789c]",
  finplan: "bg-[#dbe7fb] text-[#2b5fa8]",
  iris: "bg-[#d9f0e8] text-[#1f7a4d]",
  ferramentas: "bg-[#f7e5d6] text-[#a53a12]",
  consultor: "bg-[#e3ddf5] text-[#4c3d8f]",
};

function Fita({ ativo }: { ativo: number }) {
  return (
    <div aria-hidden className="relative z-20 mx-auto flex w-fit items-center gap-2.5">
      {MODULOS.map((m, i) => {
        const Icone = ICONES[m.icone] ?? Wallet;
        const isAtivo = i === ativo;
        return (
          <span key={m.chave} className="relative">
            <span
              className={`grid h-12 w-12 place-items-center rounded-[16px] transition-colors sm:h-[52px] sm:w-[52px] ${
                isAtivo
                  ? "bg-white text-[#0a1521] shadow-[0_10px_24px_-12px_rgba(10,21,33,0.45)]"
                  : "bg-white/60 text-[#8695a6]"
              }`}
            >
              <Icone className="h-5 w-5" strokeWidth={isAtivo ? 1.9 : 1.6} />
            </span>
            {isAtivo && (
              <span className="absolute -bottom-[6px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
            )}
          </span>
        );
      })}
    </div>
  );
}

export function Modulos() {
  return (
    <div className="space-y-4 lg:space-y-0">
      {MODULOS.map((m, i) => {
        const Icone = ICONES[m.icone] ?? Wallet;
        return (
          <div key={m.chave} className="nv-cresce">
            <section
              aria-label={`${m.etiqueta}: ${m.titulo}`}
              className={`nv-painel ${m.aurora} lg:sticky`}
              style={{ top: `calc(2rem + ${i * 16}px)`, zIndex: i + 1 }}
            >
              <div className="px-2.5 pb-2.5 pt-8 sm:px-8 sm:pb-16 sm:pt-14">
                <Fita ativo={i} />

                <div className="-mt-6 rounded-[28px] bg-[#fdfcfa] px-5 pb-5 pt-9 sm:p-11 lg:p-14">
                  <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${
                            TOM_ICONE[m.chave] ?? "bg-[#dcecf8] text-[#17789c]"
                          }`}
                        >
                          <Icone className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="text-[1.1875rem] font-semibold tracking-[-0.018em] text-[#0a1521]">
                          {m.etiqueta}
                        </span>
                        <span className="rounded-md bg-[#0a1521]/[0.07] px-2 py-1 text-[0.8125rem] font-semibold tracking-[-0.01em] text-[#46586e]">
                          {m.selo}
                        </span>
                      </div>

                      <h3 className="nv-h3 mt-6 max-w-[19ch] text-balance">
                        {m.titulo}
                      </h3>

                      <p className="nv-corpo mt-5 max-w-[42ch]">{m.texto}</p>

                      <Link href={m.href} className="nv-link mt-8">
                        {m.linkRotulo}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div
                      className={`relative flex items-center justify-center overflow-hidden rounded-[22px] px-3 py-6 sm:p-12 lg:p-16 ${m.aurora}`}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-white/55"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-10 left-4 hidden sm:flex items-center gap-2 opacity-70 sm:left-8"
                      >
                        {[46, 78, 58, 92].map((h, k) => (
                          <span
                            key={k}
                            className="block w-[9px] rounded-full bg-white"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </span>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-10 right-4 hidden sm:flex items-center gap-2 opacity-70 sm:right-8"
                      >
                        {[92, 58, 78, 46].map((h, k) => (
                          <span
                            key={k}
                            className="block w-[9px] rounded-full bg-white"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </span>

                      <div className="relative w-full max-w-[25rem]">
                        {MAQUETES[m.chave]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}
