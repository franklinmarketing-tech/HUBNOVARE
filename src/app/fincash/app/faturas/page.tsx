"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import {
  AlertTriangle,
  CreditCard,
  Layers,
  Plus,
} from "lucide-react";
import {
  AnelProgresso,
  AvisoErro,
  AvisoSQL,
  BotaoAcao,
  brl,
  CabecalhoTela,
  CartaoPainel,
  Esqueleto,
  mesCurto,
  NavegadorMes,
  NumeroHeroi,
  Pastilha,
  Vazio,
} from "../pecas";
import { createClient } from "@/lib/supabase/client";
import {
  calcularFatura,
  carregarLancamentosDeCartao,
  faturasPorMes,
} from "@/lib/fincash/faturas";
import {
  limitesDoMes,
  mesVizinho,
  nomeDoMes,
  refDoMes,
  type Cartao,
  type Categoria,
  type Conta,
  type Lancamento,
} from "@/lib/fincash/modelo";
import { CartaoDeFatura } from "./cartao-de-fatura";
import { FormularioCartao } from "./formulario-cartao";
import { porExtenso, quandoVence } from "./comum";

/**
 * Faturas de cartão — quanto vem, e quando.
 *
 * A PERGUNTA QUE ESTA TELA RESPONDE, e é uma só: **"quanto vai chegar de
 * fatura, e em que dia?"** Não é "o que eu comprei" — isso o extrato do banco
 * já faz melhor, e é o que todo concorrente entrega achando que basta. O susto
 * da fatura não vem de esquecer uma compra; vem de não saber que as parcelas de
 * três compras diferentes caem todas no mesmo mês.
 *
 * POR ISSO A LISTA DE ITENS NASCE FECHADA. O que fica aberto é o valor, o dia
 * do vencimento e o quanto da PRÓXIMA fatura já está comprometido. A lista de
 * compras é a segunda pergunta ("por que veio alta?"), e segunda pergunta não
 * pode ocupar a tela inteira antes de a primeira ser respondida.
 *
 * OS ITENS SÃO AGRUPADOS POR CATEGORIA, e não por dia. Por dia responde "o que
 * eu comprei no sábado", que é curiosidade; por categoria responde "a fatura
 * veio R$ 600 mais alta porque foram R$ 600 de restaurante", que é decisão.
 *
 * PAGAR PASSA SEMPRE PELO MOTOR (`marcarFaturaPaga`), nunca por um update
 * daqui. São duas escritas — a despesa na conta e a baixa dos itens — e fazer
 * só a segunda deixaria o saldo mentindo para cima enquanto a projeção de 12
 * meses continuaria contando uma fatura já paga. O motivo completo está escrito
 * em `faturas.ts`; aqui basta a regra: a tela pede, o motor faz.
 *
 * O CICLO É MOSTRADO POR EXTENSO em todo cartão ("de 26/01 a 25/02, vence
 * 05/03"). Fatura é a única coisa do app cujo período NÃO é o mês do
 * calendário, e app que esconde isso é app em que a pessoa jura que o valor
 * está errado — quando o errado é a expectativa que ele criou.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * O QUE MUDOU NA REVISÃO VISUAL (a tese não mudou; a hierarquia, sim)
 * ══════════════════════════════════════════════════════════════════════════
 * 1. O TRIO DE CARTÕES VIROU UM HERÓI. "A pagar", "já pago" e "a próxima já
 *    tem" tinham exatamente o mesmo peso, e um deles é a pergunta da tela
 *    enquanto os outros dois são contexto dela. Agora o a-pagar mora sozinho no
 *    cartão navy — com o quando na frase, o já-pago no anel e no rótulo, e o
 *    comprometido no rodapé. Nada saiu; o que mudou foi quem lidera.
 * 2. UM NAVY SÓ. Cada cartão tem o seu bloco, e um fundo escuro por bloco
 *    viraria uma parede listrada em que nada lidera — que é o oposto do que o
 *    herói existe para fazer.
 * 3. CADA CARTÃO VIROU `CartaoPainel`, com cabeçalho leve no lugar da faixa
 *    saturada. Ver o comentário em `cartao-de-fatura.tsx`.
 * 4. A TELA VIROU QUATRO ARQUIVOS. Eram 1.200 linhas num só, e a tela mais
 *    delicada do app é a que menos pode ser lida em diagonal.
 */

type Dados = {
  cartoes: Cartao[];
  contas: Conta[];
  categorias: Categoria[];
  lancamentos: Lancamento[];
};

export default function FaturasPage() {
  const hoje = refDoMes();
  const [ref, setRef] = useState(hoje);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Cartao | null>(null);
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    try {
      /* A JANELA COMEÇA DOIS MESES ANTES do mês na tela porque o ciclo da
         fatura de março pode ter começado em janeiro (fecha dia 25, vence dia
         5). E NÃO TEM FIM: as parcelas futuras são o dado mais importante
         daqui — um teto de 12 meses cortaria justamente o 24x que a pessoa
         precisa ver em "já comprometido". */
      const de = limitesDoMes(mesVizinho(ref, -2)).inicio;

      const [cartoes, contas, categorias, lancamentos] = await Promise.all([
        supabase
          .from("fin_cartoes")
          .select("*")
          .eq("arquivado", false)
          .order("nome"),
        supabase
          .from("fin_contas")
          .select("*")
          .eq("arquivada", false)
          .order("nome"),
        supabase.from("fin_categorias").select("*").order("nome"),
        carregarLancamentosDeCartao(de),
      ]);

      const falhou = cartoes.error ?? contas.error ?? categorias.error;
      if (falhou) throw falhou;

      setDados({
        cartoes: (cartoes.data ?? []) as Cartao[],
        contas: (contas.data ?? []) as Conta[],
        categorias: (categorias.data ?? []) as Categoria[],
        lancamentos,
      });
      setErro(null);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(faltaTabela(err) ? "FALTA_SQL" : err.message ?? "Falhou.");
    }
  }, [ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* As faturas do mês na tela, uma por cartão. Memorizado porque
     `calcularFatura` roda por cartão a cada render e a lista de lançamentos
     pode ter centenas de linhas quando há parcelamento longo. */
  const faturas = useMemo(() => {
    if (!dados) return [];
    return dados.cartoes.map((c) =>
      calcularFatura(c, dados.lancamentos, ref),
    );
  }, [dados, ref]);

  /* O calendário do topo sai de `faturasPorMes` — a MESMA função que a projeção
     de 12 meses consome. Se esta tela somasse do seu jeito, uma hora ela e a
     projeção mostrariam números diferentes para o mesmo mês, e aí o cliente não
     confia em nenhuma das duas. */
  const proximos = useMemo(() => {
    if (!dados || dados.cartoes.length === 0) return {};
    return faturasPorMes(dados.cartoes, dados.lancamentos, ref, 6);
  }, [dados, ref]);

  if (erro === "FALTA_SQL")
    return <AvisoSQL arquivo="supabase/fincash.sql" oQue="Os cartões" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  /* Forma "painel": o que nasce aqui é um herói navy alto seguido de blocos
     largos. O esqueleto de lista prometeria uma tabela e a tela pularia
     inteira no primeiro dado — que é o defeito que o esqueleto existe para
     resolver. */
  if (!dados) return <Esqueleto forma="painel" />;

  const aPagar = faturas.reduce((s, f) => s + Math.max(0, f.aberto), 0);
  const jaPago = faturas.reduce((s, f) => s + f.pago, 0);
  const daProxima = faturas.reduce((s, f) => s + Math.max(0, f.proxima), 0);

  /* Quanto do mês de fatura já foi quitado. É a leitura que o anel do herói
     dá de graça: "faltam R$ 1.200" muda de significado conforme sejam os
     últimos R$ 1.200 de R$ 4.000 ou os únicos R$ 1.200 do mês. */
  const doMes = aPagar + jaPago;
  const pctPago = doMes > 0 ? (jaPago / doMes) * 100 : 0;

  const emAberto = faturas
    .filter((f) => f.aberto > 0)
    .sort((a, b) => a.ciclo.vencimento.localeCompare(b.ciclo.vencimento));

  /* A que vence primeiro entre as que ainda têm saldo. É o "e quando" da
     pergunta da tela — sem ele o número grande fica solto. */
  const maisProxima = emAberto[0];
  const atrasadas = emAberto.filter((f) => f.ciclo.vencida);

  const nomeDoCartao = new Map(dados.cartoes.map((c) => [c.id, c.nome]));
  const mes = nomeDoMes(ref).split(" de ")[0];

  return (
    <div className="surgir">
      <CabecalhoTela
        /* O disco amarra a tela ao item que a pessoa tocou no menu "Mais" —
           é por lá que se chega aqui, e lá não há contexto nenhum. */
        Icone={CreditCard}
        chapeu="Sem susto na hora da fatura"
        titulo="Cartões"
        resumo="Quanto vem de fatura em cada cartão, em que dia vence e quanto do mês que vem já está comprometido por parcelas."
      />

      <NavegadorMes
        mes={ref}
        hoje={hoje}
        nome={nomeDoMes(ref)}
        aoMudar={setRef}
        acao={
          dados.cartoes.length > 0 ? (
            /* Contorno, não sólido: o laranja desta tela é o "Pagar" de uma
               fatura fechada. Cadastrar cartão é coisa que se faz uma vez. */
            <BotaoAcao variante="contorno" Icone={Plus} onClick={() => setCriando(true)}>
              Novo cartão
            </BotaoAcao>
          ) : undefined
        }
      />

      {dados.cartoes.length === 0 ? (
        <Vazio
          Icone={CreditCard}
          titulo="Nenhum cartão cadastrado"
          texto="Cadastre o dia em que o cartão fecha e o dia em que vence. É com esses dois números que o app consegue dizer em qual fatura cada compra vai cair — e quanto vem no mês que vem."
          passos={[
            "Dê o nome que você usa para falar dele (“Nubank”, “o do Itaú”).",
            "Diga o dia em que ele FECHA e o dia em que VENCE — a tela mostra o ciclo que sai desses dois números para você conferir.",
            "Lance as compras escolhendo o cartão. Elas caem sozinhas na fatura certa.",
          ]}
          acao={
            <BotaoAcao Icone={Plus} onClick={() => setCriando(true)}>
              Cadastrar o primeiro
            </BotaoAcao>
          }
        />
      ) : (
        <>
          {/* O HERÓI. Um bloco escuro por tela — e nesta ele tem de ser o
              total, porque cada cartão já tem o bloco dele logo abaixo: navy
              por cartão viraria uma parede listrada em que nada lidera. */}
          <div className="mb-3">
            <NumeroHeroi
              rotulo={
                aPagar > 0
                  ? `De fatura, ainda falta pagar em ${mes}`
                  : `Nada em aberto de fatura em ${mes}`
              }
              valor={brl(aPagar)}
              /* Vermelho SÓ para atraso — é a única notícia ruim que esta tela
                 tem para dar. Fatura a vencer é o normal da vida de quem usa
                 cartão, e pintá-la de vermelho gastaria o alarme. */
              sinal={
                atrasadas.length > 0
                  ? "negativo"
                  : aPagar > 0
                    ? "neutro"
                    : "positivo"
              }
              explicacao={
                maisProxima
                  ? `A do ${nomeDoCartao.get(maisProxima.cartaoId) ?? "cartão"} vence ${porExtenso(maisProxima.ciclo.vencimento)} — ${quandoVence(maisProxima.ciclo)}.${
                      jaPago > 0
                        ? ` Os ${brl(jaPago)} já pagos viraram despesa na conta e saíram do saldo.`
                        : ""
                    }`
                  : jaPago > 0
                    ? `Tudo o que vencia neste mês já foi pago: os ${brl(jaPago)} viraram despesa na conta e saíram do saldo.`
                    : "Nenhuma fatura deste mês tem saldo em aberto."
              }
              lateral={
                doMes > 0 ? (
                  <AnelProgresso
                    valor={pctPago}
                    rotulo={`Das faturas de ${mes} já pagas`}
                    centro={`${Math.round(pctPago)}%`}
                    legenda="pagas"
                    tom={pctPago >= 100 ? "success" : "ciano"}
                    sobre="escuro"
                    tamanho={116}
                  />
                ) : undefined
              }
              rodape={
                daProxima > 0 && (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="max-w-prose text-2xs leading-relaxed text-white/65">
                      A próxima fatura já tem parcelas e lançamentos que já
                      existem — não é estimativa, é o que está lançado.
                    </p>
                    <p className="font-display text-lg font-semibold tabular-nums text-white">
                      {brl(daProxima)}
                    </p>
                  </div>
                )
              }
            >
              {atrasadas.length > 0 && (
                <Pastilha tom="atrasado" Icone={AlertTriangle} sobre="escuro">
                  {atrasadas.length === 1
                    ? "1 fatura atrasada"
                    : `${atrasadas.length} faturas atrasadas`}
                </Pastilha>
              )}
              {jaPago > 0 && (
                <Pastilha tom="pago" sobre="escuro">
                  {brl(jaPago)} já pagos
                </Pastilha>
              )}
              <Pastilha tom="neutro" sobre="escuro">
                {dados.cartoes.length === 1
                  ? "1 cartão"
                  : `${dados.cartoes.length} cartões`}
              </Pastilha>
            </NumeroHeroi>
          </div>

          <CalendarioDeFaturas
            mapa={proximos}
            refAtual={ref}
            aoEscolher={setRef}
          />

          <div className="space-y-3">
            {dados.cartoes.map((cartao, i) => (
              /* A cascata de entrada é a mesma da home, com teto de seis
                 passos: quem tem cinco cartões não pode esperar a lista
                 inteira desfilar toda vez que abre a tela. */
              <div
                key={cartao.id}
                style={{ "--fin-i": i } as React.CSSProperties}
                className="fin-entra"
              >
                <CartaoDeFatura
                  cartao={cartao}
                  fatura={faturas[i]}
                  contas={dados.contas}
                  categorias={dados.categorias}
                  lancamentos={dados.lancamentos}
                  aoMudar={carregar}
                  aoEditar={() => setEditando(cartao)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {(criando || editando) && (
        <FormularioCartao
          cartao={editando}
          contas={dados.contas}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
          aoSalvar={async () => {
            setCriando(false);
            setEditando(null);
            await carregar();
          }}
        />
      )}
    </div>
  );
}

/**
 * Os próximos seis meses de fatura, somando todos os cartões.
 *
 * É A RESPOSTA VISUAL AO "QUANDO". Uma fatura de R$ 2.000 em abril não assusta
 * ninguém em janeiro; o que assusta — e faz mudar de ideia sobre parcelar em
 * 12x — é ver que março, abril e maio já estão todos em R$ 2.000. Cada mês é um
 * botão: clicar leva a tela para lá, que é o gesto natural depois de ver um
 * pico e querer saber de onde ele vem.
 *
 * A barrinha embaixo do valor é proporcional ao maior mês da faixa, e é
 * `aria-hidden`: o valor já está escrito ali do lado em texto, ela só existe
 * para o pico saltar aos olhos sem ninguém ter de comparar seis números.
 */
function CalendarioDeFaturas({
  mapa,
  refAtual,
  aoEscolher,
}: {
  mapa: Record<string, number>;
  refAtual: string;
  aoEscolher: (ref: string) => void;
}) {
  const refs = Object.keys(mapa).sort();
  const teto = Math.max(1, ...Object.values(mapa));
  if (refs.length === 0) return null;

  const total = Object.values(mapa).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <CartaoPainel
      titulo="O que vem pela frente"
      Icone={Layers}
      tom="info"
      detalhe="somando todos os cartões, mês a mês"
      className="mb-3"
    >
      <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {refs.map((r) => {
          const valor = mapa[r];
          const atual = r === refAtual;

          return (
            <li key={r} className="min-w-[5.75rem] flex-1">
              <button
                type="button"
                onClick={() => aoEscolher(r)}
                aria-current={atual ? "true" : undefined}
                className={`fin-toque min-h-11 w-full rounded-xl border px-2.5 py-2.5 text-left ${
                  atual
                    ? "border-ciano bg-ciano-tint"
                    : "border-border/70 bg-white hover:border-accent-soft"
                }`}
              >
                <span className="block text-2xs capitalize text-muted-foreground">
                  {mesCurto(r)}
                  {r.slice(0, 4) !== refAtual.slice(0, 4) && (
                    <span className="ml-1">/{r.slice(2, 4)}</span>
                  )}
                  {/* O mês na tela também é dito com palavra, e não só com a
                      moldura ciano: quem não enxerga cor precisa saber onde
                      está sem ter de tocar em tudo para descobrir. */}
                  {atual && <span className="sr-only"> (o mês que você está vendo)</span>}
                </span>
                <span
                  className={`mt-0.5 block truncate font-display text-sm font-semibold tabular-nums ${
                    valor > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {brl(valor)}
                </span>
                <span
                  aria-hidden
                  className="mt-1.5 block h-1 overflow-hidden rounded-full bg-gelo"
                >
                  <span
                    className="block h-full rounded-full bg-ciano transition-[width] duration-700 ease-out"
                    style={{ width: `${(valor / teto) * 100}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-2xs leading-relaxed text-muted-foreground">
        Só o que está em aberto: a parte já paga virou despesa na conta e sairia
        contada duas vezes.
      </p>
    </CartaoPainel>
  );
}
