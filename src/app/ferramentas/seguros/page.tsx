"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Plus,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, parseNumero } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Seguro {
  id: string;
  tipo: string;
  seguradora: string;
  cobertura: number;
  premioMensal: number;
  /** yyyy-mm-dd */
  vencimento: string;
}

const TIPOS = ["Vida", "Saúde", "Auto", "Residencial", "Viagem", "Outros"] as const;

function diasAteVencer(vencimento: string): number {
  const [ano, mes, dia] = vencimento.split("-").map(Number);
  if (!ano || !mes || !dia) return Number.POSITIVE_INFINITY;
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function formatarData(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/* -------------------------------------------------------------------------- */

export default function SegurosPage() {
  const [seguros, setSeguros, carregado] = useArmazenado<Seguro[]>("seguros", []);

  const [tipo, setTipo] = useState<string>(TIPOS[0]);
  const [seguradora, setSeguradora] = useState("");
  const [cobertura, setCobertura] = useState("");
  const [premio, setPremio] = useState("");
  const [vencimento, setVencimento] = useState("");

  const coberturaNumero = parseNumero(cobertura);
  const premioNumero = parseNumero(premio);
  const formValido =
    seguradora.trim().length > 0 &&
    coberturaNumero > 0 &&
    premioNumero > 0 &&
    !!vencimento;

  const ordenados = useMemo(
    () => [...seguros].sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
    [seguros]
  );

  const coberturaTotal = useMemo(
    () => seguros.reduce((acc, s) => acc + s.cobertura, 0),
    [seguros]
  );
  const custoMensal = useMemo(
    () => seguros.reduce((acc, s) => acc + s.premioMensal, 0),
    [seguros]
  );

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const novo: Seguro = {
      id: novoId(),
      tipo,
      seguradora: seguradora.trim(),
      cobertura: coberturaNumero,
      premioMensal: premioNumero,
      vencimento,
    };
    setSeguros((lista) => [...lista, novo]);
    setSeguradora("");
    setCobertura("");
    setPremio("");
    setVencimento("");
  };

  const remover = (id: string) =>
    setSeguros((lista) => lista.filter((s) => s.id !== id));

  const vazio = carregado && seguros.length === 0;

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
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Organizador de seguros
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Shield className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Todas as suas apólices em um só lugar
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Cadastre cada seguro que você paga, veja quanto de proteção já
            contratou e receba um alerta visual quando uma apólice estiver
            perto de renovar. Seguro esquecido é dinheiro jogado fora.
          </p>
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Nova apólice
          </h2>
          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="tipo-de-seguro" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo de seguro
              </label>
              <select id="tipo-de-seguro"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="seguradora" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Seguradora
              </label>
              <input id="seguradora"
                value={seguradora}
                onChange={(e) => setSeguradora(e.target.value)}
                placeholder="Porto, Bradesco, SulAmérica..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="cobertura" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Cobertura
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="cobertura"
                  inputMode="decimal"
                  value={cobertura}
                  onChange={(e) => setCobertura(e.target.value)}
                  placeholder="500.000,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="premio-mensal" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Prêmio mensal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="premio-mensal"
                  inputMode="decimal"
                  value={premio}
                  onChange={(e) => setPremio(e.target.value)}
                  placeholder="180,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="vencimento-da-apolice" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Vencimento da apólice
              </label>
              <input id="vencimento-da-apolice"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar apólice
              </button>
            </div>
          </form>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Cobertura total contratada
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(coberturaTotal)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {seguros.length > 0
              ? `É o quanto de proteção suas ${seguros.length === 1 ? "apólice garante" : "apólices garantem"} hoje.`
              : "Cadastre a primeira apólice para ver sua proteção somada."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(custoMensal)}
            legenda="Custo mensal somado"
          />
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(custoMensal * 12)}
            legenda="Custo anual"
          />
          <Kpi
            icone={<FileText className="h-5 w-5 mx-auto text-primary" />}
            valor={String(seguros.length)}
            legenda={seguros.length === 1 ? "Apólice cadastrada" : "Apólices cadastradas"}
          />
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Shield className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Nenhuma apólice cadastrada
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Adicione seguros de vida, saúde, auto e residência no formulário
              acima. O resumo de custo e proteção aparece aqui.
            </p>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">Suas apólices</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
              Ordenadas pelo vencimento mais próximo.
            </p>
            <ul className="divide-y divide-slate-100">
              {ordenados.map((s) => {
                const dias = diasAteVencer(s.vencimento);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {s.tipo}
                        <span className="font-normal text-slate-500"> · {s.seguradora}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        Cobertura {brlCurto(s.cobertura)} · {brl(s.premioMensal)}/mês ·
                        vence em {formatarData(s.vencimento)}
                      </p>
                      {dias < 0 ? (
                        <span className="inline-flex mt-1.5 rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[11px] font-semibold">
                          apólice vencida
                        </span>
                      ) : dias < 30 ? (
                        <span className="inline-flex mt-1.5 rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                          renova em {dias} {dias === 1 ? "dia" : "dias"}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(s.id)}
                      aria-label={`Remover apólice ${s.tipo} da ${s.seguradora}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
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
