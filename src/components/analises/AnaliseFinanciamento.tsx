"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, pct, type ResultadoFinanciamento } from "@/lib/calculos";
import {
  AnaliseVazia,
  CartaoGrafico,
  CascaAnalise,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";

/**
 * A ANÁLISE DO FINANCIAMENTO, como um consultor leria a simulação.
 *
 * Tudo vem do PRICE e do SAC que a página já calculou (`parcelaPrice` /
 * `parcelaSac`). Nenhuma taxa nova: as contas daqui são divisões e somas
 * sobre a tabela que já existe. A única referência externa (parcela até 30%
 * da renda) aparece dita como referência de mercado, não como regra.
 */

type Tipo = "casa" | "carro" | "terreno";

const COR = {
  entrada: CORES_ANALISE.cinza,
  principal: CORES_ANALISE.navy,
  juros: CORES_ANALISE.laranja,
};

const k = (v: number) =>
  v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`;

export function AnaliseFinanciamento({
  tipo,
  valorBem,
  entrada,
  price,
  sac,
}: {
  tipo: Tipo;
  valorBem: number;
  entrada: number;
  price: ResultadoFinanciamento;
  sac: ResultadoFinanciamento;
}) {
  if (price.principal <= 0 || price.tabela.length === 0) {
    return (
      <AnaliseVazia texto="Informe o valor do bem, uma entrada menor que ele, os juros e o prazo para ver o diagnóstico do financiamento." />
    );
  }

  const ent = Math.min(Math.max(0, entrada), valorBem);
  const parcelasPrice = price.principal + price.totalJuros; // tudo o que sai em parcelas
  const jurosSobrePrincipal = (price.totalJuros / price.principal) * 100;
  const parteJuro = (price.totalJuros / parcelasPrice) * 100;
  const porReal = parcelasPrice / price.principal; // quanto volta ao banco por R$ 1 emprestado
  const economiaSac = Math.max(0, price.totalJuros - sac.totalJuros);
  const degrauSac = sac.primeiraParcela - price.parcela;
  const jurosPrimeiroMes = price.tabela[0].parcela > 0 ? (price.tabela[0].juros / price.tabela[0].parcela) * 100 : 0;

  /* ── O veredito ────────────────────────────────────────────────────────
     O corte é sobre o próprio número da simulação: juros acima do valor
     emprestado quer dizer pagar o bem "duas vezes"; acima de 40% já pesa. */
  const veredito =
    jurosSobrePrincipal >= 100
      ? { tom: "ruim" as const,
          titulo: "Os juros passam do valor emprestado",
          texto: `No PRICE, você pega ${brl(price.principal)} e devolve ${brl(parcelasPrice)}: ${brl(price.totalJuros)} são só juros. Para cada R$ 1 emprestado, voltam ${brl(porReal)} ao banco. Antes de assinar, veja abaixo o que encurta essa conta.` }
      : jurosSobrePrincipal >= 40
        ? { tom: "atencao" as const,
            titulo: `Os juros custam ${pct(jurosSobrePrincipal, 0)} do valor financiado`,
            texto: `São ${brl(price.totalJuros)} de juros sobre ${brl(price.principal)} emprestados. É um custo alto, mas dá para reduzir — as recomendações abaixo estão em ordem de impacto.` }
        : { tom: "bom" as const,
            titulo: "Custo de juros sob controle",
            texto: `Os juros somam ${pct(jurosSobrePrincipal, 0)} do valor financiado (${brl(price.totalJuros)}). A maior parte do que você paga é o próprio bem.${price.totalJuros > 0 ? " Ainda assim, há como economizar." : ""}` };

  /* ── Gráfico 1: para onde vai o dinheiro, no PRICE ──────────────────── */
  const fatias = [
    { nome: "Entrada", valor: ent, cor: COR.entrada },
    { nome: "Valor financiado", valor: price.principal, cor: COR.principal },
    { nome: "Juros", valor: price.totalJuros, cor: COR.juros },
  ].filter((f) => f.valor > 0);
  const totalFatias = fatias.reduce((s, f) => s + f.valor, 0) || 1;

  /* ── Gráfico 2: juro × amortização, ano a ano (ou mês a mês se curto) ─ */
  const porAno = price.tabela.length > 24;
  const barras: { rotulo: string; juros: number; amortizacao: number }[] = [];
  price.tabela.forEach((l) => {
    const idx = porAno ? Math.floor((l.mes - 1) / 12) : l.mes - 1;
    if (!barras[idx]) barras[idx] = { rotulo: porAno ? `${idx + 1}º` : `${l.mes}`, juros: 0, amortizacao: 0 };
    barras[idx].juros += l.juros;
    barras[idx].amortizacao += l.amortizacao;
  });
  const primeiro = barras[0];
  const juroPrimeiroPeriodo = primeiro ? (primeiro.juros / (primeiro.juros + primeiro.amortizacao)) * 100 : 0;

  /* ── Recomendações, na ordem em que um consultor atacaria ──────────── */
  const recs: Recomendacao[] = [];

  // 1. Antes de tudo, a parcela precisa caber. 30% é referência de mercado.
  const maiorParcela = Math.max(price.parcela, sac.primeiraParcela);
  recs.push({
    titulo: "Confirme que a parcela cabe no mês",
    texto: `Uma referência de mercado comum é deixar as parcelas em até 30% da renda — não é regra, mas é um teto prudente. Para ${brl(maiorParcela)}, isso pede renda a partir de ${brl(maiorParcela / 0.3)} por mês.`,
    href: "/ferramentas/orcamento",
    link: "Encaixar a parcela no orçamento",
  });

  // 2. SAC: mesma taxa, mesmo prazo, menos juros.
  if (economiaSac > 0) {
    recs.push({
      titulo: `Pergunte pelo SAC: ${brl(economiaSac)} a menos de juros`,
      texto: `Em troca, a primeira parcela sobe para ${brl(sac.primeiraParcela)}${degrauSac > 0 ? ` (${brl(degrauSac)} a mais que no PRICE)` : ""} e vai caindo até ${brl(sac.ultimaParcela)}. Se o começo couber no mês, é o caminho mais barato.`,
    });
  }

  // 3. Entrada maior: no PRICE o juro é proporcional ao valor financiado,
  //    então cada real a menos emprestado corta juros na mesma proporção.
  const passo = Math.max(1000, Math.round((valorBem * 0.1) / 1000) * 1000);
  if (price.principal > passo && price.totalJuros > 0) {
    const corte = passo * (price.totalJuros / price.principal);
    recs.push({
      titulo: `Cada ${brl(passo, 0)} a mais de entrada corta ${brl(corte, 0)} de juros`,
      texto: `A entrada hoje é ${pct(valorBem > 0 ? (ent / valorBem) * 100 : 0, 0)} do valor do bem. Juntar um pouco mais antes de assinar é a forma mais direta de pagar menos juros.`,
      href: "/ferramentas/juros-compostos",
      link: "Ver quanto o que você guarda vira com o tempo",
    });
  }

  // 4. Depois de assinado, todo dinheiro extra que abate o saldo corta juros.
  if (price.totalJuros > 0) recs.push({
    titulo: "Planeje amortizações extras ao longo do contrato",
    texto: `O juro é cobrado sobre o saldo: no primeiro mês, ${pct(jurosPrimeiroMes, 0)} da parcela é só juro. Todo extra que abate a dívida (13º, bônus${tipo === "casa" ? ", FGTS" : ""}) apaga juros futuros.`,
    href: "/ferramentas/amortizacao",
    link: "Simular um abatimento extra",
  });

  return (
    <CascaAnalise titulo="O que este financiamento diz">
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador rotulo="Do que você paga, é juro" valor={pct(parteJuro, 0)}
          nota={`${brl(price.totalJuros, 0)} de ${brl(parcelasPrice, 0)} em parcelas`} ruim={parteJuro >= 50} />
        <Indicador rotulo="Parcela no PRICE" valor={brl(price.parcela)}
          nota={`No SAC: de ${brl(sac.primeiraParcela, 0)} caindo até ${brl(sac.ultimaParcela, 0)}`} />
        <Indicador rotulo="Custo total do bem" valor={brl(price.totalPago, 0)}
          nota={`À vista seriam ${brl(valorBem, 0)}`} ruim={jurosSobrePrincipal >= 100} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Para onde vai o seu dinheiro" legenda="A rosca é tudo o que você paga no PRICE. A fatia laranja é o que fica com o banco.">
          <div className="relative mx-auto h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%"
                  paddingAngle={2} stroke="none" isAnimationActive>
                  {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold tabular-nums text-primary">
                {pct((price.totalJuros / totalFatias) * 100, 0)}
              </span>
              <span className="text-2xs text-slate-500">do total é juro</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{brl(f.valor, 0)}</span>
              </li>
            ))}
          </ul>
        </CartaoGrafico>

        <CartaoGrafico
          titulo={`O que cada ${porAno ? "ano" : "mês"} de parcelas paga`}
          legenda={`Laranja é juro, azul é o que abate a dívida. No ${porAno ? "1º ano" : "1º mês"}, ${pct(juroPrimeiroPeriodo, 0)} é juro — e isso só cai com o tempo.`}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barras} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} minTickGap={8}
                  tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={k}
                  tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip formatter={(v) => brl(Number(v ?? 0))}
                  labelFormatter={(r) => (porAno ? `${r} ano` : `Mês ${r}`)}
                  cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="juros" name="Juros" stackId="p" fill={COR.juros} />
                <Bar dataKey="amortizacao" name="Abate a dívida" stackId="p" fill={COR.principal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs}
        rodape={economiaSac > 0
          ? <>Só trocando para o SAC, a conta de juros cai de <b className="text-primary">{brl(price.totalJuros, 0)}</b> para <b className="text-primary">{brl(sac.totalJuros, 0)}</b>, com a mesma taxa e o mesmo prazo.</>
          : undefined} />
    </CascaAnalise>
  );
}
