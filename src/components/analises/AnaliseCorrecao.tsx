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
 * A ANÁLISE DA CORREÇÃO, como um consultor leria o índice escolhido.
 *
 * Usa só as séries do Banco Central que a página já buscou (`/api/indices`).
 * As médias por ano são o mesmo fator acumulado "espalhado" no tempo, com
 * juros sobre juros — nenhum índice novo. Poupança e TR são rendimento, não
 * inflação: para elas a leitura é "ganhou ou perdeu do IPCA no período".
 */

/** O pedaço da resposta de `/api/indices` que a análise usa. */
export type SerieIndice = { fator: number; variacaoPct: number; meses: number; de: string | null; ate: string | null };

const INFLACAO = new Set(["ipca", "igpm", "inpc"]);

const tempoTexto = (m: number) => {
  const anos = Math.floor(m / 12);
  const resto = m % 12;
  if (anos <= 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
};

export function AnaliseCorrecao({
  valorOriginal,
  indice,
  indices,
  dados,
  carregando,
  erro,
  periodoInvalido,
}: {
  valorOriginal: number;
  indice: string;
  indices: readonly { chave: string; nome: string }[];
  dados: Record<string, SerieIndice | undefined>;
  carregando: boolean;
  erro: string | null;
  periodoInvalido: boolean;
}) {
  const atual = dados[indice];
  const nome = indices.find((i) => i.chave === indice)?.nome ?? indice.toUpperCase();

  if (periodoInvalido) return <AnaliseVazia texto="Acerte o período (a data inicial vem antes da final) para ver a análise." />;
  if (erro) return <AnaliseVazia texto="Sem os índices do Banco Central não há análise. Tente de novo em instantes." />;
  if (carregando) return <AnaliseVazia texto="Buscando os índices no Banco Central…" />;
  if (valorOriginal <= 0) return <AnaliseVazia texto="Informe o valor a corrigir para ver o que a inflação fez com ele." />;
  if (!atual || atual.meses === 0 || atual.fator <= 0) {
    return <AnaliseVazia texto={`O ${nome} não tem dado publicado nesse período. Escolha outro índice ou outra data para ver a análise.`} />;
  }

  const corrigido = valorOriginal * atual.fator;
  const diferenca = corrigido - valorOriginal;
  const porAno = atual.meses >= 12;
  // Média equivalente: o mesmo acumulado, distribuído com juros sobre juros.
  const media = (Math.pow(atual.fator, (porAno ? 12 : 1) / atual.meses) - 1) * 100;
  const periodo = `${atual.de ?? "o início"} a ${atual.ate ?? "hoje"}`;
  const ehInflacao = INFLACAO.has(indice);

  const ipca = dados.ipca && dados.ipca.meses > 0 && dados.ipca.fator > 0 ? dados.ipca : null;
  const ganhoReal = ipca ? (atual.fator / ipca.fator - 1) * 100 : null;
  const perdaPoder = (1 - 1 / atual.fator) * 100; // quanto o dinheiro parado perdeu

  /* ── O veredito ─────────────────────────────────────────────────────── */
  let veredito: { tom: "bom" | "atencao" | "ruim"; titulo: string; texto: string };
  if (ehInflacao) {
    veredito = atual.variacaoPct <= 0
      ? { tom: "bom", titulo: `No período, os preços não subiram pelo ${nome}`,
          texto: `De ${periodo}, o ${nome} acumulou ${pct(atual.variacaoPct, 2)}. O valor de antes compra o mesmo — ou um pouco mais — hoje.` }
      : { tom: atual.fator >= 2 ? "ruim" : "atencao",
          titulo: `Em ${tempoTexto(atual.meses)}, a inflação comeu ${pct(perdaPoder, 0)} do poder de compra`,
          texto: `${brl(valorOriginal)} de ${atual.de ?? "antes"} equivalem a ${brl(corrigido)} hoje. Quem guardou esse dinheiro sem render nada perdeu, na prática, ${brl(diferenca)} — é quanto falta para comprar a mesma coisa.` };
  } else if (ganhoReal != null) {
    veredito = ganhoReal >= 0
      ? { tom: "bom", titulo: `A ${nome} ganhou da inflação por ${pct(ganhoReal, 1)}`,
          texto: `De ${periodo}, a ${nome} levou ${brl(valorOriginal)} a ${brl(corrigido)}, um pouco acima do IPCA. Houve ganho real, ainda que pequeno.` }
      : { tom: "ruim", titulo: `A ${nome} perdeu para a inflação no período`,
          texto: `O valor foi a ${brl(corrigido)}, mas pelo IPCA seriam precisos ${brl(valorOriginal * ipca!.fator)} para comprar o mesmo. A perda real foi de ${brl(valorOriginal * ipca!.fator - corrigido)}.` };
  } else {
    veredito = { tom: "atencao", titulo: `A ${nome} levou ${brl(valorOriginal)} a ${brl(corrigido)}`,
      texto: "Sem o IPCA do mesmo período não dá para dizer se houve ganho real. Compare com a inflação antes de concluir." };
  }

  /* ── Gráfico 1: os cinco índices no mesmo período ───────────────────── */
  const barras = indices
    .map((i) => ({ chave: i.chave, nome: i.nome, d: dados[i.chave] }))
    .filter((i) => i.d && i.d.meses > 0)
    .map((i) => ({ chave: i.chave, nome: i.nome, variacao: Number(i.d!.variacaoPct.toFixed(2)), valor: valorOriginal * i.d!.fator }));
  // Para a conversa de contrato, só os índices de inflação (poupança não é cláusula).
  const contratuais = barras.filter((b) => INFLACAO.has(b.chave));
  const maior = contratuais.reduce((m, b) => (b.valor > m ? b.valor : m), -Infinity);
  const menor = contratuais.reduce((m, b) => (b.valor < m ? b.valor : m), Infinity);
  const nomeMaior = contratuais.find((b) => b.valor === maior)?.nome;
  const nomeMenor = contratuais.find((b) => b.valor === menor)?.nome;

  /* ── Gráfico 2: do valor de hoje, quanto é o original e quanto é correção ── */
  const fatias = [
    { nome: "Valor original", valor: Math.min(valorOriginal, corrigido), cor: CORES_ANALISE.navy },
    { nome: ehInflacao ? "Reposição da inflação" : "Rendimento", valor: Math.max(0, diferenca), cor: CORES_ANALISE.laranja },
  ].filter((f) => f.valor > 0);

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (ehInflacao && atual.variacaoPct > 0) {
    recs.push({
      titulo: "Dinheiro parado precisa render acima da inflação",
      texto: `Neste período, o ${nome} subiu em média ${pct(media, 2)} por ${porAno ? "ano" : "mês"}. Uma aplicação só protege de verdade se render mais que isso depois do imposto.`,
      href: "/ferramentas/rentabilidade-real",
      link: "Calcular o ganho real de uma aplicação",
    });
    recs.push({
      titulo: `Se era um salário, hoje ele precisaria ser ${brl(corrigido)}`,
      texto: `Para manter o mesmo poder de compra de ${atual.de ?? "antes"}. Se a renda de hoje é menor que isso, ela encolheu em termos reais.`,
      href: "/ferramentas/salario-liquido",
      link: "Ver o salário líquido de hoje",
    });
  }
  if (ehInflacao && atual.variacaoPct <= 0) {
    recs.push({
      titulo: "Olhe também um período mais longo",
      texto: "Meses de queda de preços costumam ser exceção. Num prazo de anos, a inflação quase sempre aparece — é ela que o dinheiro guardado precisa vencer.",
      href: "/ferramentas/rentabilidade-real",
      link: "Calcular o ganho real de uma aplicação",
    });
  }
  if (!ehInflacao) {
    if (ganhoReal != null && ganhoReal < 0) {
      recs.push({
        titulo: "Separe a reserva do dinheiro de longo prazo",
        texto: `A ${nome} perdeu ${pct(-ganhoReal, 1)} para o IPCA no período. Para a reserva de emergência, o que manda é poder sacar rápido; para o resto, vale comparar o ganho real antes de escolher onde deixar.`,
        href: "/ferramentas/reserva",
        link: "Planejar a reserva de emergência",
      });
    }
    recs.push({
      titulo: "Compare o ganho real antes de decidir",
      texto: "Corrigir não é ganhar: só conta o que sobra acima da inflação, depois do imposto.",
      href: "/ferramentas/rentabilidade-real",
      link: "Calcular a rentabilidade real",
    });
  }
  if (contratuais.length > 1 && maior - menor > 0.005) {
    recs.push({
      titulo: `Num contrato, o índice vale ${brl(maior - menor)} aqui`,
      texto: `É a diferença entre o ${nomeMaior} e o ${nomeMenor} no mesmo período, sobre ${brl(valorOriginal)}. Antes de assinar, leia qual índice está na cláusula de correção.`,
      href: "/ferramentas/reajuste-aluguel",
      link: "Conferir o reajuste do aluguel",
    });
  }

  return (
    <CascaAnalise titulo="O que esta correção diz">
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador rotulo="Variação acumulada" valor={pct(atual.variacaoPct, 2)}
          nota={`${atual.meses} ${atual.meses === 1 ? "mês" : "meses"} de ${nome}`} />
        <Indicador rotulo={porAno ? "Média por ano" : "Média por mês"} valor={pct(media, 2)}
          nota="o mesmo acumulado, com juros sobre juros" />
        {ehInflacao || ganhoReal == null ? (
          <Indicador rotulo="Poder de compra perdido" valor={pct(Math.max(0, perdaPoder), 0)}
            nota="por quem guardou sem render" ruim={perdaPoder > 0} />
        ) : (
          <Indicador rotulo="Ganho acima do IPCA" valor={pct(ganhoReal, 1)}
            nota={ganhoReal >= 0 ? "ganho real no período" : "perdeu para a inflação"} ruim={ganhoReal < 0} />
        )}
      </GradeIndicadores>

      <GradeGraficos>
        {barras.length > 1 && (
          <CartaoGrafico titulo="Os índices no mesmo período"
            legenda="Cada barra é quanto o índice acumulou nas mesmas datas. A laranja é a que você escolheu.">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barras} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => `${Math.round(v)}%`} />
                  <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={64}
                    tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip formatter={(v) => pct(Number(v ?? 0), 2)} cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="variacao" name="Acumulado" radius={[0, 6, 6, 0]}>
                    {barras.map((b) => (
                      <Cell key={b.chave} fill={b.chave === indice ? CORES_ANALISE.laranja : CORES_ANALISE.navy} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        )}

        <CartaoGrafico titulo="O valor de hoje, por dentro"
          legenda={ehInflacao
            ? "A fatia laranja não é ganho: é só o que a inflação exige para comprar o mesmo."
            : "A fatia laranja é o que o índice somou ao valor original."}>
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
              <span className="font-display text-xl font-bold tabular-nums text-primary">{brl(corrigido, 0)}</span>
              <span className="text-2xs text-slate-500">valor corrigido</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{brl(f.valor)}</span>
              </li>
            ))}
          </ul>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)} />
    </CascaAnalise>
  );
}
