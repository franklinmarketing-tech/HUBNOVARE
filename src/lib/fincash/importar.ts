/**
 * A importação de extrato — a parte que fala com o banco.
 *
 * O parse mora em `ofx.ts`, puro e testável. Aqui está o que precisa de
 * sessão: descobrir o que JÁ foi importado antes, gravar os lançamentos
 * confirmados e registrar a importação no histórico.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * A DEDUPLICAÇÃO, que é a parte que não pode falhar
 * ═══════════════════════════════════════════════════════════════════════════
 * Três camadas, e cada uma existe porque a anterior não cobre tudo:
 *
 *   1. **Dentro do arquivo** (`separarRepetidasNoArquivo`, em `ofx.ts`). O
 *      mesmo FITID repetido no próprio export — comum quando a pessoa pede um
 *      período que se sobrepõe a outro.
 *
 *   2. **Contra o que já entrou** (`marcarJaImportadas`, aqui). Uma consulta a
 *      `fin_import_itens` pelas chaves do arquivo. É o que faz a PRÉVIA dizer
 *      "estas 47 já estão no app" antes de gravar qualquer coisa — informação,
 *      não garantia.
 *
 *   3. **O índice único do banco** (`fin_import_itens_chave_uk`). Esta é a
 *      garantia. As duas primeiras camadas informam; só o índice impede. Um
 *      `select` antes de inserir tem uma janela entre ler e escrever, e duas
 *      abas abertas, um toque duplo no botão ou uma retentativa de rede caem
 *      dentro dela.
 *
 * A ORDEM DA GRAVAÇÃO É INVERTIDA DE PROPÓSITO: a chave é reservada ANTES do
 * lançamento existir. Se fosse ao contrário — gravar o lançamento e depois a
 * chave —, uma chave recusada pelo índice deixaria para trás um lançamento
 * duplicado já visível no saldo, e caberia ao app apagá-lo (com o app talvez
 * já fechado). Reservando primeiro, o pior caso é uma chave órfã com
 * `lancamento_id` nulo: invisível para a pessoa e inofensiva para o saldo.
 *
 * ⚠️ A REGRA DO SINAL vale aqui como em todo o FINCASH: `valor` é SEMPRE
 * positivo e o sinal vem de `tipo`. O `ofx.ts` já entrega assim; este arquivo
 * não mexe no número.
 */

import { createClient } from "@/lib/supabase/client";
import { casarCategoria } from "@/lib/fincash/whatsapp";
import {
  separarRepetidasNoArquivo,
  type ExtratoOfx,
  type TransacaoOfx,
} from "@/lib/fincash/ofx";
import { cicloQueContem } from "@/lib/fincash/faturas";
import type {
  Cartao,
  Categoria,
  Conta,
  Lancamento,
} from "@/lib/fincash/modelo";

// ── Tipos ───────────────────────────────────────────────────────────────────

/** Por que uma linha não vai entrar. `null` = vai entrar. */
export type MotivoIgnorada = "repetida-no-arquivo" | "ja-importada";

export type LinhaPrevia = {
  /** Identidade da linha na TELA (a chave pode repetir entre ignoradas). */
  id: string;
  transacao: TransacaoOfx;
  /** Desmarcada pela pessoa ou bloqueada pela dedup. */
  incluir: boolean;
  ignorada: MotivoIgnorada | null;
  /** Sugestão do casador do WhatsApp. A pessoa troca na prévia. */
  categoria_id: string | null;
  categoria_nome: string | null;
  /**
   * Só quando o destino é CARTÃO: o mês do VENCIMENTO da fatura em que a
   * compra cai. A competência da fatura é a do vencimento, não a da compra
   * (ver `faturas.ts`) — e mostrar isso na prévia é o que evita a pergunta
   * "por que a compra de 28/03 apareceu na fatura de abril?".
   */
  faturaRef: string | null;
};

export type Destinos = {
  contas: Conta[];
  cartoes: Cartao[];
  categorias: Categoria[];
};

export type Importacao = {
  id: string;
  arquivo: string;
  banco: string | null;
  conta_id: string | null;
  cartao_id: string | null;
  periodo_de: string | null;
  periodo_ate: string | null;
  lidas: number;
  importadas: number;
  ignoradas: number;
  criado_em: string;
};

// ── Leitura ─────────────────────────────────────────────────────────────────

/**
 * Contas, cartões e categorias — numa viagem só.
 *
 * Em paralelo pelo mesmo motivo de `carregarMes`: cascata numa tela que já
 * espera o arquivo ser lido é meio segundo perdido sem nada em troca.
 */
export async function carregarDestinos(): Promise<Destinos> {
  const supabase = createClient();

  const [contas, cartoes, cats] = await Promise.all([
    supabase.from("fin_contas").select("*").eq("arquivada", false).order("nome"),
    supabase.from("fin_cartoes").select("*").eq("arquivado", false).order("nome"),
    supabase.from("fin_categorias").select("*").eq("arquivada", false).order("nome"),
  ]);

  const erro = contas.error ?? cartoes.error ?? cats.error;
  if (erro) throw erro;

  return {
    contas: (contas.data ?? []) as Conta[],
    cartoes: (cartoes.data ?? []) as Cartao[],
    categorias: (cats.data ?? []) as Categoria[],
  };
}

/**
 * Quais destas chaves o app já viu.
 *
 * EM LOTES porque a lista de chaves vira um filtro `in (...)` na URL da
 * consulta, e um extrato anual passa de 600 linhas — URL longa demais volta
 * como erro de servidor, não como resultado vazio, e o sintoma seria "a dedup
 * parou de funcionar em extrato grande", que é exatamente o caso em que ela
 * mais importa.
 */
export async function chavesJaImportadas(chaves: string[]): Promise<Set<string>> {
  const supabase = createClient();
  const vistas = new Set<string>();
  const LOTE = 200;

  for (let i = 0; i < chaves.length; i += LOTE) {
    const { data, error } = await supabase
      .from("fin_import_itens")
      .select("chave")
      .in("chave", chaves.slice(i, i + LOTE));
    if (error) throw error;
    for (const l of data ?? []) vistas.add(l.chave as string);
  }

  return vistas;
}

// ── Prévia ──────────────────────────────────────────────────────────────────

/**
 * O arquivo lido → as linhas que a tela mostra.
 *
 * A CATEGORIA VEM DO CASADOR DO WHATSAPP (`casarCategoria`), e não de uma
 * tabela de palavras própria daqui. Dois casadores divergentes seriam o mesmo
 * gasto caindo em categorias diferentes conforme a porta de entrada — o
 * "MERCADO SAO JOSE" digitado no WhatsApp iria para Mercado e o mesmo
 * "MERCADO SAO JOSE" vindo do extrato iria para Outros. Gráfico que muda de
 * resposta conforme por onde o dado entrou é gráfico em que ninguém confia.
 *
 * Ele casa contra as categorias que a PESSOA cadastrou e devolve `null` quando
 * não tem certeza; sem categoria é um estado legítimo e honesto, e a prévia
 * deixa escolher antes de gravar.
 *
 * NADA AQUI GRAVA. A pessoa confirma primeiro — importação que grava direto e
 * erra a categoria de 200 linhas gera mais trabalho do que economiza.
 */
export function montarPrevia(
  extrato: ExtratoOfx,
  categorias: Categoria[],
  jaImportadas: Set<string>,
  cartao?: Cartao | null,
  hoje?: string,
): LinhaPrevia[] {
  const { repetidas } = separarRepetidasNoArquivo(extrato.transacoes);
  const idsRepetidas = new Set(repetidas);

  return extrato.transacoes.map((t, i) => {
    const ignorada: MotivoIgnorada | null = idsRepetidas.has(t)
      ? "repetida-no-arquivo"
      : jaImportadas.has(t.chave)
        ? "ja-importada"
        : null;

    const cat = casarCategoria(t.descricao, categorias, t.tipo);

    return {
      id: `${i}-${t.chave}`,
      transacao: t,
      incluir: ignorada === null,
      ignorada,
      categoria_id: cat?.id ?? null,
      categoria_nome: cat?.nome ?? null,
      faturaRef: cartao ? cicloQueContem(cartao, t.data, hoje).ref : null,
    };
  });
}

/** O placar da prévia, para o cabeçalho da tela. */
export function contarPrevia(linhas: LinhaPrevia[]) {
  let novas = 0;
  let repetidas = 0;
  let entradas = 0;
  let saidas = 0;
  let semCategoria = 0;

  for (const l of linhas) {
    if (l.ignorada) {
      repetidas++;
      continue;
    }
    novas++;
    if (!l.incluir) continue;
    if (!l.categoria_id) semCategoria++;
    if (l.transacao.tipo === "receita") entradas += l.transacao.valor;
    else saidas += l.transacao.valor;
  }

  return {
    total: linhas.length,
    novas,
    repetidas,
    marcadas: linhas.filter((l) => l.incluir).length,
    semCategoria,
    entradas: Math.round(entradas * 100) / 100,
    saidas: Math.round(saidas * 100) / 100,
  };
}

// ── Gravação ────────────────────────────────────────────────────────────────

export type DestinoEscolhido =
  | { conta_id: string; cartao_id?: null }
  | { conta_id?: null; cartao_id: string };

export type ResultadoImportacao = {
  importacaoId: string;
  importadas: number;
  /** Repetidas + o que a pessoa desmarcou + o que o índice recusou na hora. */
  ignoradas: number;
};

/**
 * Grava o que a pessoa confirmou.
 *
 * O PASSO A PASSO, e por que ele é assim:
 *
 *   1. Abre a importação no histórico. Ela nasce com o placar zerado e é
 *      fechada no fim — assim, se o navegador cair no meio, sobra o registro
 *      de que houve uma tentativa, que é o que permite explicar depois de onde
 *      vieram as linhas que entraram.
 *
 *   2. RESERVA AS CHAVES em `fin_import_itens`, com `ignoreDuplicates`. O
 *      `select()` no fim devolve só as que o índice ACEITOU — as recusadas
 *      simplesmente não voltam. É esse retorno, e não uma consulta prévia, que
 *      decide o que será gravado: entre a consulta e a escrita cabe uma
 *      segunda aba fazendo a mesma importação.
 *
 *   3. Insere os lançamentos SÓ das chaves reservadas, e devolve os ids.
 *
 *   4. Costura `lancamento_id` de volta nos itens, para o histórico saber
 *      apontar cada linha.
 *
 * `pago: true` porque extrato é o que JÁ ACONTECEU — é dinheiro que saiu da
 * conta. Marcar como previsto faria o saldo do app ficar abaixo do saldo real
 * do banco, que é o oposto do motivo de importar.
 */
export async function gravarImportacao(args: {
  arquivo: string;
  extrato: ExtratoOfx;
  linhas: LinhaPrevia[];
  destino: DestinoEscolhido;
}): Promise<ResultadoImportacao> {
  const supabase = createClient();
  const conta_id = args.destino.conta_id ?? null;
  const cartao_id = args.destino.cartao_id ?? null;

  const escolhidas = args.linhas.filter((l) => l.incluir && !l.ignorada);

  const { data: imp, error: erroImp } = await supabase
    .from("fin_importacoes")
    .insert({
      arquivo: args.arquivo.slice(0, 200),
      banco: args.extrato.conta.banco,
      conta_id,
      cartao_id,
      periodo_de: args.extrato.inicio,
      periodo_ate: args.extrato.fim,
      lidas: args.extrato.transacoes.length,
    })
    .select("id")
    .single();
  if (erroImp) throw erroImp;
  const importacaoId = imp.id as string;

  const fechar = async (importadas: number) => {
    await supabase
      .from("fin_importacoes")
      .update({ importadas, ignoradas: args.extrato.transacoes.length - importadas })
      .eq("id", importacaoId);
  };

  if (escolhidas.length === 0) {
    await fechar(0);
    return { importacaoId, importadas: 0, ignoradas: args.extrato.transacoes.length };
  }

  // 2. Reserva. `ignoreDuplicates` transforma a violação do índice em silêncio
  //    em vez de erro: uma linha já vista não deve derrubar as outras 199.
  const { data: reservados, error: erroChaves } = await supabase
    .from("fin_import_itens")
    .upsert(
      escolhidas.map((l) => ({ importacao_id: importacaoId, chave: l.transacao.chave })),
      { onConflict: "user_id,chave", ignoreDuplicates: true },
    )
    .select("id, chave");
  if (erroChaves) throw erroChaves;

  const porChave = new Map(escolhidas.map((l) => [l.transacao.chave, l]));
  const aGravar = (reservados ?? [])
    .map((r) => ({ itemId: r.id as string, linha: porChave.get(r.chave as string) }))
    .filter((x): x is { itemId: string; linha: LinhaPrevia } => Boolean(x.linha));

  if (aGravar.length === 0) {
    await fechar(0);
    return { importacaoId, importadas: 0, ignoradas: args.extrato.transacoes.length };
  }

  // 3. Os lançamentos. `user_id` não vai: quem preenche é o `default
  //    auth.uid()` do banco (ver o fim de `fincash.sql`).
  const { data: criados, error: erroLanc } = await supabase
    .from("fin_lancamentos")
    .insert(
      aGravar.map(({ linha }) => ({
        tipo: linha.transacao.tipo,
        descricao: linha.transacao.descricao,
        valor: linha.transacao.valor,
        data: linha.transacao.data,
        categoria_id: linha.categoria_id,
        conta_id,
        cartao_id,
        pago: true,
        // De onde veio, em português, na própria linha: é o que responde
        // "esse lançamento eu criei ou o extrato trouxe?" três meses depois.
        observacao: `Importado do extrato ${args.arquivo}`.slice(0, 200),
      })),
    )
    .select("id");
  if (erroLanc) throw erroLanc;

  // 4. Costura. O `insert` do PostgREST devolve na MESMA ordem em que foi
  //    enviado, então o índice basta — e uma consulta a mais só para reencontrar
  //    o que acabamos de criar seria trabalho sem ganho.
  const ids = (criados ?? []) as { id: string }[];
  await Promise.all(
    aGravar.map(({ itemId }, i) =>
      ids[i]
        ? supabase
            .from("fin_import_itens")
            .update({ lancamento_id: ids[i].id })
            .eq("id", itemId)
        : Promise.resolve(),
    ),
  );

  const importadas = ids.length;
  await fechar(importadas);

  return {
    importacaoId,
    importadas,
    ignoradas: args.extrato.transacoes.length - importadas,
  };
}

/** As últimas importações — o histórico que a tela mostra no rodapé. */
export async function listarImportacoes(limite = 8): Promise<Importacao[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fin_importacoes")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as Importacao[];
}

/**
 * Desfaz uma importação inteira.
 *
 * Existe porque a alternativa é a pessoa apagar 200 linhas na mão — e um
 * importador sem volta é um importador que ninguém experimenta. As CHAVES
 * ficam? Não: aqui elas somem junto, senão reimportar o mesmo arquivo depois de
 * desfazer não traria nada de volta e a tela diria "tudo repetido", o que
 * pareceria defeito.
 */
export async function desfazerImportacao(importacaoId: string): Promise<number> {
  const supabase = createClient();

  const { data: itens, error } = await supabase
    .from("fin_import_itens")
    .select("id, lancamento_id")
    .eq("importacao_id", importacaoId);
  if (error) throw error;

  const lancamentos = (itens ?? [])
    .map((i) => i.lancamento_id as string | null)
    .filter((id): id is string => Boolean(id));

  if (lancamentos.length > 0) {
    const { error: erroDel } = await supabase
      .from("fin_lancamentos")
      .delete()
      .in("id", lancamentos);
    if (erroDel) throw erroDel;
  }

  await supabase.from("fin_import_itens").delete().eq("importacao_id", importacaoId);
  await supabase.from("fin_importacoes").delete().eq("id", importacaoId);

  return lancamentos.length;
}

/** Só para a tela de resultado saber quais linhas nasceram. */
export type LancamentoImportado = Pick<
  Lancamento,
  "descricao" | "valor" | "data" | "tipo"
>;
