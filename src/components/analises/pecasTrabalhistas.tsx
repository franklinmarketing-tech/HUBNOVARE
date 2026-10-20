"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, brlCurto, pct } from "@/lib/calculos";

/**
 * Peças de gráfico das análises das ferramentas trabalhistas (salário
 * líquido, rescisão, seguro-desemprego, 13º e férias). Ficam aqui, fora do
 * kit, porque só este grupo usa: a rosca com legenda e a barra empilhada
 * "o que fica × o que sai".
 */

export type Fatia = { nome: string; valor: number; cor: string };

/** Rosca com o número principal no meio e a legenda em % da base. */
export function Rosca({ fatias, base, centro, rotuloCentro }: {
  fatias: Fatia[];
  /** Sobre o que a % da legenda é calculada (ex.: o bruto). */
  base: number;
  centro: string;
  rotuloCentro: string;
}) {
  const visiveis = fatias.filter((f) => f.valor > 0);
  return (
    <>
      <div className="relative mx-auto h-56 w-full max-w-[16rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={visiveis} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%"
              paddingAngle={2} stroke="none" isAnimationActive>
              {visiveis.map((f) => <Cell key={f.nome} fill={f.cor} />)}
            </Pie>
            <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <span className="font-display text-2xl font-bold tabular-nums text-primary">{centro}</span>
          <span className="text-2xs text-slate-500">{rotuloCentro}</span>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {visiveis.map((f) => (
          <li key={f.nome} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
            <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
            <span className="ml-auto flex gap-3 whitespace-nowrap tabular-nums">
              <span className="text-slate-500">{brl(f.valor)}</span>
              <b className="w-10 text-right text-slate-800">{pct(base > 0 ? (f.valor / base) * 100 : 0, 0)}</b>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export type Serie = { chave: string; nome: string; cor: string };

/**
 * Barras empilhadas na vertical (uma por categoria do eixo X). Serve para
 * "parcela × o que falta" e "líquido × descontos".
 */
export function BarrasEmpilhadas({ dados, series, altura = "h-56" }: {
  dados: Array<Record<string, string | number>>;
  series: Serie[];
  altura?: string;
}) {
  return (
    <>
      <div className={`${altura} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => brlCurto(Number(v ?? 0))} />
            <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: "rgba(148,163,184,0.12)" }} />
            {series.map((s, i) => (
              <Bar key={s.chave} dataKey={s.chave} name={s.nome} stackId="a" fill={s.cor}
                radius={i === series.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {series.map((s) => (
          <li key={s.chave} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.cor }} />
            {s.nome}
          </li>
        ))}
      </ul>
    </>
  );
}
