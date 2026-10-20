"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { brl, pct } from "@/lib/calculos";
import type { MotivoRescisao, Rescisao } from "@/lib/trabalhista";
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
import { Rosca } from "./pecasTrabalhistas";

/**
 * A análise da rescisão, como um consultor leria o termo.
 *
 * A pergunta que importa: quanto disso é dinheiro NOVO (as verbas da saída)
 * e quanto é o FGTS que já era seu e só ficou livre para sacar. E quanto
 * tempo isso segura, medido em salários — a página não tem as despesas,
 * então a régua é o último salário, e a análise diz isso.
 *
 * ⚠️ Tudo sai de `rescisao()`, que a página já calculou. Nada de regra nova.
 */
export function AnaliseRescisao({ r, motivo, salario, totalNaMao }: {
  r: Rescisao;
  motivo: MotivoRescisao;
  salario: number;
  totalNaMao: number;
}) {
  if (salario <= 0) {
    return <AnaliseVazia texto="Informe o último salário e o tempo de empresa para ver o que é dinheiro novo, o que é FGTS e quanto tempo o valor segura." />;
  }

  const dinheiroNovo = r.totalLiquido; // verbas da rescisão, já com INSS e IR descontados
  const fgtsLivre = r.saqueFgts; // o saldo que já era seu
  const emSalarios = totalNaMao / salario;
  const descontos = r.inss + r.irrf;
  const mesesTxt = emSalarios.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito =
    totalNaMao <= 0
      ? { tom: "ruim" as const, titulo: "Com esses dados, não há nada a receber",
          texto: "Confira os dias trabalhados no mês da saída e as férias. Se algo parecer errado, confira com o RH/sindicato antes de assinar." }
      : emSalarios < 1
        ? { tom: "ruim" as const, titulo: `O total não chega a um salário seu`,
            texto: `São ${brl(totalNaMao)}, menos que o seu último salário de ${brl(salario)}. ${r.temSeguroDesemprego ? "O seguro-desemprego ajuda a fechar a conta" : "E não há seguro-desemprego neste caso"}: cada real precisa de destino antes de sair da conta.` }
        : !r.temSeguroDesemprego
          ? { tom: "atencao" as const, titulo: `${brl(totalNaMao)} precisam durar até o próximo salário`,
              texto: `O valor equivale a ${mesesTxt} salários seus, e neste tipo de saída não há seguro-desemprego. É todo o dinheiro do período sem renda.` }
          : { tom: "bom" as const, titulo: `Você sai com ${mesesTxt} salários na mão`,
              texto: fgtsLivre > 0
                ? `${brl(dinheiroNovo)} são dinheiro novo da rescisão; ${brl(fgtsLivre)} são o FGTS que já era seu e agora fica livre. Ainda há o seguro-desemprego.`
                : `São ${brl(dinheiroNovo)} da rescisão, e ainda há o seguro-desemprego. Informe o saldo do FGTS para somar o saque.` };

  /* ── Rosca: dinheiro novo × FGTS liberado ───────────────────────────── */
  const fatias = [
    { nome: "Verbas da rescisão (líquido)", valor: Math.max(0, dinheiroNovo - r.multaFgts), cor: CORES_ANALISE.navy },
    { nome: "Multa do FGTS", valor: r.multaFgts, cor: CORES_ANALISE.laranja },
    { nome: "Saque do saldo do FGTS", valor: fgtsLivre, cor: CORES_ANALISE.verde },
  ];

  /* ── Barras: cada verba bruta, da maior para a menor ────────────────── */
  const verbas = [
    { nome: "Saldo de salário", valor: r.saldoSalario },
    { nome: "Aviso prévio", valor: r.avisoPrevio },
    { nome: "13º proporcional", valor: r.decimoProporcional },
    { nome: "Férias vencidas", valor: r.feriasVencidas },
    { nome: "Férias prop. + 1/3", valor: r.feriasProporcionais + r.tercoFerias },
    { nome: "Multa do FGTS", valor: r.multaFgts },
  ].filter((v) => v.valor > 0).sort((a, b) => b.valor - a.valor);
  const corVerba = (nome: string) => (nome === "Multa do FGTS" ? CORES_ANALISE.laranja : CORES_ANALISE.navy);

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [
    { titulo: "Conferir o termo verba por verba antes de assinar",
      texto: `Compare cada linha com a tabela acima${verbas[0] ? ` — a maior aqui é ${verbas[0].nome.toLowerCase()}, de ${brl(verbas[0].valor)}` : ""}. Se faltar algo ou vier diferente, confira com o RH/sindicato.` },
  ];
  if (r.temSeguroDesemprego) {
    recs.push({ titulo: "Pedir o seguro-desemprego logo",
      texto: "O prazo para pedir é curto. Veja quanto vem por parcela e por quantos meses, para saber quanto da rescisão precisa cobrir.",
      href: "/ferramentas/seguro-desemprego", link: "Calcular o seguro-desemprego" });
  }
  if (totalNaMao > 0) {
    recs.push({ titulo: `Separar os ${brl(totalNaMao)} como reserva antes de gastar`,
      texto: `Deixe o valor parado e de fácil acesso até ter renda de novo. No ritmo do seu último salário, ele equivale a ${mesesTxt} meses.`,
      href: "/ferramentas/reserva", link: "Ver quantos meses de contas isso cobre" });
    recs.push({ titulo: "Refazer o orçamento para o período sem salário",
      texto: "Corte primeiro o que não é essencial. Cada mês a menos de gasto é um mês a mais que esse dinheiro segura.",
      href: "/ferramentas/orcamento", link: "Montar o orçamento" });
  }

  return (
    <CascaAnalise titulo="O que a sua rescisão diz">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Equivale a" valor={`${mesesTxt} salários`} nota="total ÷ último salário" ruim={emSalarios < 1} />
        <Indicador rotulo="Parte que é FGTS" valor={pct(totalNaMao > 0 ? (fgtsLivre / totalNaMao) * 100 : 0, 0)}
          nota={fgtsLivre > 0 ? "saldo que já era seu, agora livre" : motivo === "sem-justa-causa" ? "informe o saldo do FGTS" : "sem saque neste tipo de saída"} />
        <Indicador rotulo="Descontos" valor={brl(descontos)}
          nota={r.totalBruto > 0 ? `${pct((descontos / r.totalBruto) * 100, 1)} do bruto · só saldo e 13º pagam` : "só saldo e 13º pagam"} />
      </GradeIndicadores>

      {totalNaMao > 0 && (
        <GradeGraficos>
          <CartaoGrafico titulo="De onde vem o total" legenda="Azul-escuro e laranja são dinheiro novo; o verde é o FGTS que já era seu.">
            <Rosca fatias={fatias} base={totalNaMao} centro={brl(totalNaMao, 0)} rotuloCentro="na sua mão" />
          </CartaoGrafico>
          {verbas.length > 0 && (
            <CartaoGrafico titulo="Verba por verba, antes dos descontos" legenda="Barra maior, verba que mais pesa. Confira essas no termo primeiro.">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={verbas} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="nome" width={108} tickLine={false} axisLine={false}
                      tick={{ fontSize: 11, fill: "#475569" }} />
                    <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                    <Bar dataKey="valor" name="Valor bruto" radius={[0, 8, 8, 0]} barSize={18}>
                      {verbas.map((v) => <Cell key={v.nome} fill={corVerba(v.nome)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CartaoGrafico>
          )}
        </GradeGraficos>
      )}

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={totalNaMao > 0 ? (
          <>Dos <b className="text-primary">{brl(totalNaMao)}</b>, <b className="text-primary">{brl(dinheiroNovo)}</b> é dinheiro novo
            {fgtsLivre > 0 && <> e <b className="text-primary">{brl(fgtsLivre)}</b> é o FGTS que você já tinha</>}.</>
        ) : undefined} />
    </CascaAnalise>
  );
}
