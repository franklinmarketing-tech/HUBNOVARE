"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, pct, taxaAnualParaMensal } from "@/lib/calculos";
import {
  AnaliseVazia,
  BarraAlvo,
  CartaoGrafico,
  CascaAnalise,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "@/components/analises/kit";

/**
 * A ANÁLISE DA RESERVA DE EMERGÊNCIA, como um consultor leria os números.
 *
 * A referência de meses é a da própria ferramenta (4, 6 ou 12 conforme o
 * perfil, em `reservaEmergencia`). A projeção mês a mês usa a mesma taxa e a
 * mesma capitalização de `mesesAteMeta`, para o gráfico bater com o prazo
 * que a página mostra. O "aporte para fechar em 12 meses" é soma simples,
 * sem rendimento, de propósito: é o lado seguro da conta.
 */

type Perfil = "clt" | "servidor" | "autonomo" | "empresario";

const NOME_PERFIL: Record<Perfil, string> = {
  clt: "quem é CLT",
  servidor: "servidor público",
  autonomo: "autônomo",
  empresario: "empresário",
};

const umaCasa = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
// "1 mês", "0,5 mês", "3,6 meses": singular até 1, como se fala.
const mesesTxt = (n: number) => `${umaCasa(n)} ${Math.round(n * 10) / 10 <= 1 ? "mês" : "meses"}`;
const kTxt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`);

export function AnaliseReserva({
  custoMensal,
  perfil,
  jaGuardado,
  aporteMensal,
  taxaAnualPct,
  alvo,
  falta,
  mesesRecomendados,
  mesesParaCompletar,
  progressoPct,
  prazoTexto,
}: {
  custoMensal: number;
  perfil: Perfil;
  jaGuardado: number;
  aporteMensal: number;
  taxaAnualPct: number;
  alvo: number;
  falta: number;
  mesesRecomendados: number;
  mesesParaCompletar: number | null;
  progressoPct: number;
  /** O prazo já em texto, do jeito que a página escreve ("1 ano e 3 meses"). */
  prazoTexto: string;
}) {
  if (custoMensal <= 0) {
    return <AnaliseVazia texto="Informe o seu custo de vida mensal para ver quantos meses a reserva já cobre, o caminho até a meta e o que fazer primeiro." />;
  }

  const guardado = Math.max(0, jaGuardado);
  const aporte = Math.max(0, aporteMensal);
  const completa = falta <= 0;
  const cobertura = guardado / custoMensal;
  const excedente = Math.max(0, guardado - alvo);
  const nomePerfil = NOME_PERFIL[perfil];

  /* ── A trajetória mês a mês: mesma conta de `mesesAteMeta` ─────────────── */
  const i = taxaAnualParaMensal(taxaAnualPct);
  // Até a meta (no máximo 10 anos, para o gráfico continuar legível). Se a
  // reserva não fecha, mostra 2 anos para deixar claro que a linha não chega.
  const horizonte = mesesParaCompletar === null ? 24 : Math.min(Math.max(mesesParaCompletar, 1), 120);
  const serie: { mes: number; saldo: number }[] = [{ mes: 0, saldo: guardado }];
  let saldo = guardado;
  for (let m = 1; m <= horizonte; m++) {
    saldo = saldo * (1 + i) + aporte;
    serie.push({ mes: m, saldo });
  }
  const saldo12 = serie[Math.min(12, serie.length - 1)].saldo;
  const cobertura12 = saldo12 / custoMensal;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito = completa
    ? {
        tom: "bom" as const,
        titulo: "Reserva completa: o colchão está pronto",
        texto: `Você tem ${mesesTxt(cobertura)} de custo de vida guardados, ${cobertura > mesesRecomendados ? "acima" : "dentro"} dos ${mesesRecomendados} meses que a ferramenta usa como referência para ${nomePerfil}.${excedente > 0 ? ` E ainda sobram ${brl(excedente)} acima da meta.` : ""}`,
      }
    : mesesParaCompletar === null
      ? {
          tom: "ruim" as const,
          titulo: "Do jeito que está, a reserva não fecha",
          texto: `Faltam ${brl(falta)} e, sem um valor guardado todo mês, ela não chega à meta. Até lá, um imprevisto pode virar dívida.`,
        }
      : cobertura < 1
        ? {
            tom: "ruim" as const,
            titulo: "Hoje a reserva não segura nem um mês",
            texto: `O que está guardado cobre ${mesesTxt(cobertura)} do custo de vida. A referência para ${nomePerfil} é ${mesesRecomendados} meses. No ritmo atual, você chega lá em ${prazoTexto}.`,
          }
        : {
            tom: "atencao" as const,
            titulo: `Faltam ${brl(falta)} para a reserva ficar completa`,
            texto: `Hoje ela cobre ${mesesTxt(cobertura)} de custo de vida, de ${mesesRecomendados} recomendados para ${nomePerfil}. No ritmo atual, completa em ${prazoTexto}.`,
          };

  /* ── As recomendações, em ordem de prioridade ──────────────────────── */
  const recs: Recomendacao[] = [];
  const aporte12 = falta / 12;
  if (!completa) {
    if (mesesParaCompletar === null || mesesParaCompletar > 12) {
      recs.push({
        titulo: `Guardar ${brl(aporte12)} por mês fecha a reserva em 1 ano`,
        texto: aporte > 0
          ? `Hoje você guarda ${brl(aporte)}. A diferença, ${brl(Math.max(0, aporte12 - aporte))}, costuma sair de um corte no orçamento. A conta é sem rendimento, para ficar do lado seguro.`
          : "Sem aporte, a reserva não anda. Esse é o valor para chegar lá em 12 meses, sem contar rendimento.",
        href: "/ferramentas/orcamento",
        link: "Achar espaço no orçamento",
      });
    }
    recs.push({
      titulo: "Separar o aporte no dia em que a renda entra",
      texto: "Reserva se constrói no automático: o que fica para o fim do mês costuma não sobrar. Até completar, ela vem antes de investir para o longo prazo.",
    });
    recs.push({
      titulo: "Deixar a reserva onde dá para sacar no mesmo dia",
      texto: "Emergência não escolhe data. Aqui, resgate rápido e baixo risco valem mais do que rendimento alto.",
      href: "/ferramentas/rentabilidade-real",
      link: "Conferir se ela rende acima da inflação",
    });
  } else {
    if (excedente > 0) {
      recs.push({
        titulo: `Dar destino aos ${brl(excedente)} acima da meta`,
        texto: "O que passa da reserva pode ir para objetivos de prazo maior. Veja quanto esse valor vira com o tempo.",
        href: "/ferramentas/juros-compostos",
        link: "Simular o longo prazo",
      });
    }
    recs.push({
      titulo: "Rever a meta uma vez por ano",
      texto: `A reserva acompanha o custo de vida: se ele subir, a meta de ${mesesRecomendados} meses sobe junto.`,
      href: "/ferramentas/orcamento",
      link: "Revisar o custo de vida",
    });
    recs.push({
      titulo: "Proteger o que a reserva não cobre",
      texto: "A reserva segura alguns meses de despesa. Invalidez, morte ou um prejuízo grande pedem seguro, não reserva.",
      href: "/ferramentas/seguros",
      link: "Ver a análise de seguros",
    });
  }

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador
          rotulo="Meses cobertos hoje"
          valor={`${umaCasa(cobertura)} de ${mesesRecomendados}`}
          nota="meses de custo de vida guardados"
          ruim={cobertura < 1}
        />
        <Indicador
          rotulo="Quanto falta"
          valor={brl(falta)}
          nota={completa ? "Meta batida" : `${pct(progressoPct, 0)} da meta já guardado`}
        />
        {completa ? (
          <Indicador rotulo="Acima da meta" valor={brl(excedente)} nota="Pode ir para prazos maiores" />
        ) : (
          <Indicador rotulo="Para fechar em 12 meses" valor={brl(aporte12)} nota="por mês, sem contar rendimento" ruim={aporte < aporte12} />
        )}
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico
          titulo="Meses de custo de vida cobertos"
          legenda="A barra é a sua reserva em meses; o traço escuro é a meta do seu perfil."
        >
          <div className="space-y-5">
            <BarraAlvo
              rotulo="Hoje"
              valor={cobertura}
              alvo={mesesRecomendados}
              maximo={mesesRecomendados * 1.2}
              formato={mesesTxt}
              bomAcima
            />
            {!completa && (
              <BarraAlvo
                rotulo="Daqui a 12 meses, no ritmo atual"
                valor={cobertura12}
                alvo={mesesRecomendados}
                maximo={mesesRecomendados * 1.2}
                formato={mesesTxt}
                bomAcima
                cor={CORES_ANALISE.azul}
              />
            )}
          </div>
        </CartaoGrafico>

        {!completa && (
          <CartaoGrafico
            titulo="O caminho até a meta"
            legenda={mesesParaCompletar === null
              ? "A área é a reserva nos próximos 24 meses; ela não alcança a linha tracejada, que é a meta."
              : "A área é a reserva crescendo mês a mês com aporte e rendimento; a linha tracejada é a meta."}
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gReservaSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CORES_ANALISE.verde} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CORES_ANALISE.verde} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}m`} />
                  <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={kTxt} domain={[0, (max: number) => Math.max(max, alvo) * 1.05]} />
                  <Tooltip
                    formatter={(v) => brl(Number(v ?? 0))}
                    labelFormatter={(v) => `Mês ${v}`}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <ReferenceLine y={alvo} stroke={CORES_ANALISE.navy} strokeDasharray="5 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="saldo" name="Reserva" stroke={CORES_ANALISE.verde} strokeWidth={2} fill="url(#gReservaSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        )}
      </GradeGraficos>

      <Recomendacoes
        itens={recs}
        rodape={!completa && aporte > 0 ? (
          <>
            Guardando <b className="text-primary">{brl(aporte)}</b> por mês, são{" "}
            <b className="text-primary">{brl(aporte * 12)}</b> em 12 meses, fora o rendimento.
          </>
        ) : undefined}
      />
    </CascaAnalise>
  );
}
