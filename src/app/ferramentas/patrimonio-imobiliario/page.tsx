"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Home,
  KeyRound,
  Layers,
  MinusCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { brl, brlCurto, parseNumero, pct, rentabilidadeAluguel } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* --------------------------------------------------------------------------
   Carteira de imóveis.

   O patrimônio imobiliário verdadeiro é o valor de mercado MENOS o saldo
   devedor. Quem soma só o valor dos imóveis está contando um dinheiro que
   ainda é do banco.
   -------------------------------------------------------------------------- */

type TipoImovel = "residencial" | "comercial" | "terreno" | "rural";

interface Imovel {
  id: string;
  nome: string;
  tipo: TipoImovel;
  valor: number;
  divida: number;
  aluguel: number;
}

const TIPOS: Array<{ valor: TipoImovel; rotulo: string; cor: string }> = [
  { valor: "residencial", rotulo: "Residencial", cor: "bg-primary" },
  { valor: "comercial", rotulo: "Comercial", cor: "bg-primary-soft" },
  { valor: "terreno", rotulo: "Terreno", cor: "bg-primary-bright" },
  { valor: "rural", rotulo: "Rural", cor: "bg-slate-400" },
];

const rotuloTipo = (t: TipoImovel) =>
  TIPOS.find((x) => x.valor === t)?.rotulo ?? t;
const corTipo = (t: TipoImovel) =>
  TIPOS.find((x) => x.valor === t)?.cor ?? "bg-slate-300";

const VAZIO: Imovel[] = [];

export default function PatrimonioImobiliarioPage() {
  const [imoveis, setImoveis, carregado] = useArmazenado<Imovel[]>(
    "patrimonio-imobiliario",
    VAZIO
  );

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoImovel>("residencial");
  const [valor, setValor] = useState("");
  const [divida, setDivida] = useState("");
  const [aluguel, setAluguel] = useState("");

  const valor$ = parseNumero(valor);
  const valido = nome.trim().length > 0 && valor$ > 0;

  const totalValor = useMemo(
    () => imoveis.reduce((a, i) => a + i.valor, 0),
    [imoveis]
  );
  const totalDivida = useMemo(
    () => imoveis.reduce((a, i) => a + i.divida, 0),
    [imoveis]
  );
  const totalAluguel = useMemo(
    () => imoveis.reduce((a, i) => a + i.aluguel, 0),
    [imoveis]
  );
  const liquido = totalValor - totalDivida;

  const composicao = useMemo(
    () =>
      TIPOS.map((t) => {
        const soma = imoveis
          .filter((i) => i.tipo === t.valor)
          .reduce((a, i) => a + i.valor, 0);
        return {
          ...t,
          soma,
          fatia: totalValor > 0 ? (soma / totalValor) * 100 : 0,
        };
      }).filter((t) => t.soma > 0),
    [imoveis, totalValor]
  );

  const yieldCarteira =
    totalValor > 0 ? ((totalAluguel * 12) / totalValor) * 100 : 0;

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    const novo: Imovel = {
      id: novoId(),
      nome: nome.trim(),
      tipo,
      valor: valor$,
      divida: Math.max(0, parseNumero(divida)),
      aluguel: Math.max(0, parseNumero(aluguel)),
    };
    setImoveis((lista) => [...lista, novo]);
    setNome("");
    setValor("");
    setDivida("");
    setAluguel("");
  };

  const remover = (id: string) =>
    setImoveis((lista) => lista.filter((i) => i.id !== id));

  const vazio = carregado && imoveis.length === 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome="Patrimônio imobiliário" />

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Building2 className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto dos seus imóveis é seu, e quanto ainda é do banco?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Liste os imóveis com valor de mercado, saldo devedor e aluguel
            recebido. A carteira inteira aparece em uma tela, com o retorno de
            cada peça.
          </p>
        </section>

        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Patrimônio imobiliário líquido
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              liquido < 0 ? "text-red-400" : ""
            }`}
          >
            {brl(liquido)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {vazio
              ? "Comece cadastrando o primeiro imóvel abaixo."
              : liquido < 0
                ? "As dívidas superam o valor de mercado. Vale revisar avaliação e contratos."
                : "Valor de mercado menos o saldo devedor dos financiamentos."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-4 gap-4">
          <Kpi
            icone={<Home className="h-5 w-5 mx-auto text-primary" />}
            valor={String(imoveis.length)}
            legenda={imoveis.length === 1 ? "Imóvel na carteira" : "Imóveis na carteira"}
          />
          <Kpi
            icone={<Building2 className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(totalValor)}
            legenda="Valor total de mercado"
          />
          <Kpi
            icone={<MinusCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(totalDivida)}
            legenda="Dívida total"
          />
          <Kpi
            icone={<KeyRound className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(totalAluguel)}
            legenda="Renda mensal de aluguéis"
          />
        </section>

        {composicao.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-700">
                Composição por tipo
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Concentração é risco: uma carteira inteira em um só tipo sente
              qualquer virada de mercado em cheio.
            </p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {composicao.map((c) => (
                <div
                  key={c.valor}
                  className={c.cor}
                  style={{ width: `${c.fatia}%` }}
                />
              ))}
            </div>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {composicao.map((c) => (
                <li
                  key={c.valor}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${c.cor}`} />
                  <span className="flex-1">{c.rotulo}</span>
                  <span className="tabular-nums text-slate-500">
                    {pct(c.fatia, 0)}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    {brlCurto(c.soma)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Adicionar imóvel
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Use o valor que o imóvel venderia hoje, não o que você pagou nele.
          </p>
          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="nome-ou-apelido" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome ou apelido
              </label>
              <input id="nome-ou-apelido"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Apê da praia, sala comercial, lote..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="tipo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo
              </label>
              <select id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoImovel)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <CampoValor
              label="Valor de mercado"
              value={valor}
              onChange={setValor}
            />
            <CampoValor
              label="Saldo devedor do financiamento"
              value={divida}
              onChange={setDivida}
            />
            <div className="sm:col-span-2">
              <CampoValor
                label="Aluguel mensal recebido"
                value={aluguel}
                onChange={setAluguel}
                hint="Deixe zero se o imóvel não está alugado."
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!valido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar imóvel
              </button>
            </div>
          </form>

          {vazio ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Building2 className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum imóvel cadastrado
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Comece pela sua moradia. Mesmo sem aluguel, ela pesa no
                patrimônio e no endividamento.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {imoveis.map((im) => {
                const y = rentabilidadeAluguel({
                  valorImovel: im.valor,
                  aluguelMensal: im.aluguel,
                }).yieldBrutoPct;
                const liq = im.valor - im.divida;
                return (
                  <li
                    key={im.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${corTipo(
                          im.tipo
                        )}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {im.nome}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {rotuloTipo(im.tipo)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">
                          {brl(liq)}
                        </p>
                        <p className="text-[11px] text-slate-500">líquido</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remover(im.id)}
                        aria-label={`Remover imóvel ${im.nome}`}
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Mercado</p>
                        <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                          {brlCurto(im.valor)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Dívida</p>
                        <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                          {brlCurto(im.divida)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Aluguel</p>
                        <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                          {brlCurto(im.aluguel)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">
                          Yield bruto
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                          {im.aluguel > 0 ? pct(y, 2) : "n/d"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            O yield bruto da carteira está em {pct(yieldCarteira, 2)} ao ano.
            Ele ignora IPTU, condomínio, manutenção e meses vagos, então o
            número que chega no seu bolso é sempre menor. Compare com a renda
            fixa antes de decidir se vale manter o imóvel parado.
          </p>

        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Cabecalho({ nome }: { nome: string }) {
  return (
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
          {nome}
        </span>
          <BotaoHome />
        </div>
      </div>
    </header>
  );
}

function CampoValor({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
          R$
        </span>
        <input
          inputMode="numeric"
          value={formatarMoedaInput(value)}
          onChange={(e) => onChange(digitosParaReais(e.target.value))}
          placeholder="0,00"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
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
