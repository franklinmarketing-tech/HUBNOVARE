"use client";

import { useMemo, useState } from "react";
import { ArrowRight, HeartPulse, Lock, PiggyBank, Shield, TrendingUp, Wallet } from "lucide-react";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead } from "@/lib/leads";

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
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const r = useMemo(() => {
    const n = (v: string) => parseFloat(v) || 0;
    const p = pontos(n(renda), n(gastos), n(divida), n(reserva), n(invest));
    return { ...p, f: faixa(p.score) };
  }, [renda, gastos, divida, reserva, invest]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const enviar = () => {
    if (!emailOk) return;
    setEnviado(true);
    salvarLead({
      email,
      origem: "/exame-saude-financeira",
      tipo: "saude-financeira",
      payload: { score: r.score, faixa: r.f.rotulo, renda, gastos, divida, reserva, invest },
    });
    try {
      localStorage.setItem("novare:saude-lead", JSON.stringify({ email, renda, gastos, divida, reserva, invest, score: r.score, ts: Date.now() }));
    } catch {}
    const msg =
      `Olá! Fiz o Exame de Saúde Financeira no site da Novare.\n` +
      `• Nota: ${r.score}/100 (${r.f.rotulo})\n` +
      `• E-mail: ${email}\n` +
      `Quero receber o diagnóstico detalhado.`;
    window.open(falarNoWhatsApp(msg), "_blank", "noopener,noreferrer");
  };

  const DIMS = [
    { icone: PiggyBank, nome: "Sobra mensal", val: r.p1 },
    { icone: Shield, nome: "Reserva de emergência", val: r.p2 },
    { icone: Wallet, nome: "Endividamento", val: r.p3 },
    { icone: TrendingUp, nome: "Investimentos", val: r.p4 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,21rem)]">
      {/* ENTRADAS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum label="Renda mensal" value={renda} onChange={setRenda} />
          <CampoNum label="Gastos mensais" value={gastos} onChange={setGastos} />
          <CampoNum label="Total de dívidas" value={divida} onChange={setDivida} />
          <CampoNum label="Reserva de emergência" value={reserva} onChange={setReserva} />
          <CampoNum label="Total investido" value={invest} onChange={setInvest} />
          <div className="flex items-end">
            <p className="text-[11px] leading-snug text-slate-400">
              Avaliamos 4 pilares: sobra mensal, reserva, endividamento e investimentos.
            </p>
          </div>
        </div>
      </div>

      {/* RESULTADO */}
      <div className="flex flex-col gap-4">
        <div className="palco-iris relative overflow-hidden rounded-3xl p-6 text-white shadow-lg">
          <div className="relative">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              <HeartPulse className="h-3.5 w-3.5" /> Sua nota de saúde financeira
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-display text-6xl font-black tabular-nums leading-none">{r.score}</span>
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

        {enviado ? (
          <div className="rounded-3xl border border-emerald-300/50 bg-emerald-50 p-5 text-center">
            <HeartPulse className="mx-auto h-6 w-6 text-emerald-600" />
            <p className="mt-2 font-display text-sm font-bold text-emerald-800">Diagnóstico a caminho!</p>
            <p className="mt-1 text-xs text-emerald-700/80">Abrimos o WhatsApp com sua nota — é só enviar pra falar com um especialista.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-display text-sm font-bold text-primary">Receba o diagnóstico completo</p>
            <p className="mt-1 text-xs text-slate-500">O que melhorar, na ordem certa, pra subir sua nota.</p>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
            <button
              onClick={enviar}
              disabled={!emailOk}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quero meu diagnóstico
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <Lock className="h-3 w-3" /> Seus dados são tratados conforme a LGPD.
            </p>
          </div>
        )}
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
