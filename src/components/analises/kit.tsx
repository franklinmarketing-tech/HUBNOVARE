"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

/**
 * O KIT DA "ANÁLISE DE CONSULTOR" — as peças que toda ferramenta usa abaixo
 * do resultado, para as 20 terem a mesma cara (pedido do dono, 20/10/2026).
 * O modelo de referência é `AnaliseOrcamento`.
 *
 * Ordem de uso numa análise:
 *   <CascaAnalise titulo=…>
 *     <Veredito tom=… titulo=… texto=… />
 *     <GradeIndicadores> <Indicador …/> ×3 </GradeIndicadores>
 *     <CartaoGrafico titulo=… legenda=…> gráfico </CartaoGrafico>   (1 ou 2, em <GradeGraficos>)
 *     <Recomendacoes itens=[…] rodape=… />
 *   </CascaAnalise>
 *
 * ⚠️ REGRAS DE CONTEÚDO, valem para todas:
 * - Tudo sai dos números que a pessoa digitou e das contas que a ferramenta
 *   já faz. Nenhum rendimento, índice ou taxa inventada.
 * - Nada de recomendar produto, ativo ou instituição (somos consultoria de
 *   valores mobiliários: recomendação personalizada é a consultoria).
 * - Português claro, frases curtas, valores em R$ com `brl`.
 */

export const CORES_ANALISE = {
  navy: "hsl(215 50% 30%)",
  laranja: "hsl(24 85% 55%)",
  verde: "hsl(152 55% 41%)",
  cinza: "hsl(214 20% 86%)",
  vermelho: "hsl(0 70% 52%)",
  azul: "hsl(200 70% 45%)",
} as const;

export function CascaAnalise({
  titulo = "O que os seus números dizem",
  children,
  aviso = "Análise automática a partir dos números que você informou. É um ponto de partida para decidir — não é recomendação de investimento.",
}: {
  titulo?: string;
  children: ReactNode;
  aviso?: string;
}) {
  return (
    <section data-analise className="mx-auto mt-6 max-w-3xl space-y-4 print:break-inside-avoid" aria-label={titulo}>
      <div>
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Análise completa</p>
        <h2 className="mt-1 font-display text-xl font-bold text-primary sm:text-2xl">{titulo}</h2>
      </div>
      {children}
      <p className="text-2xs leading-relaxed text-slate-500">{aviso}</p>
    </section>
  );
}

/** Para quando faltam dados: diz o que preencher para a análise aparecer. */
export function AnaliseVazia({ texto }: { texto: string }) {
  return (
    <section data-analise className="mx-auto mt-6 max-w-3xl">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
        <p className="font-display text-base font-bold text-primary">A análise aparece aqui</p>
        <p className="mt-1 text-sm text-slate-500">{texto}</p>
      </div>
    </section>
  );
}

export function Veredito({ tom, titulo, texto }: { tom: "bom" | "atencao" | "ruim"; titulo: string; texto: string }) {
  const t = {
    bom: { caixa: "border-success/30 bg-success/5", icone: <CircleCheck className="h-5 w-5 text-success" /> },
    atencao: { caixa: "border-warning/40 bg-warning/5", icone: <TriangleAlert className="h-5 w-5 text-warning" /> },
    ruim: { caixa: "border-destructive/30 bg-destructive/5", icone: <CircleAlert className="h-5 w-5 text-destructive" /> },
  }[tom];
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${t.caixa}`}>
      <span className="mt-0.5 shrink-0">{t.icone}</span>
      <div>
        <p className="font-display text-base font-bold text-slate-900">{titulo}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{texto}</p>
      </div>
    </div>
  );
}

export function GradeIndicadores({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-3">{children}</div>;
}

export function Indicador({ rotulo, valor, nota, ruim }: { rotulo: string; valor: string; nota: string; ruim?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">{rotulo}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${ruim ? "text-destructive" : "text-primary"}`}>{valor}</p>
      <p className="mt-0.5 text-2xs text-slate-500">{nota}</p>
    </div>
  );
}

export function GradeGraficos({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

export function CartaoGrafico({ titulo, legenda, children }: { titulo: string; legenda?: string; children: ReactNode }) {
  return (
    // min-w-0: item de grid com conteúdo largo não pode empurrar a página.
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">{titulo}</p>
      {legenda && <p className="mt-0.5 text-2xs text-slate-500">{legenda}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * Barra com o valor da pessoa e um traço no alvo/referência. `bomAcima`
 * diz se passar do alvo é bom (poupança) ou ruim (gasto).
 */
export function BarraAlvo({ rotulo, valor, alvo, maximo, formato, bomAcima = false, cor = CORES_ANALISE.navy }: {
  rotulo: string; valor: number; alvo?: number; maximo: number; formato: (v: number) => string; bomAcima?: boolean; cor?: string;
}) {
  const ok = alvo === undefined ? true : bomAcima ? valor >= alvo : valor <= alvo;
  const esc = Math.max(maximo, valor, alvo ?? 0) || 1;
  return (
    <div>
      {/* flex-wrap: rótulo longo + valor com referência não cabem juntos em
          390px; o valor desce para a linha de baixo em vez de estourar a tela. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
        <span className="min-w-0 font-semibold text-slate-700">{rotulo}</span>
        <span className="whitespace-nowrap tabular-nums">
          <b className={ok ? "text-slate-900" : "text-destructive"}>{formato(valor)}</b>
          {alvo !== undefined && <span className="text-slate-500"> · referência {formato(alvo)}</span>}
        </span>
      </div>
      <div className="relative mt-2 h-3 rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(100, (valor / esc) * 100)}%`, background: ok ? cor : CORES_ANALISE.vermelho }} />
        {alvo !== undefined && (
          <span aria-hidden className="absolute -top-1 h-5 w-[3px] rounded-full bg-slate-800" style={{ left: `${Math.min(100, (alvo / esc) * 100)}%` }} />
        )}
      </div>
    </div>
  );
}

export type Recomendacao = { titulo: string; texto: string; href?: string; link?: string };

export function Recomendacoes({ itens, rodape, titulo = "O que um consultor faria, na ordem" }: { itens: Recomendacao[]; rodape?: ReactNode; titulo?: string }) {
  if (!itens.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">{titulo}</p>
      <ol className="mt-4 space-y-4">
        {itens.map((r, i) => (
          <li key={r.titulo} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{r.titulo}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{r.texto}</p>
              {r.href && r.link && (
                <Link href={r.href} className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline print:hidden">
                  {r.link} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      {rodape && <div className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-sm text-slate-700">{rodape}</div>}
    </div>
  );
}
