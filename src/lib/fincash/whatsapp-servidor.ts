/**
 * O lado sujo do assistente: banco, vínculo, idempotência e resposta.
 *
 * A divisão com `whatsapp.ts` é proposital — lá está a decisão (o que a
 * mensagem quer dizer), aqui está o efeito (o que isso muda no banco). Quem for
 * mexer na interpretação não precisa entender de Supabase, e quem for trocar o
 * provedor não precisa entender de português.
 *
 * ⚠️ ESTE MÓDULO USA A CHAVE DE SERVIÇO, que passa POR CIMA do RLS.
 * O webhook chega sem sessão: não há cookie, não há `auth.uid()`, e por isso a
 * policy "org: dono manda" não protege nada aqui. A proteção passa a ser
 * disciplina de código: **toda consulta e toda escrita carrega `user_id`
 * explícito**, vindo do vínculo confirmado do telefone. Um `.eq("user_id", ...)`
 * esquecido neste arquivo é vazamento de dado financeiro entre clientes.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Cartao, Categoria, Conta } from "@/lib/fincash/modelo";
import {
  interpretar,
  extrairCodigo,
  respostaCodigoInvalido,
  respostaDeAjuda,
  respostaDeConsultaCategoria,
  respostaDeRegistro,
  respostaDeResumo,
  respostaDeSaldo,
  respostaDesfeito,
  respostaIndefinida,
  respostaMidiaNaoSuportada,
  respostaNadaParaDesfazer,
  respostaNaoVinculado,
  respostaVinculado,
  formatarBRL,
  type Consulta,
  type Intencao,
  type RascunhoLancamento,
} from "@/lib/fincash/whatsapp";
import {
  baixarMidia,
  custoEstimadoCentavos,
  midiaInterpretavel,
  respostaFalhaMidia,
  tetoMidiasMes,
  tipoProcessavel,
} from "@/lib/fincash/whatsapp-midia";
import {
  processarAudio,
  respostaAudioIncompreensivel,
  respostaDoAudio,
  transcritorOpenAI,
} from "@/lib/fincash/whatsapp-audio";
import {
  ehConfirmacao,
  ehRecusa,
  fraseDaProposta,
  processarFoto,
  respostaFotoImplausivel,
  respostaProposta,
  visaoOpenAI,
  type Proposta,
} from "@/lib/fincash/whatsapp-foto";
import { enviarTexto, whatsappConfigurado } from "@/lib/fincash/whatsapp-envio";
import {
  variantesTelefone,
  type MensagemRecebida,
} from "@/lib/fincash/whatsapp-provedor";

// ── Cliente ─────────────────────────────────────────────────────────────────

let cache: SupabaseClient | null = null;

export function servicoDisponivel(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function servico(): SupabaseClient {
  if (cache) return cache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao foi configurada");
  }
  // Sem sessão e sem refresh: é processo de servidor, não navegador. Deixar a
  // persistência ligada faria instâncias serverless brigarem por um mesmo
  // "usuário atual" que não existe.
  cache = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cache;
}

// ── Datas ───────────────────────────────────────────────────────────────────
// Copiado de `modelo.ts` (seis linhas) em vez de importado: `modelo.ts` é
// `"use client"` por dentro e arrastá-lo para um route handler traria o cliente
// de navegador do Supabase junto. Se um dia essas funções saírem de lá para um
// módulo neutro, este bloco some.

function limitesDoMes(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return { inicio: `${ref}-01`, fim: `${ref}-${String(ultimo).padStart(2, "0")}` };
}

// ── Vínculo ─────────────────────────────────────────────────────────────────

type Vinculo = {
  id: string;
  user_id: string;
  telefone: string;
  conta_padrao_id: string | null;
  cartao_padrao_id: string | null;
};

async function acharVinculo(telefone: string): Promise<Vinculo | null> {
  const { data } = await servico()
    .from("fin_whatsapp_contas")
    .select("id, user_id, telefone, conta_padrao_id, cartao_padrao_id")
    // As duas formas do mesmo celular brasileiro. O porquê está em
    // `variantesTelefone`.
    .in("telefone", variantesTelefone(telefone))
    .not("confirmado_em", "is", null)
    .eq("ativo", true)
    .limit(1);

  return (data?.[0] as Vinculo | undefined) ?? null;
}

/**
 * Quantas mensagens este número mandou na última hora.
 *
 * É a defesa contra chute de código: seis dígitos são um milhão de combinações,
 * mas sem teto um script tenta todas. Com teto por telefone, mais a validade de
 * dez minutos e um código pendente por usuário, o ataque deixa de fechar a
 * conta. É também o que impede o número da Novare de virar megafone: mais de N
 * mensagens de um desconhecido e o assistente simplesmente cala.
 */
async function mensagensNaHora(telefone: string): Promise<number> {
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await servico()
    .from("fin_whatsapp_mensagens")
    .select("id", { count: "exact", head: true })
    .eq("telefone", telefone)
    .eq("direcao", "entrada")
    .gte("criado_em", desde);
  return count ?? 0;
}

const TETO_POR_HORA = 30;
const TETO_TENTATIVAS_CODIGO = 8;

/**
 * Tenta transformar um código em vínculo.
 *
 * O telefone só é carimbado aqui, com o número que REALMENTE mandou a mensagem —
 * nunca com um número digitado numa tela. É o que torna o vínculo uma prova de
 * posse do aparelho, e não uma declaração.
 */
async function tentarVincular(
  telefone: string,
  texto: string,
  recentes: number,
): Promise<{ ok: boolean; user_id?: string } | null> {
  const codigo = extrairCodigo(texto);
  if (!codigo) return null;

  if (recentes > TETO_TENTATIVAS_CODIGO) return { ok: false };

  const { data } = await servico()
    .from("fin_whatsapp_contas")
    .select("id, user_id")
    .eq("codigo", codigo)
    .is("confirmado_em", null)
    .gt("codigo_expira_em", new Date().toISOString())
    .limit(1);

  const pendente = data?.[0] as { id: string; user_id: string } | undefined;
  if (!pendente) return { ok: false };

  // Trocar de celular é o caso comum, e ele passa por aqui: o vínculo anterior
  // sai para o novo entrar. Sem isto o índice `fin_whatsapp_confirmado_idx`
  // recusaria a troca, e a pessoa veria "código inválido" sem entender por quê.
  // O histórico de mensagens não se perde: ele aponta para o usuário, não para
  // o vínculo.
  await servico()
    .from("fin_whatsapp_contas")
    .delete()
    .eq("user_id", pendente.user_id)
    .not("confirmado_em", "is", null);

  // O código morre no uso. Reaproveitar um código já usado é o mesmo que ter um
  // segundo vínculo grátis.
  const { error } = await servico()
    .from("fin_whatsapp_contas")
    .update({
      telefone,
      codigo: null,
      codigo_expira_em: null,
      confirmado_em: new Date().toISOString(),
    })
    .eq("id", pendente.id)
    .is("confirmado_em", null);

  // `telefone` é único: se este número já pertence a outro usuário, o banco
  // recusa — e recusar é o comportamento certo. Um número escreve numa conta
  // financeira só.
  if (error) return { ok: false };

  return { ok: true, user_id: pendente.user_id };
}

// ── Log ─────────────────────────────────────────────────────────────────────

/**
 * Registra a entrada e, com isso, RESERVA o direito de processá-la.
 *
 * A ordem é a peça inteira da idempotência: insere PRIMEIRO, interpreta depois.
 * O índice único `(provedor, provedor_msg_id)` recusa o reenvio, e devolver
 * `null` faz o webhook descartar em silêncio. Fazer o contrário — interpretar e
 * registrar no fim — deixa aberta a janela em que dois reenvios simultâneos
 * gravam o mesmo gasto duas vezes. Lançamento duplicado num app de dinheiro é o
 * defeito que faz a pessoa desinstalar.
 */
async function reservarEntrada(
  msg: MensagemRecebida,
  userId: string | null,
): Promise<string | null> {
  const { data, error } = await servico()
    .from("fin_whatsapp_mensagens")
    .insert({
      user_id: userId,
      telefone: msg.de,
      direcao: "entrada",
      provedor: msg.provedor,
      provedor_msg_id: msg.idMensagem,
      tipo: msg.tipo,
      texto: msg.texto || null,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = violação de índice único = reenvio do provedor. Silêncio é a
    // resposta certa; qualquer outro erro merece log.
    if (error.code !== "23505") {
      console.warn("[whatsapp] nao registrou entrada:", error.message);
    }
    return null;
  }
  return data.id as string;
}

/**
 * Responde e registra a saída.
 *
 * Registra SEMPRE, envia só se houver credencial. É o que permite o assistente
 * inteiro rodar antes de a API estar plugada: dá para conferir no banco o que
 * ele teria respondido, sem conta na Meta.
 */
async function responder(params: {
  telefone: string;
  userId: string | null;
  texto: string;
  interpretacao?: unknown;
  lancamentoId?: string | null;
  mensagemId?: string | null;
}) {
  const { telefone, userId, texto } = params;

  let erro: string | null = null;
  let provedorMsgId: string | null = null;

  if (whatsappConfigurado()) {
    try {
      provedorMsgId = await enviarTexto({ para: telefone, texto });
    } catch (e) {
      // Falha de envio não pode derrubar o processamento: o lançamento já foi
      // gravado, e é ele que importa. O erro fica no log para diagnóstico.
      erro = e instanceof Error ? e.message : String(e);
      console.warn("[whatsapp] nao enviou:", erro);
    }
  } else {
    erro = "envio nao configurado";
  }

  await servico().from("fin_whatsapp_mensagens").insert({
    user_id: userId,
    telefone,
    direcao: "saida",
    provedor: "meta",
    provedor_msg_id: provedorMsgId,
    tipo: "texto",
    texto,
    erro,
  });

  // A interpretação e o lançamento vão na linha da ENTRADA, não na da resposta:
  // é a mensagem da pessoa que gerou o lançamento, e é por ela que o "desfazer"
  // procura.
  if (params.mensagemId && (params.interpretacao || params.lancamentoId)) {
    await servico()
      .from("fin_whatsapp_mensagens")
      .update({
        interpretacao: params.interpretacao ?? null,
        lancamento_id: params.lancamentoId ?? null,
      })
      .eq("id", params.mensagemId);
  }
}

// ── Dados do usuário ────────────────────────────────────────────────────────

type Contexto = {
  categorias: Categoria[];
  contas: Conta[];
  cartoes: Cartao[];
};

async function carregarContexto(userId: string): Promise<Contexto> {
  const s = servico();
  // Em paralelo: três idas ao banco em cascata seriam meio segundo a mais em
  // cada mensagem, e o assistente vale pela rapidez.
  const [cats, contas, cartoes] = await Promise.all([
    s.from("fin_categorias").select("*").eq("user_id", userId).eq("arquivada", false),
    s.from("fin_contas").select("*").eq("user_id", userId).eq("arquivada", false),
    s.from("fin_cartoes").select("*").eq("user_id", userId).eq("arquivado", false),
  ]);

  return {
    categorias: (cats.data ?? []) as Categoria[],
    contas: (contas.data ?? []) as Conta[],
    cartoes: (cartoes.data ?? []) as Cartao[],
  };
}

// ── Efeitos ─────────────────────────────────────────────────────────────────

/**
 * Grava o lançamento.
 *
 * `pago: true` porque gasto contado pelo WhatsApp é gasto que JÁ aconteceu — a
 * pessoa acabou de sair do mercado. Conta a pagar (previsto) se cadastra no app,
 * onde dá para escolher a data e conferir.
 *
 * O valor entra POSITIVO, sempre; quem dá o sinal é `tipo`. A regra é do
 * `modelo.ts` e está repetida aqui porque é a que quebra o saldo do app inteiro.
 */
async function gravarLancamento(
  userId: string,
  r: RascunhoLancamento,
): Promise<string | null> {
  const { data, error } = await servico()
    .from("fin_lancamentos")
    .insert({
      user_id: userId,
      tipo: r.tipo,
      descricao: r.descricao,
      valor: r.valor,
      data: r.data,
      categoria_id: r.categoria_id,
      conta_id: r.conta_id,
      cartao_id: r.cartao_id,
      pago: true,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[whatsapp] nao gravou lancamento:", error.message);
    return null;
  }
  return data.id as string;
}

/**
 * O alerta de estouro de orçamento, e por que ele avisa UMA vez.
 *
 * Só dispara quando ESTE lançamento foi o que cruzou o limite (antes dele o
 * total cabia, depois dele não cabe mais). Avisar a cada gasto depois do estouro
 * transformaria o assistente em alarme de carro: a pessoa desliga, e junto com
 * ele desliga o aviso que importava.
 */
async function alertaDeOrcamento(
  userId: string,
  r: RascunhoLancamento,
): Promise<string | null> {
  if (r.tipo !== "despesa" || !r.categoria_id) return null;

  const ref = r.data.slice(0, 7);
  const { inicio, fim } = limitesDoMes(ref);
  const s = servico();

  const [orc, gastos] = await Promise.all([
    s
      .from("fin_orcamentos")
      .select("valor")
      .eq("user_id", userId)
      .eq("categoria_id", r.categoria_id)
      .eq("mes_ref", ref)
      .maybeSingle(),
    semApagadosServico((filtrar) => {
      let q = s
        .from("fin_lancamentos")
        .select("valor")
        .eq("user_id", userId)
        .eq("categoria_id", r.categoria_id)
        .eq("tipo", "despesa")
        .gte("data", inicio)
        .lte("data", fim);
      if (filtrar) q = q.is("apagado_em", null);
      return q;
    }),
  ]);

  const limite = Number(orc.data?.valor ?? 0);
  if (!limite) return null;

  const total = (gastos.data ?? []).reduce((soma, l) => soma + Number(l.valor), 0);
  const antes = total - r.valor;
  if (antes > limite || total <= limite) return null;

  return `Atenção: com este gasto você passou o orçamento de *${r.categoria_nome}* (${formatarBRL(limite)}). Já são ${formatarBRL(total)} no mês.`;
}

async function responderConsulta(userId: string, c: Consulta): Promise<string> {
  const s = servico();
  const { inicio, fim } = limitesDoMes(c.ref);

  if (c.escopo === "saldo") {
    const { data } = await s
      .from("fin_saldos")
      .select("nome, saldo")
      .eq("user_id", userId);
    return respostaDeSaldo(
      (data ?? []).map((l) => ({ nome: l.nome as string, saldo: Number(l.saldo) })),
    );
  }

  if (c.escopo === "resumo") {
    const { data } = await semApagadosServico<
      { tipo: string; valor: number; pago: boolean }[]
    >((filtrar) => {
      let q = s
        .from("fin_lancamentos")
        .select("tipo, valor, pago")
        .eq("user_id", userId)
        .gte("data", inicio)
        .lte("data", fim);
      if (filtrar) q = q.is("apagado_em", null);
      return q;
    });

    let entrou = 0;
    let saiu = 0;
    let aPagar = 0;
    for (const l of data ?? []) {
      const v = Number(l.valor);
      if (l.tipo === "receita") {
        if (l.pago) entrou += v;
      } else if (l.pago) saiu += v;
      else aPagar += v;
    }
    return respostaDeResumo({ ref: c.ref, entrou, saiu, aPagar });
  }

  let q = s
    .from("fin_lancamentos")
    .select("valor")
    .eq("user_id", userId)
    .eq("tipo", "despesa")
    .gte("data", inicio)
    .lte("data", fim);
  if (c.categoria_id) q = q.eq("categoria_id", c.categoria_id);

  /* A consulta já está montada acima, então o filtro entra aqui e o fallback
     refaz sem ele. Mesmo motivo das outras: chave de serviço não vê RLS. */
  let { data, error: erroConsulta } = await q.is("apagado_em", null);
  if (erroConsulta && (erroConsulta as { code?: string }).code === "42703") {
    ({ data } = await q);
  }
  const linhas = data ?? [];
  const total = linhas.reduce((soma, l) => soma + Number(l.valor), 0);

  let orcamento: number | null = null;
  if (c.categoria_id) {
    const { data: orc } = await s
      .from("fin_orcamentos")
      .select("valor")
      .eq("user_id", userId)
      .eq("categoria_id", c.categoria_id)
      .eq("mes_ref", c.ref)
      .maybeSingle();
    orcamento = orc?.valor ? Number(orc.valor) : null;
  }

  return respostaDeConsultaCategoria({
    categoria: c.categoria_nome ?? "Total de gastos",
    ref: c.ref,
    total,
    quantidade: linhas.length,
    orcamento,
  });
}

/**
 * Desfaz o último lançamento que o ASSISTENTE criou.
 *
 * Só o que veio pelo WhatsApp, e só nas últimas 24h. Deixar o "desfazer" chegar
 * em lançamento feito no app seria dar a um canal sem tela o poder de apagar o
 * que a pessoa digitou com calma em outro lugar.
 */
async function desfazerUltimo(userId: string): Promise<string> {
  const s = servico();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await s
    .from("fin_whatsapp_mensagens")
    .select("id, lancamento_id")
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .not("lancamento_id", "is", null)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1);

  const alvo = data?.[0] as { id: string; lancamento_id: string } | undefined;
  if (!alvo) return respostaNadaParaDesfazer();

  const { data: lanc } = await s
    .from("fin_lancamentos")
    .select("descricao, valor")
    .eq("id", alvo.lancamento_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!lanc) return respostaNadaParaDesfazer();

  /* Carimbo, não `delete`: "desfazer" pelo WhatsApp precisa mandar o
     lançamento para a MESMA lixeira do app, senão o mesmo gesto apaga de vez
     por um caminho e é recuperável pelo outro. O fallback para `delete` cobre
     o banco onde `fincash_lixeira.sql` ainda não rodou. */
  let { error } = await s
    .from("fin_lancamentos")
    .update({ apagado_em: new Date().toISOString() })
    .eq("id", alvo.lancamento_id)
    .eq("user_id", userId);

  if (error && (error as { code?: string }).code === "42703") {
    ({ error } = await s
      .from("fin_lancamentos")
      .delete()
      .eq("id", alvo.lancamento_id)
      .eq("user_id", userId));
  }

  if (error) return "Não consegui apagar agora. Tente pelo app.";

  // Solta o vínculo para "desfazer" duas vezes seguidas não tentar apagar o
  // mesmo lançamento (já morto) em vez de andar para o anterior.
  await s
    .from("fin_whatsapp_mensagens")
    .update({ lancamento_id: null })
    .eq("id", alvo.id);

  return respostaDesfeito(lanc.descricao as string, Number(lanc.valor));
}

/**
 * A faxina dos códigos vencidos, de vez em quando.
 *
 * Uma vez a cada ~50 lotes, e não a cada mensagem: varrer a tabela em toda
 * mensagem seria uma consulta desperdiçada por gasto lançado, e o que ela limpa
 * não tem pressa nenhuma. Fica aqui, e não num cron, porque cron ainda não
 * existe no projeto — quando existir (ver `docs/whatsapp.md`), esta chamada sai.
 *
 * Nunca lança: é faxina, não pode derrubar o processamento de uma mensagem.
 */
/**
 * Repete a consulta sem o filtro da lixeira quando a coluna ainda não existe.
 *
 * POR QUE ISTO PRECISA EXISTIR AQUI TAMBÉM
 * O resto do app fica protegido pela policy restritiva de SELECT criada em
 * `fincash_lixeira.sql`. Este arquivo não: ele usa a chave de SERVIÇO, que
 * passa por cima de toda RLS. Sem filtro explícito, o assistente do WhatsApp
 * responderia "você gastou X em mercado" contando lançamento que a pessoa
 * apagou — e aí dois lugares do mesmo app dão números diferentes, que é o
 * defeito que faz alguém parar de confiar num app de dinheiro.
 *
 * O fallback existe porque `fincash_lixeira.sql` é aditivo e pode não ter sido
 * rodado ainda: melhor responder contando o apagado do que não responder.
 */
async function semApagadosServico<T>(
  consulta: (filtrar: boolean) => PromiseLike<{ data: T | null; error: unknown }>,
) {
  const r = await consulta(true);
  const codigo = (r.error as { code?: string } | null)?.code;
  if (r.error && codigo === "42703") return consulta(false);
  return r;
}


export async function faxinaEventual(): Promise<void> {
  if (Math.random() > 0.02) return;
  try {
    await servico().rpc("fin_whatsapp_limpar_pendentes");
  } catch (e) {
    console.warn("[whatsapp] faxina falhou:", e);
  }
}

// ── Mídia ───────────────────────────────────────────────────────────────────

/**
 * Quantas mídias este usuário já mandou no mês.
 *
 * Conta pelo LOG, que já existe, em vez de um contador em coluna nova: contador
 * é estado a mais para dessincronizar, e a tabela de mensagens é a fonte da
 * verdade sobre o que a pessoa mandou. O mês é o civil, do fuso de São Paulo —
 * o mesmo recorte que a pessoa vê no app, senão o limite "zera" num dia que não
 * é o dia 1º para ela.
 *
 * A mensagem atual JÁ está registrada quando isto roda (a reserva vem antes de
 * tudo), então a comparação certa é `> teto`, não `>=`.
 */
async function midiasNoMes(userId: string): Promise<number> {
  const hoje = agoraNoBrasil();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

  const { count } = await servico()
    .from("fin_whatsapp_mensagens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .in("tipo", ["audio", "imagem"])
    .gte("criado_em", inicio);

  return count ?? 0;
}

/** Janela em que "sim" ainda se refere à foto. Curta de propósito — ver abaixo. */
const JANELA_PROPOSTA_MIN = 15;

/**
 * A proposta de foto ainda aberta deste usuário, se houver.
 *
 * Quinze minutos porque "sim" é uma palavra perigosa: passada a conversa, um
 * "sim" solto respondendo a outra coisa gravaria um gasto que a pessoa nem
 * lembra de ter proposto. Confirmação que envelhece deixa de ser confirmação.
 *
 * Mora no `interpretacao` da própria linha da foto — jsonb que já existe — para
 * não precisar de tabela nem coluna nova. `lancamento_id` nulo é o que marca
 * "ainda não virou lançamento": no momento em que vira, a mesma linha deixa de
 * ser encontrada aqui, e o "sim" repetido não duplica o gasto.
 */
type PropostaPendente = { id: string; proposta: Proposta; custoCentavos: number };

async function propostaPendente(userId: string): Promise<PropostaPendente | null> {
  const desde = new Date(Date.now() - JANELA_PROPOSTA_MIN * 60 * 1000).toISOString();

  const { data } = await servico()
    .from("fin_whatsapp_mensagens")
    .select("id, interpretacao")
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .eq("tipo", "imagem")
    .is("lancamento_id", null)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1);

  const linha = data?.[0] as
    | {
        id: string;
        interpretacao: { tipo?: string; proposta?: Proposta; custo_centavos?: number } | null;
      }
    | undefined;

  if (linha?.interpretacao?.tipo !== "proposta-foto") return null;
  const p = linha.interpretacao.proposta;
  if (!p || typeof p.valor !== "number") return null;
  return {
    id: linha.id,
    proposta: p,
    custoCentavos: Number(linha.interpretacao.custo_centavos ?? 0),
  };
}

/**
 * Marca a proposta como resolvida sem ter virado lançamento.
 *
 * Necessário no "não": sem isto a proposta continuaria pendente e o próximo
 * "sim" — sobre outro assunto — a ressuscitaria.
 */
async function descartarProposta(p: PropostaPendente): Promise<void> {
  // O custo já pago pela leitura da foto vai junto: a pessoa ter recusado a
  // proposta não devolve o dinheiro, e a auditoria de consumo tem que
  // continuar fechando.
  await servico()
    .from("fin_whatsapp_mensagens")
    .update({
      interpretacao: { tipo: "proposta-foto-descartada", custo_centavos: p.custoCentavos },
    })
    .eq("id", p.id);
}

/**
 * Áudio e foto, do arquivo à resposta.
 *
 * As duas mídias dividem tudo que é caro e arriscado — teto do mês, download em
 * memória, registro de custo — e divergem só no fim: áudio vira texto e SEGUE
 * pelo caminho normal (grava); foto vira proposta e PARA (espera "sim"). Essa
 * assimetria é a decisão central e está explicada em `whatsapp-foto.ts`.
 */
async function tratarMidia(
  vinculo: Vinculo,
  msg: MensagemRecebida,
  mensagemId: string,
): Promise<void> {
  const tipo = msg.tipo as "audio" | "imagem";
  const base = { telefone: msg.de, userId: vinculo.user_id, mensagemId };

  const usadas = await midiasNoMes(vinculo.user_id);
  if (usadas > tetoMidiasMes()) {
    await responder({ ...base, texto: respostaFalhaMidia("teto-do-mes", tipo) });
    return;
  }

  if (!msg.midiaId) {
    await responder({ ...base, texto: respostaFalhaMidia("formato-errado", tipo) });
    return;
  }

  // O download acontece aqui e o resultado morre no fim desta função: nada de
  // arquivo em disco, nada de URL pública. O que sobra no banco é o extraído.
  let midia;
  try {
    midia = await baixarMidia(msg.midiaId);
  } catch (e) {
    console.warn("[whatsapp] midia nao baixou:", e);
    await responder({ ...base, texto: respostaFalhaMidia("download-falhou", tipo) });
    return;
  }

  /* O custo estimado vai para o log JUNTO com a interpretação, na linha da
     entrada. É o que permite responder "quanto o assistente custou este mês"
     com uma consulta ao banco, em vez de conferindo fatura da OpenAI. */
  const custo = custoEstimadoCentavos(tipo, midia.tamanho / 1600);

  if (tipo === "audio") {
    const r = await processarAudio(midia, transcritorOpenAI());
    if (!r.ok) {
      await responder({
        ...base,
        interpretacao: { tipo: "midia", midia: "audio", falha: r.motivo, custo_centavos: custo },
        texto:
          r.motivo === "nao-entendi"
            ? respostaAudioIncompreensivel()
            : respostaFalhaMidia(r.motivo, "audio"),
      });
      return;
    }

    // A partir daqui é uma mensagem de texto como qualquer outra — de novo, um
    // interpretador só para os dois canais.
    const ctx = await carregarContexto(vinculo.user_id);
    const intencao = interpretar(r.texto, {
      ...ctx,
      contaPadraoId: vinculo.conta_padrao_id,
      cartaoPadraoId: vinculo.cartao_padrao_id,
      hoje: agoraNoBrasil(),
    });

    await executar(vinculo, intencao, mensagemId, msg, {
      transcricao: r.texto,
      custoCentavos: custo,
    });
    return;
  }

  const r = await processarFoto(midia, visaoOpenAI(), agoraNoBrasil(), msg.texto);
  if (!r.ok) {
    await responder({
      ...base,
      interpretacao: { tipo: "midia", midia: "imagem", falha: r.motivo, custo_centavos: custo },
      texto:
        r.motivo === "implausivel"
          ? respostaFotoImplausivel()
          : respostaFalhaMidia(r.motivo, "imagem"),
    });
    return;
  }

  // Proposta gravada no log, lançamento NÃO. É o "sim" que grava.
  await responder({
    ...base,
    interpretacao: { tipo: "proposta-foto", proposta: r.proposta, custo_centavos: custo },
    texto: respostaProposta(r.proposta),
  });
}

/**
 * O "sim" que fecha uma proposta de foto.
 *
 * Passa a proposta pelo `interpretar()` de texto, e não direto para o banco: a
 * escolha de categoria, de conta padrão e de data precisa sair do mesmo lugar em
 * todos os canais, ou a foto criaria lançamentos com regra própria.
 *
 * Devolve `true` quando consumiu a mensagem; `false` deixa o texto seguir o
 * caminho normal (quem responde uma foto com "mercado 280" está corrigindo o
 * valor, não conversando — e corrigir tem que funcionar).
 */
async function tratarRespostaAProposta(
  vinculo: Vinculo,
  msg: MensagemRecebida,
  mensagemId: string,
): Promise<boolean> {
  const sim = ehConfirmacao(msg.texto);
  const nao = ehRecusa(msg.texto);
  if (!sim && !nao) return false;

  const pendente = await propostaPendente(vinculo.user_id);
  if (!pendente) return false;

  const base = { telefone: msg.de, userId: vinculo.user_id, mensagemId };

  if (nao) {
    await descartarProposta(pendente);
    await responder({
      ...base,
      texto: "Beleza, não registrei nada. Me manda o valor certo em texto — por exemplo: “mercado 280”.",
    });
    return true;
  }

  const hoje = agoraNoBrasil();
  const ctx = await carregarContexto(vinculo.user_id);
  const intencao = interpretar(fraseDaProposta(pendente.proposta, hoje), {
    ...ctx,
    contaPadraoId: vinculo.conta_padrao_id,
    cartaoPadraoId: vinculo.cartao_padrao_id,
    hoje,
  });

  if (intencao.tipo !== "registrar") {
    // Cai aqui quando falta conta padrão, por exemplo: a pergunta do
    // interpretador é a resposta certa, e a proposta some para o "sim" seguinte
    // não reabrir esta.
    await descartarProposta(pendente);
    await responder({
      ...base,
      texto:
        intencao.tipo === "indefinido"
          ? respostaIndefinida(intencao.motivo, intencao.opcoes)
          : respostaFotoImplausivel(),
    });
    return true;
  }

  const id = await gravarLancamento(vinculo.user_id, intencao.rascunho);
  if (!id) {
    await responder({ ...base, texto: "Não consegui salvar agora. Tente de novo em instantes." });
    return true;
  }

  /* O lançamento é carimbado na linha da FOTO, não na do "sim": é a foto que
     gerou o gasto, é por ela que o `desfazer` procura, e é isso que fecha a
     proposta para um segundo "sim" não duplicar. */
  await servico()
    .from("fin_whatsapp_mensagens")
    .update({ lancamento_id: id })
    .eq("id", pendente.id);

  const alerta = await alertaDeOrcamento(vinculo.user_id, intencao.rascunho);
  await responder({
    ...base,
    interpretacao: intencao as unknown,
    lancamentoId: id,
    texto: [respostaDeRegistro(intencao.rascunho), alerta].filter(Boolean).join("\n\n"),
  });
  return true;
}

// ── Orquestração ────────────────────────────────────────────────────────────

/**
 * Uma mensagem, do começo ao fim.
 *
 * Nunca lança: o webhook precisa responder 200 mesmo quando algo aqui falha,
 * senão o provedor reenvia — e reenvio é justamente o que a idempotência está
 * aqui para conter. O erro vai para o log e para o console.
 */
export async function processarMensagem(msg: MensagemRecebida): Promise<void> {
  try {
    const vinculo = await acharVinculo(msg.de);

    // Reserva do direito de processar. Vem antes de tudo, inclusive do vínculo,
    // porque o reenvio de uma mensagem de número desconhecido também não deve
    // gerar uma segunda resposta.
    const mensagemId = await reservarEntrada(msg, vinculo?.user_id ?? null);
    if (!mensagemId) return;

    // Teto de tráfego por número. Vale para vinculado e desconhecido: se algo
    // entrar em laço (dois bots conversando, por exemplo), o assistente para.
    // Contado uma vez só e reaproveitado abaixo — a mesma conta serve para o
    // teto de tráfego e para o teto de chute de código.
    const recentes = await mensagensNaHora(msg.de);
    if (recentes > TETO_POR_HORA) return;

    if (!vinculo) {
      const tentativa = await tentarVincular(msg.de, msg.texto, recentes);
      if (tentativa?.ok) {
        await responder({
          telefone: msg.de,
          userId: tentativa.user_id ?? null,
          texto: respostaVinculado(),
          mensagemId,
        });
        return;
      }
      await responder({
        telefone: msg.de,
        userId: null,
        texto: tentativa ? respostaCodigoInvalido() : respostaNaoVinculado(),
        mensagemId,
      });
      return;
    }

    if (msg.tipo !== "texto") {
      // Vídeo e documento continuam de fora: são caros de processar e quase
      // nunca são comprovante — quem manda PDF de fatura quer o importador de
      // OFX, que já existe no app.
      if (!tipoProcessavel(msg.tipo) || !midiaInterpretavel()) {
        await responder({
          telefone: msg.de,
          userId: vinculo.user_id,
          texto: respostaMidiaNaoSuportada(msg.tipo),
          mensagemId,
        });
        return;
      }
      await tratarMidia(vinculo, msg, mensagemId);
      return;
    }

    // "sim"/"não" só ganham sentido quando há uma foto esperando confirmação.
    // Vem antes do interpretador porque para ele "sim" é conversa fiada.
    if (await tratarRespostaAProposta(vinculo, msg, mensagemId)) return;

    const ctx = await carregarContexto(vinculo.user_id);
    const intencao: Intencao = interpretar(msg.texto, {
      ...ctx,
      contaPadraoId: vinculo.conta_padrao_id,
      cartaoPadraoId: vinculo.cartao_padrao_id,
      // O "hoje" do usuário, não o do servidor. A Vercel roda em UTC e, depois
      // das 21h no Brasil, um gasto de hoje seria gravado amanhã.
      hoje: agoraNoBrasil(),
    });

    await executar(vinculo, intencao, mensagemId, msg);
  } catch (e) {
    console.error("[whatsapp] falhou ao processar:", e);
  }
}

async function executar(
  vinculo: Vinculo,
  intencao: Intencao,
  mensagemId: string,
  msg: MensagemRecebida,
  /* Só o áudio preenche isto. A transcrição entra na resposta E no log: na
     resposta para a pessoa flagrar a palavra ouvida errada na hora, no log para
     alguém conseguir explicar, meses depois, por que o gasto foi parar naquela
     categoria. */
  audio?: { transcricao: string; custoCentavos: number },
) {
  const base = {
    telefone: msg.de,
    userId: vinculo.user_id,
    mensagemId,
    interpretacao: (audio
      ? { ...(intencao as object), transcricao: audio.transcricao, custo_centavos: audio.custoCentavos }
      : intencao) as unknown,
  };

  // A confirmação de áudio sempre mostra o que foi ouvido — inclusive quando o
  // interpretador não entendeu, que é justamente quando a pista mais importa.
  const comAudio = (texto: string) =>
    audio ? respostaDoAudio(audio.transcricao, texto) : texto;

  switch (intencao.tipo) {
    case "registrar": {
      const id = await gravarLancamento(vinculo.user_id, intencao.rascunho);
      if (!id) {
        await responder({
          ...base,
          texto: comAudio("Não consegui salvar agora. Tente de novo em instantes."),
        });
        return;
      }
      const alerta = await alertaDeOrcamento(vinculo.user_id, intencao.rascunho);
      await responder({
        ...base,
        lancamentoId: id,
        texto: comAudio(
          [respostaDeRegistro(intencao.rascunho), alerta].filter(Boolean).join("\n\n"),
        ),
      });
      return;
    }

    case "consulta":
      await responder({
        ...base,
        texto: comAudio(await responderConsulta(vinculo.user_id, intencao.consulta)),
      });
      return;

    case "desfazer":
      await responder({ ...base, texto: comAudio(await desfazerUltimo(vinculo.user_id)) });
      return;

    case "indefinido":
      await responder({
        ...base,
        // Áudio mal entendido mostra a transcrição: sem ela a pessoa não sabe se
        // o problema foi a fala, o ruído ou a frase.
        texto: audio
          ? respostaAudioIncompreensivel(audio.transcricao)
          : respostaIndefinida(intencao.motivo, intencao.opcoes),
      });
      return;

    default:
      await responder({ ...base, texto: comAudio(respostaDeAjuda()) });
  }
}

/**
 * O "agora" de quem escreveu, não o do servidor.
 *
 * A Vercel roda em UTC. Sem este ajuste, todo gasto lançado depois das 21h no
 * Brasil cairia no dia seguinte — e no dia 30, no mês seguinte, que é onde isso
 * deixa de ser detalhe e vira fechamento errado.
 *
 * Fuso fixo em America/Sao_Paulo: o FINCASH é de cliente brasileiro, e
 * inferir fuso pelo DDD acerta menos que assumir.
 */
function agoraNoBrasil(): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const p = (t: string) => Number(partes.find((x) => x.type === t)?.value ?? 0);
  return new Date(p("year"), p("month") - 1, p("day"), p("hour"), p("minute"));
}
