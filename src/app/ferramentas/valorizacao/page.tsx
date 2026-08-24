"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Building2,
  Coins,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* --------------------------------------------------------------------------
   Valorização de imóveis.

   A conta que quase ninguém faz: o imóvel subiu, mas subiu MAIS do que a
   inflação? A valorização real sai por Fisher, não por subtração:
       real = (1 + nominal) / (1 + inflação) - 1
   Subtrair taxas superestima o ganho, e em prazo longo o erro é grande.
   -------------------------------------------------------------------------- */

export default function ValorizacaoPage() {
  const anoAtual = new Date().getFullYear();

  const [valorPago, setValorPago] = useState("300000");
  const [anoCompra, setAnoCompra] = useState(String(anoAtual - 8));
  const [valorHoje, setValorHoje] = useState("450000");
  const [ipca, setIpca] = useState("5");
  const [custoAnual, setCustoAnual] = useState("6000");

  const pago = parseNumero(valorPago);
  const hoje = parseNumero(valorHoje);
  const ano = Math.round(parseNumero(anoCompra));
  const anos = Math.max(0, Math.min(anoAtual - ano, 80));
  const ipcaAA = parseNumero(ipca) / 100;
  const custoAno = parseNumero(custoAnual);

  const valido = pago > 0 && hoje > 0 && anos > 0;

  const nominalTotalPct = pago > 0 ? (hoje / pago - 1) * 100 : 0;
  const nominalAA = valido ? Math.pow(hoje / pago, 1 / anos) - 1 : 0;
  const realAA = (1 + nominalAA) / (1 + ipcaAA) - 1;

  const custosTotais = custoAno * anos;
  const ganhoNominal = hoje - pago;
  const ganhoAposCustos = ganhoNominal - custosTotais;
  const liquidoHoje = hoje - custosTotais;

  const aaAposCustos =
    valido && liquidoHoje > 0 ? Math.pow(liquidoHoje / pago, 1 / anos) - 1 : -1;
  const realAposCustos =
    liquidoHoje > 0 ? (1 + aaAposCustos) / (1 + ipcaAA) - 1 : -1;

  const ipcaAcumPct = anos > 0 ? (Math.pow(1 + ipcaAA, anos) - 1) * 100 : 0;
  const valorCorrigido = pago * Math.pow(1 + ipcaAA, anos);
  const perdeuParaInflacao = valido && realAA < 0;

  const serie = useMemo(() => {
    if (!valido) return [];
    const razao = Math.pow(hoje / pago, 1 / anos);
    const pontos: { ano: number; imovel: number; ipca: number }[] = [];
    for (let k = 0; k <= anos; k++) {
      pontos.push({
        ano: ano + k,
        imovel: pago * Math.pow(razao, k),
        ipca: pago * Math.pow(1 + ipcaAA, k),
      });
    }
    return pontos;
  }, [valido, pago, hoje, anos, ano, ipcaAA]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome="Valorização de imóveis" />

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Building2 className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Seu imóvel valorizou ou só acompanhou a inflação?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O preço subiu, isso todo mundo vê. Aqui você descobre quanto sobrou
            depois de descontar a inflação do período e o custo de manter o
            imóvel de pé.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Valor pago no imóvel"
              prefixo="R$"
              value={valorPago}
              onChange={setValorPago}
            />
            <Campo
              label="Ano da compra"
              value={anoCompra}
              onChange={setAnoCompra}
              hint={
                anos > 0
                  ? `${anos} ${anos === 1 ? "ano" : "anos"} de posse.`
                  : "Informe um ano anterior ao atual."
              }
            />
            <Campo
              label="Valor estimado hoje"
              prefixo="R$"
              value={valorHoje}
              onChange={setValorHoje}
              hint="Use o preço que um comprador pagaria à vista, não o anúncio."
            />
            <Campo
              label="Inflação do período"
              sufixo="% ao ano"
              value={ipca}
              onChange={setIpca}
              hint={`IPCA histórico gira perto de 5% ao ano. No período isso acumula ${pct(
                ipcaAcumPct,
                1
              )}.`}
            />
            <div className="sm:col-span-2">
              <Campo
                label="Custos anuais (IPTU, condomínio e manutenção)"
                prefixo="R$"
                value={custoAnual}
                onChange={setCustoAnual}
                hint="Some tudo o que o imóvel consome por ano, mesmo parado."
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Valorização real ao ano
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              perdeuParaInflacao ? "text-red-400" : ""
            }`}
          >
            {valido ? pct(realAA * 100, 2) : "0,00%"}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {!valido
              ? "Preencha valor pago, valor de hoje e um ano de compra no passado."
              : perdeuParaInflacao
                ? "Abaixo da inflação. O imóvel subiu de preço e mesmo assim perdeu poder de compra."
                : `Acima da inflação, já descontado o IPCA de ${pct(ipcaAA * 100, 1)} ao ano.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Coins className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(ganhoNominal)}
            legenda="Ganho nominal no período"
          />
          <Kpi
            icone={<TrendingUp className="h-5 w-5 mx-auto text-primary" />}
            valor={valido ? pct(nominalAA * 100, 2) : "0,00%"}
            legenda="Valorização nominal ao ano"
          />
          <Kpi
            icone={<Receipt className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(custosTotais)}
            legenda="Custos totais no período"
          />
        </section>

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              O preço, sem filtro
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              A conta que o vendedor faz: quanto o número do anúncio cresceu.
            </p>
            <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
              {pct(nominalTotalPct, 1)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              valorização nominal acumulada
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Valor de hoje</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(hoje)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Só corrigindo pelo IPCA
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(valorCorrigido)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Depois dos custos de carregar
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              IPTU, condomínio e manutenção saíram do seu bolso todo ano.
            </p>
            <p
              className={`text-2xl font-bold mt-4 tabular-nums ${
                ganhoAposCustos < 0 ? "text-destructive" : "text-slate-900"
              }`}
            >
              {brlCurto(ganhoAposCustos)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ganho líquido no período
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Nominal ao ano</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {valido && liquidoHoje > 0 ? pct(aaAposCustos * 100, 2) : "n/d"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Real ao ano</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {valido && liquidoHoje > 0
                    ? pct(realAposCustos * 100, 2)
                    : "n/d"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {serie.length > 1 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Seu imóvel contra a inflação
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              A linha cinza é o que o preço precisaria ser só para empatar com o
              IPCA. Ficar abaixo dela é perda real.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={serie}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis
                  dataKey="ano"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={62}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                      : `${v}`
                  }
                />
                <Tooltip
                  formatter={(v: unknown, nome: unknown) => [
                    brl(Number(v)),
                    String(nome),
                  ]}
                  labelFormatter={(v: unknown) => `Ano ${v}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="imovel"
                  name="Preço do imóvel"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ipca"
                  name="Corrigido pelo IPCA"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Imóvel que valoriza abaixo do IPCA perde poder de compra, mesmo
            tendo subido de preço. O número maior no anúncio compra menos coisa
            do que o número menor comprava na época.
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

function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  hint?: string;
}) {
  const idCampo = useId();
  const ehMoeda = prefixo === "R$";

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
          id={idCampo}
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={ehMoeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-24" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {sufixo}
          </span>
        )}
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
