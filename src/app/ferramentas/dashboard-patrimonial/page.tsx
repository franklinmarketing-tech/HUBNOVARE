"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ChartPie,
  KeyRound,
  Layers,
  MinusCircle,
  Shield,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { brl, brlCurto, pct } from "@/lib/calculos";
import { useArmazenado } from "@/lib/useArmazenado";

/* --------------------------------------------------------------------------
   Esta página NÃO escreve nada. Ela só lê o que as outras ferramentas
   gravaram. Por isso toda leitura é defensiva: a ferramenta de origem pode
   nunca ter sido aberta, e o dado pode estar num formato antigo.
   -------------------------------------------------------------------------- */

interface Ativo {
  id: string;
  nome: string;
  classe: string;
  valor: number;
}

interface Divida {
  id: string;
  nome: string;
  valor: number;
}

interface Patrimonio {
  ativos: Ativo[];
  dividas: Divida[];
}

interface Seguro {
  id: string;
  tipo: string;
  seguradora: string;
  cobertura: number;
  premioMensal: number;
  vencimento: string;
}

interface Imovel {
  id: string;
  nome: string;
  tipo: string;
  valorMercado: number;
  saldoDevedor: number;
  aluguelMensal: number;
}

interface ContaInventario {
  id: string;
  servico: string;
  email: string;
  doisFatores: boolean;
  instrucoes: string;
}

const PATRIMONIO_VAZIO: Patrimonio = { ativos: [], dividas: [] };

const ROTULO_CLASSE: Record<string, string> = {
  imoveis: "Imóveis",
  veiculos: "Veículos",
  "renda-fixa": "Renda fixa",
  "renda-variavel": "Renda variável",
  caixa: "Caixa",
  outros: "Outros",
};

const CORES = [
  "var(--color-primary)",
  "var(--color-primary-soft)",
  "var(--color-primary-bright)",
  "#94a3b8",
  "#64748b",
  "#cbd5e1",
];

/** Soma um campo numérico de uma lista que pode não ser lista. */
function somar<T>(lista: unknown, campo: (item: T) => unknown): number {
  if (!Array.isArray(lista)) return 0;
  return lista.reduce<number>((acc, item) => {
    const bruto = Number(campo(item as T));
    return acc + (Number.isFinite(bruto) ? bruto : 0);
  }, 0);
}

const contar = (lista: unknown): number =>
  Array.isArray(lista) ? lista.length : 0;

/* -------------------------------------------------------------------------- */

export default function DashboardPatrimonialPage() {
  const [patrimonioBruto, , carregadoPatrimonio] = useArmazenado<Patrimonio>(
    "patrimonio",
    PATRIMONIO_VAZIO
  );
  const [segurosBruto, , carregadoSeguros] = useArmazenado<Seguro[]>(
    "seguros",
    []
  );
  const [imoveisBruto, , carregadoImoveis] = useArmazenado<Imovel[]>(
    "patrimonio-imobiliario",
    []
  );
  const [inventarioBruto, , carregadoInventario] = useArmazenado<
    ContaInventario[]
  >("inventario", []);

  const carregado =
    carregadoPatrimonio &&
    carregadoSeguros &&
    carregadoImoveis &&
    carregadoInventario;

  const ativos = Array.isArray(patrimonioBruto?.ativos)
    ? patrimonioBruto.ativos
    : [];
  const dividas = Array.isArray(patrimonioBruto?.dividas)
    ? patrimonioBruto.dividas
    : [];
  const seguros = Array.isArray(segurosBruto) ? segurosBruto : [];
  const imoveis = Array.isArray(imoveisBruto) ? imoveisBruto : [];
  const inventario = Array.isArray(inventarioBruto) ? inventarioBruto : [];

  const totalAtivos = somar<Ativo>(ativos, (a) => a.valor);
  const totalDividas = somar<Divida>(dividas, (d) => d.valor);
  const totalImoveis = somar<Imovel>(imoveis, (i) => i.valorMercado);
  const totalSaldoImoveis = somar<Imovel>(imoveis, (i) => i.saldoDevedor);
  const coberturaTotal = somar<Seguro>(seguros, (s) => s.cobertura);

  const brutoTotal = totalAtivos + totalImoveis;
  const dividaTotal = totalDividas + totalSaldoImoveis;
  const liquido = brutoTotal - dividaTotal;

  // Proteção = quanto da riqueza bruta a apólice cobre se algo acontecer hoje.
  const protecaoPct = brutoTotal > 0 ? (coberturaTotal / brutoTotal) * 100 : 0;

  const composicao = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of ativos) {
      const valor = Number(a?.valor);
      if (!Number.isFinite(valor) || valor <= 0) continue;
      const chave = ROTULO_CLASSE[a?.classe] ?? "Outros";
      mapa.set(chave, (mapa.get(chave) ?? 0) + valor);
    }
    // Imóveis cadastrados na ferramenta imobiliária entram na mesma fatia.
    const imoveisValor = imoveis.reduce((acc, i) => {
      const v = Number(i?.valorMercado);
      return acc + (Number.isFinite(v) && v > 0 ? v : 0);
    }, 0);
    if (imoveisValor > 0) {
      mapa.set("Imóveis", (mapa.get("Imóveis") ?? 0) + imoveisValor);
    }
    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [ativos, imoveis]);

  const semNada =
    carregado &&
    ativos.length === 0 &&
    dividas.length === 0 &&
    seguros.length === 0 &&
    imoveis.length === 0 &&
    inventario.length === 0;

  const comDoisFatores = inventario.filter((c) => c?.doisFatores).length;

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
            Dashboard patrimonial
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Layers className="h-3.5 w-3.5" />
            Tudo o que você já preencheu, num lugar só
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            O retrato completo do seu patrimônio
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Esta tela não pede nada de novo. Ela junta o que você já registrou
            nas outras ferramentas e mostra o resultado somado: o que você tem,
            o que deve, o quanto está protegido e o que ainda falta mapear.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Patrimônio líquido total
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              liquido < 0 ? "text-red-400" : ""
            }`}
          >
            {brl(liquido)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {semNada
              ? "Ainda não há nada registrado. Comece por qualquer um dos cards abaixo."
              : "Bens e investimentos, mais imóveis, menos todas as dívidas."}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <MiniEscuro rotulo="Bens e investimentos" valor={brlCurto(totalAtivos)} />
            <MiniEscuro rotulo="Imóveis a mercado" valor={brlCurto(totalImoveis)} />
            <MiniEscuro rotulo="Dívidas somadas" valor={brlCurto(dividaTotal)} />
          </div>
        </section>

        {/* Composição por classe */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <CabecalhoCard
            icone={<ChartPie className="h-4 w-4 text-primary" />}
            titulo="Composição por classe"
            destino="/ferramentas/patrimonio"
            rotuloDestino="Editar patrimônio"
          />
          {carregado && composicao.length === 0 ? (
            <Vazio
              titulo="Nenhum ativo cadastrado"
              texto="Liste o que você possui para ver como sua riqueza está distribuída. Concentração demais numa classe só é o risco que ninguém enxerga."
              destino="/ferramentas/patrimonio"
              rotulo="Cadastrar patrimônio"
            />
          ) : (
            <div className="mt-5 grid sm:grid-cols-2 gap-5 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicao}
                      dataKey="valor"
                      nameKey="nome"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {composicao.map((fatia, indice) => (
                        <Cell
                          key={fatia.nome}
                          fill={CORES[indice % CORES.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown, nome: unknown) => [
                        brl(Number(v)),
                        String(nome),
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {composicao.map((fatia, indice) => {
                  const fatiaPct =
                    brutoTotal > 0 ? (fatia.valor / brutoTotal) * 100 : 0;
                  return (
                    <li
                      key={fatia.nome}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: CORES[indice % CORES.length],
                        }}
                      />
                      <span className="flex-1 truncate text-slate-600">
                        {fatia.nome}
                      </span>
                      <span className="tabular-nums text-slate-500 text-xs">
                        {pct(fatiaPct, 1)}
                      </span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {brlCurto(fatia.valor)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Cards de leitura */}
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          {/* Proteção */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CabecalhoCard
              icone={<Shield className="h-4 w-4 text-primary" />}
              titulo="Proteção por seguros"
              destino="/ferramentas/seguros"
              rotuloDestino="Ver apólices"
            />
            {carregado && seguros.length === 0 ? (
              <Vazio
                titulo="Nenhuma apólice registrada"
                texto="Sem seguro, o patrimônio construído em vinte anos pode virar dívida num único evento."
                destino="/ferramentas/seguros"
                rotulo="Cadastrar seguros"
              />
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums text-slate-900 mt-4">
                  {pct(Math.min(protecaoPct, 999), 0)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  da riqueza bruta coberta por apólice
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(protecaoPct, 100)}%` }}
                  />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 tabular-nums">
                    Cobertura somada de {brlCurto(coberturaTotal)} em{" "}
                    {seguros.length}{" "}
                    {seguros.length === 1 ? "apólice" : "apólices"}.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Imóveis */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CabecalhoCard
              icone={<Building2 className="h-4 w-4 text-primary" />}
              titulo="Carteira imobiliária"
              destino="/ferramentas/patrimonio-imobiliario"
              rotuloDestino="Ver imóveis"
            />
            {carregado && imoveis.length === 0 ? (
              <Vazio
                titulo="Nenhum imóvel mapeado"
                texto="Imóvel financiado tem dois números: quanto vale e quanto ainda deve. Só a diferença é seu."
                destino="/ferramentas/patrimonio-imobiliario"
                rotulo="Cadastrar imóveis"
              />
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums text-slate-900 mt-4">
                  {brlCurto(totalImoveis - totalSaldoImoveis)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  equity líquida em {imoveis.length}{" "}
                  {imoveis.length === 1 ? "imóvel" : "imóveis"}
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 tabular-nums">
                    {brlCurto(totalImoveis)} de valor de mercado,{" "}
                    {brlCurto(totalSaldoImoveis)} de saldo devedor.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Inventário digital */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CabecalhoCard
              icone={<KeyRound className="h-4 w-4 text-primary" />}
              titulo="Inventário digital"
              destino="/ferramentas/inventario"
              rotuloDestino="Abrir inventário"
            />
            {carregado && inventario.length === 0 ? (
              <Vazio
                titulo="Nenhuma conta mapeada"
                texto="Conta que a família não conhece simplesmente some. Mapear leva minutos e evita perdas."
                destino="/ferramentas/inventario"
                rotulo="Mapear contas"
              />
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums text-slate-900 mt-4">
                  {inventario.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {inventario.length === 1
                    ? "conta mapeada"
                    : "contas mapeadas"}
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 tabular-nums">
                    {comDoisFatores} com verificação em duas etapas ligada.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Dívida total */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CabecalhoCard
              icone={<MinusCircle className="h-4 w-4 text-primary" />}
              titulo="Dívida total"
              destino="/ferramentas/patrimonio"
              rotuloDestino="Editar dívidas"
            />
            {carregado && dividas.length === 0 && totalSaldoImoveis === 0 ? (
              <Vazio
                titulo="Nenhuma dívida registrada"
                texto="Se realmente não há dívidas, seu patrimônio líquido é igual a tudo o que você possui."
                destino="/ferramentas/patrimonio"
                rotulo="Registrar dívidas"
              />
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums text-slate-900 mt-4">
                  {brlCurto(dividaTotal)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {brutoTotal > 0
                    ? `${pct((dividaTotal / brutoTotal) * 100, 1)} do que você possui`
                    : "sobre um patrimônio ainda não informado"}
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 tabular-nums">
                    {brlCurto(totalDividas)} de dívidas avulsas e{" "}
                    {brlCurto(totalSaldoImoveis)} de financiamento imobiliário.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CabecalhoCard({
  icone,
  titulo,
  destino,
  rotuloDestino,
}: {
  icone: ReactNode;
  titulo: string;
  destino: string;
  rotuloDestino: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icone}
      <h2 className="text-sm font-semibold text-slate-700 flex-1">{titulo}</h2>
      <Link
        href={destino}
        className="text-[11px] font-semibold text-primary underline underline-offset-2 shrink-0"
      >
        {rotuloDestino}
      </Link>
    </div>
  );
}

function MiniEscuro({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-[11px] text-white/60">{rotulo}</p>
      <p className="text-sm font-semibold tabular-nums mt-0.5">{valor}</p>
    </div>
  );
}

function Vazio({
  titulo,
  texto,
  destino,
  rotulo,
}: {
  titulo: string;
  texto: string;
  destino: string;
  rotulo: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">{texto}</p>
      <Link
        href={destino}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-3.5 h-9 text-xs font-semibold transition-opacity hover:opacity-90"
      >
        {rotulo}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
