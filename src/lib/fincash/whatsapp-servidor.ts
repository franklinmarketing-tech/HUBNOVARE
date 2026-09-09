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
import { midiaInterpretavel } from "@/lib/fincash/whatsapp-midia";
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
    s
      .from("fin_lancamentos")
      .select("valor")
      .eq("user_id", userId)
      .eq("categoria_id", r.categoria_id)
      .eq("tipo", "despesa")
      .gte("data", inicio)
      .lte("data", fim),
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
    const { data } = await s
      .from("fin_lancamentos")
      .select("tipo, valor, pago")
      .eq("user_id", userId)
      .gte("data", inicio)
      .lte("data", fim);

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

  const { data } = await q;
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

  const { error } = await s
    .from("fin_lancamentos")
    .delete()
    .eq("id", alvo.lancamento_id)
    .eq("user_id", userId);

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
export async function faxinaEventual(): Promise<void> {
  if (Math.random() > 0.02) return;
  try {
    await servico().rpc("fin_whatsapp_limpar_pendentes");
  } catch (e) {
    console.warn("[whatsapp] faxina falhou:", e);
  }
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

    // Mídia: reconhecida, respondida, não interpretada. O porquê está em
    // `whatsapp-midia.ts`.
    if (msg.tipo !== "texto" && !midiaInterpretavel()) {
      await responder({
        telefone: msg.de,
        userId: vinculo.user_id,
        texto: respostaMidiaNaoSuportada(msg.tipo),
        mensagemId,
      });
      return;
    }

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
) {
  const base = {
    telefone: msg.de,
    userId: vinculo.user_id,
    mensagemId,
    interpretacao: intencao as unknown,
  };

  switch (intencao.tipo) {
    case "registrar": {
      const id = await gravarLancamento(vinculo.user_id, intencao.rascunho);
      if (!id) {
        await responder({
          ...base,
          texto: "Não consegui salvar agora. Tente de novo em instantes.",
        });
        return;
      }
      const alerta = await alertaDeOrcamento(vinculo.user_id, intencao.rascunho);
      await responder({
        ...base,
        lancamentoId: id,
        texto: [respostaDeRegistro(intencao.rascunho), alerta]
          .filter(Boolean)
          .join("\n\n"),
      });
      return;
    }

    case "consulta":
      await responder({
        ...base,
        texto: await responderConsulta(vinculo.user_id, intencao.consulta),
      });
      return;

    case "desfazer":
      await responder({ ...base, texto: await desfazerUltimo(vinculo.user_id) });
      return;

    case "indefinido":
      await responder({
        ...base,
        texto: respostaIndefinida(intencao.motivo, intencao.opcoes),
      });
      return;

    default:
      await responder({ ...base, texto: respostaDeAjuda() });
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
