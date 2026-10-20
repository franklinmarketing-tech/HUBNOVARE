"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { brl, brlCurto, pct, rentabilidadeAluguel } from "@/lib/calculos";
import {
  AnaliseVazia,
  CascaAnalise,
  CartaoGrafico,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";

/**
 * A ANÁLISE DA CARTEIRA DE IMÓVEIS, como um consultor leria a lista.
 *
 * Usa os totais e o yield bruto que a página já calcula; o yield de cada
 * imóvel sai da mesma `rentabilidadeAluguel` que a lista usa.
 *
 * ⚠️ Não compara com nenhuma taxa de mercado (seria inventar número): o
 * imóvel que "rende pouco" é o que rende menos que os outros da própria
 * carteira, ou o que não rende nada. As faixas de 50%/30% de dívida são
 * referência genérica, e o texto diz isso.
 */

type ImovelAnalise = { nome: string; tipo: string; valor: number; divida: number; aluguel: number };

const REF_DIVIDA_RUIM = 50;
const REF_DIVIDA_ATENCAO = 30;

// Nome curto para caber no eixo do gráfico no celular.
const curto = (s: string, n = 14) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function AnalisePatrimonioImobiliario({
  imoveis,
  totalValor,
  totalDivida,
  totalAluguel,
  liquido,
  yieldCarteira,
  composicao,
}: {
  imoveis: ImovelAnalise[];
  totalValor: number;
  totalDivida: number;
  totalAluguel: number;
  liquido: number;
  yieldCarteira: number;
  composicao: { rotulo: string; soma: number; fatia: number }[];
}) {
  if (imoveis.length === 0 || totalValor <= 0) {
    return (
      <AnaliseVazia texto="Cadastre pelo menos um imóvel com o valor de mercado (e o saldo devedor e o aluguel, se houver) para ver quanto é seu, quanto rende e o que fazer primeiro." />
    );
  }

  const comYield = imoveis.map((im) => ({
    ...im,
    yieldPct: rentabilidadeAluguel({ valorImovel: im.valor, aluguelMensal: im.aluguel }).yieldBrutoPct,
  }));
  const alugados = comYield.filter((i) => i.aluguel > 0).sort((a, b) => b.yieldPct - a.yieldPct);
  const parados = comYield.filter((i) => i.aluguel <= 0);
  const valorParado = parados.reduce((s, i) => s + i.valor, 0);
  const pctParado = (valorParado / totalValor) * 100;
  const alavancagem = (totalDivida / totalValor) * 100;
  const parteSua = Math.max(0, (liquido / totalValor) * 100);
  const maiorTipo = [...composicao].sort((a, b) => b.fatia - a.fatia)[0];
  const maiorDivida = [...imoveis].filter((i) => i.divida > 0).sort((a, b) => b.divida - a.divida)[0];
  const melhor = alugados[0];
  const pior = alugados.length >= 2 ? alugados[alugados.length - 1] : undefined;
  // Só um imóvel e sem aluguel: quase sempre é a moradia, e isso é normal.
  const soMoradia = imoveis.length === 1 && alugados.length === 0;

  /* ── O veredito ────────────────────────────────────────────────────── */
  const veredito =
    liquido < 0
      ? { tom: "ruim" as const, titulo: `As dívidas passam o valor dos imóveis em ${brl(-liquido)}`,
          texto: "Se fosse vender tudo hoje, não daria para quitar os financiamentos. Vale revisar a avaliação dos imóveis e os contratos." }
      : alavancagem >= REF_DIVIDA_RUIM
        ? { tom: "ruim" as const, titulo: "Mais da metade dos imóveis ainda é do banco",
            texto: `O saldo devedor é ${pct(alavancagem, 0)} do valor de mercado. Como referência genérica, acima de ${REF_DIVIDA_RUIM}% uma queda de preço ou um aperto na renda pesa muito.` }
        : !soMoradia && imoveis.length > 1 && pctParado >= 50
          ? { tom: "atencao" as const, titulo: "Boa parte da carteira não gera renda",
              texto: `${pct(pctParado, 0)} do valor está em imóveis sem aluguel. Imóvel parado tem custo (IPTU, condomínio, manutenção) e não devolve nada por mês.` }
          : pior && melhor && pior.yieldPct < melhor.yieldPct / 2
            ? { tom: "atencao" as const, titulo: `${pior.nome} rende bem menos que o resto`,
                texto: `Rende ${pct(pior.yieldPct, 2)} ao ano de aluguel bruto, menos da metade de ${melhor.nome} (${pct(melhor.yieldPct, 2)}). Vale entender por quê.` }
            : alavancagem >= REF_DIVIDA_ATENCAO
              ? { tom: "atencao" as const, titulo: "A dívida ainda pesa na carteira",
                  texto: `O saldo devedor é ${pct(alavancagem, 0)} do valor de mercado. Como referência genérica, até ${REF_DIVIDA_ATENCAO}% é confortável.` }
              : soMoradia
                ? { tom: "bom" as const, titulo: "Seu imóvel é patrimônio, não renda",
                    texto: `${pct(parteSua, 0)} dele já é seu. Por não gerar aluguel, ele protege mas não paga contas: a renda precisa vir de outro lugar.` }
                : { tom: "bom" as const, titulo: "Carteira de imóveis saudável",
                    texto: "Dívida sob controle e os imóveis trabalhando. Agora é acompanhar o aluguel e os custos de cada um." };

  /* ── Recomendações, na ordem ───────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (maiorDivida && (liquido < 0 || alavancagem >= REF_DIVIDA_ATENCAO)) {
    recs.push({ titulo: `Reduzir primeiro o saldo de ${maiorDivida.nome} (${brl(maiorDivida.divida)})`,
      texto: `É o maior financiamento da carteira, ${pct((maiorDivida.divida / totalDivida) * 100, 0)} de toda a dívida. Antecipar parcelas dele é o que mais aumenta a parte que é sua.`,
      href: "/ferramentas/amortizacao", link: "Simular a amortização" });
  }
  if (pior && melhor && pior.yieldPct < melhor.yieldPct / 2) {
    recs.push({ titulo: `Rever o aluguel de ${pior.nome}`,
      texto: `Hoje ${brl(pior.aluguel)} por mês, ${pct(pior.yieldPct, 2)} ao ano sobre o valor. Confira se o contrato foi reajustado e se o valor está em linha com a região.`,
      href: "/ferramentas/reajuste-aluguel", link: "Conferir o reajuste do aluguel" });
  }
  if (!soMoradia && parados.length > 0) {
    recs.push({ titulo: `Decidir o destino de ${brl(valorParado)} parados`,
      texto: `${parados.length === 1 ? `${parados[0].nome} não gera` : `${parados.length} imóveis não geram`} aluguel. Se não for a sua moradia, compare o que ele custa com o que esse valor renderia investido.`,
      href: "/ferramentas/rentabilidade-real", link: "Ver o ganho real de um investimento" });
  }
  if (maiorTipo && imoveis.length > 1 && maiorTipo.fatia >= 80) {
    recs.push({ titulo: `Cuidado com a concentração em ${maiorTipo.rotulo.toLowerCase()}`,
      texto: `${pct(maiorTipo.fatia, 0)} do valor está num tipo só. Se esse mercado esfriar, a carteira inteira sente.`,
      href: "/ferramentas/patrimonio", link: "Ver os imóveis dentro do patrimônio todo" });
  }
  if (recs.length < 2) {
    recs.push({ titulo: "Somar os imóveis ao resto do patrimônio",
      texto: "Imóvel costuma ser a maior parte do que uma família tem. Vê-lo ao lado dos investimentos e das dívidas mostra se o total está equilibrado.",
      href: "/ferramentas/patrimonio", link: "Montar o patrimônio completo" });
  }

  /* ── Gráficos ──────────────────────────────────────────────────────── */
  const partes = [...imoveis]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
    .map((i) => ({
      nome: curto(i.nome),
      Seu: Math.max(0, i.valor - i.divida),
      Banco: Math.min(i.valor, i.divida),
    }));
  const yields = alugados.slice(0, 6).map((i) => ({ nome: curto(i.nome), valor: i.yieldPct }));

  return (
    <CascaAnalise>
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Parte que já é sua" valor={pct(parteSua, 0)}
          nota={`${brlCurto(Math.max(0, liquido))} de ${brlCurto(totalValor)}`} ruim={alavancagem >= REF_DIVIDA_RUIM} />
        <Indicador rotulo="Aluguel bruto ao ano" valor={pct(yieldCarteira, 2)}
          nota="sobre o valor de mercado, antes de IPTU, condomínio e vacância" />
        <Indicador rotulo="Valor sem aluguel" valor={pct(pctParado, 0)}
          nota={`${brlCurto(valorParado)} em imóveis que não geram renda`} ruim={!soMoradia && imoveis.length > 1 && pctParado >= 50} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Quanto de cada imóvel é seu"
          legenda="Azul-escuro é a parte já paga; vermelho é o que ainda deve ao banco.">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partes} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={96} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => brl(Number(v ?? 0))}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="Seu" stackId="a" fill={CORES_ANALISE.navy} />
                <Bar dataKey="Banco" stackId="a" fill={CORES_ANALISE.vermelho} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>

        {yields.length > 0 ? (
          <CartaoGrafico titulo="Quanto cada imóvel rende de aluguel"
            legenda="Aluguel de 12 meses dividido pelo valor do imóvel. Barra maior = rende mais.">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yields} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nome" width={96} tickLine={false} axisLine={false}
                    tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => `${pct(Number(v ?? 0), 2)} ao ano`}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {yields.map((y, i) => (
                      <Cell key={`${y.nome}-${i}`}
                        fill={pior && i === yields.length - 1 && yields.length >= 2 ? CORES_ANALISE.laranja : CORES_ANALISE.verde} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        ) : (
          <CartaoGrafico titulo="Quanto cada imóvel rende de aluguel"
            legenda="Aparece quando algum imóvel tiver aluguel informado.">
            <p className="text-sm text-slate-500">
              Nenhum imóvel da lista gera aluguel hoje. Se algum está alugado, informe o valor para comparar o rendimento.
            </p>
          </CartaoGrafico>
        )}
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={totalAluguel > 0
          ? <>Os aluguéis somam <b className="text-primary">{brl(totalAluguel)}</b> por mês, <b className="text-primary">{brl(totalAluguel * 12)}</b> em 12 meses, antes de IPTU, condomínio, manutenção e meses vagos.</>
          : undefined} />
    </CascaAnalise>
  );
}
