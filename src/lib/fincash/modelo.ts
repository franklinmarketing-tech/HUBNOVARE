/**
 * O FINCASH — modelo e contas.
 *
 * ONDE ELE VIVE
 * Em tabelas próprias com prefixo `fin_` (ver `supabase/fincash.sql`), e
 * não no `tool_states` das calculadoras. O motivo está escrito lá; o resumo é
 * que blob JSON não aguenta 800 lançamentos, não deixa consultar por período,
 * e o consultor precisa conseguir ler para fazer a revisão trimestral.
 *
 * A REGRA DO SINAL, e ela vale para o arquivo inteiro:
 * **`valor` é SEMPRE positivo.** O sinal vem de `tipo`. Guardar despesa como
 * número negativo E ter um campo de tipo é como se soma o mesmo sinal duas
 * vezes e o saldo aparece errado — e saldo errado num app de dinheiro é o
 * defeito que faz a pessoa desinstalar.
 */

import { createClient } from "@/lib/supabase/client";
import {
  agregarPorCategoria,
  chaveOrcamento,
  proximaOrdem,
  trocarOrdem,
  type ModoOrcamento,
  type Orcamento,
} from "./categorias";

export type TipoLancamento = "receita" | "despesa";
export type TipoConta = "corrente" | "poupanca" | "carteira" | "investimento";
export type GrupoCategoria = "necessidades" | "estilo" | "futuro";

export type Conta = {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldo_inicial: number;
  cor: string;
  arquivada: boolean;
};

export type Cartao = {
  id: string;
  nome: string;
  limite: number | null;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_pagamento_id: string | null;
  cor: string;
  arquivado: boolean;
};

export type Categoria = {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  grupo: GrupoCategoria | null;
  cor: string;
  arquivada: boolean;
  /** Nulo = categoria. Preenchido = SUBcategoria do pai (`fincash_v3.sql`).
   *
   *  Opcional no tipo, e não `string | null` obrigatório, porque o banco de
   *  quem ainda não rodou o v3 não devolve a coluna — e tela que quebra por
   *  campo ausente transforma "falta rodar um SQL" em "o app parou". */
  pai_id?: string | null;
  /** Posição na lista, definida pela pessoa. Esparsa de 10 em 10. */
  ordem?: number;
};

export type Lancamento = {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  /** yyyy-mm-dd */
  data: string;
  categoria_id: string | null;
  /** A subcategoria, quando a pessoa detalhou (`fincash_v3.sql`).
   *
   *  OPCIONAL, e é a decisão que torna a migração indolor: o lançamento que já
   *  existe não tem este campo, continua válido e continua somando na categoria
   *  pai. `categoria_id` NUNCA aponta para uma subcategoria — é sempre o pai,
   *  e um gatilho no banco garante isso. Assim toda tela que agrupa por
   *  categoria continua certa sem ter sido tocada. */
  subcategoria_id?: string | null;
  conta_id: string | null;
  cartao_id: string | null;
  /** Falso = previsto. Conta a pagar, salário que ainda não caiu. */
  pago: boolean;
  parcela_num: number | null;
  parcela_total: number | null;
  observacao: string | null;
  /** Qual regra gerou este lançamento, quando veio de uma.
   *
   *  OPCIONAL no tipo (e não `string | null` obrigatório) porque
   *  `NovoLancamento` é um `Omit<Lancamento, "id">`: torná-lo obrigatório faria
   *  toda tela que grava um lançamento avulso ter de passar `null` à mão. Vem
   *  preenchido do banco, que é onde a projeção precisa dele — é por este campo
   *  que ela sabe que a recorrência do mês já virou lançamento e não deve ser
   *  contada duas vezes. */
  recorrencia_id?: string | null;
  /** A lixeira (`supabase/fincash_lixeira.sql`). Nulo = vivo.
   *
   *  OPCIONAL pela mesma razão de `pai_id` e `ordem`: o banco de quem ainda não
   *  rodou o aditivo não devolve a coluna, e tipo obrigatório aqui viraria
   *  `undefined` circulando como se fosse dado. Quem lê isto quase nunca precisa
   *  do campo — as leituras já vêm filtradas (ver `semApagados`) —, ele existe
   *  para a tela da lixeira poder dizer há quanto tempo aquilo está lá. */
  apagado_em?: string | null;
};

export type Recorrencia = {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  categoria_id: string | null;
  conta_id: string | null;
  cartao_id: string | null;
  frequencia: "mensal" | "semanal" | "anual";
  /** Dia do mês em que cai. */
  dia: number;
  inicio: string;
  fim: string | null;
  ativa: boolean;
};

/** O que uma tela precisa para desenhar o mês inteiro, numa viagem só. */
export type Mes = {
  lancamentos: Lancamento[];
  contas: Conta[];
  cartoes: Cartao[];
  categorias: Categoria[];
  recorrencias: Recorrencia[];
};

// ── Datas ───────────────────────────────────────────────────────────────────
// Tudo em yyyy-mm-dd e sempre no fuso local. `new Date("2026-03-01")` é lido
// como UTC pelo JS e, no Brasil, volta como 28 de fevereiro — o bug clássico
// que joga o lançamento para o mês errado.

/** O `ref` de um mês: "2026-03". */
export const refDoMes = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Primeiro e último dia do mês, em yyyy-mm-dd. */
export function limitesDoMes(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return {
    inicio: `${ref}-01`,
    fim: `${ref}-${String(ultimo).padStart(2, "0")}`,
  };
}

/** "2026-03" → "março de 2026". */
export function nomeDoMes(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** Anda `n` meses a partir de um ref, para frente ou para trás. */
export function mesVizinho(ref: string, n: number) {
  const [ano, mes] = ref.split("-").map(Number);
  return refDoMes(new Date(ano, mes - 1 + n, 1));
}

/* Daqui para baixo, os utilitários que faturas.ts, metas.ts e investimentos.ts
   compartilham. Eles moram AQUI, e não em cada arquivo, porque data em app de
   dinheiro é onde o bug mora: bastaria uma das três telas clampar o dia 31 de
   um jeito diferente para a fatura de fevereiro cair no mês errado e o cliente
   ver duas datas para o mesmo evento. Uma implementação só, um bug só. */

/** Um `Date` local em yyyy-mm-dd. */
export function dataIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Hoje em yyyy-mm-dd. Parâmetro para os testes poderem fixar o dia. */
export const hojeIso = () => dataIso(new Date());

/** "2026-03-15" → "2026-03". Fatiar é de propósito: `new Date` da string ISO é
    lido como UTC e, no Brasil, volta um dia antes — o bug que joga o lançamento
    do dia 1º para o mês anterior. */
export const refDaData = (data: string) => data.slice(0, 7);

/** Quantos dias tem o mês. */
export function ultimoDiaDoMes(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

/**
 * Um dia dentro do mês, com a guarda do mês curto.
 *
 * Dia 31 em fevereiro vira 28 (ou 29), e não 3 de março. É o clamp que faz a
 * fatura que fecha no dia 31 continuar fechando no fim do mês em vez de
 * escorregar para o mês seguinte e criar um ciclo de 32 dias seguido de um de
 * 27 — que é exatamente como um app de finanças perde a confiança do usuário.
 */
export function diaNoMes(ref: string, dia: number) {
  const d = Math.min(Math.max(Math.trunc(dia), 1), ultimoDiaDoMes(ref));
  return `${ref}-${String(d).padStart(2, "0")}`;
}

/** Anda `n` dias a partir de uma data ISO. */
export function somarDias(data: string, n: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return dataIso(new Date(ano, mes - 1, dia + n));
}

/** Dias entre duas datas ISO. Em UTC para o horário de verão não devolver
    23 ou 25 horas e o arredondamento comer um dia. */
export function diasEntre(de: string, ate: string) {
  const [a1, a2, a3] = de.split("-").map(Number);
  const [b1, b2, b3] = ate.split("-").map(Number);
  return Math.round(
    (Date.UTC(b1, b2 - 1, b3) - Date.UTC(a1, a2 - 1, a3)) / 86_400_000,
  );
}

/** Meses cheios entre dois refs: `mesesEntre("2026-01", "2026-04")` = 3. */
export function mesesEntre(de: string, ate: string) {
  const [a1, a2] = de.split("-").map(Number);
  const [b1, b2] = ate.split("-").map(Number);
  return (b1 - a1) * 12 + (b2 - a2);
}

// ── Leitura ─────────────────────────────────────────────────────────────────

// ── A lixeira, do lado da leitura ───────────────────────────────────────────
/**
 * TODA leitura de `fin_lancamentos` deste arquivo passa por aqui.
 *
 * POR QUE UM ENVELOPE, e não um `.is("apagado_em", null)` solto em cada consulta
 * Porque o filtro só é seguro num banco que já rodou `fincash_lixeira.sql`. Num
 * que não rodou, `.is("apagado_em", null)` é erro de coluna inexistente (42703)
 * e derruba o PAINEL de quem só queria ver o saldo — trocar "o cliente perdeu um
 * lançamento" por "o app não abre" não é conserto. Então tenta com o filtro e,
 * *só* no erro específico de coluna que falta, refaz sem ele.
 *
 * A segunda tentativa NÃO é o comportamento normal: é a ponte para quem ainda
 * não rodou o aditivo. Quando ele estiver rodado em todo mundo, este envelope
 * vira uma linha só.
 *
 * ⚠️ Isto é a primeira tranca, não a única. A de verdade é a policy restritiva
 * do SQL, que torna o apagado invisível para QUALQUER consulta com a chave
 * anônima — inclusive as que vivem em arquivos que este aqui não controla
 * (`faturas.ts`, `importar.ts`, `projecao/carga.ts`). Filtro escrito à mão
 * protege a consulta que alguém lembrou de proteger; a policy protege as outras.
 */
function colunaDaLixeiraAusente(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const e = erro as { code?: unknown; message?: unknown };
  if (e.code === "42703") return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("apagado_em");
}

type Resposta<T> = { data: T[] | null; error: unknown };

async function semApagados<T>(
  consulta: (filtrar: boolean) => PromiseLike<Resposta<T>>,
): Promise<Resposta<T>> {
  const r = await consulta(true);
  if (r.error && colunaDaLixeiraAusente(r.error)) return consulta(false);
  return r;
}

/**
 * Carrega um mês inteiro.
 *
 * Quatro consultas em paralelo, e não uma cascata: cascata numa tela que a
 * pessoa abre todo dia é meio segundo perdido por visita, sem nada em troca.
 */
export async function carregarMes(ref: string): Promise<Mes> {
  const supabase = createClient();
  const { inicio, fim } = limitesDoMes(ref);

  const [lanc, contas, cartoes, cats, recs] = await Promise.all([
    /* Sem o que está na lixeira — senão o mês na tela soma dinheiro que a
       pessoa apagou, e o resumo do topo diverge do saldo da conta. */
    semApagados((filtrar) => {
      const q = supabase
        .from("fin_lancamentos")
        .select("*")
        .gte("data", inicio)
        .lte("data", fim);
      return (filtrar ? q.is("apagado_em", null) : q).order("data", {
        ascending: false,
      });
    }),
    supabase.from("fin_contas").select("*").eq("arquivada", false).order("nome"),
    supabase.from("fin_cartoes").select("*").eq("arquivado", false).order("nome"),
    /* Continua ordenando por NOME no banco, e não por `ordem`, mesmo depois do
       v3: `.order("ordem")` num banco que ainda não rodou o v3 é erro de coluna
       inexistente, e derrubaria o painel inteiro de quem só queria ver o saldo.
       A ordem da pessoa é aplicada em memória por `montarArvore`, que é onde a
       árvore é montada de qualquer jeito.

       Vêm PAIS E FILHAS na mesma consulta: hierarquia se monta em memória, não
       com uma ida ao banco por nível. */
    supabase.from("fin_categorias").select("*").eq("arquivada", false).order("nome"),
    supabase.from("fin_recorrencias").select("*").eq("ativa", true).order("dia"),
  ]);

  const erro =
    lanc.error ?? contas.error ?? cartoes.error ?? cats.error ?? recs.error;
  if (erro) throw erro;

  return {
    lancamentos: (lanc.data ?? []) as Lancamento[],
    contas: (contas.data ?? []) as Conta[],
    cartoes: (cartoes.data ?? []) as Cartao[],
    categorias: (cats.data ?? []) as Categoria[],
    recorrencias: (recs.data ?? []) as Recorrencia[],
  };
}

/**
 * A base da EXPORTAÇÃO: o histórico inteiro, sem recorte de mês.
 *
 * Mora aqui, e não na tela de Dados, porque é leitura de `fin_lancamentos` — e a
 * regra desta casa é que toda leitura de lançamento passa pelo mesmo envelope de
 * lixeira. Uma consulta ampla escrita na tela seria justamente a que ninguém
 * lembraria de filtrar, e o CSV sairia com o que a pessoa apagou.
 *
 * CONTAS, CARTÕES E CATEGORIAS VÊM INCLUSIVE ARQUIVADOS, ao contrário de
 * `carregarMes`: a planilha resolve o id em NOME, e um lançamento de dois anos
 * atrás aponta para a conta que a pessoa já fechou. Filtrando os arquivados, a
 * coluna "Conta" sairia vazia justamente nas linhas antigas — que são as que só
 * existem no arquivo exportado.
 *
 * SEM PAGINAÇÃO, e é uma decisão consciente: o PostgREST corta em mil linhas por
 * padrão, então o range é pedido explicitamente até um teto alto. Cinquenta mil
 * lançamentos são vinte anos de quem lança sete por dia; acima disso o problema
 * deixa de ser o CSV.
 */
export async function carregarBaseExportacao(): Promise<Mes & { saldos: Record<string, number> }> {
  const supabase = createClient();

  const [lanc, contas, cartoes, cats, recs, saldos] = await Promise.all([
    semApagados((filtrar) => {
      const q = supabase.from("fin_lancamentos").select("*");
      return (filtrar ? q.is("apagado_em", null) : q)
        .order("data", { ascending: false })
        .range(0, 49_999);
    }),
    supabase.from("fin_contas").select("*").order("nome"),
    supabase.from("fin_cartoes").select("*").order("nome"),
    supabase.from("fin_categorias").select("*").order("nome"),
    supabase.from("fin_recorrencias").select("*").order("dia"),
    carregarSaldos(),
  ]);

  const erro = lanc.error ?? contas.error ?? cartoes.error ?? cats.error ?? recs.error;
  if (erro) throw erro;

  return {
    lancamentos: (lanc.data ?? []) as Lancamento[],
    contas: (contas.data ?? []) as Conta[],
    cartoes: (cartoes.data ?? []) as Cartao[],
    categorias: (cats.data ?? []) as Categoria[],
    recorrencias: (recs.data ?? []) as Recorrencia[],
    saldos,
  };
}

/**
 * O saldo de cada conta, da view `fin_saldos`.
 *
 * Vem do banco de propósito: se cada tela somasse do seu jeito, uma hora duas
 * telas mostrariam saldos diferentes para a mesma conta — e aí o cliente não
 * confia em nenhuma.
 *
 * ⚠️ O saldo conta o histórico TODO, não só o mês na tela.
 */
export async function carregarSaldos(): Promise<Record<string, number>> {
  const supabase = createClient();

  /* O `.eq("user_id", ...)` é redundante quando a RLS está certa — e é
     exatamente por isso que ele fica. Em 10/09/2026 a view `fin_saldos` estava
     sem `security_invoker`, a RLS não se aplicava a ela, e esta função devolveu
     as contas de onze estranhos para uma conta recém-criada. O banco já foi
     corrigido; este filtro é a segunda tranca, para a próxima falha de policy
     não virar vazamento de novo. Uma consulta que só pode devolver o que é do
     dono não deveria depender de uma única linha de configuração. */
  const { data: sessao } = await supabase.auth.getUser();
  const eu = sessao.user?.id;
  if (!eu) return {};

  const { data, error } = await supabase
    .from("fin_saldos")
    .select("conta_id, saldo")
    .eq("user_id", eu);
  if (error) throw error;

  const mapa: Record<string, number> = {};
  for (const l of data ?? []) mapa[l.conta_id as string] = Number(l.saldo);
  return mapa;
}

// ── Contas do mês ───────────────────────────────────────────────────────────

export type ResumoDoMes = {
  /** Só o que já aconteceu. */
  entrouRealizado: number;
  saiuRealizado: number;
  sobraRealizada: number;
  /** Realizado + previsto: como o mês termina se nada mudar. */
  entrouPrevisto: number;
  saiuPrevisto: number;
  sobraPrevista: number;
  /** Quanto ainda está marcado como não pago. */
  aPagar: number;
  aReceber: number;
};

/**
 * O fechamento do mês, em dois tempos.
 *
 * DUAS LEITURAS, e a distinção é o que o app tem de útil a mais que um
 * extrato: o REALIZADO responde "como estou agora"; o PREVISTO responde "como
 * termino se nada mudar". A segunda é a que muda comportamento — é ela que
 * avisa que o mês vai fechar no vermelho enquanto ainda dá para evitar.
 */
export function resumirMes(lancamentos: Lancamento[]): ResumoDoMes {
  let entrouRealizado = 0;
  let saiuRealizado = 0;
  let aPagar = 0;
  let aReceber = 0;

  for (const l of lancamentos) {
    const receita = l.tipo === "receita";
    if (l.pago) {
      if (receita) entrouRealizado += l.valor;
      else saiuRealizado += l.valor;
    } else {
      if (receita) aReceber += l.valor;
      else aPagar += l.valor;
    }
  }

  const entrouPrevisto = entrouRealizado + aReceber;
  const saiuPrevisto = saiuRealizado + aPagar;

  return {
    entrouRealizado,
    saiuRealizado,
    sobraRealizada: entrouRealizado - saiuRealizado,
    entrouPrevisto,
    saiuPrevisto,
    sobraPrevista: entrouPrevisto - saiuPrevisto,
    aPagar,
    aReceber,
  };
}

/**
 * Quanto saiu por categoria, do maior para o menor.
 *
 * DELEGA para `agregarPorCategoria` (em `categorias.ts`) e devolve a MESMA
 * forma de antes do v3 — `{ id, total, nome, cor, grupo }`. A assinatura foi
 * ESTENDIDA com um parâmetro opcional, e não trocada: o painel e o robô do
 * WhatsApp chamam esta função hoje, e quebrar a leitura de três telas para
 * acrescentar um nível é o oposto de migrar sem perder nada.
 *
 * Quem quiser o segundo nível pede `{ arvore: true }` e recebe `subs` e
 * `proprio` junto. Duas funções para a mesma soma seria a garantia de que um
 * dia elas discordam.
 */
export function porCategoria(
  lancamentos: Lancamento[],
  categorias: Categoria[],
  opcoes: { tipo?: TipoLancamento } = {},
) {
  return agregarPorCategoria(lancamentos, categorias, opcoes).map((c) => ({
    id: c.id,
    total: c.total,
    nome: c.nome,
    cor: c.cor,
    grupo: c.grupo,
    /* Extras do v3. Aditivos: quem desestrutura os cinco campos antigos nem
       vê que eles existem. */
    proprio: c.proprio,
    subs: c.subs,
  }));
}

// ── Escrita ─────────────────────────────────────────────────────────────────

export type NovoLancamento = Omit<Lancamento, "id"> & { parcelas?: number };

/**
 * Grava um lançamento — e, quando parcelado, os N de uma vez.
 *
 * POR QUE AS PARCELAS NASCEM TODAS AGORA
 * "12x de R$ 300" só vira informação útil se as onze futuras existirem: sem
 * elas, a projeção do mês que vem mostra sobra que não existe. Gerar na hora
 * também é o que permite editar ou apagar uma parcela isolada depois.
 *
 * O dia é preservado ao andar os meses, com a guarda do mês curto: parcela de
 * 31 de janeiro cai em 28 de fevereiro, e não em 3 de março.
 */
export async function salvarLancamento(nov: NovoLancamento) {
  const supabase = createClient();
  const { parcelas = 1, ...base } = nov;

  if (parcelas <= 1) {
    const { error } = await supabase.from("fin_lancamentos").insert(base);
    if (error) throw error;
    return;
  }

  const [ano, mes, dia] = base.data.split("-").map(Number);
  const linhas = Array.from({ length: parcelas }, (_, i) => {
    const alvo = new Date(ano, mes - 1 + i, 1);
    const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    const d = new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(dia, ultimoDia));
    return {
      ...base,
      data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      // Só a primeira pode já estar paga; as futuras nascem previstas.
      pago: i === 0 ? base.pago : false,
      parcela_num: i + 1,
      parcela_total: parcelas,
    };
  });

  const { error } = await supabase.from("fin_lancamentos").insert(linhas);
  if (error) throw error;
}

export async function alternarPago(id: string, pago: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_lancamentos")
    .update({ pago })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Apagar um lançamento — para a LIXEIRA, não para o vazio.
 *
 * Era um `delete`. Um toque errado na lista do mês e o registro sumia sem
 * desfazer, sem histórico e sem como saber o que faltou quando a conta do mês
 * não fechasse. Agora é um carimbo de data (`supabase/fincash_lixeira.sql`): a
 * linha continua onde estava, com o mesmo `id`, invisível para todas as leituras
 * e restaurável por 30 dias.
 *
 * O FALLBACK PARA `delete` não é preguiça: enquanto houver banco sem o aditivo
 * rodado, o update falharia com "coluna não existe" e o botão de apagar
 * simplesmente não funcionaria — o que é pior que o comportamento antigo. Some
 * junto com a última instalação sem o SQL.
 */
export async function apagarLancamento(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_lancamentos")
    .update({ apagado_em: new Date().toISOString() })
    .eq("id", id);

  if (error && colunaDaLixeiraAusente(error)) {
    const { error: erroDelete } = await supabase
      .from("fin_lancamentos")
      .delete()
      .eq("id", id);
    if (erroDelete) throw erroDelete;
    return;
  }
  if (error) throw error;
}

// ── A lixeira ───────────────────────────────────────────────────────────────
/**
 * Por que TUDO aqui passa por RPC, e não por consulta direta à tabela.
 *
 * A policy restritiva do `fincash_lixeira.sql` torna o lançamento apagado
 * invisível para qualquer `select` — de propósito, porque é ela que garante que
 * nenhuma leitura esquecida some dinheiro apagado. O efeito colateral é que a
 * própria tela da lixeira também não o veria, e o `update` que restaura tampouco
 * acharia a linha (no PostgreSQL, `update ... where id = ?` aplica as policies
 * de SELECT sobre a linha existente).
 *
 * As funções `security definer` são a exceção controlada: uma porta só, com o
 * `auth.uid()` conferido dentro dela, em vez de um buraco permanente na policy.
 */

/** Dias que o lançamento fica na lixeira antes do expurgo. Espelha o padrão da
    função no banco — está aqui só para a TELA poder dizer o prazo em palavras.
    Quem manda é o SQL; mudar este número não muda o comportamento. */
export const DIAS_NA_LIXEIRA = 30;

export async function carregarLixeira(): Promise<Lancamento[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fin_lixeira");
  if (error) throw error;
  return (data ?? []) as Lancamento[];
}

export async function restaurarLancamento(id: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("fin_lixeira_restaurar", { p_id: id });
  if (error) throw error;
}

/** Apagar de vez, um. Só funciona sobre o que já está na lixeira — a função no
    banco recusa o resto, para que um bug de tela não vire perda definitiva. */
export async function apagarDeVez(id: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("fin_lixeira_apagar", { p_id: id });
  if (error) throw error;
}

/** Esvaziar a lixeira inteira. Devolve quantos foram. */
export async function esvaziarLixeira(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fin_lixeira_esvaziar");
  if (error) throw error;
  return Number(data ?? 0);
}

/**
 * O expurgo do que passou dos 30 dias.
 *
 * Chamado pela TELA ao abrir, e não por um cron no banco: agendamento é
 * configuração de projeto, e um `pg_cron` escondido num arquivo de schema é como
 * se descobre, meses depois, que existe algo apagando dados de produção de
 * madrugada. Aqui o expurgo acontece enquanto o dono está olhando para a lixeira
 * — e ele custa uma consulta indexada sobre algumas dezenas de linhas.
 */
export async function expurgarLixeira(dias = DIAS_NA_LIXEIRA): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fin_lixeira_expurgar", { p_dias: dias });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function salvarConta(c: Omit<Conta, "id" | "arquivada">) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_contas").insert(c);
  if (error) throw error;
}

/**
 * Primeira visita: cria as categorias iniciais.
 *
 * Tela de organizador que abre sem categoria nenhuma obriga a pessoa a
 * configurar antes de usar — e é exatamente ali que ela desiste. A função é
 * idempotente no banco (`on conflict do nothing`), então chamar de novo não
 * duplica nada.
 */
export async function semearCategorias() {
  const supabase = createClient();
  const { error } = await supabase.rpc("fin_semear_categorias");
  if (error) throw error;
}

// ── Categorias e subcategorias (fincash_v3.sql) ─────────────────────────────
// O CRUD mora AQUI, e não em `categorias.ts`, porque tudo daqui fala com a
// rede. `categorias.ts` é o motor puro — é a separação que permite testar a
// agregação sem banco, sem sessão e sem browser.
//
// AS COLUNAS SÃO PEDIDAS PELO NOME, e não com `select("*")`: num banco em que
// o v3 ainda não rodou, `pai_id` não existe e o PostgREST devolve um erro que
// `faltaTabela()` reconhece pela mensagem ("does not exist"). A tela então
// mostra "rode o fincash_v3.sql" em vez de meio funcionar sem hierarquia — que
// é o pior dos dois mundos, porque a pessoa cria categorias que não se ligam a
// nada e só descobre depois.
const CAMPOS_CATEGORIA = "id,nome,tipo,grupo,cor,arquivada,pai_id,ordem";

/** Todas as categorias, arquivadas inclusive — a tela de gerenciamento é o
    único lugar onde a arquivada precisa aparecer, para poder voltar. */
export async function carregarCategorias(): Promise<Categoria[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fin_categorias")
    .select(CAMPOS_CATEGORIA)
    .order("ordem")
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export type NovaCategoria = {
  nome: string;
  tipo: TipoLancamento;
  grupo: GrupoCategoria | null;
  cor: string;
  /** Nulo cria categoria; preenchido cria subcategoria daquele pai. */
  pai_id: string | null;
};

/**
 * Cria categoria ou subcategoria — a mesma função, porque é a mesma tabela.
 *
 * `irmas` entra para a nova nascer no FIM da lista, e não empatada em 0 com
 * todo mundo. Categoria nova que aparece no meio da lista é categoria que a
 * pessoa procura e não acha logo depois de criar.
 *
 * A SUBCATEGORIA HERDA O GRUPO DO PAI quando nenhum é passado: streaming dentro
 * de Assinaturas é estilo de vida porque Assinaturas é. Deixar a filha sem
 * grupo a jogaria no bloco "Outras" do orçamento, longe do próprio pai.
 */
export async function criarCategoria(
  nova: NovaCategoria,
  irmas: Categoria[] = [],
) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_categorias").insert({
    ...nova,
    ordem: proximaOrdem(irmas),
  });
  if (error) throw error;
}

export async function renomearCategoria(
  id: string,
  campos: Partial<Pick<Categoria, "nome" | "cor" | "grupo">>,
) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_categorias").update(campos).eq("id", id);
  if (error) throw error;
}

/**
 * Arquivar, NUNCA apagar.
 *
 * `on delete set null` no lançamento significa que apagar a categoria deixaria
 * anos de gasto sem etiqueta: o extrato continuaria certo em dinheiro e mudo em
 * significado, e não há como desfazer. Arquivar tira da lista de escolha e
 * mantém o passado legível — que é a única coisa que o histórico tem para
 * oferecer.
 *
 * ARQUIVAR PAI ARQUIVA AS FILHAS. Filha ativa de pai arquivado é uma linha que
 * aparece na escolha, é escolhida, e some do orçamento porque o bloco dela não
 * é mais desenhado. Uma escrita a mais aqui evita esse fantasma.
 */
export async function arquivarCategoria(
  id: string,
  arquivada: boolean,
  filhas: Categoria[] = [],
) {
  const supabase = createClient();
  const ids = [id, ...filhas.filter((f) => f.pai_id === id).map((f) => f.id)];
  const { error } = await supabase
    .from("fin_categorias")
    .update({ arquivada })
    .in("id", ids);
  if (error) throw error;
}

/**
 * Sobe ou desce uma categoria entre as irmãs dela.
 *
 * A conta é pura (`trocarOrdem`) e só o resultado vem parar aqui. No caso
 * normal são duas linhas trocando de número; no caso do banco herdado, em que
 * todo mundo está empatado, o nível inteiro é renumerado de uma vez — e aí a
 * escrita em lote existe para a lista não ficar meio ordenada se algo falhar
 * no meio.
 */
export async function moverCategoria(
  irmas: Categoria[],
  id: string,
  direcao: -1 | 1,
) {
  const mudancas = trocarOrdem(irmas, id, direcao);
  if (mudancas.length === 0) return;

  const supabase = createClient();
  await Promise.all(
    mudancas.map((m) =>
      supabase.from("fin_categorias").update({ ordem: m.ordem }).eq("id", m.id),
    ),
  );
}

// ── Orçamento nos dois modos (fincash_v3.sql) ───────────────────────────────

const CAMPOS_ORCAMENTO = "id,categoria_id,subcategoria_id,mes_ref,modo,valor";

/**
 * Traz o orçamento do mês E todos os fixos, numa consulta só.
 *
 * O `or` é o que faz os dois modos conviverem: `mes_ref = ref` pega as linhas
 * variáveis daquele mês (inclusive as exceções), `modo = fixo` pega as regras,
 * que não têm competência nenhuma. Buscar em duas viagens deixaria a tela
 * desenhar uma vez com o fixo e de novo com a exceção — e o número piscando de
 * 1.800 para 2.100 é o tipo de coisa que faz a pessoa duvidar do app.
 */
export async function carregarOrcamentos(ref: string): Promise<Orcamento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fin_orcamentos")
    .select(CAMPOS_ORCAMENTO)
    .or(`mes_ref.eq.${ref},modo.eq.fixo`);
  if (error) throw error;
  return (data ?? []).map((o) => ({ ...o, valor: Number(o.valor) })) as Orcamento[];
}

export type AlvoOrcamento = {
  categoria_id: string;
  /** Nulo = o limite é da categoria inteira. */
  subcategoria_id: string | null;
};

/**
 * Define o limite de uma linha, no modo pedido.
 *
 * POR QUE LEITURA-E-ESCRITA, e não `upsert`
 * As chaves únicas do v3 são índices de EXPRESSÃO (`coalesce(subcategoria_id,
 * …)`), porque em Postgres dois nulos são distintos e sem o coalesce nada
 * impediria dois fixos para a mesma categoria. `onConflict` do PostgREST só
 * sabe nomear colunas, não expressões. Então o `id` que já veio na tela decide:
 * tem id, é update; não tem, é insert. Só o dono edita o próprio orçamento e a
 * tela é uma só — a corrida que o upsert protegeria não existe aqui.
 *
 * SALVAR NO MODO FIXO NÃO APAGA AS EXCEÇÕES dos meses. É a decisão do v3 e ela
 * é deliberada: quem ajustou dezembro à mão ajustou por um motivo, e um
 * "corrigi o valor do aluguel" não deveria varrer isso. A tela avisa quantos
 * meses seguem com valor próprio.
 */
export async function definirOrcamento(
  alvo: AlvoOrcamento,
  valor: number,
  modo: ModoOrcamento,
  ref: string,
  idExistente: string | null,
) {
  const supabase = createClient();
  const linha = {
    categoria_id: alvo.categoria_id,
    subcategoria_id: alvo.subcategoria_id,
    modo,
    // A restrição `fin_orcamentos_competencia_chk` recusa qualquer outra
    // combinação: fixo sem competência, variável com ela.
    mes_ref: modo === "fixo" ? null : ref,
    valor,
  };

  const { error } = idExistente
    ? await supabase.from("fin_orcamentos").update(linha).eq("id", idExistente)
    : await supabase.from("fin_orcamentos").insert(linha);
  if (error) throw error;
}

/**
 * Apaga uma linha de orçamento.
 *
 * É o que sustenta o "voltar ao fixo": a exceção do mês é REMOVIDA, e o fixo
 * volta a valer sozinho por precedência. Reescrever a exceção com o valor do
 * fixo pareceria a mesma coisa na tela e não seria: no mês seguinte em que o
 * aluguel subisse, aquele mês continuaria preso no valor velho.
 */
export async function apagarOrcamento(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_orcamentos").delete().eq("id", id);
  if (error) throw error;
}

/** Quantos meses já têm exceção sobre um fixo — o número que a tela mostra
    antes de deixar a pessoa mexer na regra. */
export async function contarExcecoes(alvo: AlvoOrcamento): Promise<number> {
  const supabase = createClient();
  let q = supabase
    .from("fin_orcamentos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", alvo.categoria_id)
    .eq("modo", "variavel");
  q = alvo.subcategoria_id
    ? q.eq("subcategoria_id", alvo.subcategoria_id)
    : q.is("subcategoria_id", null);
  const { count } = await q;
  return count ?? 0;
}

export { chaveOrcamento };

// ── Recorrências ────────────────────────────────────────────────────────────

/**
 * As datas em que uma recorrência cai dentro de um mês.
 *
 * FUNÇÃO PURA, e é ela que a materialização E a projeção usam. Antes, quem
 * materializava gerava um lançamento por mês para qualquer frequência — o que
 * transformava o IPVA anual em doze IPVAs e fazia a projeção de 12 meses
 * mostrar uma despesa que não existe. Duas contas separadas para a mesma
 * pergunta é como se descobre, tarde, que a tela e o banco discordam.
 *
 * `semanal` devolve várias datas; as outras, no máximo uma.
 */
export function ocorrenciasNoMes(r: Recorrencia, ref: string): string[] {
  const { inicio: primeiro, fim: ultimo } = limitesDoMes(ref);

  // Fora da vigência: regra que começa em março não aparece em janeiro, e a
  // que terminou não volta.
  if (r.inicio > ultimo) return [];
  if (r.fim && r.fim < primeiro) return [];

  if (r.frequencia === "semanal") {
    // De 7 em 7 a partir do início da regra. O salto é calculado, e não
    // iterado desde `inicio`: uma regra de 2019 daria 300 voltas de laço por
    // mês projetado, e são 12 meses × N regras a cada abertura da tela.
    const atraso = diasEntre(r.inicio, primeiro);
    const primeiraNoMes = somarDias(r.inicio, atraso <= 0 ? 0 : Math.ceil(atraso / 7) * 7);

    const datas: string[] = [];
    for (let d = primeiraNoMes; d <= ultimo; d = somarDias(d, 7)) {
      if (r.fim && d > r.fim) break;
      datas.push(d);
    }
    return datas;
  }

  // Anual só no mês de aniversário da regra.
  if (r.frequencia === "anual" && r.inicio.slice(5, 7) !== ref.slice(5, 7)) {
    return [];
  }

  const data = diaNoMes(ref, r.dia);
  if (data < r.inicio) return [];
  if (r.fim && data > r.fim) return [];
  return [data];
}

/**
 * Gera no mês os lançamentos que faltam das recorrências ativas.
 *
 * POR QUE MATERIALIZAR, e não só calcular na hora de mostrar
 * Porque o lançamento gerado precisa ser EDITÁVEL. A conta de luz é "todo mês
 * dia 10", mas em janeiro veio R$ 40 mais cara — a pessoa tem de conseguir
 * corrigir aquele mês sem mexer na regra. Recorrência que só existe como
 * fórmula não deixa corrigir a exceção, e a vida é feita de exceção.
 *
 * POR QUE SÓ QUANDO O MÊS É ABERTO, e não doze meses de uma vez
 * Gerar o ano inteiro enche a tabela de futuro que muda. "O aluguel subiu"
 * viraria doze edições em vez de uma. Materializar sob demanda mantém a regra
 * como fonte e o lançamento como exceção.
 *
 * IDEMPOTENTE: reconhece o que já foi gerado por `recorrencia_id` + mês, então
 * abrir a mesma tela duas vezes não duplica nada. É a garantia que permite
 * chamá-la sem medo a cada carga.
 *
 * Nasce SEMPRE como previsto (`pago: false`). Marcar sozinho como pago faria o
 * app afirmar que a conta foi paga sem ninguém ter pago — e saldo que mente é
 * pior que saldo que falta.
 */
export async function materializarRecorrencias(
  ref: string,
  recorrencias: Recorrencia[],
  jaNoMes: Lancamento[],
): Promise<number> {
  if (recorrencias.length === 0) return 0;

  const supabase = createClient();
  const { inicio, fim } = limitesDoMes(ref);

  /* O que já existe neste mês, vindo de recorrência. Uma consulta própria
     porque `jaNoMes` pode ter sido filtrado pela tela. */
  /* ⚠️ A LIXEIRA ENTRA AQUI COM UM SENTIDO PRÓPRIO, e é o filtro mais fácil de
     esquecer do arquivo. Sem ele, a recorrência do mês que a pessoa apagou de
     propósito ("a academia deste mês eu não paguei") continuaria contando como
     "já materializada" e o app nunca mais a geraria. Com ele, apagar a
     ocorrência do mês faz a regra voltar a valer no mês seguinte — que é o que
     a pessoa espera de uma lixeira. */
  const { data: existentes } = await semApagados<{
    recorrencia_id: string;
    data: string;
  }>((filtrar) => {
    const q = supabase
      .from("fin_lancamentos")
      .select("recorrencia_id, data")
      .gte("data", inicio)
      .lte("data", fim)
      .not("recorrencia_id", "is", null);
    return filtrar ? q.is("apagado_em", null) : q;
  });

  /* DUAS CHAVES DE IDEMPOTÊNCIA, e a diferença importa.
     Para mensal e anual basta "esta regra já apareceu neste mês": se a pessoa
     mudou a data do lançamento gerado (a luz venceu dia 12, não dia 10),
     comparar por data exata criaria um segundo lançamento no dia 10.
     Para semanal isso não serve — são várias ocorrências no mesmo mês —, então
     ali a comparação é por data. */
  const mesJaTem = new Set<string>();
  const dataJaTem = new Set<string>();
  for (const l of existentes ?? []) {
    mesJaTem.add(l.recorrencia_id as string);
    dataJaTem.add(`${l.recorrencia_id}|${l.data}`);
  }

  const novos = recorrencias.flatMap((r) => {
    const semanal = r.frequencia === "semanal";
    if (!semanal && mesJaTem.has(r.id)) return [];

    return ocorrenciasNoMes(r, ref)
      .filter((data) => !semanal || !dataJaTem.has(`${r.id}|${data}`))
      .map((data) => ({
        tipo: r.tipo,
        descricao: r.descricao,
        valor: r.valor,
        data,
        categoria_id: r.categoria_id,
        conta_id: r.conta_id,
        cartao_id: r.cartao_id,
        pago: false,
        recorrencia_id: r.id,
      }));
  });

  if (novos.length === 0) return 0;

  const { error } = await supabase.from("fin_lancamentos").insert(novos);
  if (error) throw error;
  return novos.length;
}

export async function salvarRecorrencia(
  r: Omit<Recorrencia, "id" | "ativa">,
) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_recorrencias").insert(r);
  if (error) throw error;
}

/**
 * Desligar, e não apagar.
 *
 * Apagar a regra levaria junto o `recorrencia_id` dos lançamentos que ela já
 * gerou (o `on delete set null` os deixaria órfãos) — e o histórico do cliente
 * perderia a informação de que aquele gasto era o aluguel.
 */
export async function desligarRecorrencia(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_recorrencias")
    .update({ ativa: false })
    .eq("id", id);
  if (error) throw error;
}

// ── Projeção de 12 meses ────────────────────────────────────────────────────
// O para-brisa. Todo app de finanças mostra o retrovisor ("você gastou X"); o
// que muda comportamento é ver, em setembro, que março fecha no vermelho —
// enquanto ainda dá para fazer alguma coisa a respeito.
//
// POR QUE ELA MORA AQUI, e não num arquivo próprio
// Porque ela é feita das peças que já vivem neste arquivo (lançamentos,
// recorrências, saldo) e nada mais. Fatura de cartão e aporte de meta entram
// como NÚMEROS PRONTOS (`faturas`, `aportesPlanejados`), calculados por
// `faturas.ts` e `metas.ts` — que importam este arquivo. Se a projeção fosse
// buscar esses números sozinha, os três módulos importariam uns aos outros em
// ciclo, e ciclo de import quebra em runtime de um jeito difícil de achar.
//
// A CONTA, em uma frase: começa do saldo de hoje e soma, mês a mês, só o que
// AINDA NÃO ACONTECEU.

export type EntradaProjecao = {
  refInicial: string;
  /** Padrão 12. */
  meses?: number;
  /** A soma dos saldos de todas as contas HOJE — `carregarSaldos()` somado. */
  saldoInicial: number;
  /** Do refInicial em diante MAIS todo não-pago atrasado. `carregarProjecao` já traz assim. */
  lancamentos: Lancamento[];
  recorrencias: Recorrencia[];
  /** ref do vencimento → fatura em aberto que vence nele. De `faturasPorMes`. */
  faturas?: Record<string, number>;
  /** ref → quanto vai ser separado para metas. De `aportesPlanejadosPorMes`. */
  aportesPlanejados?: Record<string, number>;
};

export type PontoProjecao = {
  ref: string;
  entradas: number;
  /** Despesas que saem da CONTA. Fatura de cartão vem separada. */
  saidas: number;
  faturas: number;
  aportes: number;
  /** entradas − saidas − faturas − aportes. */
  resultado: number;
  saldoInicio: number;
  saldoFim: number;
  /** De onde vieram os números do mês — a tela usa para explicar a previsão. */
  origem: { lancados: number; recorrencias: number };
};

/**
 * O saldo mês a mês, começando do saldo de hoje.
 *
 * AS TRÊS ARMADILHAS que esta função existe para não cair, e cada uma delas já
 * derrubou a projeção de algum concorrente:
 *
 * 1. **Contar o que já está no saldo.** A view `fin_saldos` soma TODO
 *    lançamento com `pago = true`, sem filtrar data. Então aqui só entra o não
 *    pago — somar o pago de novo dobraria o mês corrente.
 *
 * 2. **Contar a recorrência e o lançamento que ela gerou.** Assim que o mês é
 *    aberto, `materializarRecorrencias` transforma a regra em lançamento. Se a
 *    projeção somasse os dois, o aluguel apareceria duas vezes — e só nos meses
 *    já visitados, que é o tipo de erro que ninguém reproduz.
 *
 * 3. **Contar a compra no cartão no dia da compra.** Comprar no cartão dia 3 não
 *    tira dinheiro da conta dia 3: tira no vencimento da fatura. Por isso todo
 *    lançamento com `cartao_id` é ignorado aqui e o cartão entra pelo mapa
 *    `faturas`, que é calculado por ciclo em `faturas.ts`.
 *
 * O ATRASADO NÃO SOME: conta não paga de um mês anterior ao início da projeção
 * cai no primeiro mês. Fingir que ela desapareceu deixaria a previsão bonita e
 * errada.
 *
 * LIMITE CONHECIDO: recorrência lançada no CARTÃO (assinatura) entra no mês em
 * que cai, e não no vencimento da fatura, enquanto não tiver sido
 * materializada. Dá uma defasagem de até um mês nos meses distantes — pequena
 * perto de ignorar a assinatura, que era a alternativa.
 */
export function projetarMeses(e: EntradaProjecao): PontoProjecao[] {
  const meses = e.meses ?? 12;
  const refs = Array.from({ length: meses }, (_, i) => mesVizinho(e.refInicial, i));
  const indice = new Map(refs.map((r, i) => [r, i]));

  const pontos: PontoProjecao[] = refs.map((ref) => ({
    ref,
    entradas: 0,
    saidas: 0,
    faturas: e.faturas?.[ref] ?? 0,
    aportes: e.aportesPlanejados?.[ref] ?? 0,
    resultado: 0,
    saldoInicio: 0,
    saldoFim: 0,
    origem: { lancados: 0, recorrencias: 0 },
  }));

  // Armadilha 2: o que a regra já virou, para não contar a regra depois.
  const materializadas = new Set<string>();

  for (const l of e.lancamentos) {
    const ref = refDaData(l.data);
    if (l.recorrencia_id) materializadas.add(`${l.recorrencia_id}|${ref}`);

    if (l.pago) continue;      // armadilha 1
    if (l.cartao_id) continue; // armadilha 3

    const i = indice.get(ref < e.refInicial ? e.refInicial : ref);
    if (i === undefined) continue;

    if (l.tipo === "receita") pontos[i].entradas += l.valor;
    else pontos[i].saidas += l.valor;
    pontos[i].origem.lancados += 1;
  }

  for (const r of e.recorrencias) {
    if (!r.ativa) continue;

    for (let i = 0; i < meses; i++) {
      if (materializadas.has(`${r.id}|${refs[i]}`)) continue;

      const quantas = ocorrenciasNoMes(r, refs[i]).length;
      if (quantas === 0) continue;

      if (r.tipo === "receita") pontos[i].entradas += r.valor * quantas;
      else pontos[i].saidas += r.valor * quantas;
      pontos[i].origem.recorrencias += quantas;
    }
  }

  let saldo = e.saldoInicial;
  for (const p of pontos) {
    p.saldoInicio = saldo;
    p.resultado = p.entradas - p.saidas - p.faturas - p.aportes;
    saldo += p.resultado;
    p.saldoFim = saldo;
  }

  return pontos;
}

export type ResumoProjecao = {
  saldoFinal: number;
  menorSaldo: number;
  refDoMenor: string;
  /** O primeiro mês que fecha negativo — o aviso que vale a tela inteira. */
  primeiroNegativo: string | null;
  totalEntradas: number;
  totalSaidas: number;
};

/** A leitura de uma linha da projeção. O `primeiroNegativo` é o número que a
    tela deve gritar: é o único acionável antes de acontecer. */
export function resumirProjecao(pontos: PontoProjecao[]): ResumoProjecao {
  const vazio = pontos.length === 0;
  let menor = vazio ? 0 : Infinity;
  let refDoMenor = vazio ? "" : pontos[0].ref;
  let primeiroNegativo: string | null = null;
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (const p of pontos) {
    if (p.saldoFim < menor) {
      menor = p.saldoFim;
      refDoMenor = p.ref;
    }
    if (primeiroNegativo === null && p.saldoFim < 0) primeiroNegativo = p.ref;
    totalEntradas += p.entradas;
    totalSaidas += p.saidas + p.faturas + p.aportes;
  }

  return {
    saldoFinal: vazio ? 0 : pontos[pontos.length - 1].saldoFim,
    menorSaldo: vazio ? 0 : menor,
    refDoMenor,
    primeiroNegativo,
    totalEntradas,
    totalSaidas,
  };
}

/**
 * Tudo o que a projeção precisa, numa viagem só.
 *
 * O `or` na consulta de lançamentos não é firula: traz o que está DENTRO da
 * janela mais todo lançamento não pago que ficou para trás. Sem ele, a conta de
 * agosto que ninguém pagou sumiria da previsão — e a previsão passaria a ser
 * mais otimista do que a vida.
 *
 * Devolve os cartões junto porque a tela precisa deles para chamar
 * `faturasPorMes` antes de projetar; buscá-los numa segunda ida ao banco seria
 * uma cascata numa tela que já espera por quatro consultas.
 */
export async function carregarProjecao(refInicial = refDoMes(), meses = 12) {
  const supabase = createClient();
  const { inicio } = limitesDoMes(refInicial);
  const { fim } = limitesDoMes(mesVizinho(refInicial, meses - 1));

  const [lanc, recs, cartoes, saldos] = await Promise.all([
    /* Mesmo filtro do mês. Aqui ele importa em dobro: a projeção parte do saldo
       (que já ignora o apagado, pela view) e soma o futuro por cima — se as duas
       pontas não concordarem sobre o que existe, a linha do gráfico dá um degrau
       que ninguém consegue explicar. */
    semApagados((filtrar) => {
      const q = supabase
        .from("fin_lancamentos")
        .select("*")
        .lte("data", fim)
        .or(`data.gte.${inicio},pago.is.false`);
      return (filtrar ? q.is("apagado_em", null) : q).order("data");
    }),
    supabase.from("fin_recorrencias").select("*").eq("ativa", true),
    supabase.from("fin_cartoes").select("*").eq("arquivado", false).order("nome"),
    carregarSaldos(),
  ]);

  const erro = lanc.error ?? recs.error ?? cartoes.error;
  if (erro) throw erro;

  return {
    lancamentos: (lanc.data ?? []) as Lancamento[],
    recorrencias: (recs.data ?? []) as Recorrencia[],
    cartoes: (cartoes.data ?? []) as Cartao[],
    saldos,
    saldoInicial: Object.values(saldos).reduce((a, b) => a + b, 0),
  };
}
