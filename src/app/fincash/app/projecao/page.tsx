"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  CalendarRange,
  Eraser,
  FlaskConical,
  LineChart,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  BarrasMes,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoGrupo,
  CabecalhoTela,
  CartaoNumero,
  Esqueleto,
  Pastilha,
  Vazio,
  mesCurto,
  type PontoMes,
} from "../pecas";
import {
  hojeIso,
  mesVizinho,
  mesesEntre,
  nomeDoMes,
  ocorrenciasNoMes,
  projetarMeses,
  refDaData,
  refDoMes,
  resumirProjecao,
} from "@/lib/fincash/modelo";
import { faturasPorMes } from "@/lib/fincash/faturas";
import { aportesPlanejadosPorMes } from "@/lib/fincash/metas";
import { faltaTabela } from "@/lib/fincash/erros";
import { carregarPainelProjecao, type DadosProjecao } from "./carga";
import { aplicarHipoteses, type Hipotese } from "./simulacao";
import { detalharMes } from "./auditoria";
import { GraficoSaldo } from "./GraficoSaldo";
import {
  AportesDeMetas,
  AuditoriaMes,
  NotaConfianca,
  Simulacao,
  TabelaMeses,
  type Confianca,
} from "./secoes";

/**
 * A projeção de 12 meses — o para-brisa.
 *
 * A TESE DO PRODUTO, e esta é a tela que a cumpre: os concorrentes mostram o
 * retrovisor ("você gastou R$ 800 em restaurante"), e passado não muda
 * comportamento. O que muda é ver, em setembro, que MARÇO fecha no vermelho —
 * enquanto ainda dá para cancelar uma assinatura, adiar uma compra, pedir um
 * freela. Todo o resto desta página existe para esse aviso ser: (a) cedo,
 * (b) específico, e (c) conferível.
 *
 * A DIFERENÇA PARA O PAINEL, que já mostra seis meses no rodapé: lá é MEMÓRIA
 * — quanto se gastou por mês, olhando para trás, para responder "estou
 * melhorando?". Aqui é FUTURO, e a unidade não é o gasto, é o SALDO: o número
 * que decide se a conta vira ou não. As duas telas nunca desenham a mesma
 * coisa, e por isso a de lá continua sendo barra de gasto e a daqui é uma
 * curva que cruza o zero.
 *
 * O QUE A TELA ENTREGA, em ordem de importância:
 *   1. o mês em que o saldo fica negativo pela primeira vez — o único número
 *      acionável antes de acontecer;
 *   2. o menor saldo do período, que é o aperto real mesmo quando ninguém
 *      fica negativo;
 *   3. a conta aberta de cada mês, linha por linha, porque projeção que não se
 *      explica é fé e fé não sobrevive ao primeiro erro;
 *   4. um simulador de hipóteses que não grava nada;
 *   5. a franqueza sobre o quanto essa previsão vale, dado o que o app sabe.
 *
 * O QUE ELA NÃO FAZ: não guarda cenário, não manda alerta, não sugere corte.
 * Sugerir corte com base em categoria é o tipo de conselho automático que erra
 * feio ("corte o mercado") e queima a confiança que o resto da tela construiu.
 */

const MESES = 12;

/** Contas fixas que cheiram a investimento — a pista para a decisão do aporte. */
const PARECE_INVESTIMENTO =
  /invest|aporte|aplica|poupan|reserva|previd|tesouro|cdb|fundo|meta/i;

export default function ProjecaoPage() {
  const [refInicial] = useState(() => refDoMes());
  const [dados, setDados] = useState<DadosProjecao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /* A decisão da dupla contagem vive aqui, e o padrão é NÃO somar. O porquê
     está escrito em `AportesDeMetas`: entre inventar um vermelho que não existe
     e mostrar o fluxo como ele está lançado, o segundo erro é o recuperável. */
  const [somarAportes, setSomarAportes] = useState(false);
  const [hipoteses, setHipoteses] = useState<Hipotese[]>([]);
  const [mesEscolhido, setMesEscolhido] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setDados(null);
    try {
      setDados(await carregarPainelProjecao(refInicial, MESES));
      setErro(null);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(
        faltaTabela(err) ? "FALTA_SQL" : (err.message ?? "Não consegui carregar."),
      );
    }
  }, [refInicial]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /**
   * A conta inteira, de uma vez.
   *
   * DUAS PROJEÇÕES, sempre: a BASE (só o que está gravado) e a SIMULADA. A
   * base não é desperdício — é ela que a auditoria usa para explicar cada mês,
   * e é contra ela que a linha tracejada do gráfico compara. Sem guardar as
   * duas, ligar uma hipótese apagaria a verdade da tela.
   */
  const calculo = useMemo(() => {
    if (!dados) return null;

    const hoje = hojeIso();
    const refs = Array.from({ length: MESES }, (_, i) => mesVizinho(refInicial, i));

    // Armadilha 3 do motor: cartão entra pelo VENCIMENTO da fatura.
    const faturas = faturasPorMes(dados.cartoes, dados.lancamentos, refInicial, MESES, hoje);

    /* O mapa de metas é calculado sempre (a tela precisa dizer quanto elas
       pedem por mês, mesmo com o somatório desligado) mas só ENTRA na projeção
       quando a pessoa disse que ainda não lançou esses aportes. */
    const mapaAportes = dados.metas
      ? aportesPlanejadosPorMes(dados.metas, refInicial, MESES)
      : {};
    const pedidoMensal = mapaAportes[refInicial] ?? 0;

    const base = projetarMeses({
      refInicial,
      meses: MESES,
      saldoInicial: dados.saldoInicial,
      lancamentos: dados.lancamentos,
      recorrencias: dados.recorrencias,
      faturas,
      aportesPlanejados: somarAportes ? mapaAportes : undefined,
    });

    const pontos = aplicarHipoteses(base, hipoteses, dados.saldoInicial);
    const resumo = resumirProjecao(pontos);
    const resumoBase = resumirProjecao(base);
    const cortePerdido = pontos.reduce((t, p) => t + p.cortePerdido, 0);

    /* A pista para a pergunta do aporte: contas fixas de despesa cuja
       descrição ou categoria dizem "futuro". Heurística, e apresentada como
       tal — quem decide é a pessoa. */
    const grupoDaCategoria = new Map(dados.categorias.map((c) => [c.id, c.grupo]));
    const candidatas = dados.recorrencias
      .filter((r) => {
        if (r.tipo !== "despesa" || !r.ativa) return false;
        const futuro = r.categoria_id
          ? grupoDaCategoria.get(r.categoria_id) === "futuro"
          : false;
        return futuro || PARECE_INVESTIMENTO.test(r.descricao);
      })
      .map((r) => ({
        id: r.id,
        descricao: r.descricao,
        valor:
          r.frequencia === "mensal"
            ? r.valor
            : r.valor * ocorrenciasNoMes(r, refInicial).length,
      }))
      .filter((c) => c.valor > 0);

    // O que sustenta (ou não) esta previsão.
    const mesesHistorico = dados.primeiraData
      ? mesesEntre(refDaData(dados.primeiraData), refInicial) + 1
      : 0;
    const previstosFuturos = dados.lancamentos.filter((l) => !l.pago).length;
    const nivel: Confianca =
      dados.recorrencias.length === 0 || mesesHistorico < 2
        ? "fraca"
        : dados.recorrencias.length < 3 || mesesHistorico < 4
          ? "parcial"
          : "boa";

    return {
      hoje,
      refs,
      faturas,
      mapaAportes,
      pedidoMensal,
      base,
      pontos,
      resumo,
      resumoBase,
      cortePerdido,
      candidatas,
      mesesHistorico,
      previstosFuturos,
      nivel,
    };
  }, [dados, refInicial, somarAportes, hipoteses]);

  if (erro === "FALTA_SQL") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!dados || !calculo) return <Esqueleto linhas={4} />;

  const { pontos, resumo, resumoBase } = calculo;
  const simulando = hipoteses.some((h) => h.ativa && h.valor > 0);

  /* O mês aberto na auditoria. O padrão não é "o primeiro" e sim O MÊS DO
     PROBLEMA: se existe um mês que fecha no vermelho, é dele que a pessoa
     precisa da conta aberta. */
  const mesAberto =
    mesEscolhido ?? resumo.primeiroNegativo ?? resumo.refDoMenor ?? refInicial;
  const pontoAberto = pontos.find((p) => p.ref === mesAberto) ?? pontos[0];

  const semNada =
    dados.lancamentos.length === 0 &&
    dados.recorrencias.length === 0 &&
    dados.saldoInicial === 0;

  if (semNada) {
    return (
      <div className="surgir">
        <CabecalhoTela
          chapeu="Projeção"
          titulo="Os próximos 12 meses"
          resumo="Como o seu dinheiro termina o ano, se nada mudar."
        />
        <Vazio
          Icone={LineChart}
          titulo="Ainda não há o que projetar"
          texto="A projeção nasce do que você já lançou e das suas contas fixas. Cadastre as contas que se repetem todo mês — aluguel, salário, assinaturas — e esta tela passa a mostrar o ano inteiro."
          acao={
            <BotaoAcao href="/fincash/app/fixas" Icone={CalendarRange}>
              Cadastrar minhas contas fixas
            </BotaoAcao>
          }
        />
      </div>
    );
  }

  const faltamMeses = resumo.primeiroNegativo
    ? mesesEntre(refInicial, resumo.primeiroNegativo)
    : null;
  const pontoDoVermelho = resumo.primeiroNegativo
    ? pontos.find((p) => p.ref === resumo.primeiroNegativo)
    : null;

  // Entra × sai mês a mês, com a peça da casa. O saldo tem gráfico próprio
  // (cruza o zero); aqui a pergunta é outra — o mês se paga sozinho?
  const fluxo: PontoMes[] = pontos.map((p) => ({
    ref: p.ref,
    planejado: p.entradas,
    realizado: p.saidas + p.faturas + p.aportes,
  }));

  /** Os meses que não se pagam. É o que a figura de entra × sai tem a dizer —
      e no celular ela diz isso em palavras, sem doze colunas de 21px. */
  const mesesNoPrejuizo = pontos.filter((p) => p.resultado < 0);

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="Projeção"
        titulo="Os próximos 12 meses"
        resumo="Todo app de finanças mostra o que já aconteceu. Esta tela mostra como o ano termina se nada mudar — que é a parte que ainda dá para mudar."
        acao={
          simulando ? (
            <button
              type="button"
              onClick={() => setHipoteses([])}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-primary transition-colors hover:border-accent-soft"
            >
              <Eraser className="h-4 w-4" />
              Limpar simulação
            </button>
          ) : undefined
        }
      />

      {simulando && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-ciano/50 bg-ciano-tint px-4 py-2.5">
          <Pastilha tom="previsto" Icone={FlaskConical}>
            Simulação ativa
          </Pastilha>
          <p className="min-w-0 flex-1 text-2xs leading-snug text-ciano-forte">
            Os números abaixo incluem as suas hipóteses. Nada foi gravado — seus
            lançamentos continuam como estavam.
          </p>
        </div>
      )}

      {/* O HERÓI: o aviso que vale a tela inteira. */}
      <Bloco className="mb-3 overflow-hidden">
        <div className="grid items-center gap-5 p-6 sm:p-7 md:grid-cols-[1.2fr_auto]">
          <div className="min-w-0">
            {resumo.primeiroNegativo && pontoDoVermelho ? (
              <>
                <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-destructive"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  Se nada mudar, o seu dinheiro acaba em
                </p>
                <p className="mt-1 font-display text-4xl font-semibold capitalize leading-none tracking-tight text-destructive">
                  {nomeDoMes(resumo.primeiroNegativo)}
                </p>
                <p className="mt-2.5 text-sm tabular-nums text-foreground">
                  O mês fecha em {brl(pontoDoVermelho.saldoFim)} —{" "}
                  {faltamMeses === 0
                    ? "e é este mês"
                    : faltamMeses === 1
                      ? "daqui a um mês"
                      : `daqui a ${faltamMeses} meses`}
                  .
                </p>
                <p className="mt-3 max-w-prose text-xs leading-relaxed text-muted-foreground">
                  Este é o aviso que chega enquanto ainda dá para agir: são{" "}
                  {faltamMeses === 0 ? "poucos dias" : `${faltamMeses} meses`}{" "}
                  para cancelar uma assinatura, adiar uma compra ou trazer uma
                  renda. Abra o mês na tabela para ver exatamente o que pesa
                  nele, ou teste um corte na simulação aqui embaixo.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  Se nada mudar, você atravessa os 12 meses com
                </p>
                <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-tight text-primary tabular-nums">
                  {brl(resumo.saldoFinal)}
                </p>
                <p className="mt-2.5 text-sm text-foreground">
                  Nenhum mês fecha no vermelho. O aperto maior é em{" "}
                  <span className="capitalize">{nomeDoMes(resumo.refDoMenor)}</span>,
                  com {brl(resumo.menorSaldo)} em caixa.
                </p>
                <p className="mt-3 max-w-prose text-xs leading-relaxed text-muted-foreground">
                  Saldo positivo o ano inteiro não é o mesmo que folga: o menor
                  saldo é o que diz se você aguenta um imprevisto. Se ele for
                  menor que um mês das suas despesas, a reserva ainda é curta.
                </p>
              </>
            )}

            {simulando && (
              <p className="mt-3 rounded-xl bg-gelo px-3 py-2 text-2xs leading-relaxed text-muted-foreground">
                Sem a simulação:{" "}
                {resumoBase.primeiroNegativo ? (
                  <>
                    o vermelho chegaria em{" "}
                    <span className="capitalize">
                      {nomeDoMes(resumoBase.primeiroNegativo)}
                    </span>
                  </>
                ) : (
                  "nenhum mês fecharia no vermelho"
                )}
                , e o ano terminaria com {brl(resumoBase.saldoFinal)}.
              </p>
            )}
          </div>

          <div className="md:w-52">
            <div className="rounded-2xl bg-gelo p-4 text-center">
              <p className="text-2xs uppercase tracking-wider text-muted-foreground">
                Menor saldo do período
              </p>
              <p
                className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
                  resumo.menorSaldo < 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {brl(resumo.menorSaldo)}
              </p>
              <p className="mt-0.5 text-2xs capitalize text-muted-foreground">
                em {nomeDoMes(resumo.refDoMenor)}
              </p>
              <button
                type="button"
                onClick={() => setMesEscolhido(resumo.refDoMenor)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-2xs font-semibold text-primary transition-colors hover:border-accent-soft"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Abrir a conta desse mês
              </button>
            </div>
          </div>
        </div>
      </Bloco>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <CartaoNumero
          rotulo="Você tem hoje"
          valor={brl(dados.saldoInicial)}
          detalhe="a soma de todas as contas — o ponto de partida da projeção"
          tom="info"
          Icone={Wallet}
          href="/fincash/app/contas"
        />
        <CartaoNumero
          rotulo="Vai entrar em 12 meses"
          valor={brl(resumo.totalEntradas)}
          detalhe="só o que ainda não caiu"
          tom="bom"
        />
        <CartaoNumero
          rotulo="Vai sair em 12 meses"
          valor={brl(resumo.totalSaidas)}
          detalhe="contas, faturas e aportes ainda não pagos"
          tom="atencao"
        />
      </div>

      {/* O DESENHO. Clicar num mês abre a conta dele logo abaixo. */}
      <Bloco className="mb-3 overflow-hidden">
        <CabecalhoGrupo
          titulo="Saldo mês a mês"
          tom="reserva"
          Icone={LineChart}
          detalhe="toque num mês para abrir a conta"
        />
        <div className="p-4 sm:p-5">
          <GraficoSaldo
            meses={pontos.map((p) => ({
              ref: p.ref,
              saldo: p.saldoFim,
              saldoBase: p.base.saldoFim,
            }))}
            aberto={mesAberto}
            aoAbrir={setMesEscolhido}
            primeiroNegativo={resumo.primeiroNegativo}
            refDoMenor={resumo.refDoMenor}
            formatar={brl}
            simulando={simulando}
          />
        </div>
      </Bloco>

      <Bloco className="mb-3 overflow-hidden">
        <CabecalhoGrupo
          titulo="O que entra e o que sai"
          tom="neutro"
          detalhe="mês a mês"
        />
        <div className="p-4 sm:p-5">
          {/* AS DOZE COLUNAS SÓ NO COMPUTADOR. Em 320px de largura cada uma
              fica com 21px e o rótulo do mês vira "ja…" — gráfico ilegível é
              pior do que gráfico nenhum. No celular fica a mesma informação em
              palavras, que é o que essa figura tem a dizer: quais meses não se
              pagam. O saldo, que é o dado principal, tem desenho próprio ali em
              cima nas duas larguras. */}
          <div className="hidden sm:block">
            <BarrasMes
              meses={fluxo}
              formatar={brl}
              rotuloRealizado="Vai sair"
              rotuloPlanejado="Vai entrar"
              altura={112}
            />
          </div>

          <div className="sm:mt-4">
            {mesesNoPrejuizo.length === 0 ? (
              <p className="max-w-prose text-2xs leading-relaxed text-muted-foreground">
                Nenhum dos 12 meses gasta mais do que recebe. É o cenário em que
                o saldo só cresce — e o que pode estragá-lo é o que ainda não
                está lançado.
              </p>
            ) : (
              <>
                <p className="max-w-prose text-2xs leading-relaxed text-muted-foreground">
                  {mesesNoPrejuizo.length === 1
                    ? "Um mês gasta mais do que recebe:"
                    : `${mesesNoPrejuizo.length} dos 12 meses gastam mais do que recebem:`}{" "}
                  um mês assim não é problema se houver caixa; vários seguidos
                  são o que faz o saldo cruzar o zero.
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {mesesNoPrejuizo.map((p) => (
                    <li key={p.ref}>
                      <button
                        type="button"
                        onClick={() => setMesEscolhido(p.ref)}
                        className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-2xs font-semibold capitalize text-primary transition-colors hover:border-accent-soft"
                      >
                        {mesCurto(p.ref)}
                        <span className="font-normal tabular-nums text-destructive">
                          {brl(p.resultado)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Bloco>

      <div className="mb-3">
        <AuditoriaMes
          ponto={pontoAberto}
          linhas={detalharMes({
            ref: pontoAberto.ref,
            refInicial,
            lancamentos: dados.lancamentos,
            recorrencias: dados.recorrencias,
            cartoes: dados.cartoes,
            hoje: calculo.hoje,
            aporte: pontoAberto.base.aportes,
            hipoteses,
          })}
        />
      </div>

      <div className="mb-3">
        <Simulacao
          hipoteses={hipoteses}
          refs={calculo.refs}
          cortePerdido={calculo.cortePerdido}
          aoAdicionar={(h) => setHipoteses((atual) => [...atual, h])}
          aoAlternar={(id) =>
            setHipoteses((atual) =>
              atual.map((h) => (h.id === id ? { ...h, ativa: !h.ativa } : h)),
            )
          }
          aoRemover={(id) =>
            setHipoteses((atual) => atual.filter((h) => h.id !== id))
          }
        />
      </div>

      <div className="mb-3">
        <AportesDeMetas
          metas={dados.metas}
          ligado={somarAportes}
          aoMudar={setSomarAportes}
          pedidoMensal={calculo.pedidoMensal}
          candidatas={calculo.candidatas}
        />
      </div>

      <Bloco className="mb-3 overflow-hidden">
        <CabecalhoGrupo
          titulo="Os doze meses em números"
          tom="neutro"
          total={brl(resumo.saldoFinal)}
          detalhe="saldo no fim do período"
        />
        <TabelaMeses
          pontos={pontos}
          aberto={mesAberto}
          aoAbrir={setMesEscolhido}
          primeiroNegativo={resumo.primeiroNegativo}
          refDoMenor={resumo.refDoMenor}
        />
      </Bloco>

      <div className="mb-3">
        <NotaConfianca
          nivel={calculo.nivel}
          mesesHistorico={calculo.mesesHistorico}
          recorrencias={dados.recorrencias.length}
          previstosFuturos={calculo.previstosFuturos}
        />
      </div>

      <ComoAContaEFeita refInicial={refInicial} />
    </div>
  );
}

/**
 * O método, escrito.
 *
 * Nenhum concorrente publica isto, e é justamente por isso que vale: as três
 * regras abaixo são as que separam uma projeção certa de uma que dobra valores.
 * Quem confere e vê que bate passa a confiar no resto do app; quem confere e vê
 * que não bate tem como nos dizer onde erramos.
 */
function ComoAContaEFeita({ refInicial }: { refInicial: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/70 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
        <ShieldCheck className="h-4 w-4 text-ciano-forte" aria-hidden />
        Como esta conta é feita
      </p>
      <ul className="mt-2.5 space-y-2 text-2xs leading-relaxed text-muted-foreground">
        <li>
          <strong className="text-foreground">Parte do seu saldo de hoje.</strong>{" "}
          Tudo o que você já marcou como pago está dentro dele — por isso a
          projeção soma daqui para a frente só o que ainda NÃO foi pago. Somar o
          realizado de novo dobraria o mês corrente.
        </li>
        <li>
          <strong className="text-foreground">
            Compra no cartão entra no vencimento da fatura.
          </strong>{" "}
          Comprar dia 3 não tira dinheiro da conta dia 3. Cada fatura é somada no
          mês em que vence, e só a parte que ainda está em aberto.
        </li>
        <li>
          <strong className="text-foreground">
            Conta fixa não conta duas vezes.
          </strong>{" "}
          Quando a regra mensal já virou lançamento no mês, vale o lançamento —
          que é o que você pode editar quando a luz vem mais cara.
        </li>
        <li>
          <strong className="text-foreground">Nada aqui é gravado.</strong> A
          simulação vive só nesta aba, e sair da tela a apaga.{" "}
          <Link
            href="/fincash/app/lancamentos"
            className="font-semibold text-accent-strong underline underline-offset-2"
          >
            Para mudar a projeção de verdade, mude os lançamentos.
          </Link>
        </li>
      </ul>
      <p className="mt-3 text-2xs leading-relaxed text-muted-foreground">
        Um limite conhecido, para você não ser pego de surpresa: assinatura
        lançada como conta fixa NO CARTÃO entra no mês em que cai, e não no
        vencimento da fatura, enquanto não virar lançamento. Nos meses distantes
        isso pode adiantar um gasto em até um mês. É pouco perto de ignorar a
        assinatura, que era a alternativa.
      </p>
      <p className="mt-3 text-2xs capitalize text-muted-foreground">
        Janela desta tela: {nomeDoMes(refInicial)} a{" "}
        {nomeDoMes(mesVizinho(refInicial, MESES - 1))}.
      </p>
    </div>
  );
}
