"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { brl } from "@/app/planejamento/app/pecas";

/**
 * As roscas da Evolução: para onde o dinheiro vai e do que o patrimônio é
 * feito.
 *
 * A tela tinha UM gráfico, de linha, e com um único mês fechado ele mostrava
 * dois pontos soltos num retângulo vazio — a pior versão possível de um
 * gráfico de série temporal. Rosca não tem esse problema: a composição de um
 * mês já é uma história completa, e fica melhor ainda no segundo.
 *
 * Rosca e não pizza cheia: o buraco do meio carrega o total, que é o número
 * que a pessoa procura primeiro. Uma pizza obriga a somar as fatias de olho.
 */

/** Um tom por fatia, todos da paleta da casa. Nada de arco-íris. */
const CORES_GASTO = [
  "hsl(16 80% 55%)", // accent - o que sai
  "hsl(152 55% 41%)", // success - o que sobra
];

const CORES_PATRIMONIO = [
  "hsl(197 70% 45%)", // ciano - o que é seu
  "hsl(14 65% 48%)", // vermelho suave - o que é do banco
];

type Fatia = { nome: string; valor: number };

function semDados(fatias: Fatia[]) {
  return fatias.every((f) => f.valor <= 0);
}

/**
 * A rosca em si.
 *
 * O total no centro é o ponto: sem ele a pessoa lê proporções sem saber
 * proporções de quanto.
 */
function Rosca({
  titulo,
  explicacao,
  fatias,
  cores,
  total,
  rotuloTotal,
  vazio,
}: {
  titulo: string;
  explicacao: string;
  fatias: Fatia[];
  cores: string[];
  total: number;
  rotuloTotal: string;
  vazio: string;
}) {
  if (semDados(fatias)) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_8px_20px_-14px_hsl(215_40%_20%_/_0.2)]">
        <h3 className="font-display text-base font-bold text-primary">{titulo}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{explicacao}</p>
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          {vazio}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_8px_20px_-14px_hsl(215_40%_20%_/_0.2)]">
      <h3 className="font-display text-base font-bold text-primary">{titulo}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{explicacao}</p>

      <div className="relative mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="nome"
              innerRadius="60%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={0}
              /* Sem animação de entrada em loop: a rosca aparece uma vez e
                 fica parada. Gráfico que se remonta a cada render distrai
                 de um dado que não mudou. */
              isAnimationActive={false}
            >
              {fatias.map((f, i) => (
                <Cell key={f.nome} fill={cores[i % cores.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => brl(Number(v))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(215 20% 90%)",
                fontSize: 12,
                boxShadow: "0 8px 24px -12px hsl(215 40% 20% / 0.25)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={9}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* O total, no buraco. `pointer-events-none` para não roubar o
            hover das fatias. */}
        <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            {rotuloTotal}
          </p>
          <p className="font-display text-xl font-black tabular-nums text-primary">
            {brl(total)}
          </p>
        </div>
      </div>
    </section>
  );
}

export function GraficosEvolucao({
  renda,
  despesas,
  ativos,
  dividas,
}: {
  renda: number;
  despesas: number;
  ativos: number;
  dividas: number;
}) {
  const sobra = Math.max(0, renda - despesas);

  return (
    <section className="mb-5 grid gap-3 lg:grid-cols-2">
      <Rosca
        titulo="Para onde foi o seu mês"
        explicacao="Do que entrou, quanto saiu e quanto sobrou."
        fatias={[
          { nome: "Gastei", valor: Math.max(0, despesas) },
          { nome: "Sobrou", valor: sobra },
        ]}
        cores={CORES_GASTO}
        total={renda}
        rotuloTotal="Entrou"
        vazio="Sem renda lançada neste fechamento."
      />

      <Rosca
        titulo="Quanto do seu já é seu"
        explicacao="O que você tem contra o que ainda deve."
        fatias={[
          { nome: "É meu", valor: Math.max(0, ativos - dividas) },
          { nome: "Ainda devo", valor: Math.max(0, dividas) },
        ]}
        cores={CORES_PATRIMONIO}
        total={ativos}
        rotuloTotal="Você tem"
        vazio="Sem bens nem dívidas lançados neste fechamento."
      />
    </section>
  );
}
