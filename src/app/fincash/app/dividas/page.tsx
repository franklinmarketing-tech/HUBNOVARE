"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarCheck,
  Flame,
  Plus,
  Scale,
  Snowflake,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { faltaTabela } from "@/lib/fincash/erros";
import {
  AvisoErro,
  AvisoSQL,
  BotaoAcao,
  brl,
  brlExato,
  CabecalhoTela,
  CartaoNumero,
  CartaoPainel,
  DiscoIcone,
  Esqueleto,
  Medidor,
  NumeroHeroi,
  Pastilha,
  Vazio,
} from "../pecas";
import { mesAno } from "../metas/pecas-metas";
import {
  AlarmeCrescendo,
  CartaoDivida,
  DetalheDivida,
  FormularioDivida,
  FormularioPagamento,
  iconeDaDivida,
  ROTULO_STATUS,
} from "./pecas-dividas";
import {
  carregarDividas,
  compararEstrategias,
  EXPLICACAO_ESTRATEGIA,
  panoramaDividas,
  ROTULO_ESTRATEGIA,
  ROTULO_FAIXA,
  simularAporteExtra,
  suspeitaDeContagemDupla,
  type Divida,
  type Estrategia,
  type PagamentoDivida,
  type RetratoDivida,
} from "@/lib/fincash/dividas";
import {
  carregarMes,
  refDoMes,
  resumirMes,
  type Cartao,
  type Lancamento,
} from "@/lib/fincash/modelo";

/**
 * Dívidas — o módulo que separa este app dos outros.
 *
 * O CONCORRENTE LÍDER trata dívida como um indicador do painel: um "grau de
 * comprometimento", um número, e nada a fazer com ele. Isso serve para quem já
 * está no azul. Para quem não está, é um termômetro sem remédio — a pessoa vê
 * 68% todo mês e não tem uma única tela que responda o que ela realmente
 * pergunta, que é QUANDO ISSO ACABA.
 *
 * Esta tela responde isso, e responde o que muda a resposta. Nada mais.
 *
 * AS QUATRO COISAS QUE ELA SE RECUSA A FAZER
 *
 * 1. **Consolar.** Dívida que cresce é dita em vermelho, com o número, antes
 *    de qualquer outra coisa na página. App que suaviza vira autoajuda: a
 *    pessoa se sente melhor, não muda nada, e descobre no extrato.
 *
 * 2. **Escolher a estratégia por ela.** Avalanche e bola de neve aparecem
 *    lado a lado, com o preço de cada uma em reais e em meses. A matemática
 *    prefere a avalanche; a persistência costuma preferir a outra. Quem paga
 *    escolhe sabendo o preço.
 *
 * 3. **Recomendar produto.** Nenhuma linha desta tela sugere refinanciar,
 *    portar ou consolidar. A Novare é consultoria — conselho de produto no
 *    meio de um alarme é venda disfarçada de socorro.
 *
 * 4. **Contar o mesmo dinheiro duas vezes.** Compra parcelada no cartão já
 *    vive em `fin_lancamentos` e já pesa na fatura. Cadastrar de novo aqui
 *    inflaria o comprometimento — e num módulo de dívida, mentir para cima é o
 *    pior erro possível: assusta quem já está assustado. Daí a flag
 *    `ja_no_fluxo` e o aviso de contagem dupla mais abaixo.
 *
 * O VAZIO AQUI É UMA BOA NOTÍCIA, e está escrito assim. Todas as outras telas
 * do app pedem para a pessoa cadastrar alguma coisa. Esta, não: não ter dívida
 * é o estado que o módulo inteiro persegue.
 */
export default function DividasPage() {
  const [dividas, setDividas] = useState<Divida[] | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoDivida[]>([]);
  /** A receita PREVISTA do mês corrente — a base do comprometimento. */
  const [renda, setRenda] = useState(0);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [estrategia, setEstrategia] = useState<Estrategia>("avalanche");
  const [extra, setExtra] = useState(0);

  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const [pagando, setPagando] = useState<Divida | null>(null);
  /* O detalhe guarda o ID, e não a dívida: assim ele continua apontando para o
     dado recém-recarregado depois de um pagamento, em vez de exibir a foto
     velha que estava na memória quando abriu. */
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      /* A renda viaja JUNTO das dívidas, não depois: sem ela não existe grau
         de comprometimento, e ele é metade do que esta tela tem a dizer. O
         `catch` local é para o mês não derrubar a lista — sem renda a tela
         ainda serve, sem dívidas não. */
      const [dados, mes] = await Promise.all([
        carregarDividas(),
        carregarMes(refDoMes()).catch(() => null),
      ]);

      setDividas(dados.dividas);
      setPagamentos(dados.pagamentos);
      setErro(null);

      if (mes) {
        /* PREVISTO, e não realizado: no dia 3 do mês o realizado é quase zero
           e o comprometimento apareceria como 400% da renda. O previsto é a
           renda do mês como ela vai fechar — que é contra o que a parcela de
           fato compete. */
        setRenda(resumirMes(mes.lancamentos).entrouPrevisto);
        setCartoes(mes.cartoes);
        setLancamentos(mes.lancamentos);
      }
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(
        faltaTabela(err) ? "FALTA_SQL" : (err.message ?? "Não consegui carregar."),
      );
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ativas = useMemo(
    () => (dividas ?? []).filter((d) => d.status === "ativa" && d.saldo_atual > 0),
    [dividas],
  );

  const panorama = useMemo(
    () => panoramaDividas(dividas ?? [], pagamentos, renda),
    [dividas, pagamentos, renda],
  );

  const comparacao = useMemo(
    () => compararEstrategias(ativas, extra),
    [ativas, extra],
  );

  const aportes = useMemo(
    () => simularAporteExtra(ativas, estrategia, [100, 300, 500, 1000]),
    [ativas, estrategia],
  );

  const duplicadas = useMemo(
    () => suspeitaDeContagemDupla(ativas, lancamentos),
    [ativas, lancamentos],
  );

  if (erro === "FALTA_SQL")
    return <AvisoSQL arquivo="supabase/fincash_dividas.sql" oQue="As dívidas" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!dividas) return <Esqueleto forma="cartoes" linhas={4} />;

  const encerradas = dividas.filter((d) => d.status !== "ativa" || d.saldo_atual <= 0);
  const detalhe = detalheId
    ? (panorama.retratos.find((r) => r.divida.id === detalheId) ?? null)
    : null;

  const escolhida =
    estrategia === "avalanche" ? comparacao.avalanche : comparacao.bolaDeNeve;

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="Saia do vermelho primeiro"
        titulo="Dívidas"
        resumo="Quanto você deve, quanto disso é juro, e em que mês você fica livre. Com o preço de cada caminho — para você escolher sabendo."
        Icone={TrendingDown}
        acao={
          <BotaoAcao Icone={Plus} onClick={() => setCriando(true)}>
            Nova dívida
          </BotaoAcao>
        }
      />

      {ativas.length === 0 ? (
        /* ► O VAZIO COMO BOA NOTÍCIA. Toda outra tela do app diz "cadastre
           alguma coisa". Esta diz "parabéns" — e só depois oferece o cadastro,
           discretamente, para quem chegou aqui porque TEM dívida. Inverter isso
           faria o app parabenizar quem não tem meta, que é o oposto. */
        <div className="rounded-3xl border border-success/25 bg-success/[0.06] px-6 py-12 text-center">
          <span
            aria-hidden
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/12 text-success-strong"
          >
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-primary">
            {dividas.length > 0
              ? "Você não tem mais nenhuma dívida ativa"
              : "Nenhuma dívida cadastrada"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {dividas.length > 0
              ? "Zerar dívida é a coisa mais difícil que este app pede. Você fez. O dinheiro que ia para juro agora é seu — é ele que vira reserva, e depois investimento."
              : "Se você não deve nada, esta tela é para ficar vazia mesmo. Ela existe para quem tem — e é aqui que a dívida vira uma data em vez de um peso sem fim."}
          </p>
          <div className="mt-6">
            <BotaoAcao variante="contorno" Icone={Plus} onClick={() => setCriando(true)}>
              {dividas.length > 0 ? "Cadastrar outra dívida" : "Cadastrar uma dívida"}
            </BotaoAcao>
          </div>
          {encerradas.length > 0 && (
            <p className="mt-4 text-2xs tabular-nums text-muted-foreground">
              {encerradas.length}{" "}
              {encerradas.length === 1 ? "dívida encerrada" : "dívidas encerradas"} no
              seu histórico.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* A primeira coisa da página quando existe. */}
          <AlarmeCrescendo retratos={panorama.crescendo} />

          {duplicadas.length > 0 && (
            <div
              role="status"
              className="mb-3 rounded-2xl border border-accent/40 bg-accent-tint/50 p-4"
            >
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-accent-strong">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Confira: pode estar contando duas vezes
              </p>
              <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-foreground">
                {duplicadas
                  .map((d) => `“${d.divida.credor}” e o lançamento “${d.lancamento.descricao}”`)
                  .join("; ")}{" "}
                têm a mesma parcela. Se for a mesma dívida, marque{" "}
                <strong>“a parcela já está no meu fluxo de caixa”</strong> na
                dívida — senão o comprometimento da sua renda aparece maior do
                que é de verdade.
              </p>
            </div>
          )}

          <NumeroHeroi
            rotulo="Você ainda deve"
            valor={brl(panorama.totalDevido)}
            sinal="negativo"
            explicacao={
              panorama.dataSaidaNoRitmo
                ? `No ritmo de hoje, sem mudar nada, você fica livre em ${mesAno(panorama.dataSaidaNoRitmo)}.`
                : "No ritmo de hoje não há data de saída: alguma dívida sua não se encerra. É o que o alerta acima explica."
            }
            lateral={
              <Medidor
                valor={panorama.comprometimento.fracao * 100}
                rotulo="Da sua renda comprometida com dívida"
                legenda={ROTULO_FAIXA[panorama.comprometimento.faixa]}
                sobre="escuro"
              />
            }
          >
            <Pastilha sobre="escuro" tom="saida">
              {brlExato(panorama.comprometimento.parcelaMensal)} por mês em parcelas
            </Pastilha>
            <Pastilha sobre="escuro" tom="atrasado">
              {brlExato(panorama.jurosDoMes)} só de juro no próximo mês
            </Pastilha>
            <Pastilha sobre="escuro" tom="neutro">
              {panorama.quantidadeAtiva}{" "}
              {panorama.quantidadeAtiva === 1 ? "dívida ativa" : "dívidas ativas"}
            </Pastilha>
          </NumeroHeroi>

          <div className="mb-3 mt-3 grid gap-3 sm:grid-cols-3">
            <CartaoNumero
              rotulo="Juro que ainda vai pagar"
              valor={brl(panorama.jurosAPagar)}
              tom="ruim"
              Icone={Flame}
              detalhe="No ritmo atual, daqui até a última parcela. É o preço de estar devendo."
            />
            <CartaoNumero
              rotulo="Já quitado do total original"
              valor={brl(
                Math.max(0, panorama.totalOriginal - panorama.totalDevido),
              )}
              tom="bom"
              Icone={CalendarCheck}
              barra={{
                pct:
                  panorama.totalOriginal > 0
                    ? ((panorama.totalOriginal - panorama.totalDevido) /
                        panorama.totalOriginal) *
                      100
                    : 0,
                cor: "var(--color-success)",
              }}
              detalhe={`de ${brl(panorama.totalOriginal)} contratados`}
            />
            <CartaoNumero
              rotulo="Comprometimento da renda"
              valor={`${(panorama.comprometimento.fracao * 100).toFixed(0)}%`}
              tom={
                panorama.comprometimento.faixa === "leve"
                  ? "bom"
                  : panorama.comprometimento.faixa === "atencao"
                    ? "atencao"
                    : "ruim"
              }
              Icone={Scale}
              detalhe={
                renda > 0
                  ? `${brlExato(panorama.comprometimento.parcelaMensal)} de parcelas sobre ${brl(renda)} de receita prevista neste mês.`
                  : "Sem receita lançada neste mês, não dá para calcular. Lance a sua renda em Lançamentos."
              }
            />
          </div>

          {/* ─────────── O comparativo, o coração da tela ─────────── */}
          <CartaoPainel
            titulo="Em que ordem pagar"
            Icone={Scale}
            tom="info"
            detalhe="as duas estratégias que funcionam, com o preço de cada uma"
            className="mb-3"
          >
            <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
              Nos dois planos você paga o mesmo por mês (
              <strong className="tabular-nums text-foreground">
                {brlExato(comparacao.avalanche.orcamentoMensal)}
              </strong>
              ). O que muda é a ORDEM — e quando uma dívida acaba, a parcela dela
              não some: ela vai inteira para a próxima da fila. É isso que faz o
              plano acelerar sozinho no fim.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["avalanche", "bola_de_neve"] as Estrategia[]).map((e) => {
                const r = e === "avalanche" ? comparacao.avalanche : comparacao.bolaDeNeve;
                const ativa = estrategia === e;
                const primeira =
                  e === "avalanche"
                    ? comparacao.primeiraVitoria.avalanche
                    : comparacao.primeiraVitoria.bolaDeNeve;

                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEstrategia(e)}
                    aria-pressed={ativa}
                    className={`rounded-2xl border-2 p-4 text-left transition-colors fin-toque ${
                      ativa
                        ? "border-primary bg-primary/[0.04]"
                        : "border-border bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <DiscoIcone
                        Icone={e === "avalanche" ? Flame : Snowflake}
                        tom={ativa ? "info" : "neutro"}
                        tamanho="sm"
                      />
                      <p className="font-display text-sm font-semibold text-primary">
                        {ROTULO_ESTRATEGIA[e]}
                      </p>
                      {/* Nunca só a cor: a escolhida diz "escolhida". */}
                      {ativa && <Pastilha tom="previsto">Escolhida</Pastilha>}
                    </div>

                    <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                      {EXPLICACAO_ESTRATEGIA[e]}
                    </p>

                    <dl className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Livre em</dt>
                        <dd className="font-semibold tabular-nums text-primary">
                          {r.dataSaida ? mesAno(r.dataSaida) : "não acaba"}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Juro total</dt>
                        <dd className="font-semibold tabular-nums text-destructive">
                          {brl(r.jurosTotal)}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">1ª dívida some em</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {primeira ? `${primeira} ${primeira === 1 ? "mês" : "meses"}` : "—"}
                        </dd>
                      </div>
                    </dl>
                  </button>
                );
              })}
            </div>

            {/* O preço da escolha, dito em uma frase e sem juízo de valor. */}
            <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-foreground">
              {comparacao.economiaDaAvalanche > 1 ? (
                <>
                  Escolher a bola de neve custa{" "}
                  <strong className="tabular-nums text-destructive">
                    {brlExato(comparacao.economiaDaAvalanche)}
                  </strong>{" "}
                  a mais de juro
                  {comparacao.mesesAdiantados > 0
                    ? ` e ${comparacao.mesesAdiantados} ${comparacao.mesesAdiantados === 1 ? "mês" : "meses"} a mais`
                    : ""}
                  . Em troca, a primeira dívida sai antes. Se você já desistiu de
                  um plano antes, esse é um preço que pode valer a pena — e a
                  decisão é sua.
                </>
              ) : (
                <>
                  No seu caso as duas dão praticamente no mesmo (
                  {brlExato(Math.abs(comparacao.economiaDaAvalanche))} de
                  diferença). Escolha a que você consegue seguir.
                </>
              )}
            </p>

            <ol className="mt-4 space-y-2">
              {escolhida.ordem.map((o) => (
                <li key={o.dividaId} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-2xs font-bold tabular-nums text-primary"
                  >
                    {o.posicao}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {o.credor}
                  </span>
                  <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                    {o.quitaEm ? `some em ${mesAno(o.quitaEm)}` : "sem data"}
                  </span>
                </li>
              ))}
            </ol>
          </CartaoPainel>

          {/* ─────────── O aporte extra ─────────── */}
          <CartaoPainel
            titulo="E se você pagasse um pouco a mais?"
            Icone={Sparkles}
            tom="bom"
            detalhe={`sobre o plano de ${ROTULO_ESTRATEGIA[estrategia].toLowerCase()}`}
            className="mb-3"
          >
            <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
              Todo real a mais vai inteiro no saldo — não paga juro nenhum. Por
              isso o efeito é desproporcional: costuma cortar anos, não meses.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] text-xs">
                <thead>
                  <tr className="text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 text-left font-semibold">A mais por mês</th>
                    <th className="py-2 text-right font-semibold">Fica livre em</th>
                    <th className="py-2 text-right font-semibold">Antecipa</th>
                    <th className="py-2 text-right font-semibold">Economiza de juro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2.5 text-muted-foreground">Nada a mais (hoje)</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {aportes.base.dataSaida ? mesAno(aportes.base.dataSaida) : "não acaba"}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">—</td>
                    <td className="py-2.5 text-right text-muted-foreground">—</td>
                  </tr>
                  {aportes.cenarios.map((c) => (
                    <tr key={c.extra}>
                      <td className="py-2.5 font-semibold tabular-nums text-primary">
                        + {brl(c.extra)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-foreground">
                        {c.dataSaida ? mesAno(c.dataSaida) : "não acaba"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-success-strong">
                        {c.mesesAntes > 0
                          ? `${c.mesesAntes} ${c.mesesAntes === 1 ? "mês" : "meses"}`
                          : "—"}
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-success-strong">
                        {c.economiaDeJuros > 0 ? brlExato(c.economiaDeJuros) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-2xs font-medium text-muted-foreground">
                Ver o plano acima com:
              </span>
              {[0, 100, 300, 500, 1000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setExtra(v)}
                  aria-pressed={extra === v}
                  className={`min-h-11 rounded-xl px-3 text-xs font-semibold tabular-nums transition-colors fin-toque ${
                    extra === v
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v === 0 ? "sem extra" : `+${brl(v)}`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
              O app não promete que você consegue esse valor — mostra o que ele
              faria. De onde ele sai é uma conversa para o Orçamento.
            </p>
          </CartaoPainel>

          {/* ─────────── A lista ─────────── */}
          <div className="grid gap-3 lg:grid-cols-2">
            {panorama.retratos.map((r: RetratoDivida) => (
              <CartaoDivida
                key={r.divida.id}
                r={r}
                aoPagar={() => setPagando(r.divida)}
                aoAbrir={() => setDetalheId(r.divida.id)}
              />
            ))}
          </div>
        </>
      )}

      {ativas.length > 0 && encerradas.length > 0 && (
        <CartaoPainel
          titulo="Encerradas"
          Icone={Archive}
          tom="bom"
          detalhe={
            encerradas.length === 1
              ? "1 dívida que você já venceu"
              : `${encerradas.length} dívidas que você já venceu`
          }
          className="mt-3"
          corpoSemPadding
        >
          <ul className="divide-y divide-border/50">
            {encerradas.map((d) => (
              <li
                key={d.id}
                className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5"
              >
                <DiscoIcone Icone={iconeDaDivida(d.tipo)} cor={d.cor} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{d.credor}</p>
                  <p className="mt-0.5 text-2xs tabular-nums text-muted-foreground">
                    eram {brl(d.valor_original)}
                  </p>
                </div>
                <Pastilha tom={d.status === "quitada" ? "pago" : "neutro"}>
                  {ROTULO_STATUS[d.status]}
                </Pastilha>
              </li>
            ))}
          </ul>
        </CartaoPainel>
      )}

      {criando && (
        <FormularioDivida
          cartoes={cartoes}
          aoFechar={() => setCriando(false)}
          aoSalvar={async () => {
            setCriando(false);
            await carregar();
          }}
        />
      )}

      {editando && (
        <FormularioDivida
          divida={editando}
          cartoes={cartoes}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            setEditando(null);
            setDetalheId(null);
            await carregar();
          }}
        />
      )}

      {pagando && (
        <FormularioPagamento
          divida={pagando}
          aoFechar={() => setPagando(null)}
          aoSalvar={async () => {
            setPagando(null);
            await carregar();
          }}
        />
      )}

      {detalhe && (
        <DetalheDivida
          r={detalhe}
          pagamentos={pagamentos}
          aoFechar={() => setDetalheId(null)}
          aoEditar={() => {
            setEditando(detalhe.divida);
            setDetalheId(null);
          }}
          aoMudar={async () => {
            setDetalheId(null);
            await carregar();
          }}
        />
      )}
    </div>
  );
}
