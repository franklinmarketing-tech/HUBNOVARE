/**
 * O lado sujo do assistente: banco, vínculo, idempotência e resposta.
 *
 * A divisão com `whatsapp.ts` é proposital — lá está a decisão (o que a
 * mensagem quer dizer), aqui está o efeito (o que isso muda no banco). Quem for
 * mexer na interpretação não precisa entender de Supabase, e quem for trocar o
 * provedor não precisa entender de português.
 *
 * ⚠️ O DESTINO DOS DADOS É O NOVARECASH (03/11/2026). O assistente nasceu no
 * FINCASH, foi desligado lá em 19/10/2026 e hoje só atende assinante do
 * NovareCash — que é OUTRO app, com dados próprios. Tudo o que a pessoa
 * registra por aqui (texto, áudio, foto) vai para `ncash_transacoes`, e as
 * consultas leem `ncash_transacoes`, `ncash_contas` e `ncash_orcamentos`.
 * NADA aqui lê ou escreve em `fin_lancamentos`, `fin_contas`, `fin_cartoes` ou
 * nas categorias do FINCASH.
 *
 * O que CONTINUA em `fin_whatsapp_*` é a infraestrutura do CANAL — vínculo
 * telefone → usuário, log de mensagens, idempotência, tetos. Não é dado
 * financeiro do FINCASH; o prefixo é só história. As duas colunas que ligam o
 * canal ao NovareCash (`ncash_conta_padrao_id` e `ncash_transacao_id`) entram
 * por `supabase/novarecash_whatsapp.sql`.
 *
 * ⚠️ ESTE MÓDULO USA A CHAVE DE SERVIÇO, que passa POR CIMA do RLS.
 * O webhook chega sem sessão: não há cookie, não há `auth.uid()`, e por isso a
 * policy "ncash: dono manda" não protege nada aqui. A proteção passa a ser
 * disciplina de código: **toda consulta e toda escrita carrega `user_id`
 * explícito**, vindo do vínculo confirmado do telefone. Um `.eq("user_id", ...)`
 * esquecido neste arquivo é vazamento de dado financeiro entre clientes.
 *
 * CONTA COMPARTILHADA (04/11/2026): em `ncash_*` esse id é `vinculo.dono_id` —
 * o dono do NovareCash que a pessoa aceitou dividir (ou ela mesma). Nas tabelas
 * do CANAL (`fin_whatsapp_*`) continua `vinculo.user_id`, quem mandou.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SITE_URL } from "@/lib/site";

import {
  CATEGORIAS,
  NAO_E_GASTO,
  adivinharCategoria,
  categoria as categoriaNcash,
} from "@/lib/novarecash/categorias";
import { faturasAbertas } from "@/lib/novarecash/cartoes";
import { carregarMesDeContas } from "@/lib/novarecash/contas-pagar";
import { comSaldos, dataCurta, hojeNoBrasil, lerContas } from "@/lib/novarecash/dados";
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
  type CategoriaAlvo,
  type Consulta,
  type Intencao,
  type OrigemAlvo,
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

/** 42703 = coluna inexistente: o SQL aditivo ainda não rodou neste banco. */
function colunaFaltando(erro: unknown): boolean {
  return (erro as { code?: string } | null)?.code === "42703";
}

// ── Datas ───────────────────────────────────────────────────────────────────
// Copiado de `modelo.ts` (seis linhas) em vez de importado: `modelo.ts` é
// `"use client"` por dentro e arrastá-lo para um route handler traria o cliente
// de navegador do Supabase junto.

function limitesDoMes(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return { inicio: `${ref}-01`, fim: `${ref}-${String(ultimo).padStart(2, "0")}` };
}

/** "2026-11-03T…" → "03/11", no fuso de quem lê. */
function diaBrasil(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  });
}

// ── Vínculo ─────────────────────────────────────────────────────────────────

type Vinculo = {
  id: string;
  /** Quem está vinculado ao telefone. É o id do LOG do canal (`fin_whatsapp_mensagens`). */
  user_id: string;
  /**
   * De quem é o NovareCash em que esta pessoa grava e consulta (04/11/2026,
   * conta compartilhada): o DONO do grupo que ela aceitou, ou ela mesma. É o
   * `user_id` de toda leitura e escrita em `ncash_*`. Ver `donoEfetivo`.
   */
  dono_id: string;
  telefone: string;
  /**
   * A origem padrão no NovareCash (`ncash_contas.id`, conta OU cartão).
   *
   * ⚠️ NÃO é `conta_padrao_id`/`cartao_padrao_id`: essas duas colunas apontam
   * para `fin_contas`/`fin_cartoes` (chave estrangeira) e ficam como história
   * do FINCASH. Ler qualquer uma delas aqui gravaria um id do FINCASH no
   * extrato do NovareCash.
   */
  ncash_conta_padrao_id: string | null;
};

async function acharVinculo(telefone: string): Promise<Vinculo | null> {
  const consulta = (colunas: string) =>
    servico()
      .from("fin_whatsapp_contas")
      .select(colunas)
      // As duas formas do mesmo celular brasileiro. O porquê está em
      // `variantesTelefone`.
      .in("telefone", variantesTelefone(telefone))
      .not("confirmado_em", "is", null)
      .eq("ativo", true)
      .limit(1);

  let { data, error } = await consulta("id, user_id, telefone, ncash_conta_padrao_id");
  // Sem `novarecash_whatsapp.sql` a coluna não existe. O vínculo NÃO pode cair
  // por isso — viraria "número não vinculado" para todo mundo. Segue sem padrão.
  if (error && colunaFaltando(error)) {
    ({ data, error } = await consulta("id, user_id, telefone"));
  }

  const linha = (data as unknown as Partial<Vinculo>[] | null)?.[0];
  if (!linha?.id || !linha.user_id) return null;
  return {
    id: linha.id,
    user_id: linha.user_id,
    dono_id: await donoEfetivo(linha.user_id),
    telefone: linha.telefone ?? telefone,
    ncash_conta_padrao_id: linha.ncash_conta_padrao_id ?? null,
  };
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

// ── Assinatura (NovareCash) ─────────────────────────────────────────────────

/**
 * De quem é o NovareCash desta pessoa (04/11/2026, conta compartilhada).
 *
 * A mesma regra de `ncash_dono_atual()` em `supabase/novarecash_compartilhar.sql`
 * — o dono do grupo que ela ACEITOU (o mais recente); senão, ela mesma —, lida
 * aqui com a chave de serviço porque o webhook não tem sessão.
 *
 * Só convite ACEITO conta: convite pendente não muda nada. Falha de leitura (ou
 * `ncash_membros` ainda não criada) = a própria pessoa, que é o comportamento
 * de antes da conta compartilhada: nunca grava no NovareCash de outra pessoa
 * por engano.
 */
async function donoEfetivo(userId: string): Promise<string> {
  try {
    const { data, error } = await servico()
      .from("ncash_membros")
      .select("dono_id")
      .eq("membro_id", userId)
      .eq("status", "aceito")
      .order("aceito_em", { ascending: false })
      .limit(1);
    const dono = (data?.[0] as { dono_id?: string } | undefined)?.dono_id;
    return !error && dono ? dono : userId;
  } catch {
    return userId;
  }
}

/**
 * O dono deste vínculo pode usar o assistente? (03/11/2026)
 *
 * O WhatsApp virou recurso do NovareCash (pago). A regra é a do banco —
 * `ncash_tem_acesso_email()` em `supabase/novarecash.sql` — perguntada pelo
 * e-mail da conta, porque o webhook não tem sessão (`auth.email()` seria nulo).
 * A equipe (admin/equipe em `hub_profiles`) sempre passa, como no app.
 *
 * CONTA COMPARTILHADA (04/11/2026): o MEMBRO ACEITO de um dono que assina também
 * passa — a mesma regra que `ncash_tem_acesso()` ganhou no banco. O e-mail
 * conferido, nesse caso, é o do DONO (o membro não precisa assinar).
 *
 * Falha de leitura = NÃO. No pior caso um assinante recebe o aviso educado uma
 * vez; nunca um não assinante grava de graça.
 */
async function temNovareCash(userId: string): Promise<boolean> {
  try {
    const s = servico();
    const { data: perfil } = await s.from("hub_profiles").select("role").eq("id", userId).maybeSingle();
    if (perfil?.role === "admin" || perfil?.role === "equipe") return true;

    const { data: usuario } = await s.auth.admin.getUserById(userId);
    const email = usuario?.user?.email;
    if (!email) return false;

    const { data, error } = await s.rpc("ncash_tem_acesso_email", { p_email: email });
    if (!error && data === true) return true;

    // Membro aceito: vale a assinatura do dono do grupo.
    const dono = await donoEfetivo(userId);
    if (dono === userId) return false;
    const { data: doDono } = await s.auth.admin.getUserById(dono);
    const emailDono = doDono?.user?.email;
    if (!emailDono) return false;
    const r = await s.rpc("ncash_tem_acesso_email", { p_email: emailDono });
    return !r.error && r.data === true;
  } catch {
    return false;
  }
}

/* O link vai para a página do NovareCash (`/novarecash`), e não para
   `/novarecash/app/...`: quem recebe esta mensagem NÃO é assinante, e a área
   do app só mostraria a porta fechada. */
const TEXTO_SEM_ASSINATURA = [
  "Oi! O assistente de WhatsApp da Novare agora faz parte do NovareCash.",
  `Para lançar gastos por aqui, conheça o plano: ${SITE_URL}/novarecash`,
].join("\n");

/**
 * A resposta a quem não tem NovareCash: UMA vez a cada 24 h por número, e mais
 * nada. Sem isto, cada mensagem de um ex-assinante viraria um aviso repetido —
 * e o número da Novare, um robô insistente. Nada é gravado além do log.
 */
async function responderSemAssinatura(telefone: string, userId: string | null, mensagemId: string) {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await servico()
    .from("fin_whatsapp_mensagens")
    .select("id", { count: "exact", head: true })
    .eq("telefone", telefone)
    .eq("direcao", "saida")
    .eq("texto", TEXTO_SEM_ASSINATURA)
    .gte("criado_em", desde);
  if ((count ?? 0) > 0) return;
  await responder({ telefone, userId, texto: TEXTO_SEM_ASSINATURA, mensagemId });
}

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
): Promise<{ ok: boolean; user_id?: string; semAssinatura?: boolean } | null> {
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

  // Sem NovareCash, o código não vira vínculo (o código fica pendente e vence).
  if (!(await temNovareCash(pendente.user_id))) {
    return { ok: false, user_id: pendente.user_id, semAssinatura: true };
  }

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
 *
 * (Há uma SEGUNDA trava, no destino: a transação nasce com `externo_id` = id da
 * mensagem no provedor, e o índice único de `ncash_transacoes` recusa repetir.
 * Ver `gravarTransacao`.)
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
  /** A transação do NovareCash que esta mensagem gerou (`ncash_transacoes.id`). */
  transacaoId?: string | null;
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

  // A interpretação e a transação vão na linha da ENTRADA, não na da resposta:
  // é a mensagem da pessoa que gerou o lançamento, e é por ela que o "desfazer"
  // procura.
  //
  // ⚠️ `ncash_transacao_id`, NÃO `lancamento_id`: a antiga é chave estrangeira
  // para `fin_lancamentos` e recusaria um id do NovareCash. Ela fica como
  // história do FINCASH.
  if (params.mensagemId && params.interpretacao !== undefined) {
    await servico()
      .from("fin_whatsapp_mensagens")
      .update({ interpretacao: params.interpretacao ?? null })
      .eq("id", params.mensagemId);
  }
  if (params.mensagemId && params.transacaoId) {
    const { error } = await servico()
      .from("fin_whatsapp_mensagens")
      .update({ ncash_transacao_id: params.transacaoId })
      .eq("id", params.mensagemId);
    if (error) console.warn("[whatsapp] nao carimbou a transacao:", error.message);
  }
}

// ── Dados do usuário (NovareCash) ───────────────────────────────────────────

/**
 * As categorias do NovareCash no formato do interpretador.
 *
 * Lista FECHADA, em código (`src/lib/novarecash/categorias.ts`): não há tabela
 * por usuário. `id` = a chave gravada em `ncash_transacoes.categoria`; `nome` =
 * o rótulo, que é o que o casador procura no texto ("mercado", "saúde"…).
 */
const CATEGORIAS_ALVO: CategoriaAlvo[] = CATEGORIAS.map((c) => ({
  id: c.chave,
  nome: c.rotulo,
  tipo: c.tipo === "entrada" ? "receita" : "despesa",
}));

type ContaNcash = {
  id: string;
  nome: string;
  tipo: "conta" | "cartao" | "investimento";
  saldo: number | null;
  saldo_em: string | null;
};

type Contexto = {
  categorias: CategoriaAlvo[];
  /** `ncash_contas` com tipo 'conta'. */
  contas: OrigemAlvo[];
  /** `ncash_contas` com tipo 'cartao'. */
  cartoes: OrigemAlvo[];
};

/**
 * As contas e os cartões do NovareCash, separados pelo `tipo`.
 *
 * 'investimento' NÃO entra como origem: o Open Finance cria essas contas
 * sozinho, e contá-las faria quem tem uma conta e uma aplicação receber "de
 * qual conta saiu?" em toda mensagem. Gasto do dia a dia não sai de aplicação.
 */
async function carregarContexto(userId: string): Promise<Contexto> {
  const { data } = await servico()
    .from("ncash_contas")
    .select("id, nome, tipo")
    .eq("user_id", userId)
    .eq("ativa", true);

  const contas = (data ?? []) as Pick<ContaNcash, "id" | "nome" | "tipo">[];
  return {
    categorias: CATEGORIAS_ALVO,
    contas: contas.filter((c) => c.tipo === "conta").map(({ id, nome }) => ({ id, nome })),
    cartoes: contas.filter((c) => c.tipo === "cartao").map(({ id, nome }) => ({ id, nome })),
  };
}

/**
 * Interpreta com o contexto do NovareCash — o ÚNICO caminho até o
 * interpretador, para texto, áudio e foto.
 *
 * Duas coisas acontecem aqui e em nenhum outro lugar:
 *
 *   · A ORIGEM PADRÃO É CONFERIDA contra as contas que acabaram de ser lidas
 *     com `user_id`. A coluna do vínculo é escrita pelo app sob RLS, que só
 *     garante que a LINHA é da pessoa, não que o id apontado é dela. Sem esta
 *     conferência, um id de conta alheia escrito ali iria parar numa transação.
 *   · A CATEGORIA GANHA UM SEGUNDO PALPITE: quando o casador por nome não acha,
 *     `adivinharCategoria()` (as `palavras` de cada categoria do NovareCash)
 *     tenta pela descrição. É o mesmo palpite do banco, então "posto shell"
 *     cai em Transporte venha pelo WhatsApp ou pelo Open Finance. Usa a
 *     DESCRIÇÃO, sem o valor: "camiseta 99" não pode virar Transporte pelo "99".
 */
function interpretarNoNovareCash(
  texto: string,
  vinculo: Vinculo,
  ctx: Contexto,
  hoje: Date,
): Intencao {
  const padrao = vinculo.ncash_conta_padrao_id;
  const intencao = interpretar(texto, {
    ...ctx,
    contaPadraoId: padrao && ctx.contas.some((c) => c.id === padrao) ? padrao : null,
    cartaoPadraoId: padrao && ctx.cartoes.some((c) => c.id === padrao) ? padrao : null,
    hoje,
  });

  if (intencao.tipo !== "registrar" || intencao.rascunho.categoria_id) return intencao;

  const r = intencao.rascunho;
  const chave = adivinharCategoria(r.descricao, r.tipo === "receita" ? "entrada" : "saida");
  if (chave === "outros" || chave === "outras_entradas") return intencao;

  return {
    ...intencao,
    rascunho: { ...r, categoria_id: chave, categoria_nome: categoriaNcash(chave).rotulo },
  };
}

/** A chave que vai para o banco. Sem categoria = "Outros" (a coluna não é anulável). */
function chaveDaCategoria(r: RascunhoLancamento): string {
  return r.categoria_id ?? (r.tipo === "receita" ? "outras_entradas" : "outros");
}

// ── Efeitos ─────────────────────────────────────────────────────────────────

/**
 * Grava a transação no extrato do NovareCash.
 *
 * O valor entra POSITIVO, sempre; quem dá o sinal é `tipo` ('entrada' |
 * 'saida'). A regra é do contrato em `supabase/novarecash_dados.sql` e está
 * repetida aqui porque é a que quebra o saldo do app inteiro.
 *
 * Conta e cartão moram na MESMA tabela no NovareCash (`ncash_contas.tipo`),
 * então os dois viram `conta_id`. Sem origem, `conta_id` vai nulo.
 *
 * IDEMPOTÊNCIA NO DESTINO: `origem = 'whatsapp'` + `externo_id` = id da
 * mensagem no provedor. O índice único (user_id, origem, externo_id) recusa a
 * segunda cópia; quando recusa, devolvemos a que já existe — o efeito de
 * "gravar duas vezes" passa a ser "gravar uma vez".
 */
async function gravarTransacao(
  userId: string,
  r: RascunhoLancamento,
  externoId: string,
): Promise<string | null> {
  const s = servico();
  const { data, error } = await s
    .from("ncash_transacoes")
    .insert({
      user_id: userId,
      conta_id: r.conta_id ?? r.cartao_id ?? null,
      data: r.data,
      descricao: r.descricao,
      valor: r.valor,
      tipo: r.tipo === "receita" ? "entrada" : "saida",
      categoria: chaveDaCategoria(r),
      origem: "whatsapp",
      externo_id: externoId,
    })
    .select("id")
    .single();

  if (!error) return data.id as string;

  if (error.code === "23505") {
    const { data: existente } = await s
      .from("ncash_transacoes")
      .select("id")
      .eq("user_id", userId)
      .eq("origem", "whatsapp")
      .eq("externo_id", externoId)
      .maybeSingle();
    if (existente?.id) return existente.id as string;
  }

  console.warn("[whatsapp] nao gravou transacao:", error.message);
  return null;
}

/**
 * Total de saídas do mês, opcionalmente de uma categoria. Sempre com `user_id`.
 *
 * Sem categoria ("quanto gastei?"), fica de fora o que NÃO é gasto
 * (`NAO_E_GASTO`: pagamento de fatura, transferências, aplicações) — senão a
 * compra no cartão e o pagamento da fatura dela somavam o mesmo dinheiro duas
 * vezes, e o número do WhatsApp não batia com o do app.
 */
async function saidasDoMes(
  userId: string,
  ref: string,
  categoria: string | null,
): Promise<{ total: number; quantidade: number }> {
  const { inicio, fim } = limitesDoMes(ref);
  let q = servico()
    .from("ncash_transacoes")
    .select("valor, categoria")
    .eq("user_id", userId)
    .eq("tipo", "saida")
    .gte("data", inicio)
    .lte("data", fim);
  if (categoria) q = q.eq("categoria", categoria);

  const { data } = await q;
  const linhas = (data ?? []).filter((l) => categoria || !NAO_E_GASTO.has(String(l.categoria)));
  return {
    total: linhas.reduce((soma, l) => soma + Number(l.valor), 0),
    quantidade: linhas.length,
  };
}

/** O limite mensal da categoria em `ncash_orcamentos` (vale para todo mês). */
async function limiteDaCategoria(userId: string, categoria: string): Promise<number | null> {
  const { data } = await servico()
    .from("ncash_orcamentos")
    .select("limite")
    .eq("user_id", userId)
    .eq("categoria", categoria)
    .maybeSingle();
  const limite = Number(data?.limite ?? 0);
  return limite > 0 ? limite : null;
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
  if (r.tipo !== "despesa") return null;

  const chave = chaveDaCategoria(r);
  const [limite, gastos] = await Promise.all([
    limiteDaCategoria(userId, chave),
    saidasDoMes(userId, r.data.slice(0, 7), chave),
  ]);
  if (!limite) return null;

  const total = gastos.total;
  const antes = total - r.valor;
  if (antes > limite || total <= limite) return null;

  const nome = r.categoria_nome ?? categoriaNcash(chave).rotulo;
  return `Atenção: com este gasto você passou o orçamento de *${nome}* (${formatarBRL(limite)}). Já são ${formatarBRL(total)} no mês.`;
}

/**
 * As perguntas, respondidas com o extrato do NovareCash.
 *
 * "contas" e "fatura" continuam sendo entendidas pelo interpretador, mas o
 * NovareCash não tem contas fixas nem data de fechamento de cartão: a resposta
 * diz isso e aponta o que ele SABE responder, em vez de inventar.
 */
async function responderConsulta(userId: string, c: Consulta): Promise<string> {
  const s = servico();

  if (c.escopo === "saldo" || c.escopo === "fatura") {
    const linkBanco = `${SITE_URL}/novarecash/app/banco`;
    // O MESMO número do app (04/11/2026): `comSaldos` anda a conta MANUAL com os
    // lançamentos feitos depois do saldo informado. Ler só a coluna `saldo`
    // respondia o valor do dia em que a pessoa o digitou — com o app dizendo outro.
    let contas: Awaited<ReturnType<typeof comSaldos>>;
    try {
      contas = await comSaldos(s, userId, await lerContas(s, userId));
    } catch (e) {
      console.warn("[whatsapp] nao leu saldos:", e instanceof Error ? e.message : e);
      return "Não consegui ler suas contas agora. Tente de novo em instantes.";
    }

    if (c.escopo === "saldo") {
      const comSaldo = contas.filter((k) => k.tipo !== "cartao" && k.saldoAtual !== null);
      if (comSaldo.length === 0) {
        return `Ainda não tenho o saldo das suas contas. Conecte o banco no NovareCash (${linkBanco}) e ele entra sozinho.`;
      }
      // "Atualizado até" só faz sentido para o saldo que vem do BANCO; o manual é o de hoje.
      // A data mais recente é escolhida pelo ISO, não pelo "dd/mm" (que ordena
      // "31/10" depois de "03/11").
      const maisRecente = comSaldo
        .filter((k) => k.origem === "openfinance")
        .map((k) => k.saldo_em)
        .filter((d): d is string => Boolean(d))
        .sort()
        .pop();
      const dia = diaBrasil(maisRecente ?? null);
      return [
        respostaDeSaldo(comSaldo.map((k) => ({ nome: k.nome, saldo: Number(k.saldoAtual) }))),
        dia ? `Saldo do banco atualizado até ${dia}.` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    const cartoes = contas.filter((k) => k.tipo === "cartao");
    if (cartoes.length === 0) {
      return `Ainda não tenho nenhum cartão seu. Cadastre em Cartões no NovareCash ou conecte o banco (${linkBanco}).`;
    }
    // A FATURA ABERTA de cada cartão (`cartoes.ts`), a mesma do Início; sem o SQL
    // dos cartões, o saldo do cartão (limite usado).
    const abertas = await faturasAbertas(s, userId, hojeNoBrasil()).catch(() => null);
    return cartoes
      .map((k) => {
        const aberta = abertas?.get(k.id);
        if (aberta !== undefined) return `*${k.nome}*: ${formatarBRL(aberta)} na fatura aberta`;
        if (k.saldoAtual === null) return `*${k.nome}*: ainda sem lançamentos`;
        const dia = k.origem === "openfinance" ? diaBrasil(k.saldo_em) : null;
        return `*${k.nome}*: ${formatarBRL(Math.abs(k.saldoAtual))} em aberto${dia ? ` (em ${dia})` : ""}`;
      })
      .join("\n");
  }

  if (c.escopo === "contas") {
    // 04/11/2026: o NovareCash GANHOU contas a pagar (`contas-pagar.ts`). A resposta
    // antiga ("ainda não acompanha contas a pagar") passou a ser falsa para quem as cadastrou.
    const linkContas = `${SITE_URL}/novarecash/app/contas`;
    try {
      const hoje = hojeNoBrasil();
      const { itens } = await carregarMesDeContas(s, userId, hoje.slice(0, 7), hoje);
      const faltam = itens.filter((i) => !i.pagamento);
      if (!itens.length) return `Você ainda não cadastrou contas a pagar. Cadastre em ${linkContas} e eu aviso na véspera.`;
      if (!faltam.length) return "Todas as contas deste mês estão pagas.";
      const total = faltam.reduce((soma, i) => soma + i.conta.valor, 0);
      const linhas = faltam
        .slice(0, 8)
        .map((i) => `• ${i.conta.descricao}: ${formatarBRL(i.conta.valor)}, ${i.situacao === "atrasada" ? "venceu" : "vence"} ${dataCurta(i.vence)}`);
      if (faltam.length > 8) linhas.push(`• e mais ${faltam.length - 8}`);
      return [`Faltam pagar ${formatarBRL(total)} em ${faltam.length === 1 ? "1 conta" : `${faltam.length} contas`}:`, ...linhas].join("\n");
    } catch (e) {
      console.warn("[whatsapp] nao leu contas a pagar:", e instanceof Error ? e.message : e);
      return `Não consegui ler suas contas a pagar agora. Veja em ${linkContas}.`;
    }
  }

  if (c.escopo === "resumo") {
    const { inicio, fim } = limitesDoMes(c.ref);
    const { data } = await s
      .from("ncash_transacoes")
      .select("tipo, valor, categoria")
      .eq("user_id", userId)
      .gte("data", inicio)
      .lte("data", fim);

    let entrou = 0;
    let saiu = 0;
    for (const l of data ?? []) {
      // Dinheiro que só mudou de lugar (fatura paga, transferência, aplicação) não é
      // entrada nem saída — a mesma regra do resumo do app (`resumoDoMes`).
      if (NAO_E_GASTO.has(String(l.categoria))) continue;
      const v = Number(l.valor);
      if (l.tipo === "entrada") entrou += v;
      else saiu += v;
    }
    // O NovareCash não tem "previsto": tudo no extrato já aconteceu.
    return respostaDeResumo({ ref: c.ref, entrou, saiu, aPagar: 0 });
  }

  const { total, quantidade } = await saidasDoMes(userId, c.ref, c.categoria_id);
  const orcamento = c.categoria_id ? await limiteDaCategoria(userId, c.categoria_id) : null;

  return respostaDeConsultaCategoria({
    categoria: c.categoria_nome ?? "Total de gastos",
    ref: c.ref,
    total,
    quantidade,
    orcamento,
  });
}

/**
 * Desfaz o último lançamento que o ASSISTENTE criou.
 *
 * Só o que veio pelo WhatsApp, e só nas últimas 24h. Deixar o "desfazer" chegar
 * em lançamento feito no app seria dar a um canal sem tela o poder de apagar o
 * que a pessoa digitou com calma em outro lugar. Por isso a exclusão exige
 * TAMBÉM `origem = 'whatsapp'` na própria transação — não basta o log apontar.
 *
 * Só olha `ncash_transacao_id`: lançamentos antigos do FINCASH (em
 * `lancamento_id`) nunca são tocados daqui.
 *
 * Conta compartilhada: o LOG é de quem mandou (`userId`) — cada um desfaz só o
 * que ELE mandou —, e a transação mora no NovareCash do dono (`donoId`).
 */
async function desfazerUltimo(userId: string, donoId: string): Promise<string> {
  const s = servico();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await s
    .from("fin_whatsapp_mensagens")
    .select("id, ncash_transacao_id")
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .not("ncash_transacao_id", "is", null)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1);

  const alvo = data?.[0] as { id: string; ncash_transacao_id: string } | undefined;
  if (!alvo) return respostaNadaParaDesfazer();

  const { data: transacao } = await s
    .from("ncash_transacoes")
    .select("descricao, valor")
    .eq("id", alvo.ncash_transacao_id)
    .eq("user_id", donoId)
    .eq("origem", "whatsapp")
    .maybeSingle();

  if (!transacao) return respostaNadaParaDesfazer();

  /* `delete` de verdade: o NovareCash não tem lixeira (não há `apagado_em` em
     `ncash_transacoes`). O que protege é o filtro triplo — id, dono e origem. */
  const { error } = await s
    .from("ncash_transacoes")
    .delete()
    .eq("id", alvo.ncash_transacao_id)
    .eq("user_id", donoId)
    .eq("origem", "whatsapp");

  if (error) return "Não consegui apagar agora. Tente pelo extrato do NovareCash.";

  // Solta o vínculo para "desfazer" duas vezes seguidas não tentar apagar o
  // mesmo lançamento (já morto) em vez de andar para o anterior.
  await s
    .from("fin_whatsapp_mensagens")
    .update({ ncash_transacao_id: null })
    .eq("id", alvo.id);

  return respostaDesfeito(transacao.descricao as string, Number(transacao.valor));
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
 * não precisar de tabela nova. Tipo "proposta-foto" com `ncash_transacao_id`
 * nulo é o que marca "ainda não virou lançamento": no momento em que vira, o
 * tipo passa a "proposta-foto-gravada", a linha deixa de ser encontrada aqui, e
 * o "sim" repetido não duplica o gasto (ver `tratarRespostaAProposta`).
 *
 * `provedor_msg_id` vem junto porque é o `externo_id` da transação: é a FOTO
 * que gerou o gasto, e é ela que não pode virar duas transações.
 */
type PropostaPendente = {
  id: string;
  provedorMsgId: string | null;
  proposta: Proposta;
  custoCentavos: number;
};

async function propostaPendente(userId: string): Promise<PropostaPendente | null> {
  const desde = new Date(Date.now() - JANELA_PROPOSTA_MIN * 60 * 1000).toISOString();

  const { data } = await servico()
    .from("fin_whatsapp_mensagens")
    .select("id, provedor_msg_id, interpretacao")
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .eq("tipo", "imagem")
    .is("ncash_transacao_id", null)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1);

  const linha = data?.[0] as
    | {
        id: string;
        provedor_msg_id: string | null;
        interpretacao: { tipo?: string; proposta?: Proposta; custo_centavos?: number } | null;
      }
    | undefined;

  if (linha?.interpretacao?.tipo !== "proposta-foto") return null;
  const p = linha.interpretacao.proposta;
  if (!p || typeof p.valor !== "number") return null;
  return {
    id: linha.id,
    provedorMsgId: linha.provedor_msg_id,
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
    const ctx = await carregarContexto(vinculo.dono_id);
    const intencao = interpretarNoNovareCash(r.texto, vinculo, ctx, agoraNoBrasil());

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
  const ctx = await carregarContexto(vinculo.dono_id);
  const intencao = interpretarNoNovareCash(
    fraseDaProposta(pendente.proposta, hoje),
    vinculo,
    ctx,
    hoje,
  );

  if (intencao.tipo !== "registrar") {
    // Cai aqui quando a origem é ambígua, por exemplo: a pergunta do
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

  const id = await gravarTransacao(
    vinculo.dono_id,
    intencao.rascunho,
    pendente.provedorMsgId ?? msg.idMensagem,
  );
  if (!id) {
    await responder({ ...base, texto: "Não consegui salvar agora. Tente de novo em instantes." });
    return true;
  }

  /* A transação é carimbada na linha da FOTO, não na do "sim": é a foto que
     gerou o gasto, e é por ela que o `desfazer` procura.

     ⚠️ A proposta também troca de tipo ("proposta-foto-gravada"), e é ISSO que
     a fecha de vez. Só o carimbo não bastaria: o NovareCash apaga de verdade
     (sem lixeira), o `desfazer` solta o carimbo, e a FK `on delete set null`
     também — com a linha voltando a ter `ncash_transacao_id` nulo e tipo
     "proposta-foto", um segundo "sim" dentro da janela regravaria o gasto. */
  await servico()
    .from("fin_whatsapp_mensagens")
    .update({
      ncash_transacao_id: id,
      interpretacao: {
        tipo: "proposta-foto-gravada",
        proposta: pendente.proposta,
        custo_centavos: pendente.custoCentavos,
      },
    })
    .eq("id", pendente.id);

  const alerta = await alertaDeOrcamento(vinculo.dono_id, intencao.rascunho);
  await responder({
    ...base,
    interpretacao: intencao as unknown,
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
      if (tentativa?.semAssinatura) {
        await responderSemAssinatura(msg.de, tentativa.user_id ?? null, mensagemId);
        return;
      }
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
        texto: tentativa ? respostaCodigoInvalido(SITE_URL) : respostaNaoVinculado(SITE_URL),
        mensagemId,
      });
      return;
    }

    // Trava de assinante (NovareCash): vinculado sem acesso recebe o aviso e
    // NADA é processado — nem lançamento, nem mídia baixada, nem consulta.
    if (!(await temNovareCash(vinculo.user_id))) {
      await responderSemAssinatura(msg.de, vinculo.user_id, mensagemId);
      return;
    }

    if (msg.tipo !== "texto") {
      // Vídeo e documento continuam de fora: são caros de processar e quase
      // nunca são comprovante — e o extrato do banco já entra sozinho pelo
      // Open Finance do NovareCash.
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

    const ctx = await carregarContexto(vinculo.dono_id);
    // O "hoje" do usuário, não o do servidor. A Vercel roda em UTC e, depois
    // das 21h no Brasil, um gasto de hoje seria gravado amanhã.
    const intencao = interpretarNoNovareCash(msg.texto, vinculo, ctx, agoraNoBrasil());

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
      // `externo_id` = id DESTA mensagem no provedor (texto ou áudio).
      const id = await gravarTransacao(vinculo.dono_id, intencao.rascunho, msg.idMensagem);
      if (!id) {
        await responder({
          ...base,
          texto: comAudio("Não consegui salvar agora. Tente de novo em instantes."),
        });
        return;
      }
      const alerta = await alertaDeOrcamento(vinculo.dono_id, intencao.rascunho);
      await responder({
        ...base,
        transacaoId: id,
        texto: comAudio(
          [respostaDeRegistro(intencao.rascunho), alerta].filter(Boolean).join("\n\n"),
        ),
      });
      return;
    }

    case "consulta":
      await responder({
        ...base,
        texto: comAudio(await responderConsulta(vinculo.dono_id, intencao.consulta)),
      });
      return;

    case "desfazer":
      await responder({ ...base, texto: comAudio(await desfazerUltimo(vinculo.user_id, vinculo.dono_id)) });
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
 * Fuso fixo em America/Sao_Paulo: o NovareCash é de cliente brasileiro, e
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
