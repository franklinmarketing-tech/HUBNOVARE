"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

/**
 * Os visuais das páginas de consultoria: o método desenhado, não resultado
 * prometido.
 *
 * ⚠️ REGRA QUE NÃO SE QUEBRA AQUI. Nenhum número desta tela é resultado de
 * cliente, média da casa ou promessa de rentabilidade. Numa consultoria de
 * investimentos registrada, gráfico de "quanto nossos clientes ganharam" é
 * risco regulatório antes de ser problema de honestidade — e a Novare vende
 * justamente não ter conflito de interesse.
 *
 * O que estes gráficos mostram é a MECÂNICA: como uma taxa corrói patrimônio
 * no tempo, como uma carteira concentrada se parece, o que entra numa
 * análise. São verdadeiros por construção, como uma fórmula é verdadeira —
 * e cada um carrega o rótulo "exemplo" na própria tela, não em nota de
 * rodapé.
 *
 * Quando houver caso real com autorização do cliente, ele entra AO LADO
 * destes, marcado como tal. Não no lugar deles.
 */

const NAVY = "hsl(215 50% 23%)";
const ACCENT = "hsl(16 80% 55%)";
const CIANO = "hsl(197 70% 45%)";
const SUCESSO = "hsl(152 55% 41%)";
const CINZA = "hsl(215 16% 80%)";

const brl0 = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/** O selo que impede qualquer um destes gráficos de ser lido como promessa. */
function SeloExemplo({ texto = "Exemplo ilustrativo" }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {texto}
    </span>
  );
}

/**
 * Anima só quando o gráfico entra na tela.
 *
 * Um gráfico que já desenhou antes de a pessoa rolar até ele perdeu a
 * animação — e é justamente o movimento que faz a página parecer viva.
 */
function useVisivel<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sem IntersectionObserver (ou com movimento reduzido), mostra parado.
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisivel(true),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visivel };
}

/* ═══════════════════════════════════════════════ 1. O CUSTO DA TAXA */

/**
 * O que 1,5% ao ano tira de um patrimônio em 20 anos.
 *
 * É a conta que a consultoria de investimentos existe para fazer, e a que
 * ninguém que ganha comissão mostra. Os dois cenários partem do mesmo aporte
 * e do mesmo rendimento bruto — o que muda é só a taxa.
 */
export function CustoDaTaxa() {
  const { ref, visivel } = useVisivel<HTMLDivElement>();

  // 100 mil, aporte de 1.000/mês, 8% a.a. bruto. Uma linha paga 1,5% de taxa.
  const serie = Array.from({ length: 21 }, (_, ano) => {
    const cresce = (taxa: number) => {
      let v = 100_000;
      for (let a = 0; a < ano; a++) v = v * (1 + 0.08 - taxa) + 12_000;
      return Math.round(v);
    };
    return { ano: ano === 0 ? "hoje" : `${ano}a`, sem: cresce(0), com: cresce(0.015) };
  });

  const fim = serie[serie.length - 1];
  const diferenca = fim.sem - fim.com;

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_12px_32px_-20px_hsl(215_40%_20%_/_0.25)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-primary">
          O que uma taxa de 1,5% ao ano custa
        </h3>
        <SeloExemplo />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Mesmo aporte, mesmo rendimento bruto. A única diferença entre as duas
        linhas é a taxa que sai todo ano — e em 20 anos ela vira{" "}
        <strong className="text-accent-strong">{brl0(diferenca)}</strong>.
      </p>

      <div className="mt-5 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradSem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CIANO} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CIANO} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="ano"
              tick={{ fontSize: 10, fill: "hsl(215 16% 55%)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <Tooltip
              formatter={(v, n) => [brl0(Number(v)), n === "sem" ? "Sem a taxa" : "Com 1,5% a.a."]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(215 20% 90%)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="sem"
              stroke={CIANO}
              strokeWidth={2.5}
              fill="url(#gradSem)"
              isAnimationActive={visivel}
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="com"
              stroke={ACCENT}
              strokeWidth={2.5}
              strokeDasharray="5 4"
              fill="transparent"
              isAnimationActive={visivel}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-4 rounded-full" style={{ background: CIANO }} />
          Sem a taxa
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-4 rounded-full" style={{ background: ACCENT }} />
          Com 1,5% ao ano
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ 2. CARTEIRA CONCENTRADA */

/**
 * O risco que a rentabilidade esconde.
 *
 * A rosca da esquerda é a carteira que chega; a da direita, depois do
 * rebalanceamento. Não há promessa de retorno — o que muda é a exposição.
 */
export function CarteiraAntesDepois() {
  const { ref, visivel } = useVisivel<HTMLDivElement>();

  const antes = [
    { nome: "Uma única ação", valor: 62, cor: ACCENT },
    { nome: "Renda fixa", valor: 24, cor: CIANO },
    { nome: "Fundos", valor: 14, cor: CINZA },
  ];
  const depois = [
    { nome: "Ações (várias)", valor: 30, cor: CIANO },
    { nome: "Renda fixa", valor: 45, cor: SUCESSO },
    { nome: "Fundos", valor: 15, cor: NAVY },
    { nome: "Exterior", valor: 10, cor: CINZA },
  ];

  const Rosca = ({ dados, titulo }: { dados: typeof antes; titulo: string }) => (
    <div className="flex-1">
      <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={visivel}
              animationDuration={900}
            >
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${v}%`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(215 20% 90%)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-1 space-y-1">
        {dados.map((d) => (
          <li key={d.nome} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: d.cor }}
            />
            <span className="min-w-0 truncate">{d.nome}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums">
              {d.valor}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_12px_32px_-20px_hsl(215_40%_20%_/_0.25)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-primary">
          O risco que a rentabilidade esconde
        </h3>
        <SeloExemplo />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        A maioria das carteiras que chega aqui não tem erro grosseiro: tem{" "}
        <strong>concentração que ninguém escolheu</strong>. O trabalho é
        distribuir o risco sem abrir mão do retorno.
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <Rosca dados={antes} titulo="Como costuma chegar" />
        <Rosca dados={depois} titulo="Depois da revisão" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ 3. O QUE ENTRA NA ANÁLISE */

/**
 * As frentes de uma análise, com barra de peso.
 *
 * Não é gráfico de dado: é o escopo do trabalho desenhado. Serve para a
 * pessoa entender que "consultoria" não é uma conversa solta.
 */
export function EscopoDaAnalise() {
  const { ref, visivel } = useVisivel<HTMLDivElement>();

  const frentes = [
    { nome: "Custo real dos produtos", peso: 100, cor: ACCENT },
    { nome: "Concentração e risco", peso: 88, cor: CIANO },
    { nome: "Liquidez para os seus prazos", peso: 76, cor: NAVY },
    { nome: "Imposto e come-cotas", peso: 64, cor: SUCESSO },
    { nome: "Aderência aos seus objetivos", peso: 92, cor: ACCENT },
  ];

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_12px_32px_-20px_hsl(215_40%_20%_/_0.25)]"
    >
      <h3 className="font-display text-lg font-bold text-primary">
        O que um consultor olha na sua carteira
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Cinco frentes, uma por uma, com o número de cada ao lado. É isso que
        separa uma análise de uma opinião.
      </p>

      <ul className="mt-5 space-y-3.5">
        {frentes.map((f, i) => (
          <li key={f.nome}>
            <p className="text-xs font-semibold text-slate-700">{f.nome}</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: visivel ? `${f.peso}%` : "0%",
                  background: f.cor,
                  transitionDelay: `${i * 120}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
