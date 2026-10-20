"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, pct } from "@/lib/calculos";
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
 * A ANÁLISE DO REAJUSTE DE ALUGUEL, como um consultor leria o índice.
 *
 * Usa só os doze meses que a página já buscou no Banco Central para cada
 * índice. A "carta na mão" é sempre a mesma: o índice do contrato contra os
 * outros no MESMO período. Não recomenda índice — mostra a diferença.
 */

/** O pedaço da resposta de `/api/indices` que a análise usa. */
export type JanelaIndice = {
  fator: number;
  variacaoPct: number;
  meses: number;
  pontos: Array<{ data: string; valor: number }>;
};

// Uma cor por índice, fixa, para a linha e a barra falarem a mesma língua.
const COR_INDICE: Record<string, string> = {
  igpm: CORES_ANALISE.laranja,
  ipca: CORES_ANALISE.navy,
  inpc: CORES_ANALISE.azul,
};

export function AnaliseReajusteAluguel({
  aluguel,
  indice,
  indices,
  dados,
  carregando,
  erro,
}: {
  aluguel: number;
  indice: string;
  indices: readonly { chave: string; nome: string }[];
  dados: Record<string, JanelaIndice | undefined>;
  carregando: boolean;
  erro: string | null;
}) {
  const escolhido = dados[indice];
  const nome = indices.find((i) => i.chave === indice)?.nome ?? indice.toUpperCase();

  if (erro) return <AnaliseVazia texto="Sem os índices do Banco Central não há análise. Tente de novo em instantes." />;
  if (carregando) return <AnaliseVazia texto="Buscando os índices no Banco Central…" />;
  if (aluguel <= 0) return <AnaliseVazia texto="Informe o aluguel atual para ver o diagnóstico do reajuste." />;
  if (!escolhido || escolhido.meses < 12) {
    return <AnaliseVazia texto={`O ${nome} ainda não tem os doze meses dessa janela publicados. Escolha um aniversário anterior ou volte depois da divulgação do índice.`} />;
  }

  const novo = aluguel * escolhido.fator;
  const aumentoMes = novo - aluguel;
  const deflacao = escolhido.variacaoPct < 0;

  // Só entram na comparação os índices com a janela completa, como o escolhido.
  const opcoes = indices
    .map((i) => ({ chave: i.chave, nome: i.nome, d: dados[i.chave] }))
    .filter((o): o is { chave: string; nome: string; d: JanelaIndice } => !!o.d && o.d.meses >= 12)
    .map((o) => ({ ...o, novo: aluguel * o.d.fator, anual: (aluguel * o.d.fator - aluguel) * 12 }));
  const maisBarato = opcoes.reduce<(typeof opcoes)[number] | null>((m, o) => (!m || o.novo < m.novo ? o : m), null);
  const economiaAno = maisBarato && maisBarato.chave !== indice ? (novo - maisBarato.novo) * 12 : 0;
  const refIpca = indice !== "ipca" ? opcoes.find((o) => o.chave === "ipca") ?? null : null;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito = deflacao
    ? { tom: "bom" as const, titulo: "O índice ficou negativo: o aluguel não deveria subir",
        texto: `O ${nome} acumulou ${pct(escolhido.variacaoPct, 2)} nos doze meses. Pela conta, o aluguel cairia ${brl(-aumentoMes)}; na prática, a maioria dos contratos só mantém o valor.` }
    : economiaAno > 0.5 && maisBarato
      ? { tom: "atencao" as const, titulo: `O ${nome} reajusta mais que o ${maisBarato.nome} neste ano`,
          texto: `Pelo contrato, o aluguel vai a ${brl(novo)} (${pct(escolhido.variacaoPct, 2)}). No mesmo período, pelo ${maisBarato.nome} seria ${brl(maisBarato.novo)}: ${brl(economiaAno)} a menos no ano. Vale levar esse número para a renovação.` }
      : { tom: "bom" as const, titulo: `Reajuste de ${pct(escolhido.variacaoPct, 2)}: o menor entre os índices`,
          texto: `O aluguel vai a ${brl(novo)}, ${brl(aumentoMes)} a mais por mês. Nenhum dos outros índices daria um valor menor neste período.` };

  /* ── Gráfico 1: quanto cada índice custa a mais em 12 meses ─────────── */
  const barras = opcoes.map((o) => ({ chave: o.chave, nome: o.nome, anual: Number(o.anual.toFixed(2)) }));

  /* ── Gráfico 2: o acumulado de cada índice, mês a mês, na janela ────── */
  const meses = escolhido.pontos.map((p) => p.data);
  const linhas = meses.map((data) => {
    const ponto: Record<string, number | string> = { data };
    for (const o of opcoes) {
      let fator = 1;
      for (const p of o.d.pontos) {
        fator *= 1 + p.valor / 100;
        if (p.data === data) break;
      }
      ponto[o.chave] = Number(((fator - 1) * 100).toFixed(2));
    }
    return ponto;
  });

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (deflacao) {
    recs.push({ titulo: "Proponha manter o aluguel, ou reduzir",
      texto: `O índice do contrato caiu ${pct(-escolhido.variacaoPct, 2)}. Não há base para aumento neste aniversário — e o número está do seu lado se quiser pedir redução.` });
  } else {
    recs.push({ titulo: `Confira a cobrança: o teto pela cláusula é ${brl(novo)}`,
      texto: "Se o valor pedido for maior, peça a memória de cálculo. Pela Lei do Inquilinato, o reajuste vem uma vez por ano e pelo índice escrito no contrato." });
    if (economiaAno > 0.5 && maisBarato) {
      recs.push({ titulo: `Proponha o ${maisBarato.nome} na renovação: ${brl(economiaAno)} a menos no ano`,
        texto: `É a diferença entre ${pct(escolhido.variacaoPct, 2)} (${nome}) e ${pct(maisBarato.d.variacaoPct, 2)} (${maisBarato.nome}) neste período. A troca só vale com acordo das duas partes, e a hora natural é a renovação.` });
    }
    recs.push({ titulo: `Reserve ${brl(aumentoMes)} a mais por mês no orçamento`,
      texto: `São ${brl(aumentoMes * 12)} no ano de contrato. Ajuste o plano do mês antes do primeiro boleto novo chegar.`,
      href: "/ferramentas/orcamento", link: "Ajustar o orçamento" });
  }
  recs.push({ titulo: "Compare com a parcela de um financiamento",
    texto: `Com o aluguel em ${brl(novo)}, vale saber quanto custaria financiar um imóvel parecido — olhando os juros, não só a parcela.`,
    href: "/ferramentas/financiamento", link: "Simular um financiamento" });

  const anualEscolhido = aumentoMes * 12;

  return (
    <CascaAnalise titulo="O que este reajuste diz">
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador rotulo="Aumento por mês" valor={brl(aumentoMes)}
          nota={`${pct(escolhido.variacaoPct, 2)} pelo ${nome}`} ruim={aumentoMes > 0 && economiaAno > 0.5} />
        <Indicador rotulo="Impacto em 12 meses" valor={brl(anualEscolhido)}
          nota="a mais no ano de contrato" />
        {/* Contra a inflação oficial quando o contrato não é IPCA; senão, contra o mais barato. */}
        {refIpca ? (
          <Indicador rotulo="Diferença para o IPCA" valor={brl(Math.abs(novo - refIpca.novo) * 12)}
            nota={novo > refIpca.novo ? "a mais no ano que pela inflação oficial" : "a menos no ano que pelo IPCA"}
            ruim={novo > refIpca.novo} />
        ) : (
          <Indicador rotulo="Até o índice mais barato" valor={brl(economiaAno)}
            nota={economiaAno > 0.5 && maisBarato ? `a menos no ano pelo ${maisBarato.nome}` : "o seu já é o mais baixo"}
            ruim={economiaAno > 0.5} />
        )}
      </GradeIndicadores>

      <GradeGraficos>
        {barras.length > 0 && (
          <CartaoGrafico titulo="Quanto cada índice custa a mais no ano"
            legenda="Cada barra é o aumento somado dos 12 meses de contrato. A barra colorida é a do seu contrato.">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barras} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => `${Math.round(v).toLocaleString("pt-BR")}`} />
                  <Tooltip formatter={(v) => brl(Number(v ?? 0))} cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="anual" name="A mais no ano" radius={[8, 8, 0, 0]}>
                    {barras.map((b) => (
                      <Cell key={b.chave} fill={b.chave === indice ? (COR_INDICE[b.chave] ?? CORES_ANALISE.navy) : CORES_ANALISE.cinza} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        )}

        {linhas.length > 1 && (
          <CartaoGrafico titulo="Como cada índice acumulou na janela"
            legenda="Cada linha soma os meses, com juros sobre juros. A que termina mais alto é a que reajusta mais.">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={linhas} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="data" tickLine={false} axisLine={false} minTickGap={24}
                    tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} />
                  <Tooltip formatter={(v) => pct(Number(v ?? 0), 2)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {opcoes.map((o) => (
                    <Line key={o.chave} type="monotone" dataKey={o.chave} name={o.nome} dot={false}
                      stroke={COR_INDICE[o.chave] ?? CORES_ANALISE.navy}
                      strokeWidth={o.chave === indice ? 3 : 1.5} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        )}
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)} />
    </CascaAnalise>
  );
}
