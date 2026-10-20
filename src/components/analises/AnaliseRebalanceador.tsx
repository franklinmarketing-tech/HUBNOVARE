"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { brl, pct } from "@/lib/calculos";
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
 * A ANÁLISE DO REBALANCEAMENTO, como um consultor leria a carteira.
 *
 * Recebe as linhas que a página já calcula (peso, desvio, ajuste, compra
 * com aporte). A única conta nova é o aporte que traria tudo ao alvo SEM
 * vender nada — derivada só dos valores e alvos digitados.
 *
 * ⚠️ A faixa de 5 pontos é a mesma que a página já pinta de vermelho na
 * tabela. Não recomenda ativo: fala só das classes que a pessoa criou.
 */

type Linha = { id: string; nome: string; valor: number; alvo: number; peso: number; desvio: number; ajuste: number; compraComAporte: number };

const FAIXA = 5; // pontos percentuais, igual à tabela da página

const curto = (s: string, n = 14) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const pontos = (v: number) => `${Math.abs(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${Math.abs(v) >= 1 && Math.abs(v) < 2 ? "ponto" : "pontos"}`;
const lista = (nomes: string[]) =>
  nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

export function AnaliseRebalanceador({
  linhas,
  total,
  somaAlvos,
  alvosOk,
  maiorDesvio,
  totalAVender,
  aporte,
}: {
  linhas: Linha[];
  total: number;
  somaAlvos: number;
  alvosOk: boolean;
  maiorDesvio: number;
  totalAVender: number;
  aporte: number;
}) {
  if (linhas.length === 0 || total <= 0) {
    return <AnaliseVazia texto="Preencha o valor atual e o alvo de pelo menos uma classe para ver o diagnóstico: o quanto a carteira se afastou do plano e o jeito mais barato de voltar." />;
  }

  const pior = [...linhas].sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio))[0];
  const fora = linhas.filter((l) => Math.abs(l.desvio) >= FAIXA);
  const abaixo = linhas.filter((l) => l.ajuste > 0.005).sort((a, b) => b.ajuste - a.ajuste);
  const acima = linhas.filter((l) => l.ajuste < -0.005).sort((a, b) => a.ajuste - b.ajuste);
  // Classe com valor e alvo zero só sai vendendo: comprar nunca a dilui a zero.
  const semAlvo = linhas.filter((l) => l.alvo <= 0 && l.valor > 0);

  /* Aporte que leva tudo ao alvo só comprando: o total precisa crescer até a
     classe mais acima do alvo voltar ao peso dela (valor ÷ alvo). */
  const totalNecessario = linhas.filter((l) => l.alvo > 0).reduce((m, l) => Math.max(m, (l.valor * 100) / l.alvo), total);
  const aporteNecessario = alvosOk && semAlvo.length === 0 ? Math.max(0, totalNecessario - total) : null;

  /* ── O veredito ────────────────────────────────────────────────────── */
  const veredito = !alvosOk
    ? { tom: "ruim" as const, titulo: `Os alvos somam ${pct(somaAlvos, 1)}, não 100%`,
        texto: "Com o plano incompleto, qualquer conta de compra e venda sai torta. Acerte os alvos antes de mexer na carteira." }
    : maiorDesvio >= FAIXA * 2
      ? { tom: "ruim" as const, titulo: "A carteira está bem longe do plano",
          texto: `${pior.nome} está ${pontos(pior.desvio)} ${pior.desvio > 0 ? "acima" : "abaixo"} do alvo — o dobro da faixa de ${FAIXA} pontos que esta ferramenta destaca. O risco da carteira já não é o que você escolheu.` }
      : maiorDesvio >= FAIXA
        ? { tom: "atencao" as const, titulo: "A carteira começou a sair do plano",
            texto: `${fora.length === 1 ? `${pior.nome} passou` : `${fora.length} classes passaram`} da faixa de ${FAIXA} pontos em relação ao alvo. Dá para corrigir com calma, de preferência só com aportes.` }
        : { tom: "bom" as const, titulo: "Carteira dentro do plano",
            texto: `Nenhuma classe está a ${FAIXA} pontos ou mais do alvo. Não há o que vender: os próximos aportes mantêm o equilíbrio.` };

  /* ── Recomendações, na ordem ───────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (!alvosOk) {
    const dif = 100 - somaAlvos;
    recs.push({ titulo: `Acertar os alvos: ${dif > 0 ? "faltam" : "sobram"} ${pontos(dif)}`,
      texto: `Some ou tire ${pontos(dif)} de alguma classe na lista acima até a soma dar exatamente 100%.` });
  }
  if (aporte > 0) {
    const compras = linhas.filter((l) => l.compraComAporte > 0.005).sort((a, b) => b.compraComAporte - a.compraComAporte).slice(0, 3);
    if (compras.length) {
      recs.push({ titulo: `Aplicar o aporte de ${brl(aporte)} nas classes abaixo do alvo`,
        texto: `${compras.map((c) => `${c.nome}: ${brl(c.compraComAporte)}`).join("; ")}. Assim a carteira se aproxima do plano sem vender nada.` });
    }
  } else if (alvosOk && fora.length > 0 && aporteNecessario !== null && abaixo.length > 0) {
    recs.push({ titulo: `Corrigir só com aportes: ${brl(aporteNecessario)} no total`,
      texto: `É quanto precisaria entrar para tudo voltar ao alvo sem vender. Direcione os próximos aportes para ${lista(abaixo.slice(0, 2).map((l) => l.nome))}, que estão abaixo do plano.`,
      href: "/ferramentas/orcamento", link: "Ver quanto sobra por mês para aportar" });
  }
  if (alvosOk && fora.length > 0 && totalAVender > 0 && acima.length > 0) {
    recs.push({ titulo: `Se preferir vender: ${brl(totalAVender)} no total`,
      texto: `Sairia principalmente de ${lista(acima.slice(0, 2).map((l) => l.nome))}. Vender realiza lucro e pode gerar imposto — faça essa conta antes de decidir.` });
  }
  if (semAlvo.length > 0) {
    recs.push({ titulo: `Definir o que fazer com ${lista(semAlvo.map((l) => l.nome))}`,
      texto: "Tem dinheiro mas alvo zero: só aportando nas outras classes ela nunca chega ao alvo. Ou dê a ela um alvo, ou planeje a saída." });
  }
  recs.push({ titulo: "Revisar a carteira em datas fixas",
    texto: `Escolha uma ou duas datas no ano para conferir, ou revise sempre que uma classe sair ${FAIXA} pontos do alvo. Mexer toda semana só gera custo.`,
    href: "/ferramentas/patrimonio", link: "Ver a carteira dentro do patrimônio total" });

  /* ── Gráficos (no máximo 7 classes, as mais desviadas) ─────────────── */
  const visiveis = [...linhas].sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio)).slice(0, 7);
  const comparacao = visiveis.map((l) => ({ nome: curto(l.nome), Atual: l.peso, Alvo: l.alvo }));
  const ajustes = visiveis.map((l) => ({ nome: curto(l.nome), valor: l.ajuste }));

  return (
    <CascaAnalise>
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Maior desvio" valor={pontos(maiorDesvio)}
          nota={`em ${pior.nome} · faixa de ${FAIXA} pontos`} ruim={maiorDesvio >= FAIXA} />
        <Indicador rotulo="Classes fora da faixa" valor={`${fora.length} de ${linhas.length}`}
          nota={`a ${FAIXA} pontos ou mais do alvo`} ruim={fora.length > 0} />
        <Indicador rotulo="Aporte para ajustar sem vender" valor={aporteNecessario === null ? "—" : brl(aporteNecessario, 0)}
          nota={aporteNecessario === null
            ? (alvosOk ? "há classe com alvo zero: só sai vendendo" : "acerte os alvos para calcular")
            : aporteNecessario <= 0 ? "a carteira já está no alvo" : "levaria todas as classes ao alvo"} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Como está × o plano"
          legenda="Azul-escuro é o peso de hoje; cinza é o alvo. Quanto mais diferentes, mais longe do plano.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparacao} layout="vertical" barGap={2} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={92} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => pct(Number(v ?? 0), 1)}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="Atual" fill={CORES_ANALISE.navy} radius={[0, 6, 6, 0]} />
                <Bar dataKey="Alvo" fill={CORES_ANALISE.cinza} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>

        <CartaoGrafico titulo="Quanto comprar ou vender para voltar ao alvo"
          legenda="Verde, para a direita, é compra; vermelho, para a esquerda, é venda.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ajustes} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={92} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }} />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => brl(Number(v ?? 0))}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="valor" radius={4}>
                  {ajustes.map((a, i) => (
                    <Cell key={`${a.nome}-${i}`} fill={a.valor >= 0 ? CORES_ANALISE.verde : CORES_ANALISE.vermelho} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={aporteNecessario !== null && aporteNecessario > 0
          ? <>Para voltar ao alvo há dois caminhos: aportar <b className="text-primary">{brl(aporteNecessario)}</b> sem vender nada, ou vender <b className="text-primary">{brl(totalAVender)}</b> e recomprar o que falta.</>
          : undefined} />
    </CascaAnalise>
  );
}
