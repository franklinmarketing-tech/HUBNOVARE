"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { brl, brlCurto, parseNumero } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

const TIPOS = ["Conta", "Cartão", "Parcela", "Imposto", "Receita"] as const;
type Tipo = (typeof TIPOS)[number];

interface Compromisso {
  id: string;
  nome: string;
  dia: number;
  valor: number;
  tipo: Tipo;
}

interface DadosCalendario {
  compromissos: Compromisso[];
  pagos: Record<string, boolean>;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const CORES_TIPO: Record<Tipo, string> = {
  Conta: "bg-primary",
  Cartão: "bg-primary-bright",
  Parcela: "bg-slate-400",
  Imposto: "bg-warning",
  Receita: "bg-success",
};

export default function CalendarioPage() {
  const [dados, setDados, carregado] = useArmazenado<DadosCalendario>(
    "calendario",
    { compromissos: [], pagos: {} }
  );

  const [nome, setNome] = useState("");
  const [dia, setDia] = useState("5");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Tipo>("Conta");

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaHoje = hoje.getDate();
  const anoMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();

  const compromissos = dados.compromissos;
  const pagos = dados.pagos;

  const porDia = useMemo(() => {
    const mapa = new Map<number, Compromisso[]>();
    for (const c of compromissos) {
      const d = Math.min(c.dia, diasNoMes);
      const lista = mapa.get(d) ?? [];
      lista.push(c);
      mapa.set(d, lista);
    }
    return mapa;
  }, [compromissos, diasNoMes]);

  const totalSaidasMes = useMemo(
    () =>
      compromissos
        .filter((c) => c.tipo !== "Receita")
        .reduce((acc, c) => acc + c.valor, 0),
    [compromissos]
  );

  const totalReceitasMes = useMemo(
    () =>
      compromissos
        .filter((c) => c.tipo === "Receita")
        .reduce((acc, c) => acc + c.valor, 0),
    [compromissos]
  );

  // Próximos 7 dias: hoje até hoje+6, respeitando a virada de mês.
  const proximos = useMemo(() => {
    const itens: { c: Compromisso; data: Date; chavePago: string }[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const data = new Date(ano, mes, diaHoje + offset);
      const chaveMes = `${data.getFullYear()}-${String(
        data.getMonth() + 1
      ).padStart(2, "0")}`;
      for (const c of compromissos) {
        if (c.dia === data.getDate()) {
          itens.push({ c, data, chavePago: `${c.id}:${chaveMes}` });
        }
      }
    }
    return itens;
  }, [compromissos, ano, mes, diaHoje]);

  const totalProximos = proximos
    .filter((p) => p.c.tipo !== "Receita" && !pagos[p.chavePago])
    .reduce((acc, p) => acc + p.c.valor, 0);

  const ordenados = useMemo(
    () => [...compromissos].sort((a, b) => a.dia - b.dia),
    [compromissos]
  );

  function adicionar() {
    const v = parseNumero(valor);
    const d = Math.min(Math.max(Math.round(parseNumero(dia)) || 1, 1), 31);
    if (!nome.trim() || v <= 0) return;
    const novo: Compromisso = {
      id: novoId(),
      nome: nome.trim(),
      dia: d,
      valor: v,
      tipo,
    };
    setDados((atual) => ({
      ...atual,
      compromissos: [...atual.compromissos, novo],
    }));
    setNome("");
    setValor("");
  }

  function remover(id: string) {
    setDados((atual) => ({
      compromissos: atual.compromissos.filter((c) => c.id !== id),
      pagos: Object.fromEntries(
        Object.entries(atual.pagos).filter(([k]) => !k.startsWith(`${id}:`))
      ),
    }));
  }

  function alternarPago(chave: string) {
    setDados((atual) => {
      const pagosNovo = { ...atual.pagos };
      if (pagosNovo[chave]) delete pagosNovo[chave];
      else pagosNovo[chave] = true;
      return { ...atual, pagos: pagosNovo };
    });
  }

  const semanas: (number | null)[] = [
    ...Array<null>(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

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
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Calendário financeiro
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <CalendarDays className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Todas as contas do mês em um só lugar
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Cadastre os vencimentos que se repetem todo mês e veja de uma vez o
            que vence, quando vence e quanto sai. Marcou como pago, saiu da
            conta da semana.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Novo compromisso do mês
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="nome" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome
              </label>
              <input id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Aluguel, cartão, IPTU..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="dia-do-vencimento" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Dia do vencimento
              </label>
              <input id="dia-do-vencimento"
                inputMode="numeric"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                placeholder="1 a 31"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
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
              <label htmlFor="tipo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo
              </label>
              <select id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={adicionar}
            disabled={!nome.trim() || parseNumero(valor) <= 0}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-11 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Adicionar ao calendário
          </button>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Saídas de {MESES[mes]} (contas, cartão, parcelas e impostos)
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(totalSaidasMes)}
          </p>
          {totalReceitasMes > 0 && (
            <p className="text-sm text-white/70 mt-3 tabular-nums">
              Receitas previstas no mês: {brl(totalReceitasMes)} (fora do total
              acima)
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            {MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1)} de {ano}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Cada ponto é um compromisso no dia. O dia de hoje está destacado.
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 pb-1"
              >
                {d}
              </div>
            ))}
            {semanas.map((d, idx) =>
              d === null ? (
                <div key={`v-${idx}`} />
              ) : (
                <div
                  key={d}
                  className={`min-h-14 rounded-xl p-1.5 text-left ${
                    d === diaHoje
                      ? "bg-white ring-2 ring-accent"
                      : "bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-[11px] tabular-nums ${
                      d === diaHoje
                        ? "font-bold text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {d}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {(porDia.get(d) ?? []).map((c) => (
                      <span
                        key={c.id}
                        title={`${c.nome} (${c.tipo}) ${brl(c.valor)}`}
                        className={`h-1.5 w-1.5 rounded-full ${CORES_TIPO[c.tipo]} ${
                          pagos[`${c.id}:${anoMes}`] ? "opacity-30" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {TIPOS.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${CORES_TIPO[t]}`} />
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Próximos 7 dias
            </h2>
            <p className="text-sm font-bold tabular-nums text-primary">
              {brl(totalProximos)}{" "}
              <span className="text-[11px] font-medium text-slate-500">
                a pagar
              </span>
            </p>
          </div>
          {proximos.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">
              Nenhum vencimento na próxima semana. Semana leve.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {proximos.map(({ c, data, chavePago }) => {
                const venceHoje =
                  data.getDate() === diaHoje && data.getMonth() === mes;
                const pago = !!pagos[chavePago];
                return (
                  <li
                    key={chavePago}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      venceHoje && !pago
                        ? "bg-primary text-white"
                        : "bg-slate-50"
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pago}
                        onChange={() => alternarPago(chavePago)}
                        className="h-4 w-4 rounded border-slate-300 accent-[var(--color-success)]"
                      />
                      <span
                        className={`text-sm font-medium flex-1 ${
                          pago ? "line-through opacity-50" : ""
                        }`}
                      >
                        {c.nome}
                        <span
                          className={`ml-2 text-[11px] font-normal ${
                            venceHoje && !pago
                              ? "text-white/70"
                              : "text-slate-500"
                          }`}
                        >
                          {venceHoje
                            ? "vence hoje"
                            : `dia ${data.getDate()}/${String(
                                data.getMonth() + 1
                              ).padStart(2, "0")}`}
                        </span>
                      </span>
                    </label>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        c.tipo === "Receita"
                          ? "text-success"
                          : pago
                            ? "opacity-50 line-through"
                            : ""
                      }`}
                    >
                      {c.tipo === "Receita" ? "+" : ""}
                      {brl(c.valor)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Compromissos do mês
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Marque como pago no mês corrente. No mês que vem a lista volta em
            aberto sozinha.
          </p>
          {carregado && ordenados.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-3 py-10 text-center">
              <CalendarDays className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum compromisso cadastrado
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Comece pelo que nunca falha: aluguel, luz, internet e a fatura
                do cartão. Em um minuto o mês inteiro aparece no calendário.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {ordenados.map((c) => {
                const chave = `${c.id}:${anoMes}`;
                const pago = !!pagos[chave];
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pago}
                        onChange={() => alternarPago(chave)}
                        className="h-4 w-4 rounded border-slate-300 accent-[var(--color-success)]"
                      />
                      <span className="flex-1">
                        <span
                          className={`block text-sm font-medium ${
                            pago
                              ? "line-through text-slate-500"
                              : "text-slate-700"
                          }`}
                        >
                          {c.nome}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          dia {c.dia} · {c.tipo}
                        </span>
                      </span>
                    </label>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        c.tipo === "Receita"
                          ? "text-success"
                          : pago
                            ? "text-slate-500 line-through"
                            : "text-slate-700"
                      }`}
                    >
                      {c.tipo === "Receita" ? "+" : ""}
                      {brl(c.valor)}
                    </span>
                    {pago && (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    )}
                    <button
                      onClick={() => remover(c.id)}
                      aria-label={`Excluir ${c.nome}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

        <p className="text-[11px] text-slate-500 mt-6 text-center">
          Seus dados ficam somente no seu navegador.
        </p>
        </section>
      </main>
    </div>
  );
}
