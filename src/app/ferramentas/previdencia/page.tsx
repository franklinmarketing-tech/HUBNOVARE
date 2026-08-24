"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  Landmark,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { brl, brlCurto, jurosCompostos, parseNumero, pct } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* -------------------------------------------------------------------------- */

type TipoPlano = "PGBL" | "VGBL" | "Fundo de pensão";

const TIPOS: TipoPlano[] = ["PGBL", "VGBL", "Fundo de pensão"];

interface Plano {
  id: string;
  nome: string;
  tipo: TipoPlano;
  saldo: number;
  aporteMensal: number;
  /** Taxa de administração ao ano, em %. Come rentabilidade todo ano. */
  taxaAdmPct: number;
  /** Taxa de carregamento, em % de cada aporte. Come na entrada. */
  carregamentoPct: number;
}

interface Previdencia {
  planos: Plano[];
  rendimentoPct: string;
  idadeAtual: string;
  idadeAposentadoria: string;
  sexo: "feminino" | "masculino";
  anosContribuicao: string;
  mediaSalarial: string;
  tetoInss: string;
}

const VAZIO: Previdencia = {
  planos: [],
  rendimentoPct: "8",
  idadeAtual: "40",
  idadeAposentadoria: "65",
  sexo: "feminino",
  anosContribuicao: "20",
  mediaSalarial: "",
  tetoInss: "8157.41",
};

/** Taxa de retirada segura usada para virar patrimônio em renda mensal. */
const RETIRADA_ANUAL_PCT = 4;

/* -------------------------------------------------------------------------- */

export default function PrevidenciaPage() {
  const [dados, setDados, carregado] = useArmazenado<Previdencia>(
    "previdencia",
    VAZIO
  );

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoPlano>("PGBL");
  const [saldo, setSaldo] = useState("");
  const [aporte, setAporte] = useState("");
  const [taxaAdm, setTaxaAdm] = useState("1,5");
  const [carregamento, setCarregamento] = useState("0");

  const planos = Array.isArray(dados?.planos) ? dados.planos : [];

  const saldoNumero = parseNumero(saldo);
  const aporteNumero = parseNumero(aporte);
  const formValido =
    nome.trim().length > 0 && (saldoNumero > 0 || aporteNumero > 0);

  const rendimento = parseNumero(dados.rendimentoPct);
  const idadeAtual = parseNumero(dados.idadeAtual);
  const idadeAposentadoria = parseNumero(dados.idadeAposentadoria);
  const anosAte = Math.max(0, Math.round(idadeAposentadoria - idadeAtual));

  /* ---- Projeção dos planos privados ---- */
  const projecoes = useMemo(() => {
    return planos.map((p) => {
      const admPct = Number(p.taxaAdmPct) || 0;
      const carregPct = Math.min(Math.max(Number(p.carregamentoPct) || 0, 0), 100);

      // Cenário real: a administração desconta da rentabilidade todo ano e o
      // carregamento tira um pedaço de cada aporte antes mesmo de investir.
      const rendimentoLiquido = rendimento - admPct;
      const aporteLiquido = (Number(p.aporteMensal) || 0) * (1 - carregPct / 100);

      const comTaxas = jurosCompostos({
        inicial: Number(p.saldo) || 0,
        aporteMensal: aporteLiquido,
        taxaAnualPct: rendimentoLiquido,
        anos: anosAte,
      });
      // Cenário-fantasia sem nenhuma taxa: serve só para medir o custo.
      const semTaxas = jurosCompostos({
        inicial: Number(p.saldo) || 0,
        aporteMensal: Number(p.aporteMensal) || 0,
        taxaAnualPct: rendimento,
        anos: anosAte,
      });

      const finalCom = comTaxas[comTaxas.length - 1].total;
      const finalSem = semTaxas[semTaxas.length - 1].total;

      return {
        plano: p,
        rendimentoLiquido,
        saldoProjetado: finalCom,
        custoTaxas: Math.max(0, finalSem - finalCom),
      };
    });
  }, [planos, rendimento, anosAte]);

  const totalProjetado = projecoes.reduce((a, p) => a + p.saldoProjetado, 0);
  const custoTaxasTotal = projecoes.reduce((a, p) => a + p.custoTaxas, 0);
  const rendaPrivada = (totalProjetado * (RETIRADA_ANUAL_PCT / 100)) / 12;

  /* ---- Estimativa educativa do INSS ---- */
  const anosContribuicao = parseNumero(dados.anosContribuicao);
  const mediaSalarial = parseNumero(dados.mediaSalarial);
  const teto = parseNumero(dados.tetoInss);
  const minimoAnos = dados.sexo === "feminino" ? 15 : 20;

  const coeficientePct = Math.min(
    100,
    60 + Math.max(0, Math.floor(anosContribuicao) - minimoAnos) * 2
  );
  const atingiuMinimo = anosContribuicao >= minimoAnos;
  const beneficioBruto = mediaSalarial * (coeficientePct / 100);
  const beneficioInss = atingiuMinimo
    ? Math.min(beneficioBruto, teto > 0 ? teto : beneficioBruto)
    : 0;

  const rendaTotal = rendaPrivada + beneficioInss;

  /* ---- CRUD ---- */
  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const novo: Plano = {
      id: novoId(),
      nome: nome.trim(),
      tipo,
      saldo: saldoNumero,
      aporteMensal: aporteNumero,
      taxaAdmPct: parseNumero(taxaAdm),
      carregamentoPct: parseNumero(carregamento),
    };
    setDados((d) => ({ ...d, planos: [...(d.planos ?? []), novo] }));
    setNome("");
    setSaldo("");
    setAporte("");
  };

  const remover = (id: string) =>
    setDados((d) => ({
      ...d,
      planos: (d.planos ?? []).filter((p) => p.id !== id),
    }));

  const campo = (patch: Partial<Previdencia>) =>
    setDados((d) => ({ ...d, ...patch }));

  const semPlanos = carregado && planos.length === 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
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
            Organizador previdenciário
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <PiggyBank className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto você vai receber quando parar de trabalhar?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Junte seus planos privados e a estimativa do INSS numa conta só. A
            maior parte das pessoas descobre aqui que o INSS sozinho cobre bem
            menos do que o padrão de vida atual.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Renda mensal estimada na aposentadoria
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(rendaTotal)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            Aos {idadeAposentadoria > 0 ? Math.round(idadeAposentadoria) : 65}{" "}
            anos, somando previdência privada e a estimativa do INSS.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[11px] text-white/60">Privada</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">
                {brl(rendaPrivada)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[11px] text-white/60">INSS estimado</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">
                {brl(beneficioInss)}
              </p>
            </div>
          </div>
        </section>

        {/* Premissas */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Suas premissas
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            O rendimento é o retorno bruto esperado dos fundos. A taxa de
            administração de cada plano é descontada dele no cálculo.
          </p>
          <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
            <Campo rotulo="Idade atual">
              <input
                inputMode="decimal"
                value={dados.idadeAtual}
                onChange={(e) => campo({ idadeAtual: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
            <Campo rotulo="Idade de aposentadoria">
              <input
                inputMode="decimal"
                value={dados.idadeAposentadoria}
                onChange={(e) => campo({ idadeAposentadoria: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
            <Campo rotulo="Rendimento esperado (% a.a.)">
              <input
                inputMode="decimal"
                value={dados.rendimentoPct}
                onChange={(e) => campo({ rendimentoPct: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500 tabular-nums">
              Horizonte de acumulação: {anosAte}{" "}
              {anosAte === 1 ? "ano" : "anos"}. A renda privada usa retirada de{" "}
              {RETIRADA_ANUAL_PCT}% ao ano sobre o saldo acumulado, para o
              dinheiro não acabar antes de você.
            </p>
          </div>
        </section>

        {/* Planos privados */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Seus planos de previdência privada
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Os dois números que mais importam estão escondidos no extrato: a
            taxa de administração e a de carregamento.
          </p>

          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <Campo rotulo="Nome do plano">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Previdência do banco, plano da empresa..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </Campo>
            </div>
            <Campo rotulo="Tipo">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoPlano)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Saldo atual">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input
                  inputMode="numeric"
                  value={formatarMoedaInput(saldo)}
                  onChange={(e) => setSaldo(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </Campo>
            <Campo rotulo="Aporte mensal">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input
                  inputMode="numeric"
                  value={formatarMoedaInput(aporte)}
                  onChange={(e) => setAporte(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </Campo>
            <Campo rotulo="Taxa de administração (% a.a.)">
              <input
                inputMode="decimal"
                value={taxaAdm}
                onChange={(e) => setTaxaAdm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
            <Campo rotulo="Taxa de carregamento (% do aporte)">
              <input
                inputMode="decimal"
                value={carregamento}
                onChange={(e) => setCarregamento(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar plano
              </button>
            </div>
          </form>

          {semPlanos ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <PiggyBank className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum plano cadastrado
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pegue o último extrato da previdência. Saldo, aporte e as duas
                taxas costumam estar na primeira página.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {projecoes.map(({ plano, saldoProjetado, custoTaxas, rendimentoLiquido }) => (
                <li
                  key={plano.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {plano.nome}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {plano.tipo} · adm {pct(plano.taxaAdmPct, 2)} a.a. ·
                        carregamento {pct(plano.carregamentoPct, 2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(plano.id)}
                      aria-label={`Remover plano ${plano.nome}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">Hoje</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brl(plano.saldo)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">
                        Na aposentadoria
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brlCurto(saldoProjetado)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">
                        As taxas levam
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brlCurto(custoTaxas)}
                      </p>
                    </div>
                  </div>
                  {rendimentoLiquido <= 0 ? (
                    <p className="mt-3 text-[11px] text-slate-500">
                      A taxa de administração come todo o rendimento esperado.
                      Nesse cenário o dinheiro só cresce pelos aportes.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {projecoes.length > 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500 tabular-nums">
                Saldo somado projetado de {brlCurto(totalProjetado)}. Se as
                taxas fossem zero, seriam {brlCurto(custoTaxasTotal)} a mais no
                seu bolso.
              </p>
            </div>
          ) : null}
        </section>

        {/* INSS */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-700">
              Estimativa do INSS
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Regra simplificada: 60% da média salarial mais 2 pontos por ano de
            contribuição acima de {minimoAnos}.
          </p>

          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo rotulo="Sexo">
              <select
                value={dados.sexo}
                onChange={(e) => campo({ sexo: e.target.value === "masculino" ? "masculino" : "feminino" })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </Campo>
            <Campo rotulo="Tempo de contribuição (anos)">
              <input
                inputMode="decimal"
                value={dados.anosContribuicao}
                onChange={(e) => campo({ anosContribuicao: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </Campo>
            <Campo rotulo="Média salarial de contribuição">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input
                  inputMode="numeric"
                  value={formatarMoedaInput(dados.mediaSalarial)}
                  onChange={(e) => campo({ mediaSalarial: digitosParaReais(e.target.value) })}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </Campo>
            <Campo rotulo="Teto do INSS">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input
                  inputMode="numeric"
                  value={formatarMoedaInput(dados.tetoInss)}
                  onChange={(e) => campo({ tetoInss: digitosParaReais(e.target.value) })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </Campo>
          </div>

          <div className="mt-5 grid sm:grid-cols-3 gap-4">
            <Kpi
              icone={<Coins className="h-5 w-5 mx-auto text-primary" />}
              valor={pct(coeficientePct, 0)}
              legenda="Coeficiente sobre a média"
            />
            <Kpi
              icone={<Landmark className="h-5 w-5 mx-auto text-primary" />}
              valor={brl(beneficioInss)}
              legenda="Benefício estimado"
            />
            <Kpi
              icone={<AlertTriangle className="h-5 w-5 mx-auto text-primary" />}
              valor={
                beneficioBruto > teto && teto > 0 ? "Sim" : "Não"
              }
              legenda="Limitado pelo teto"
            />
          </div>

          {!atingiuMinimo ? (
            <div className="mt-4 rounded-xl bg-warning/15 p-3">
              <p className="text-xs text-slate-700">
                Com {Math.floor(anosContribuicao)} anos de contribuição você
                ainda não atinge o mínimo de {minimoAnos} anos exigido. Por isso
                a estimativa aparece zerada.
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Esta é uma estimativa educativa, não um cálculo oficial. A regra
              real envolve pontuação, idade mínima, período de transição e
              revisão da média. O número que vale é o do Meu INSS.
            </p>
          </div>
        </section>

        {/* Próximo passo */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Veja essa renda futura ao lado de tudo o que você já tem no{" "}
            <Link
              href="/ferramentas/dashboard-patrimonial"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Dashboard Patrimonial
            </Link>
            .
          </p>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    // O <label> ENVOLVE o campo: associação implícita, que funciona mesmo
    // quando o input vem de fora por children e um id não alcançaria.
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
        {rotulo}
      </span>
      {children}
    </label>
  );
}

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
