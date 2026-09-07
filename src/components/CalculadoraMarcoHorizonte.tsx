"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles, Target, TrendingUp, Lock } from "lucide-react";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead } from "@/lib/leads";
import { marcoRapido, IDADE_FIM } from "@/lib/planejamento/montarPlano";
import {
  CamposLead,
  leadCompleto,
  primeiroNomeLead,
  saudacaoLead,
  type DadosLead,
} from "@/components/CamposLead";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/* A conta vem de `marcoRapido` — a MESMA do app. A versão anterior usava a
   regra dos 4% (25× a renda anual): anunciava R$ 2,4 milhões para um caso em
   que o app, depois da assinatura, mostrava R$ 1,7 milhão. A vitrine e o
   produto têm de dar o mesmo número. */

/**
 * O lead-magnet do Planejamento Financeiro, no molde da calculadora "Reserva Ideal" do
 * Nord Liberta: a pessoa preenche, vê o próprio Marco Horizonte na hora e
 * deixa nome, WhatsApp e e-mail para receber o plano detalhado. O lead vai
 * para o comercial.
 */
export function CalculadoraMarcoHorizonte() {
  const [idade, setIdade] = useState("35");
  const [idadeLivre, setIdadeLivre] = useState("60");
  const [renda, setRenda] = useState("8000");
  const [jaTem, setJaTem] = useState("50000");
  const [aporte, setAporte] = useState("2000");
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);

  const r = useMemo(() => {
    const rendaN = parseFloat(renda) || 0;
    const jaTemN = parseFloat(jaTem) || 0;
    const aporteN = parseFloat(aporte) || 0;
    const anos = Math.max(0, (parseInt(idadeLivre) || 0) - (parseInt(idade) || 0));
    const n = anos * 12;
    const { alvo, taxaMensal: i } = marcoRapido(rendaN, parseInt(idadeLivre) || 60);
    const fv =
      n > 0
        ? jaTemN * Math.pow(1 + i, n) +
          aporteN * ((Math.pow(1 + i, n) - 1) / i)
        : jaTemN;
    const gap = Math.max(0, alvo - fv);
    const pct = alvo > 0 ? Math.min(100, Math.max(0, Math.round((fv / alvo) * 100))) : 0;
    const alcancou = fv >= alvo;

    /* A conta americana, para comparar: 25× a renda anual (renda ÷ 4%).
       Ela assume perpetuidade — capital que nunca acaba, para herdeiros que
       o cliente não perguntou se quer ter. O Marco Horizonte assume prazo:
       a renda dura até os 90 e o capital termina em zero.
       Não é a nossa conta; é a régua contra a qual a nossa se explica. */
    const alvo4pct = (rendaN * 12) / 0.04;
    const excesso = Math.max(0, alvo4pct - alvo);

    /* O aporte que fecharia a conta no mesmo prazo. Invertendo a FV de série
       uniforme: pmt = (alvo − jaTem·(1+i)^n) · i / ((1+i)^n − 1).
       É o número que transforma "faltam R$ 579 mil" — assustador e inerte —
       em uma decisão do tamanho de um mês. */
    const fator = Math.pow(1 + i, n);
    const aporteIdeal =
      n > 0 && !alcancou
        ? Math.max(0, ((alvo - jaTemN * fator) * i) / (fator - 1))
        : 0;
    const aporteExtra = Math.max(0, aporteIdeal - aporteN);

    return {
      rendaN, anos, alvo, fv, gap, pct, alcancou,
      alvo4pct, excesso, aporteIdeal, aporteExtra,
    };
  }, [idade, idadeLivre, renda, jaTem, aporte]);

  const leadOk = leadCompleto(dados);

  const enviar = () => {
    if (!leadOk) return;
    setEnviado(true);
    salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: "/planejamento",
      tipo: "vida-plan",
      payload: { idade, idadeLivre, renda: r.rendaN, alvo: r.alvo, projecao: r.fv, pct: r.pct },
    });
    try {
      localStorage.setItem(
        "novare:vidaplan-lead",
        JSON.stringify({
          nome: dados.nome.trim(),
          telefone: dados.telefone,
          email: dados.email,
          idade,
          idadeLivre,
          renda,
          jaTem,
          aporte,
          ts: Date.now(),
        }),
      );
    } catch {
      /* ambiente sem storage — segue mesmo assim */
    }
    const msg =
      `${saudacaoLead(dados.nome)} Calculei meu Marco Horizonte no site e quero receber meu plano detalhado.\n` +
      `• Tenho ${idade} anos e quero parar de depender do salário aos ${idadeLivre}\n` +
      `• Renda desejada: ${brl(r.rendaN)}/mês\n` +
      `• Meu Marco Horizonte: ${brl(r.alvo)}\n` +
      `• No ritmo atual chego a ${brl(r.fv)} (${r.pct}%)\n` +
      `• WhatsApp: ${dados.telefone}` +
      (dados.email.trim() ? `\n• E-mail: ${dados.email}` : "");
    window.open(falarNoWhatsApp(msg), "_blank", "noopener,noreferrer");
  };

  return (
    // items-start: sem isso o card de entradas estica até a altura da coluna
    // direita, que ficou mais alta com o comparativo, e sobra um vazio
    // grande embaixo dos campos.
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_minmax(0,20rem)]">
      {/* ENTRADAS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum label="Sua idade hoje" value={idade} onChange={setIdade} sufixo="anos" />
          <CampoNum label="Quero parar de depender do salário aos" value={idadeLivre} onChange={setIdadeLivre} sufixo="anos" />
          <CampoNum label="Renda que quero receber (hoje)" value={renda} onChange={setRenda} moeda />
          <CampoNum label="Quanto já tenho investido" value={jaTem} onChange={setJaTem} moeda />
          <CampoNum label="Quanto consigo guardar por mês" value={aporte} onChange={setAporte} moeda />
          <div className="flex items-end">
            {/* Esta nota dizia "regra dos 4%" — e a conta acima justamente
                não é essa (ver o comentário de `marcoRapido`). Além de
                descrever errado o cálculo, entregava de graça o argumento
                que separa este produto dos concorrentes. */}
            <p className="text-[11px] leading-snug text-muted-foreground">
              Considera 5% a.a. de retorno real (acima da inflação) e renda
              até os {IDADE_FIM} anos — não a regra dos 4%.
            </p>
          </div>
        </div>

        {/* O gap sozinho ("faltam R$ 579 mil") paralisa: é um número grande
            demais para caber numa decisão. Traduzido em aporte mensal, vira
            uma escolha do tamanho de um mês — e é exatamente o cálculo que o
            app faz todo mês depois da assinatura. */}
        {r.aporteIdeal > 0 && (
          <div className="mt-5 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
              Para fechar a conta no mesmo prazo
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-primary">
              {brl(r.aporteIdeal)}
              <span className="ml-1 font-sans text-sm font-semibold text-muted-foreground">
                por mês
              </span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {r.aporteExtra > 0 ? (
                <>
                  São{" "}
                  <b className="font-semibold text-accent-strong">
                    {brl(r.aporteExtra)} a mais
                  </b>{" "}
                  do que você guarda hoje — durante os {r.anos} anos que
                  faltam.
                </>
              ) : (
                <>O seu aporte de hoje já dá conta desse prazo.</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* RESULTADO */}
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-primary p-6 text-white shadow-lg">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
            <Target className="h-3.5 w-3.5" /> Seu Marco Horizonte
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{brl(r.alvo)}</p>
          <p className="mt-1 text-xs text-white/70">
            é o patrimônio que te dá {brl(r.rendaN)} por mês até os 90 anos.
          </p>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">No seu ritmo atual, em {r.anos} anos</span>
              <span className="font-bold tabular-nums">{r.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full transition-all duration-500 ${r.alcancou ? "bg-emerald-400" : "bg-accent"}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <p className="pt-1 text-xs text-white/80">
              {r.alcancou ? (
                <>Você chega a <b>{brl(r.fv)}</b> — já passa da meta.</>
              ) : (
                <>Você chega a <b>{brl(r.fv)}</b>. Faltam <b className="text-accent-claro">{brl(r.gap)}</b>.</>
              )}
            </p>
          </div>
        </div>

        {/* O DUELO: a nossa conta contra a régua americana.
            A página inteira afirma "não é a regra dos 4%" — aqui isso deixa
            de ser afirmação e vira demonstração, com o número da própria
            pessoa. As duas barras dividem a MESMA escala (o maior dos dois
            alvos), senão a comparação mente no desenho. */}
        {r.excesso > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
              Por que não usamos a regra dos 4%
            </p>

            <div className="mt-3.5 space-y-3">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    Seu Marco Horizonte
                  </span>
                  <span className="font-display text-sm font-bold tabular-nums text-primary">
                    {brl(r.alvo)}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(r.alvo / r.alvo4pct) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Pela regra dos 4% (americana)
                  </span>
                  <span className="font-display text-sm font-bold tabular-nums text-muted-foreground">
                    {brl(r.alvo4pct)}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-full rounded-full bg-slate-300" />
                </div>
              </div>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-muted-foreground">
              A conta americana pediria{" "}
              <b className="text-accent-strong">{brl(r.excesso)} a mais</b> —
              ela supõe um capital que nunca acaba. O seu plano tem prazo: a
              renda dura até os {IDADE_FIM} anos, e não sobra patrimônio
              parado que você trabalhou anos para juntar.
            </p>
          </div>
        )}

        {/* CAPTURA DE LEAD */}
        {enviado ? (
          <div className="rounded-3xl border border-emerald-300/50 bg-emerald-50 p-5 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-emerald-600" />
            <p className="mt-2 font-display text-sm font-bold text-emerald-800">
              {primeiroNomeLead(dados.nome)
                ? `Pronto, ${primeiroNomeLead(dados.nome)}!`
                : "Pronto!"}{" "}
              Um consultor da Novare vai te enviar o plano detalhado.
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              Abrimos o WhatsApp com o seu resumo — é só enviar.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-primary">
              <TrendingUp className="h-4 w-4 text-accent-strong" /> Receba seu plano detalhado
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Como sair de {r.pct}% e chegar aos 100%, ano a ano, com a Novare.
            </p>
            <div className="mt-3">
              <CamposLead dados={dados} aoMudar={setDados} compacto />
            </div>
            <button
              onClick={enviar}
              disabled={!leadOk}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quero meu plano
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Seus dados são tratados conforme a LGPD.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CampoNum({
  label,
  value,
  onChange,
  sufixo,
  moeda,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  sufixo?: string;
  moeda?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <div className="relative">
        {moeda && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
        )}
        <input
          inputMode={moeda ? "numeric" : "numeric"}
          value={moeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(moeda ? digitosParaReais(e.target.value) : e.target.value.replace(/\D/g, ""))}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            moeda ? "pl-9" : ""
          } ${sufixo ? "pr-16" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{sufixo}</span>
        )}
      </div>
    </label>
  );
}
