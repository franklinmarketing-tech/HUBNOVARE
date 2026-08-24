"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  AlarmClock,
  ArrowRight,
  BellRing,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { brl } from "@/lib/calculos";
import { useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type TipoCompromisso = "Conta" | "Cartão" | "Parcela" | "Imposto" | "Receita";

interface Compromisso {
  id: string;
  nome: string;
  dia: number;
  valor: number;
  tipo: TipoCompromisso;
}

interface Calendario {
  compromissos: Compromisso[];
  pagos: Record<string, boolean>;
}

interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
}

interface Vencimento {
  id: string;
  nome: string;
  tipo: TipoCompromisso;
  valor: number;
  /** yyyy-mm-dd da próxima ocorrência. */
  data: string;
  diasRestantes: number;
}

const JANELA_DIAS = 15;

const pad = (n: number) => String(n).padStart(2, "0");

function dataIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Próxima ocorrência do compromisso a partir de hoje: neste mês se o dia
 * ainda não passou, senão no mês seguinte. Dia maior que o mês comporta
 * (31 em fevereiro) é ajustado para o último dia do mês.
 */
function proximaOcorrencia(dia: number, hoje: Date): Date {
  const montar = (ano: number, mes0: number) => {
    const ultimo = new Date(ano, mes0 + 1, 0).getDate();
    return new Date(ano, mes0, Math.min(Math.max(1, Math.round(dia) || 1), ultimo));
  };
  const nesteMes = montar(hoje.getFullYear(), hoje.getMonth());
  if (nesteMes.getTime() >= hoje.getTime()) return nesteMes;
  return montar(
    hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear(),
    hoje.getMonth() === 11 ? 0 : hoje.getMonth() + 1
  );
}

function rotuloDias(dias: number): string {
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

/* -------------------------------------------------------------------------- */

export default function AlertasPage() {
  const [calendario, , carCalendario] = useArmazenado<Calendario>(
    "calendario",
    { compromissos: [], pagos: {} }
  );
  const [assinaturas, , carAssinaturas] = useArmazenado<Assinatura[]>(
    "assinaturas",
    []
  );

  const compromissos = Array.isArray(calendario?.compromissos)
    ? calendario.compromissos
    : [];
  const pagos =
    calendario?.pagos && typeof calendario.pagos === "object"
      ? calendario.pagos
      : {};
  const listaAssinaturas = Array.isArray(assinaturas) ? assinaturas : [];

  const vencimentos = useMemo<Vencimento[]>(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    return compromissos
      .filter((c) => c && c.tipo !== "Receita")
      .map((c) => {
        const quando = proximaOcorrencia(c.dia, hoje);
        const anoMes = `${quando.getFullYear()}-${pad(quando.getMonth() + 1)}`;
        const pago = pagos[`${c.id}:${anoMes}`] === true;
        const diasRestantes = Math.round(
          (quando.getTime() - hoje.getTime()) / 86_400_000
        );
        return {
          id: c.id,
          nome: c.nome,
          tipo: c.tipo,
          valor: Number(c.valor) || 0,
          data: dataIso(quando),
          diasRestantes,
          pago,
        };
      })
      .filter((v) => !v.pago && v.diasRestantes <= JANELA_DIAS)
      .sort((a, b) => a.diasRestantes - b.diasRestantes || b.valor - a.valor)
      .map(({ pago: _pago, ...v }) => v);
  }, [compromissos, pagos]);

  const totalJanela = useMemo(
    () => vencimentos.reduce((acc, v) => acc + v.valor, 0),
    [vencimentos]
  );

  const totalAssinaturas = useMemo(
    () =>
      listaAssinaturas.reduce((acc, a) => acc + (Number(a?.valor) || 0), 0),
    [listaAssinaturas]
  );

  const semCompromissos = carCalendario && compromissos.length === 0;
  const semAssinaturas = carAssinaturas && listaAssinaturas.length === 0;

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
            Alerta de vencimentos
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <BellRing className="h-3.5 w-3.5" />
            Ferramenta inteligente
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Nenhuma conta pega você de surpresa
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Esta central lê o seu Calendário de Contas e as suas Assinaturas e
            mostra, num relance, tudo o que vence nos próximos {JANELA_DIAS}{" "}
            dias. O que já foi pago no mês sai da lista sozinho.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            A pagar nos próximos {JANELA_DIAS} dias
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(totalJanela)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {vencimentos.length > 0
              ? `${vencimentos.length} ${
                  vencimentos.length === 1
                    ? "compromisso pendente"
                    : "compromissos pendentes"
                } na janela.`
              : "Nada pendente na janela por enquanto."}
          </p>
        </section>

        {/* Lista de vencimentos */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1.5">
            Próximos vencimentos
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Ordenados do mais urgente para o mais folgado. Receitas e contas já
            marcadas como pagas no mês não entram.
          </p>

          {semCompromissos ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Seu calendário ainda está vazio
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Cadastre suas contas fixas no Calendário de Contas e os
                vencimentos passam a aparecer aqui automaticamente.
              </p>
              <Link
                href="/ferramentas/calendario"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Abrir o Calendário de Contas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : vencimentos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <AlarmClock className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Janela limpa
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Nenhum compromisso pendente vence nos próximos {JANELA_DIAS}{" "}
                dias. Bom sinal.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vencimentos.map((v) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums shrink-0 ${
                      v.diasRestantes === 0
                        ? "bg-destructive/10 text-destructive"
                        : v.diasRestantes <= 3
                          ? "bg-warning/15 text-slate-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {rotuloDias(v.diasRestantes)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{v.nome}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {v.tipo} vence dia {v.data.slice(8, 10)}/
                      {v.data.slice(5, 7)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {brl(v.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Assinaturas ativas */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            Assinaturas ativas
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Cobranças recorrentes todo mês, sem dia fixo cadastrado. Conte com
            elas no orçamento mesmo fora da janela acima.
          </p>

          {semAssinaturas ? (
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">
                Nenhuma assinatura cadastrada ainda.
              </p>
              <Link
                href="/ferramentas/assinaturas"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Mapear minhas assinaturas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {listaAssinaturas.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 truncate">
                        {a.nome}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {a.categoria}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {brl(Number(a.valor) || 0)}
                      <span className="text-[11px] font-normal text-slate-500">
                        {" "}
                        /mês
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Total recorrente mensal
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {brl(totalAssinaturas)}
                </p>
              </div>
            </>
          )}
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}
