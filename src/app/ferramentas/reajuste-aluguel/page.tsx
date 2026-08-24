"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, FileSignature, Handshake, Home } from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";

const INDICES = [
  { chave: "igpm", nome: "IGP-M", nota: "O índice tradicional de locação. É o que está na maioria dos contratos." },
  { chave: "ipca", nome: "IPCA", nota: "A inflação oficial. Virou comum em contratos novos por ser menos volátil." },
  { chave: "inpc", nome: "INPC", nota: "Aparece em contratos residenciais mais antigos." },
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

const HOJE = new Date();
const ANOS = Array.from({ length: 12 }, (_, i) => HOJE.getFullYear() + 1 - i);

/** Soma meses a um "aaaa-mm" sem depender de fuso horário. */
function somarMeses(competencia: string, delta: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export default function ReajusteAluguelPage() {
  const [aluguel, setAluguel] = useState("2000");
  const [indice, setIndice] = useState<Chave>("igpm");

  // Aniversário do contrato: o mês em que o reajuste passa a valer.
  const [mes, setMes] = useState(String(HOJE.getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState(String(HOJE.getFullYear()));

  const [dados, setDados] = useState<Record<string, Resposta>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const aniversario = `${ano}-${mes}`;
  // A cláusula padrão manda usar a variação acumulada dos doze meses
  // ANTERIORES ao aniversário: de -12 até -1.
  const janelaDe = somarMeses(aniversario, -12);
  const janelaAte = somarMeses(aniversario, -1);

  // Mexer em vários campos seguidos dispara várias buscas. Sem este
  // contador, a resposta que chegar por último vence — e ela pode ser a
  // de um período que o usuário já abandonou.
  const requisicao = useRef(0);

  const buscar = useCallback(async () => {
    const minha = ++requisicao.current;
    setCarregando(true);
    setErro(null);
    try {
      const respostas = await Promise.all(
        INDICES.map(async (i) => {
          const r = await fetch(
            `/api/indices?indice=${i.chave}&de=${janelaDe}&ate=${janelaAte}`,
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
  }, [janelaDe, janelaAte]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const valorAtual = Math.max(0, parseNumero(aluguel));
  const escolhido = dados[indice];
  const novo = escolhido ? valorAtual * escolhido.fator : valorAtual;
  const aumentoMensal = novo - valorAtual;

  const incompleto = !carregando && escolhido != null && escolhido.meses < 12;
  const deflacao = escolhido != null && escolhido.variacaoPct < 0;

  // A alternativa mais barata entre os índices disponíveis: é a carta na mão
  // de quem vai negociar.
  const alternativas = INDICES.map((i) => ({
    ...i,
    dado: dados[i.chave],
    valor: dados[i.chave] ? valorAtual * dados[i.chave].fator : null,
  })).filter((a) => a.dado && a.dado.meses > 0);

  const maisBarato = alternativas.reduce<(typeof alternativas)[number] | null>(
    (menor, a) => (menor == null || (a.valor ?? 0) < (menor.valor ?? 0) ? a : menor),
    null,
  );
  const economiaAnual =
    maisBarato && maisBarato.chave !== indice && maisBarato.valor != null
      ? (novo - maisBarato.valor) * 12
      : 0;

  const rotulo = INDICES.find((i) => i.chave === indice)!;

  const serie = alternativas.map((a) => ({
    nome: a.nome,
    valor: Number((a.valor ?? 0).toFixed(2)),
  }));

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
            Reajuste de aluguel
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Home className="h-3.5 w-3.5" />
            Índices oficiais do Banco Central
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            O reajuste certo do seu aluguel
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Todo ano o contrato faz aniversário e vem o reajuste. Aqui a conta é
            feita com o índice acumulado dos doze meses anteriores, direto da
            fonte oficial — vale tanto para conferir o que o proprietário
            mandou quanto para chegar na conversa com número na mão.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="aluguel-atual" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Aluguel atual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="aluguel-atual"
                  inputMode="decimal"
                  value={aluguel}
                  onChange={(e) => setAluguel(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                O valor que você paga hoje, sem condomínio nem IPTU.
              </p>
            </div>

            <div>
              <label htmlFor="mes-do-reajuste-aniversario-do-contrato" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mês do reajuste (aniversário do contrato)
              </label>
              <div className="flex gap-2">
                <select id="mes-do-reajuste-aniversario-do-contrato"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                >
                  {MESES.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, "0")}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="h-11 w-full max-w-[7rem] rounded-xl border border-slate-200 bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                >
                  {ANOS.map((a) => (
                    <option key={a} value={String(a)}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Usa o acumulado de {janelaDe.slice(5)}/{janelaDe.slice(0, 4)} a{" "}
                {janelaAte.slice(5)}/{janelaAte.slice(0, 4)}.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Índice previsto no contrato
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
              <p className="text-[11px] text-slate-500 mt-1.5">{rotulo.nota}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Novo aluguel pelo {rotulo.nome}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {carregando ? "—" : brl(novo)}
          </p>
          {!carregando && escolhido && escolhido.meses > 0 && (
            <p className="text-sm text-white/70 mt-3 tabular-nums">
              {deflacao
                ? `O ${rotulo.nome} acumulou ${pct(escolhido.variacaoPct, 2)} no período: pela cláusula, o aluguel deveria cair ${brl(Math.abs(aumentoMensal))}.`
                : `Aumento de ${brl(aumentoMensal)} por mês (${pct(escolhido.variacaoPct, 2)}), ou ${brl(aumentoMensal * 12)} no ano.`}
            </p>
          )}
        </section>

        {erro && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        {incompleto && !erro && (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            O Banco Central ainda não publicou os doze meses dessa janela —
            temos {escolhido?.meses ?? 0}. O reajuste só pode ser calculado com o
            período fechado; volte depois da divulgação do índice.
          </p>
        )}

        {deflacao && !incompleto && (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            O índice ficou negativo no período. A maioria dos contratos prevê
            reajuste, não redução, então na prática o aluguel costuma ser
            mantido — mas o número está do seu lado na conversa.
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Quanto ficaria por cada índice
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Contrato novo, ou renovação, é hora de discutir qual índice entra na
            cláusula. A diferença entre eles vira dinheiro todo mês.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Índice</th>
                  <th className="pb-2 font-semibold text-right">Acumulado 12m</th>
                  <th className="pb-2 font-semibold text-right">Novo aluguel</th>
                  <th className="pb-2 font-semibold text-right">Por ano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INDICES.map((i) => {
                  const d = dados[i.chave];
                  const v = d && d.meses > 0 ? valorAtual * d.fator : null;
                  return (
                    <tr key={i.chave} className={i.chave === indice ? "bg-accent/5" : ""}>
                      <td className="py-2.5 font-medium text-slate-700">{i.nome}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-500">
                        {d && d.meses > 0 ? pct(d.variacaoPct, 2) : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-slate-900">
                        {v != null ? brl(v) : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-500">
                        {v != null ? brl((v - valorAtual) * 12) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {serie.length > 1 && (
            <div className="mt-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={62}
                    domain={[
                      (min: number) => Math.floor(Math.min(min, valorAtual) * 0.97),
                      "dataMax",
                    ]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v: number) =>
                      v >= 1000
                        ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`
                        : `${Math.round(v)}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    formatter={(v: unknown) => [brl(Number(v)), "Novo aluguel"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="valor" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {economiaAnual > 0 && maisBarato && (
          <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <Handshake className="h-5 w-5 text-accent-strong" />
            <h3 className="text-sm font-semibold text-slate-800 mt-2">
              Carta para a negociação
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 tabular-nums">
              No mesmo período o {maisBarato.nome} subiu menos que o{" "}
              {rotulo.nome}. Migrar a cláusula para ele deixaria o aluguel em{" "}
              <span className="font-semibold">{brl(maisBarato.valor ?? 0)}</span> —{" "}
              <span className="font-semibold">{brl(economiaAnual)}</span> a menos
              no ano. Reajuste é cláusula de contrato: só muda se as duas partes
              concordarem, mas nada impede a proposta na renovação.
            </p>
          </section>
        )}

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <FileSignature className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-slate-700 mt-2">
              O que a lei garante
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              A Lei do Inquilinato permite reajuste no máximo uma vez por ano, e
              pelo índice escrito no contrato. Aumento fora do aniversário, ou
              por índice diferente do combinado, é negociação — não obrigação.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-slate-700 mt-2">
              Vale mais alugar ou comprar?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Se o reajuste anual começou a pesar, compare o aluguel corrigido
              com a parcela de um financiamento em{" "}
              <Link
                href="/ferramentas/comprar-ou-alugar"
                className="text-accent-strong font-medium underline underline-offset-2"
              >
                comprar ou alugar
              </Link>
              .
            </p>
          </div>

        <p className="mt-6 text-[11px] text-slate-500">
          Fonte: séries 189 (IGP-M), 433 (IPCA) e 188 (INPC) do Sistema
          Gerenciador de Séries Temporais do Banco Central. Esta ferramenta faz
          o cálculo do índice; ela não substitui a leitura da cláusula do seu
          contrato.
        </p>
        </section>
      </main>
    </div>
  );
}
