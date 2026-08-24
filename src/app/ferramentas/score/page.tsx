"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  Gauge,
  Layers,
  Lightbulb,
  Search,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { pct } from "@/lib/calculos";

/* ----------------------------- modelo de score ---------------------------- */

const PESOS = {
  pagamento: 0.3,
  utilizacao: 0.3,
  historico: 0.15,
  consultas: 0.1,
  mix: 0.1,
  comprometimento: 0.05,
} as const;

const OPCOES_PAGAMENTO = [
  { valor: "sempre", rotulo: "Sempre em dia", score: 1 },
  { valor: "asvezes", rotulo: "Às vezes atraso", score: 0.5 },
  { valor: "raramente", rotulo: "Raramente pago em dia", score: 0.1 },
];

const OPCOES_HISTORICO = [
  { valor: "menos1", rotulo: "Menos de 1 ano", score: 0.2 },
  { valor: "1a3", rotulo: "De 1 a 3 anos", score: 0.5 },
  { valor: "3a7", rotulo: "De 3 a 7 anos", score: 0.8 },
  { valor: "mais7", rotulo: "Mais de 7 anos", score: 1 },
];

const OPCOES_CONSULTAS = [
  { valor: "nenhuma", rotulo: "Nenhuma", score: 1 },
  { valor: "1a2", rotulo: "1 a 2 consultas", score: 0.7 },
  { valor: "3a5", rotulo: "3 a 5 consultas", score: 0.4 },
  { valor: "6mais", rotulo: "6 ou mais", score: 0.1 },
];

const OPCOES_MIX = [
  { valor: "nenhum", rotulo: "Não uso crédito", score: 0.2 },
  { valor: "socartao", rotulo: "Só cartão de crédito", score: 0.5 },
  { valor: "doistipos", rotulo: "Cartão + 1 outro tipo", score: 0.75 },
  { valor: "variado", rotulo: "Mix variado (cartão, financiamento...)", score: 1 },
];

function faixaDoScore(nota: number) {
  if (nota < 300)
    return { nome: "Baixa", cor: "text-destructive", fundo: "bg-destructive" };
  if (nota < 500)
    return { nome: "Regular", cor: "text-warning", fundo: "bg-warning" };
  if (nota < 700)
    return {
      nome: "Boa",
      cor: "text-primary-bright",
      fundo: "bg-primary-bright",
    };
  return { nome: "Excelente", cor: "text-success", fundo: "bg-success" };
}

/* --------------------------------- página --------------------------------- */

export default function ScorePage() {
  const [pagamento, setPagamento] = useState("sempre");
  const [utilizacao, setUtilizacao] = useState(40);
  const [historico, setHistorico] = useState("1a3");
  const [consultas, setConsultas] = useState("1a2");
  const [mix, setMix] = useState("socartao");
  const [comprometimento, setComprometimento] = useState(30);

  const r = useMemo(() => {
    const sPagamento =
      OPCOES_PAGAMENTO.find((o) => o.valor === pagamento)?.score ?? 0;
    // Até 30% do limite é saudável; acima disso o score cai até zerar em 100%.
    const sUtilizacao =
      utilizacao <= 30 ? 1 : Math.max(0, 1 - (utilizacao - 30) / 70);
    const sHistorico =
      OPCOES_HISTORICO.find((o) => o.valor === historico)?.score ?? 0;
    const sConsultas =
      OPCOES_CONSULTAS.find((o) => o.valor === consultas)?.score ?? 0;
    const sMix = OPCOES_MIX.find((o) => o.valor === mix)?.score ?? 0;
    // Até 20% da renda comprometida é confortável; acima de 80% zera.
    const sComprometimento =
      comprometimento <= 20
        ? 1
        : Math.max(0, 1 - (comprometimento - 20) / 60);

    const nota = Math.round(
      1000 *
        (sPagamento * PESOS.pagamento +
          sUtilizacao * PESOS.utilizacao +
          sHistorico * PESOS.historico +
          sConsultas * PESOS.consultas +
          sMix * PESOS.mix +
          sComprometimento * PESOS.comprometimento)
    );

    const dicas: { icone: LucideIcon; titulo: string; texto: string }[] = [
      {
        icone: Wallet,
        titulo: `Pagamentos (peso ${pct(PESOS.pagamento * 100, 0)})`,
        texto:
          pagamento === "sempre"
            ? "Você está no melhor cenário. Mantenha os débitos automáticos para nunca escorregar."
            : pagamento === "asvezes"
              ? "Cada atraso derruba o fator de maior peso. Coloque as contas em débito automático e alinhe os vencimentos com o dia do salário."
              : "Este é o fator que mais pesa na nota. Priorize regularizar os atrasos atuais e negocie datas de vencimento que caibam no seu fluxo.",
      },
      {
        icone: CreditCard,
        titulo: `Uso do limite (peso ${pct(PESOS.utilizacao * 100, 0)})`,
        texto:
          utilizacao <= 30
            ? "Usar até 30% do limite sinaliza controle. Continue assim."
            : utilizacao <= 60
              ? "Acima de 30% do limite os birôs leem como dependência do cartão. Tente concentrar gastos no débito ou pedir aumento de limite."
              : "Usar mais da metade do limite pesa muito contra você. Reduza o gasto no cartão ou distribua entre dois cartões para baixar o percentual.",
      },
      {
        icone: CalendarClock,
        titulo: `Tempo de histórico (peso ${pct(PESOS.historico * 100, 0)})`,
        texto:
          historico === "mais7"
            ? "Histórico longo é ativo valioso. Evite cancelar o seu cartão mais antigo."
            : "Histórico se constrói com tempo: mantenha o cartão mais antigo ativo com algum gasto recorrente pequeno, mesmo que use outro no dia a dia.",
      },
      {
        icone: Search,
        titulo: `Consultas ao CPF (peso ${pct(PESOS.consultas * 100, 0)})`,
        texto:
          consultas === "nenhuma"
            ? "Sem consultas recentes, nada sinaliza urgência por crédito. Ótimo."
            : consultas === "1a2"
              ? "Poucas consultas têm impacto pequeno. Só evite sair pedindo cartão e crediário em sequência."
              : "Muitas consultas em pouco tempo leem como aperto financeiro. Espere alguns meses antes de novos pedidos de crédito.",
      },
      {
        icone: Layers,
        titulo: `Mix de crédito (peso ${pct(PESOS.mix * 100, 0)})`,
        texto:
          mix === "variado"
            ? "Lidar bem com tipos diferentes de crédito mostra maturidade. Mantenha tudo em dia."
            : mix === "nenhum"
              ? "Sem uso de crédito, os birôs não têm o que avaliar. Um cartão com gasto pequeno pago em dia já constrói histórico."
              : "Um segundo tipo de crédito bem pago (um crediário ou financiamento leve) diversifica o histórico. Mas nunca contrate dívida só por score.",
      },
      {
        icone: Wallet,
        titulo: `Renda comprometida (peso ${pct(PESOS.comprometimento * 100, 0)})`,
        texto:
          comprometimento <= 20
            ? "Menos de 20% da renda em dívidas deixa folga para imprevistos. Excelente sinal."
            : comprometimento <= 40
              ? "Entre 20% e 40% ainda é administrável, mas priorize quitar a dívida mais cara antes de assumir novas."
              : "Acima de 40% da renda em dívidas, qualquer imprevisto vira atraso. Renegociar prazos e taxas deve ser a prioridade número um.",
      },
    ];

    return { nota, faixa: faixaDoScore(nota), dicas };
  }, [pagamento, utilizacao, historico, consultas, mix, comprometimento]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-xl font-bold text-primary">
              Novare
            </span>
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Score financeiro
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Gauge className="h-3.5 w-3.5" />
            Estimativa educativa
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Entenda o que faz o seu score subir ou cair
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Este simulador não consulta Serasa, SPC nem nenhum birô: ele usa os
            mesmos fatores que eles usam para você entender a mecânica da nota
            e o que dá para melhorar. Nada do que você marcar é salvo.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
            <CampoSelect
              label="Contas em dia nos últimos 12 meses"
              value={pagamento}
              onChange={setPagamento}
              opcoes={OPCOES_PAGAMENTO}
            />
            <CampoSlider
              label="Quanto do limite do cartão você usa"
              value={utilizacao}
              onChange={setUtilizacao}
              max={100}
              sufixo="% do limite"
            />
            <CampoSelect
              label="Tempo de histórico de crédito"
              value={historico}
              onChange={setHistorico}
              opcoes={OPCOES_HISTORICO}
            />
            <CampoSelect
              label="Consultas ao seu CPF nos últimos meses"
              value={consultas}
              onChange={setConsultas}
              opcoes={OPCOES_CONSULTAS}
            />
            <CampoSelect
              label="Tipos de crédito que você usa"
              value={mix}
              onChange={setMix}
              opcoes={OPCOES_MIX}
            />
            <CampoSlider
              label="Renda comprometida com dívidas"
              value={comprometimento}
              onChange={setComprometimento}
              max={100}
              sufixo="% da renda"
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Sua nota estimada
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {r.nota}
            <span className="text-lg font-bold text-white/50"> / 1000</span>
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full ${r.faixa.fundo}`}
                style={{ width: `${Math.min(100, (r.nota / 1000) * 100)}%` }}
              />
            </div>
            <p className={`text-sm font-bold mt-2 ${r.faixa.cor}`}>
              Faixa {r.faixa.nome.toLowerCase()}
            </p>
          </div>
          <p className="text-xs text-white/60 mt-3">
            Estimativa educativa: a nota real de cada birô usa dados que só
            eles têm.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-accent-strong" />
            O que fazer com cada fator
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Dicas geradas a partir do que você marcou acima, em ordem de peso.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.dicas.map((dica) => (
              <div key={dica.titulo} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <dica.icone className="h-3.5 w-3.5 text-primary shrink-0" />
                  {dica.titulo}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {dica.texto}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CampoSelect({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoSlider({
  label,
  value,
  onChange,
  max,
  sufixo,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  sufixo: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="h-11 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <span className="text-sm font-bold tabular-nums text-slate-700 whitespace-nowrap w-24 text-right">
          {value}
          <span className="text-[11px] font-medium text-slate-500">
            {" "}
            {sufixo}
          </span>
        </span>
      </div>
    </div>
  );
}
