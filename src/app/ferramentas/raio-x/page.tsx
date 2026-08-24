"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type Classe =
  | "pos"
  | "pre"
  | "inflacao"
  | "acoes"
  | "fiis"
  | "exterior"
  | "cripto"
  | "caixa";

type Liquidez = "diaria" | "ate30" | "longo";

interface Ativo {
  id: string;
  nome: string;
  valor: number;
  classe: Classe;
  liquidez: Liquidez;
}

const CLASSES: Array<{ valor: Classe; rotulo: string; cor: string }> = [
  { valor: "pos", rotulo: "Renda fixa pós", cor: "#1d3557" },
  { valor: "pre", rotulo: "Prefixado", cor: "#2f5d8c" },
  { valor: "inflacao", rotulo: "Inflação", cor: "#4a8fc0" },
  { valor: "acoes", rotulo: "Ações BR", cor: "#e07a45" },
  { valor: "fiis", rotulo: "FIIs", cor: "#c1521f" },
  { valor: "exterior", rotulo: "Exterior", cor: "#3aa37a" },
  { valor: "cripto", rotulo: "Cripto", cor: "#8a5cd1" },
  { valor: "caixa", rotulo: "Caixa", cor: "#94a3b8" },
];

const LIQUIDEZ: Array<{ valor: Liquidez; rotulo: string }> = [
  { valor: "diaria", rotulo: "Diária" },
  { valor: "ate30", rotulo: "Até 30 dias" },
  { valor: "longo", rotulo: "Longo prazo" },
];

const RENDA_VARIAVEL: Classe[] = ["acoes", "fiis", "exterior", "cripto"];

const rotuloClasse = (c: Classe) =>
  CLASSES.find((x) => x.valor === c)?.rotulo ?? c;
const corClasse = (c: Classe) =>
  CLASSES.find((x) => x.valor === c)?.cor ?? "#94a3b8";
const rotuloLiquidez = (l: Liquidez) =>
  LIQUIDEZ.find((x) => x.valor === l)?.rotulo ?? l;

const VAZIO: Ativo[] = [];

interface Alerta {
  titulo: string;
  texto: string;
}

/* -------------------------------------------------------------------------- */

export default function RaioXPage() {
  const [ativos, setAtivos, carregado] = useArmazenado<Ativo[]>("raio-x", VAZIO);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [classe, setClasse] = useState<Classe>("pos");
  const [liquidez, setLiquidez] = useState<Liquidez>("diaria");

  const valorNumero = parseNumero(valor);
  const podeAdicionar = nome.trim().length > 0 && valorNumero > 0;

  const total = useMemo(
    () => ativos.reduce((acc, a) => acc + a.valor, 0),
    [ativos]
  );

  const porClasse = useMemo(
    () =>
      CLASSES.map((c) => ({
        nome: c.rotulo,
        cor: c.cor,
        chave: c.valor,
        valor: ativos
          .filter((a) => a.classe === c.valor)
          .reduce((acc, a) => acc + a.valor, 0),
      })).filter((c) => c.valor > 0),
    [ativos]
  );

  const porLiquidez = useMemo(
    () =>
      LIQUIDEZ.map((l) => {
        const soma = ativos
          .filter((a) => a.liquidez === l.valor)
          .reduce((acc, a) => acc + a.valor, 0);
        return {
          chave: l.valor,
          rotulo: l.rotulo,
          valor: soma,
          peso: total > 0 ? (soma / total) * 100 : 0,
        };
      }),
    [ativos, total]
  );

  const maiorAtivo = useMemo(
    () =>
      ativos.reduce<Ativo | null>(
        (acc, a) => (acc === null || a.valor > acc.valor ? a : acc),
        null
      ),
    [ativos]
  );
  const maiorConcentracao =
    maiorAtivo && total > 0 ? (maiorAtivo.valor / total) * 100 : 0;

  const pesoDiaria = porLiquidez.find((l) => l.chave === "diaria")?.peso ?? 0;
  const pesoVariavel =
    total > 0
      ? (ativos
          .filter((a) => RENDA_VARIAVEL.includes(a.classe))
          .reduce((acc, a) => acc + a.valor, 0) /
          total) *
        100
      : 0;
  const pesoCripto =
    total > 0
      ? (ativos
          .filter((a) => a.classe === "cripto")
          .reduce((acc, a) => acc + a.valor, 0) /
          total) *
        100
      : 0;

  const alertas: Alerta[] = useMemo(() => {
    if (total <= 0) return [];
    const lista: Alerta[] = [];

    if (ativos.length === 1 || maiorConcentracao >= 99.9) {
      lista.push({
        titulo: "Carteira inteira em um único ativo",
        texto:
          "Todo o seu dinheiro depende de uma decisão só. Qualquer problema com esse ativo é um problema com o seu patrimônio inteiro.",
      });
    }

    const concentrados = ativos.filter((a) => a.valor / total > 0.2);
    if (concentrados.length > 0 && ativos.length > 1) {
      lista.push({
        titulo: "Concentração acima de 20% em um ativo",
        texto: `${concentrados
          .map((a) => a.nome)
          .join(", ")} passa de um quinto da carteira. Um susto isolado aí mexe demais no total.`,
      });
    }

    if (pesoDiaria < 10) {
      lista.push({
        titulo: "Pouca liquidez imediata",
        texto: `Só ${pct(pesoDiaria, 1)} da carteira resgata no mesmo dia. Sem essa folga, um imprevisto vira venda no pior momento ou dívida cara.`,
      });
    }

    if (pesoVariavel <= 0) {
      lista.push({
        titulo: "Nenhuma renda variável",
        texto:
          "A carteira está toda em renda fixa e caixa. Segura no curto prazo, mas costuma render pouco acima da inflação no longo prazo.",
      });
    }

    if (pesoCripto > 10) {
      lista.push({
        titulo: "Cripto acima de 10% da carteira",
        texto: `Cripto representa ${pct(pesoCripto, 1)} do total. É a classe mais volátil da lista e raramente justifica esse tamanho.`,
      });
    }

    return lista;
  }, [ativos, total, maiorConcentracao, pesoDiaria, pesoVariavel, pesoCripto]);

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!podeAdicionar) return;
    setAtivos((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim(),
        valor: valorNumero,
        classe,
        liquidez,
      },
    ]);
    setNome("");
    setValor("");
  };

  const remover = (id: string) =>
    setAtivos((atual) => atual.filter((a) => a.id !== id));

  const vazio = carregado && ativos.length === 0;

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
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Raio-X da carteira
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Activity className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Onde está o risco escondido da sua carteira
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A maioria das carteiras não quebra por falta de rentabilidade, e sim
            por concentração e falta de liquidez. Liste seus ativos e veja a
            distribuição real, com os alertas que ninguém costuma fazer.
          </p>
        </section>

        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Total da carteira
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(total)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {vazio
              ? "Adicione seus ativos abaixo para o raio-x começar."
              : alertas.length === 0
                ? "Nenhum alerta de risco disparou nesta carteira."
                : `${alertas.length} ${alertas.length === 1 ? "ponto de atenção" : "pontos de atenção"} para revisar.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Layers className="h-5 w-5 mx-auto text-primary" />}
            valor={String(ativos.length)}
            legenda="Ativos na carteira"
          />
          <Kpi
            icone={<AlertTriangle className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(maiorConcentracao, 1)}
            legenda={
              maiorAtivo ? `Maior peso: ${maiorAtivo.nome}` : "Maior concentração"
            }
          />
          <Kpi
            icone={<Droplets className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(pesoDiaria, 1)}
            legenda="Resgatável no mesmo dia"
          />
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Seus ativos
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Um por linha, com o valor de hoje. Quanto mais fiel a lista, mais
            honesto o diagnóstico.
          </p>
          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <label htmlFor="nome-do-ativo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome do ativo
              </label>
              <input id="nome-do-ativo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="CDB do banco X, fundo imobiliário, ETF..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor"
                  inputMode="numeric"
                  value={formatarMoedaInput(valor)}
                  onChange={(e) => setValor(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="classe" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Classe
              </label>
              <select id="classe"
                value={classe}
                onChange={(e) => setClasse(e.target.value as Classe)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {CLASSES.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="liquidez" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Liquidez
              </label>
              <select id="liquidez"
                value={liquidez}
                onChange={(e) => setLiquidez(e.target.value as Liquidez)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {LIQUIDEZ.map((l) => (
                  <option key={l.valor} value={l.valor}>
                    {l.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!podeAdicionar}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar ativo
              </button>
            </div>
          </form>

          {vazio ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Layers className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum ativo ainda
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Comece pelo que representa mais dinheiro: em geral a reserva e o
                maior investimento.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {ativos.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: corClasse(a.classe) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{a.nome}</p>
                    <p className="text-[11px] text-slate-500">
                      {rotuloClasse(a.classe)} · liquidez{" "}
                      {rotuloLiquidez(a.liquidez).toLowerCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {brl(a.valor)}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {pct(total > 0 ? (a.valor / total) * 100 : 0, 1)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(a.id)}
                    aria-label={`Remover ativo ${a.nome}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {porClasse.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Alocação por classe
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              É aqui que se vê o risco de verdade, não no nome dos produtos.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={porClasse}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {porClasse.map((c) => (
                    <Cell key={c.chave} fill={c.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, nome: unknown) => [
                    brl(Number(v)),
                    String(nome),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </section>
        )}

        {total > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Em quanto tempo vira dinheiro
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Liquidez é o que permite atravessar um imprevisto sem desmontar o
              plano.
            </p>
            <ul className="space-y-3">
              {porLiquidez.map((l) => (
                <li key={l.chave}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">{l.rotulo}</span>
                    <span className="tabular-nums text-slate-500">
                      {brlCurto(l.valor)} · {pct(l.peso, 1)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, l.peso)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {total > 0 && (
          <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">
              Alertas de risco
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Regras objetivas de diagnóstico. Alerta não é proibição, é convite
              a olhar com atenção.
            </p>
            {alertas.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Nada acendeu por aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Concentração, liquidez e exposição estão dentro dos limites
                    que usamos como referência.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {alertas.map((a) => (
                  <li
                    key={a.titulo}
                    className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 flex items-start gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {a.titulo}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{a.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Com os desvios mapeados, use o{" "}
            <Link
              href="/ferramentas/rebalanceador"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Rebalanceador de Carteira
            </Link>{" "}
            para descobrir quanto comprar de cada classe.
          </p>

        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Kpi({
  icone,
  valor,
  legenda,
}: {
  icone: ReactNode;
  valor: string;
  legenda: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      {icone}
      <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
        {valor}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{legenda}</p>
    </div>
  );
}
