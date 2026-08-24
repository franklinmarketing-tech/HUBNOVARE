"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles, Target, TrendingUp, Lock } from "lucide-react";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead } from "@/lib/leads";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/** Premissa conservadora: 5% a.a. de retorno REAL (acima da inflação). */
const RENT_REAL_ANUAL = 0.05;
/** Regra dos 4% (25× a renda anual) para uma renda que dura a vida toda. */
const TAXA_RETIRADA = 0.04;

/**
 * O lead-magnet do Vida Plan, no molde da calculadora "Reserva Ideal" do
 * Nord Liberta: a pessoa preenche, vê o próprio Marco Horizonte na hora e
 * deixa o e-mail para receber o plano detalhado. O lead vai para o comercial.
 */
export function CalculadoraVidaPlan() {
  const [idade, setIdade] = useState("35");
  const [idadeLivre, setIdadeLivre] = useState("60");
  const [renda, setRenda] = useState("8000");
  const [jaTem, setJaTem] = useState("50000");
  const [aporte, setAporte] = useState("2000");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const r = useMemo(() => {
    const rendaN = parseFloat(renda) || 0;
    const jaTemN = parseFloat(jaTem) || 0;
    const aporteN = parseFloat(aporte) || 0;
    const anos = Math.max(0, (parseInt(idadeLivre) || 0) - (parseInt(idade) || 0));
    const n = anos * 12;
    const i = Math.pow(1 + RENT_REAL_ANUAL, 1 / 12) - 1;
    const alvo = (rendaN * 12) / TAXA_RETIRADA;
    const fv =
      n > 0
        ? jaTemN * Math.pow(1 + i, n) +
          aporteN * ((Math.pow(1 + i, n) - 1) / i)
        : jaTemN;
    const gap = Math.max(0, alvo - fv);
    const pct = alvo > 0 ? Math.min(100, Math.max(0, Math.round((fv / alvo) * 100))) : 0;
    const alcancou = fv >= alvo;
    return { rendaN, anos, alvo, fv, gap, pct, alcancou };
  }, [idade, idadeLivre, renda, jaTem, aporte]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const enviar = () => {
    if (!emailOk) return;
    setEnviado(true);
    salvarLead({
      email,
      origem: "/vida-plan",
      tipo: "vida-plan",
      payload: { idade, idadeLivre, renda: r.rendaN, alvo: r.alvo, projecao: r.fv, pct: r.pct },
    });
    try {
      localStorage.setItem(
        "novare:vidaplan-lead",
        JSON.stringify({ email, idade, idadeLivre, renda, jaTem, aporte, ts: Date.now() }),
      );
    } catch {
      /* ambiente sem storage — segue mesmo assim */
    }
    const msg =
      `Olá! Fiz o Vida Plan no site e quero receber meu plano detalhado.\n` +
      `• Tenho ${idade} anos e quero parar de depender do salário aos ${idadeLivre}\n` +
      `• Renda desejada: ${brl(r.rendaN)}/mês\n` +
      `• Meu Marco Horizonte: ${brl(r.alvo)}\n` +
      `• No ritmo atual chego a ${brl(r.fv)} (${r.pct}%)\n` +
      `• E-mail: ${email}`;
    window.open(falarNoWhatsApp(msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,20rem)]">
      {/* ENTRADAS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum label="Sua idade hoje" value={idade} onChange={setIdade} sufixo="anos" />
          <CampoNum label="Quero parar de depender do salário aos" value={idadeLivre} onChange={setIdadeLivre} sufixo="anos" />
          <CampoNum label="Renda que quero receber (hoje)" value={renda} onChange={setRenda} moeda />
          <CampoNum label="Quanto já tenho investido" value={jaTem} onChange={setJaTem} moeda />
          <CampoNum label="Quanto consigo guardar por mês" value={aporte} onChange={setAporte} moeda />
          <div className="flex items-end">
            <p className="text-[11px] leading-snug text-slate-400">
              Considera 5% a.a. de retorno real (acima da inflação) e a regra dos 4% para
              uma renda que dura a vida toda.
            </p>
          </div>
        </div>
      </div>

      {/* RESULTADO */}
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-primary p-6 text-white shadow-lg">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
            <Target className="h-3.5 w-3.5" /> Seu Marco Horizonte
          </p>
          <p className="mt-1 font-display text-4xl font-black tabular-nums">{brl(r.alvo)}</p>
          <p className="mt-1 text-xs text-white/70">
            é o patrimônio que te dá {brl(r.rendaN)} por mês, para sempre.
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
                <>Você chega a <b>{brl(r.fv)}</b> — já passa da meta! 🎉</>
              ) : (
                <>Você chega a <b>{brl(r.fv)}</b>. Faltam <b className="text-accent-claro">{brl(r.gap)}</b>.</>
              )}
            </p>
          </div>
        </div>

        {/* CAPTURA DE LEAD */}
        {enviado ? (
          <div className="rounded-3xl border border-emerald-300/50 bg-emerald-50 p-5 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-emerald-600" />
            <p className="mt-2 font-display text-sm font-bold text-emerald-800">
              Pronto! Um consultor da Novare vai te enviar o plano detalhado.
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
              Quero meu plano
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
