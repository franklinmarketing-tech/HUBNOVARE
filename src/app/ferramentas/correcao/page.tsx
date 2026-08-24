"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, History, Landmark, TrendingUp } from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";

/** Espelha `INDICES` do servidor: rótulo e uso típico de cada série. */
const INDICES = [
  { chave: "ipca", nome: "IPCA", uso: "A inflação oficial. Padrão para salários e a maioria dos contratos." },
  { chave: "igpm", nome: "IGP-M", uso: "O índice do aluguel e de contratos antigos." },
  { chave: "inpc", nome: "INPC", uso: "Inflação de quem ganha até 5 salários. Comum em acordos trabalhistas." },
  { chave: "poupanca", nome: "Poupança", uso: "Quanto teria rendido parado na caderneta." },
  { chave: "tr", nome: "TR", uso: "Taxa Referencial. Corrige FGTS e contratos antigos." },
] as const;

type Chave = (typeof INDICES)[number]["chave"];

type Resposta = {
  fator: number;
  variacaoPct: number;
  meses: number;
  pontos: Array<{ data: string; valor: number }>;
  de: string | null;
  ate: string | null;
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: ANO_ATUAL - 1995 + 1 }, (_, i) => ANO_ATUAL - i);

export default function CorrecaoPage() {
  const [valor, setValor] = useState("1000");
  const [indice, setIndice] = useState<Chave>("ipca");

  const [mesDe, setMesDe] = useState("01");
  const [anoDe, setAnoDe] = useState(String(ANO_ATUAL - 10));
  // O mês corrente ainda não tem índice publicado; o mês anterior tem.
  const [mesAte, setMesAte] = useState(
    String(new Date().getMonth() === 0 ? 12 : new Date().getMonth()).padStart(2, "0"),
  );
  const [anoAte, setAnoAte] = useState(
    String(new Date().getMonth() === 0 ? ANO_ATUAL - 1 : ANO_ATUAL),
  );

  const [dados, setDados] = useState<Record<string, Resposta>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const de = `${anoDe}-${mesDe}`;
  const ate = `${anoAte}-${mesAte}`;
  const periodoInvalido = de > ate;

  // Mexer em vários campos seguidos dispara várias buscas. Sem este
  // contador, a resposta que chegar por último vence — e ela pode ser a
  // de um período que o usuário já abandonou.
  const requisicao = useRef(0);

  /**
   * Busca os cinco índices de uma vez. A Calculadora do Cidadão obriga a
   * refazer a consulta para cada um; ver todos lado a lado é justamente o
   * que mostra o tamanho da escolha do índice num contrato.
   */
  const buscar = useCallback(async () => {
    if (periodoInvalido) return;
    const minha = ++requisicao.current;
    setCarregando(true);
    setErro(null);
    try {
      const respostas = await Promise.all(
        INDICES.map(async (i) => {
          const r = await fetch(
            `/api/indices?indice=${i.chave}&de=${de}&ate=${ate}`,
          );
          if (!r.ok) throw new Error("falhou");
          return [i.chave, (await r.json()) as Resposta] as const;
        }),
      );
      if (minha !== requisicao.current) return;
      setDados(Object.fromEntries(respostas));
    } catch {
      if (minha !== requisicao.current) return;
      setErro("Não conseguimos falar com o Banco Central agora. Tente de novo em instantes.");
    } finally {
      // Só a busca vigente pode dizer que a tela terminou de carregar.
      if (minha === requisicao.current) setCarregando(false);
    }
  }, [de, ate, periodoInvalido]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const valorOriginal = Math.max(0, parseNumero(valor));
  const atual = dados[indice];
  const corrigido = atual ? valorOriginal * atual.fator : valorOriginal;
  const diferenca = corrigido - valorOriginal;

  const semDados = !carregando && !erro && atual != null && atual.meses === 0;

  // Curva do valor corrigido mês a mês: mostra onde a inflação apertou.
  const serie = (() => {
    if (!atual) return [];
    let acumulado = valorOriginal;
    return atual.pontos.map((p) => {
      acumulado *= 1 + p.valor / 100;
      return { mes: p.data, valor: acumulado };
    });
  })();

  const rotuloIndice = INDICES.find((i) => i.chave === indice)!;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Correção pela inflação
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Landmark className="h-3.5 w-3.5" />
            Índices oficiais do Banco Central
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto aquele valor vale hoje
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Salário de anos atrás, dívida antiga, contrato, herança, preço de um
            imóvel. Aqui o valor é trazido para o dinheiro de hoje com as séries
            oficiais do Banco Central — as mesmas da Calculadora do Cidadão, só
            que com os cinco índices na mesma tela.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <label htmlFor="valor-a-corrigir" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor a corrigir
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor-a-corrigir"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>

            <ParDeData
              titulo="Data do valor original"
              mes={mesDe}
              ano={anoDe}
              onMes={setMesDe}
              onAno={setAnoDe}
            />
            <ParDeData
              titulo="Corrigir até"
              mes={mesAte}
              ano={anoAte}
              onMes={setMesAte}
              onAno={setAnoAte}
            />

            <div className="sm:col-span-2">
              <label htmlFor="indice-de-correcao" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Índice de correção
              </label>
              <div className="flex flex-wrap gap-2">
                {INDICES.map((i) => (
                  <button
                    key={i.chave}
                    type="button"
                    onClick={() => setIndice(i.chave)}
                    className={`h-9 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                      indice === i.chave
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {i.nome}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">{rotuloIndice.uso}</p>
            </div>
          </div>

          {periodoInvalido && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              A data inicial está depois da final. Inverta o período.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Valor corrigido pelo {rotuloIndice.nome}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {carregando ? "—" : brl(corrigido)}
          </p>
          {!carregando && atual && atual.meses > 0 && (
            <p className="text-sm text-white/70 mt-3 tabular-nums">
              {brl(valorOriginal)} de {atual.de} viraram {brl(corrigido)} em{" "}
              {atual.ate}. São {brl(diferenca)} de correção, ou{" "}
              {pct(atual.variacaoPct, 2)} em {atual.meses}{" "}
              {atual.meses === 1 ? "mês" : "meses"}.
            </p>
          )}
        </section>

        {erro && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        {semDados && (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            O Banco Central não tem esse índice publicado para o período
            escolhido. Séries mais antigas costumam existir só para IPCA e IGP-M.
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            O mesmo valor, pelos cinco índices
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Em contrato, trocar o índice muda o valor final. É por isso que a
            escolha da cláusula de reajuste não é detalhe. Traço significa que
            o Banco Central não publica aquele índice no período escolhido.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Índice</th>
                  <th className="pb-2 font-semibold text-right">Acumulado</th>
                  <th className="pb-2 font-semibold text-right">Valor corrigido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INDICES.map((i) => {
                  const d = dados[i.chave];
                  const v = d ? valorOriginal * d.fator : null;
                  return (
                    <tr key={i.chave} className={i.chave === indice ? "bg-accent/5" : ""}>
                      <td className="py-2.5 font-medium text-slate-700">{i.nome}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-500">
                        {d && d.meses > 0 ? pct(d.variacaoPct, 2) : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-slate-900">
                        {v != null && d && d.meses > 0 ? brl(v) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {serie.length > 1 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              O caminho do valor, mês a mês
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Correção pelo {rotuloIndice.nome} aplicada mês sobre mês.
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-correcao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={62}
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                      : `${Math.round(v)}`
                  }
                />
                <Tooltip
                  formatter={(v: unknown) => [brl(Number(v)), "Valor corrigido"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#grad-correcao)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-slate-700 mt-2">
              Por que não basta somar a inflação dos anos
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Índice mensal se acumula por multiplicação, não por soma. Somar
              doze meses de IPCA dá sempre um número menor do que a inflação que
              o país de fato sentiu — e é o erro mais comum em planilha caseira.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-slate-700 mt-2">
              Corrigir não é ganhar
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              O valor corrigido apenas repõe o poder de compra. Só há ganho de
              verdade acima dele. Para ver quanto sobra depois do imposto e da
              inflação, use a{" "}
              <Link href="/ferramentas/rentabilidade-real" className="text-accent-strong font-medium underline underline-offset-2">
                rentabilidade real
              </Link>
              .
            </p>
          </div>

        <p className="mt-6 text-[11px] text-slate-500">
          Fonte: séries 433 (IPCA), 189 (IGP-M), 188 (INPC), 196 (Poupança) e
          7811 (TR) do Sistema Gerenciador de Séries Temporais do Banco
          Central. Índices são publicados com algumas semanas de defasagem, e
          a série da poupança começa em maio de 2012.
        </p>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ParDeData({
  titulo,
  mes,
  ano,
  onMes,
  onAno,
}: {
  titulo: string;
  mes: string;
  ano: string;
  onMes: (v: string) => void;
  onAno: (v: string) => void;
}) {
  const classe =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12";
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {titulo}
      </label>
      <div className="flex gap-2">
        <select id="indice-de-correcao" value={mes} onChange={(e) => onMes(e.target.value)} className={classe}>
          {MESES.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, "0")}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => onAno(e.target.value)}
          className={`${classe} max-w-[7rem]`}
        >
          {ANOS.map((a) => (
            <option key={a} value={String(a)}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
