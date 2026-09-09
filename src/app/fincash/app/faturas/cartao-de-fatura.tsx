"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  CreditCard,
  Pencil,
  ShoppingBag,
  Undo2,
  Wallet,
} from "lucide-react";
import {
  AnelProgresso,
  BotaoAcao,
  brl,
  brlExato,
  CartaoPainel,
  CartaoTransacao,
  Pastilha,
} from "../pecas";
import {
  arquivarCartao,
  cicloDaFatura,
  marcarFaturaPaga,
  type Fatura,
} from "@/lib/fincash/faturas";
import {
  mesVizinho,
  nomeDoMes,
  refDaData,
  type Cartao,
  type Categoria,
  type Conta,
  type Lancamento,
} from "@/lib/fincash/modelo";
import { diaMes, discoDoEstado, estadoDaFatura, porExtenso, quandoVence } from "./comum";

/**
 * Um cartão e a fatura dele no mês na tela.
 *
 * O BLOCO VIROU `CartaoPainel` na revisão visual. Antes cada cartão trazia uma
 * `CabecalhoGrupo` — a faixa saturada — no topo, e numa tela com três ou quatro
 * cartões aquilo empilhava três ou quatro tarjas laranja: a página inteira
 * gritava e, gritando tudo, nada chamava atenção. A faixa é peça de tabela
 * longa, onde ela marca onde um grupo começa; aqui o cabeçalho leve resolve, e
 * a cor entra só no disco do ícone.
 *
 * E O DISCO DIZ O ESTADO, não a cor que a pessoa escolheu para o cartão. A cor
 * pessoal continua na tela — no filete ao lado do número e no anel do limite —,
 * mas no cabeçalho ela seria enfeite ocupando o único lugar onde uma cor pode
 * dizer "esta aqui está atrasada".
 */
export function CartaoDeFatura({
  cartao,
  fatura,
  contas,
  categorias,
  lancamentos,
  aoMudar,
  aoEditar,
}: {
  cartao: Cartao;
  fatura: Fatura;
  contas: Conta[];
  categorias: Categoria[];
  lancamentos: Lancamento[];
  aoMudar: () => void;
  aoEditar: () => void;
}) {
  const [abrindoItens, setAbrindoItens] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const estado = estadoDaFatura(fatura);
  const uso = fatura.usoDoLimite === null ? null : fatura.usoDoLimite * 100;

  /* Até quando o comprometido vai. "R$ 4.200 já comprometidos" é meia
     informação; "até novembro de 2027" é a outra metade — e é a que faz alguém
     pensar duas vezes antes do próximo 12x. */
  const futuros = lancamentos.filter(
    (l) => l.cartao_id === cartao.id && l.data > fatura.ciclo.fim,
  );
  const ultimaData = futuros.map((l) => l.data).sort().at(-1);

  const parcelasFuturas = futuros.filter((l) => l.parcela_total !== null).length;

  return (
    <>
      <CartaoPainel
        titulo={cartao.nome}
        Icone={CreditCard}
        tom={discoDoEstado(estado.tom)}
        total={brl(fatura.total)}
        detalhe={`fecha ${diaMes(fatura.ciclo.fim)} · vence ${diaMes(fatura.ciclo.vencimento)}`}
        /* A lista de compras precisa encostar nas bordas do bloco: linha de
           lançamento com margem dos dois lados vira uma tabela flutuando dentro
           de um card, e o divisor deixa de separar a largura toda. */
        corpoSemPadding
      >
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            <div className="flex min-w-[13rem] flex-1 items-start gap-3">
              {/* O filete com a cor do cartão. É aqui que a cor pessoal trabalha:
                  encostada no número, ela diz de quem é o número — que é a
                  pergunta que se faz rolando uma pilha de cartões. */}
              <span
                aria-hidden
                className="mt-1 h-14 w-1.5 shrink-0 rounded-full"
                style={{ background: cartao.cor }}
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {fatura.aberto > 0 ? "A pagar" : "Fatura do período"}
                </p>
                {/* Vermelho SÓ no atraso. Fatura é saída de dinheiro, e pintar de
                    vermelho toda saída gasta o alarme em coisa normal — quando a
                    de verdade chegar, ninguém olha. */}
                <p
                  className={`mt-1 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums ${
                    estado.tom === "atrasado" ? "text-destructive" : "text-primary"
                  }`}
                >
                  {brl(fatura.aberto > 0 ? fatura.aberto : fatura.total)}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Pastilha
                    tom={estado.tom}
                    Icone={estado.tom === "atrasado" ? AlertTriangle : undefined}
                  >
                    {estado.palavra}
                  </Pastilha>
                  {fatura.parcelas.length > 0 && (
                    <Pastilha tom="fixa">
                      {fatura.parcelas.length === 1
                        ? "1 parcela aqui dentro"
                        : `${fatura.parcelas.length} parcelas aqui dentro`}
                    </Pastilha>
                  )}
                  {fatura.pago > 0 && fatura.aberto > 0 && (
                    <Pastilha tom="pago">{brl(fatura.pago)} já pagos</Pastilha>
                  )}
                </div>

                {/* O período de competência por extenso. É a linha que evita a
                    reclamação "esse valor está errado": a fatura não é o mês. */}
                <p className="mt-2.5 text-2xs leading-relaxed text-muted-foreground">
                  Compras de {porExtenso(fatura.ciclo.inicio)} a{" "}
                  {porExtenso(fatura.ciclo.fim)}
                  {fatura.ciclo.fechada ? " (já fechou)" : " — ainda pode entrar compra"}
                  . Vence {porExtenso(fatura.ciclo.vencimento)},{" "}
                  {quandoVence(fatura.ciclo)}.
                </p>

                {fatura.aberto > 0 && (
                  <div className="mt-3.5">
                    {/* SÓLIDO SÓ DEPOIS DE FECHAR. Com a fatura aberta, pagar
                        agora só traz mais compra para a mesma fatura (a janela
                        avisa isso) — o botão informa, não convida. É também o que
                        impede uma tela de quatro cartões de virar quatro laranjas
                        disputando o mesmo olhar. */}
                    <BotaoAcao
                      Icone={Wallet}
                      variante={fatura.ciclo.fechada ? "solido" : "contorno"}
                      className="w-full sm:w-auto"
                      onClick={() => setPagando(true)}
                    >
                      Pagar {brl(fatura.aberto)}
                    </BotaoAcao>
                  </div>
                )}
              </div>
            </div>

            {/* O anel só existe quando há limite cadastrado. Anel de "0% de
                nada" é enfeite que ocupa o lugar de informação. */}
            {uso !== null && (
              <div className="shrink-0">
                <AnelProgresso
                  valor={uso}
                  rotulo={`do limite de ${cartao.nome} em uso`}
                  centro={`${Math.round(uso)}%`}
                  legenda="do limite"
                  /* Abaixo de 85% o anel é a cor do cartão (identidade). Dali
                     para cima ele vira julgamento — e julgamento não pode ficar
                     na cor que a pessoa escolheu, senão um limite estourado em
                     verde-menta passa por boa notícia. */
                  cor={uso >= 85 ? undefined : cartao.cor}
                  tom={uso >= 100 ? "perigo" : "aviso"}
                  tamanho={112}
                />
                <p
                  className={`mt-0.5 max-w-[10rem] text-center text-2xs leading-snug tabular-nums ${
                    uso >= 100 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {uso >= 100
                    ? `passou do limite de ${brl(cartao.limite ?? 0)}`
                    : `sobram ${brl((cartao.limite ?? 0) * (1 - uso / 100))} de ${brl(cartao.limite ?? 0)}`}
                </p>
              </div>
            )}
          </div>

          {/* O COMPROMETIDO — a razão de a tela existir. Fica em ciano (é
              informação, não ação) e vem depois do número do mês, porque só faz
              sentido depois de a pessoa saber o de agora. */}
          {(fatura.proxima > 0 || fatura.comprometidoFuturo > 0) && (
            <div className="mt-4 rounded-xl bg-ciano-tint px-3.5 py-3">
              <p className="text-xs leading-relaxed text-ciano-forte">
                A próxima fatura, que vence{" "}
                {diaMes(
                  cicloDaFatura(cartao, mesVizinho(fatura.ciclo.ref, 1)).vencimento,
                )}
                ,{" "}
                <b className="font-semibold tabular-nums">
                  já tem {brl(fatura.proxima)}
                </b>
                .
              </p>
              {fatura.comprometidoFuturo > fatura.proxima && (
                <p className="mt-1 text-2xs leading-relaxed text-ciano-forte/85">
                  Somando todos os meses seguintes são{" "}
                  <span className="tabular-nums">
                    {brl(fatura.comprometidoFuturo)}
                  </span>{" "}
                  já comprometidos
                  {parcelasFuturas > 0 && (
                    <>
                      {" "}
                      em {parcelasFuturas}{" "}
                      {parcelasFuturas === 1 ? "parcela" : "parcelas"}
                    </>
                  )}
                  {ultimaData && (
                    <> — a última cai em {nomeDoMes(refDaData(ultimaData))}</>
                  )}
                  .
                </p>
              )}
            </div>
          )}

          {/* A lista de itens nasce fechada de propósito — ver o comentário do
              topo do `page.tsx`. O contador no rótulo é o que faz valer a pena
              abrir (ou não). */}
          {fatura.itens.length > 0 && (
            <button
              type="button"
              onClick={() => setAbrindoItens((v) => !v)}
              aria-expanded={abrindoItens}
              className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
            >
              <span>
                {abrindoItens ? "Esconder" : "Ver"} {fatura.itens.length}{" "}
                {fatura.itens.length === 1 ? "compra" : "compras"} desta fatura
              </span>
              <ChevronDown
                aria-hidden
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  abrindoItens ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          {fatura.itens.length === 0 && (
            <p className="mt-4 rounded-xl bg-gelo px-3.5 py-3 text-2xs leading-relaxed text-muted-foreground">
              Nenhuma compra caiu neste ciclo. Lançamentos feitos no cartão
              aparecem aqui automaticamente, na fatura em que a data da compra cai.
            </p>
          )}

          {erro && (
            <p role="status" className="mt-3 text-2xs text-destructive">
              {erro}
            </p>
          )}
        </div>

        {abrindoItens && fatura.itens.length > 0 && (
          <ItensDaFatura fatura={fatura} categorias={categorias} />
        )}

        {/* As ações do cadastro ficam no rodapé, secundárias: são raras perto de
            "pagar" e "olhar o valor", e disputar espaço com elas seria dar o
            mesmo peso a coisas de peso muito diferente. Alvo de 44px mesmo sendo
            raras — errar o toque aqui é arquivar um cartão sem querer. */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
          <BotaoAcao variante="contorno" tamanho="sm" Icone={Pencil} onClick={aoEditar}>
            Editar cartão
          </BotaoAcao>

          {confirmandoArquivo ? (
            /* Dois toques, não um. Arquivar some com o cartão da tela inteira, e
               desfazer isso exige achar uma tela de arquivados que a pessoa não
               sabe que existe. */
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-2xs text-muted-foreground">
                Arquivar {cartao.nome}? O histórico de compras continua.
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await arquivarCartao(cartao.id);
                    aoMudar();
                  } catch (e) {
                    setConfirmandoArquivo(false);
                    setErro((e as Error).message);
                  }
                }}
                className="inline-flex min-h-11 items-center rounded-xl bg-destructive/10 px-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15"
              >
                Arquivar
              </button>
              <BotaoAcao
                variante="contorno"
                tamanho="sm"
                onClick={() => setConfirmandoArquivo(false)}
              >
                Cancelar
              </BotaoAcao>
            </span>
          ) : (
            <BotaoAcao
              variante="contorno"
              tamanho="sm"
              Icone={Archive}
              onClick={() => setConfirmandoArquivo(true)}
            >
              Arquivar
            </BotaoAcao>
          )}
        </div>

      </CartaoPainel>

      {/* A janela mora FORA do bloco: dentro, ela seria um `fixed` com um
          ancestral `overflow-hidden`, e basta alguém pôr um `transform` no card
          um dia para a janela passar a ser recortada por ele. */}
      {pagando && (
        <ModalPagar
          cartao={cartao}
          fatura={fatura}
          contas={contas}
          aoFechar={() => setPagando(false)}
          aoPagar={async () => {
            setPagando(false);
            aoMudar();
          }}
        />
      )}
    </>
  );
}

/**
 * As compras da fatura, agrupadas por categoria.
 *
 * O TOTAL VIVE NO CABEÇALHO DO GRUPO porque a pergunta que se faz aqui é do
 * grupo inteiro ("quanto foi de mercado?"), não da linha. E o sinal segue a
 * regra da casa: estorno e cashback são `receita` e ABATEM o grupo, em vez de
 * somar — é por isso que um grupo pode aparecer negativo.
 *
 * NA REVISÃO VISUAL cada linha virou `CartaoTransacao`, a mesma peça do painel
 * e dos lançamentos. Ganhou o disco colorido da categoria (o olho filtra a
 * lista antes de ler), os 56px de altura de toque e o valor com sinal em
 * tabular — antes eram linhas de 34px desenhadas à mão só aqui, e "a mesma
 * compra" aparecia de um jeito no painel e de outro dentro da fatura.
 */
function ItensDaFatura({
  fatura,
  categorias,
}: {
  fatura: Fatura;
  categorias: Categoria[];
}) {
  const cats = new Map(categorias.map((c) => [c.id, c]));

  type Grupo = { nome: string; cor: string; total: number; itens: Lancamento[] };
  const grupos = new Map<string, Grupo>();

  for (const l of fatura.itens) {
    const chave = l.categoria_id ?? "sem";
    const atual: Grupo = grupos.get(chave) ?? {
      nome: cats.get(chave)?.nome ?? "Sem categoria",
      cor: cats.get(chave)?.cor ?? "#cbd5e1",
      total: 0,
      itens: [],
    };
    atual.total += l.tipo === "despesa" ? l.valor : -l.valor;
    atual.itens.push(l);
    grupos.set(chave, atual);
  }

  const ordenados = [...grupos.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="border-t border-border/60">
      {ordenados.map((g) => (
        <section key={g.nome}>
          <div className="flex items-center gap-2.5 border-b border-border/50 bg-gelo px-4 py-2 sm:px-5">
            <span
              aria-hidden
              className="h-3 w-1 shrink-0 rounded-full"
              style={{ background: g.cor }}
            />
            <h3 className="min-w-0 flex-1 truncate text-2xs font-semibold uppercase tracking-wider text-primary">
              {g.nome}
            </h3>
            {/* Grupo negativo é crédito: leva "+" e verde, como qualquer
                entrada do app. Sem o sinal, "R$ 50" abatendo a fatura lê
                igualzinho a "R$ 50" somando nela. */}
            <span
              className={`shrink-0 text-2xs font-semibold tabular-nums ${
                g.total < 0 ? "text-success-strong" : "text-primary"
              }`}
            >
              {g.total < 0 ? "+" : "−"} {brlExato(Math.abs(g.total))}
            </span>
          </div>

          <ul className="divide-y divide-border/50">
            {g.itens.map((l) => (
              <li key={l.id}>
                <CartaoTransacao
                  descricao={l.descricao}
                  valor={l.valor}
                  sinal={l.tipo === "receita" ? "entrada" : "saida"}
                  quando={diaMes(l.data)}
                  categoria={
                    l.parcela_total
                      ? `parcela ${l.parcela_num}/${l.parcela_total}`
                      : undefined
                  }
                  cor={g.cor}
                  Icone={l.tipo === "receita" ? Undo2 : ShoppingBag}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Pagar a fatura.
 *
 * A JANELA EXISTE POR CAUSA DE UMA PERGUNTA SÓ — de qual conta sai. Pagar
 * fatura é a maior saída do mês para a maioria das pessoas, e debitá-la da
 * conta errada estraga o saldo das duas de uma vez.
 *
 * O texto diz em voz alta o que vai acontecer nas duas pontas (despesa na conta
 * + itens baixados) porque isso NÃO é óbvio: quem clica em "pagar" num app de
 * finanças costuma achar que está só marcando um risquinho.
 *
 * E QUEM FAZ É O MOTOR, `marcarFaturaPaga` — nunca um update daqui. São duas
 * escritas, e fazer só a dos itens deixaria o saldo mentindo para cima
 * enquanto a projeção de 12 meses continuaria contando uma fatura já paga.
 */
function ModalPagar({
  cartao,
  fatura,
  contas,
  aoFechar,
  aoPagar,
}: {
  cartao: Cartao;
  fatura: Fatura;
  contas: Conta[];
  aoFechar: () => void;
  aoPagar: () => void;
}) {
  /* O padrão é a conta de pagamento do cartão — é o que a pessoa cadastrou
     justamente para não ter de escolher toda vez. */
  const [contaId, setContaId] = useState(
    cartao.conta_pagamento_id ?? contas[0]?.id ?? "",
  );
  /* E a data padrão é o VENCIMENTO, não hoje: pagar adiantado no dia 28 uma
     fatura que vence dia 5 não muda o mês de competência do gasto. */
  const [data, setData] = useState(fatura.ciclo.vencimento);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sair = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [aoFechar]);

  const naFatura = fatura.itens.filter((l) => !l.pago).length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!contaId) return;
    setSalvando(true);
    try {
      await marcarFaturaPaga(cartao, fatura, contaId, data);
      aoPagar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-pagar"
    >
      {/* A sombra vem da folha do app, como a das outras janelas: era
          `shadow-elevated`, a do site institucional, e duas receitas de sombra
          no mesmo app é o que faz parecer montado por duas pessoas. */}
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7"
      >
        <h2
          id="titulo-pagar"
          className="font-display text-lg font-semibold text-primary"
        >
          Pagar a fatura do {cartao.nome}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Vence {porExtenso(fatura.ciclo.vencimento)} · {quandoVence(fatura.ciclo)}
        </p>

        <p className="mt-4 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums text-primary">
          {brlExato(fatura.aberto)}
        </p>

        {!fatura.ciclo.fechada && (
          <p className="mt-3 rounded-xl bg-accent-tint px-3.5 py-2.5 text-2xs leading-relaxed text-accent-strong">
            Esta fatura ainda não fechou (fecha {porExtenso(fatura.ciclo.fim)}).
            Compras feitas até lá vão entrar nela e ficarão em aberto de novo.
          </p>
        )}

        {contas.length === 0 ? (
          <p className="mt-4 rounded-xl bg-accent-tint px-3.5 py-3 text-2xs leading-relaxed text-muted-foreground">
            Você ainda não tem conta cadastrada, e a fatura precisa sair de
            alguma.{" "}
            <Link
              href="/fincash/app/contas"
              className="font-semibold text-accent-strong underline underline-offset-2"
            >
              Cadastrar uma conta
            </Link>
            .
          </p>
        ) : (
          <>
            <label className="mt-5 block">
              <span className="text-xs font-medium text-muted-foreground">
                Sai de qual conta
              </span>
              <select
                autoFocus
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-muted-foreground">
                Quando foi (ou vai ser) pago
              </span>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
            </label>

            <p className="mt-4 rounded-xl bg-gelo px-3.5 py-3 text-2xs leading-relaxed text-muted-foreground">
              Vai nascer uma despesa de{" "}
              <b className="font-semibold tabular-nums text-primary">
                {brlExato(fatura.aberto)}
              </b>{" "}
              na conta escolhida — é ela que tira o dinheiro do seu saldo — e{" "}
              {naFatura === 1
                ? "a compra desta fatura vai"
                : `as ${naFatura} compras desta fatura vão`}{" "}
              ficar marcadas como pagas.
            </p>
          </>
        )}

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <BotaoAcao variante="contorno" larguraTotal onClick={aoFechar}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            larguraTotal
            desabilitado={salvando || !contaId}
          >
            {salvando ? "Pagando…" : "Confirmar pagamento"}
          </BotaoAcao>
        </div>
      </form>
    </div>
  );
}
