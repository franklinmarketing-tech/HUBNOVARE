"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, HeartPulse, Loader2, Lock, MessageCircle, PiggyBank, Shield, TrendingUp, UserRound, Wallet } from "lucide-react";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead } from "@/lib/leads";
import {
  CamposLead,
  leadCompleto,
  primeiroNomeLead,
  saudacaoLead,
  type DadosLead,
} from "@/components/CamposLead";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Cada uma das 4 dimensões vale 25 pontos → nota final de 0 a 100. */
function pontos(rendaN: number, gastosN: number, dividaN: number, reservaN: number, investN: number) {
  const sobra = rendaN - gastosN;
  const taxa = rendaN > 0 ? sobra / rendaN : 0;
  const p1 = taxa >= 0.3 ? 25 : taxa >= 0.2 ? 20 : taxa >= 0.1 ? 13 : taxa > 0 ? 6 : 0;

  const meses = gastosN > 0 ? reservaN / gastosN : reservaN > 0 ? 12 : 0;
  const p2 = meses >= 6 ? 25 : meses >= 3 ? 18 : meses >= 1 ? 9 : meses > 0 ? 4 : 0;

  const divMeses = rendaN > 0 ? dividaN / rendaN : dividaN > 0 ? 24 : 0;
  const p3 = dividaN <= 0 ? 25 : divMeses <= 1 ? 20 : divMeses <= 3 ? 14 : divMeses <= 6 ? 8 : divMeses <= 12 ? 3 : 0;

  const invX = rendaN > 0 ? investN / (rendaN * 12) : 0;
  const p4 = invX >= 1 ? 25 : invX >= 0.5 ? 18 : invX >= 0.1 ? 11 : investN > 0 ? 5 : 0;

  return { p1, p2, p3, p4, score: Math.round(p1 + p2 + p3 + p4) };
}

function faixa(score: number) {
  if (score >= 81) return { rotulo: "Excelente", cor: "text-emerald-300", barra: "bg-emerald-400", nota: "Sua saúde financeira está sólida. Vamos blindar e acelerar." };
  if (score >= 61) return { rotulo: "Boa", cor: "text-sky-300", barra: "bg-sky-400", nota: "Você está no caminho certo — dá pra otimizar e crescer mais rápido." };
  if (score >= 41) return { rotulo: "Atenção", cor: "text-amber-300", barra: "bg-amber-400", nota: "Há pontos importantes a ajustar antes de investir com tranquilidade." };
  return { rotulo: "Crítica", cor: "text-rose-300", barra: "bg-rose-400", nota: "A prioridade é reorganizar o básico. A Novare te ajuda a virar o jogo." };
}

export function CalculadoraSaudeFinanceira() {
  const [renda, setRenda] = useState("8000");
  const [gastos, setGastos] = useState("5500");
  const [divida, setDivida] = useState("12000");
  const [reserva, setReserva] = useState("15000");
  const [invest, setInvest] = useState("30000");
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);

  const r = useMemo(() => {
    const n = (v: string) => parseFloat(v) || 0;
    const p = pontos(n(renda), n(gastos), n(divida), n(reserva), n(invest));
    return { ...p, f: faixa(p.score) };
  }, [renda, gastos, divida, reserva, invest]);

  const leadOk = leadCompleto(dados);

  /* O QUE MELHORAR, NA ORDEM CERTA — calculado aqui, na tela, para todos.
     ⚠️ ATÉ 20/10/2026 ISTO ERA PROMETIDO E NUNCA EXISTIA: "Receba o
     diagnóstico completo" pedia nome, telefone e e-mail e só abria o WhatsApp
     com a nota. Agora cada pilar abaixo da nota máxima vira uma ação com o
     valor que falta, usando as MESMAS faixas de `pontos()` (a meta citada é
     a que dá os 25 pontos do pilar), do mais fraco para o mais forte. */
  const plano = useMemo(() => {
    const n = (v: string) => parseFloat(v) || 0;
    const rendaN = n(renda), gastosN = n(gastos), dividaN = n(divida), reservaN = n(reserva), investN = n(invest);
    const itens: { pts: number; titulo: string; texto: string; href: string; ferramenta: string }[] = [];
    const sobra = rendaN - gastosN;
    if (r.p1 < 25 && rendaN > 0) {
      const falta = Math.max(0, rendaN * 0.3 - sobra);
      itens.push({ pts: r.p1, titulo: "Aumentar a sobra do mês",
        texto: `Hoje sobram ${brl(Math.max(0, sobra))} (${Math.max(0, Math.round((sobra / rendaN) * 100))}% da renda). A meta é 30%: falta liberar ${brl(falta)} por mês, cortando gastos ou aumentando a renda.`,
        href: "/ferramentas/orcamento", ferramenta: "Montar o orçamento" });
    }
    if (r.p2 < 25) {
      const meses = gastosN > 0 ? reservaN / gastosN : 0;
      itens.push({ pts: r.p2, titulo: "Completar a reserva de emergência",
        texto: `Sua reserva cobre ${meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${meses >= 1 && meses < 2 ? "mês" : "meses"} de gastos. A meta é 6 meses: faltam ${brl(Math.max(0, gastosN * 6 - reservaN))}.`,
        href: "/ferramentas/reserva", ferramenta: "Planejar a reserva" });
    }
    if (r.p3 < 25) {
      const vezes = rendaN > 0 ? dividaN / rendaN : 0;
      itens.push({ pts: r.p3, titulo: "Reduzir as dívidas",
        texto: `Suas dívidas somam ${vezes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} vezes a sua renda mensal. Comece pelas de juros mais altos, como cartão e cheque especial.`,
        href: "/ferramentas/amortizacao", ferramenta: "Simular a quitação" });
    }
    if (r.p4 < 25 && rendaN > 0) {
      itens.push({ pts: r.p4, titulo: "Fazer o dinheiro trabalhar",
        texto: `Seus investimentos equivalem a ${(investN / rendaN).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses de renda. A meta é 12 meses: faltam ${brl(Math.max(0, rendaN * 12 - investN))}.`,
        href: "/ferramentas/juros-compostos", ferramenta: "Simular o crescimento" });
    }
    return itens.sort((a, b) => a.pts - b.pts);
  }, [renda, gastos, divida, reserva, invest, r]);

  const [querEspecialista, setQuerEspecialista] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  /* ⚠️ O MESMO CONSERTO DO `CapturaLead`: antes a tela comemorava antes de
     gravar, o lead ia sem `await` e o WhatsApp abria SOZINHO. Agora grava,
     espera a resposta, e o WhatsApp é um botão que a pessoa escolhe. */
  const enviar = async () => {
    if (!leadOk || enviando) return;
    setEnviando(true);
    setFalhou(false);
    const resp = await salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: "/exame-saude-financeira",
      tipo: "saude-financeira",
      payload: { score: r.score, faixa: r.f.rotulo, renda, gastos, divida, reserva, invest },
    });
    setEnviando(false);
    if (!resp.gravado) {
      setFalhou(true);
      return;
    }
    setEnviado(true);
    try {
      localStorage.setItem(
        "novare:saude-lead",
        JSON.stringify({
          nome: dados.nome.trim(),
          telefone: dados.telefone,
          email: dados.email,
          renda,
          gastos,
          divida,
          reserva,
          invest,
          score: r.score,
          ts: Date.now(),
        }),
      );
    } catch {}
  };

  const zap = falarNoWhatsApp(
    `${saudacaoLead(dados.nome)} Fiz o Exame de Saúde Financeira no site da Novare.\n` +
      `• Nota: ${r.score}/100 (${r.f.rotulo})\n` +
      `• WhatsApp: ${dados.telefone}\n` +
      (dados.email.trim() ? `• E-mail: ${dados.email}\n` : "") +
      `Quero que um especialista olhe os meus números comigo.`,
  );

  const DIMS = [
    { icone: PiggyBank, nome: "Sobra mensal", val: r.p1 },
    { icone: Shield, nome: "Reserva de emergência", val: r.p2 },
    { icone: Wallet, nome: "Endividamento", val: r.p3 },
    { icone: TrendingUp, nome: "Investimentos", val: r.p4 },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_minmax(0,21rem)]">
      {/* ENTRADAS */}
      {/* Coluna da esquerda: os campos e, logo abaixo, o plano — na largura que ele precisa. */}
      <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum label="Renda mensal" value={renda} onChange={setRenda} />
          <CampoNum label="Gastos mensais" value={gastos} onChange={setGastos} />
          <CampoNum label="Total de dívidas" value={divida} onChange={setDivida} />
          <CampoNum label="Reserva de emergência" value={reserva} onChange={setReserva} />
          <CampoNum label="Total investido" value={invest} onChange={setInvest} />
          <div className="flex items-end">
            <p className="text-[11px] leading-snug text-muted-foreground">
              Avaliamos 4 pilares: sobra mensal, reserva, endividamento e investimentos.
            </p>
          </div>
        </div>
      </div>
        {/* O PLANO, ABERTO PARA TODOS — ver a nota em `plano`. */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-bold text-primary">
            O que melhorar, na ordem certa
          </p>
          {plano.length === 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Os quatro pilares estão na nota máxima. O próximo passo é proteger o
              que você construiu e conferir quanto ele rende acima da inflação.
            </p>
          ) : (
            <ol className="mt-3 space-y-3">
              {plano.map((p, i) => (
                <li key={p.titulo} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[11px] font-bold text-accent-strong">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{p.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{p.texto}</p>
                    <Link
                      href={p.href}
                      className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline print:hidden"
                    >
                      {p.ferramenta}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* RESULTADO */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="palco-iris relative overflow-hidden rounded-3xl p-6 text-white shadow-lg">
          <div className="relative">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              <HeartPulse className="h-3.5 w-3.5" /> Sua nota de saúde financeira
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-display text-6xl font-extrabold tabular-nums leading-none">{r.score}</span>
              <span className="pb-1 text-lg font-bold text-white/50">/100</span>
            </div>
            <p className={`mt-1 text-sm font-bold ${r.f.cor}`}>{r.f.rotulo}</p>
            <p className="mt-1 text-xs text-white/70">{r.f.nota}</p>

            <div className="mt-4 space-y-2">
              {DIMS.map((d) => (
                <div key={d.nome}>
                  <div className="flex items-center justify-between text-[11px] text-white/70">
                    <span className="flex items-center gap-1.5"><d.icone className="h-3 w-3" /> {d.nome}</span>
                    <span className="tabular-nums">{d.val}/25</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className={`h-full rounded-full ${r.f.barra}`} style={{ width: `${(d.val / 25) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* AÇÕES: o PDF primeiro, sem cadastro; o especialista é opcional. */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          {enviado ? (
            <div className="text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700">
                <Check className="h-4 w-4" />
                {primeiroNomeLead(dados.nome) ? `Recebemos, ${primeiroNomeLead(dados.nome)}!` : "Recebemos!"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Um especialista da Novare entra em contato.</p>
              <a
                href={zap}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-primary hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                Prefere falar agora? Chamar no WhatsApp
              </a>
            </div>
          ) : !querEspecialista ? (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
              >
                <Download className="h-4 w-4" />
                Baixar meu resultado em PDF
              </button>
              <button
                type="button"
                onClick={() => setQuerEspecialista(true)}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" />
                Falar com um especialista
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Sem cadastro para ver ou salvar. O especialista é opcional e gratuito.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-sm font-bold text-primary">Falar com um especialista</p>
              <p className="mt-1 text-xs text-slate-500">
                Ele olha os seus números com você e indica o próximo passo — grátis, sem compromisso.
              </p>
              <div className="mt-3">
                <CamposLead dados={dados} aoMudar={setDados} compacto />
              </div>
              <button
                onClick={enviar}
                disabled={!leadOk || enviando}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {enviando ? "Enviando…" : "Quero falar com um especialista"}
              </button>
              {falhou && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  Não conseguimos registrar agora. Tente de novo em instantes.
                </p>
              )}
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Seus dados são tratados conforme a LGPD.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CampoNum({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
        <input
          inputMode="numeric"
          value={formatarMoedaInput(value)}
          onChange={(e) => onChange(digitosParaReais(e.target.value))}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
      </div>
    </label>
  );
}
