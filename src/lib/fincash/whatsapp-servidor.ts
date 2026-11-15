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
  todasAsCategorias,
  type CategoriaDaLista,
} from "@/lib/novarecash/categorias";
import {
  datasDasParcelas,
  descricaoDaParcela,
  dividirEmParcelas,
  faturasAbertas,
  lerCartao,
  somarDias,
} from "@/lib/novarecash/cartoes";
import {
  carregarMesDeContas,
  marcarComoPaga,
  salvarContaPagar,
  type ItemDoMes,
} from "@/lib/novarecash/contas-pagar";
import { criarCategoriaCustom, lerCategoriasCustomOuNada } from "@/lib/novarecash/ajustes";
import { ErroDados } from "@/lib/novarecash/dados";
import { carregarReceber, darBaixa, salvarReceber, type LinhaReceber } from "@/lib/novarecash/receber";
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
  /** 15/11/2026: as contas a pagar pendentes ("paguei a luz") e o fiado em aberto ("o João pagou"). */
  contasAPagar: OrigemAlvo[];
  aReceber: OrigemAlvo[];
  /** O que está por trás de cada id acima, para o servidor executar a baixa. */
  itensPagar: Map<string, ItemDoMes>;
  itensReceber: Map<string, LinhaReceber>;
  /** Fixas + personalizadas: o rótulo certo nas respostas. */
  listaCategorias: CategoriaDaLista[];
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
  const s = servico();
  const hoje = hojeNoBrasil();

  /* 15/11/2026: as CATEGORIAS PRÓPRIAS (Ajustes) também casam pelo WhatsApp, e
     as pendências entram para "paguei a luz" / "o João pagou". Cada leitura é
     opcional: sem o SQL, ou com falha, o assistente segue com o que tem. */
  const [custom, mesDeContas, receber] = await Promise.all([
    lerCategoriasCustomOuNada(s, userId),
    carregarMesDeContas(s, userId, hoje.slice(0, 7), hoje).catch(() => null),
    carregarReceber(s, userId, hoje).catch(() => [] as LinhaReceber[]),
  ]);
  const listaCategorias = todasAsCategorias(custom);
  const minhas: CategoriaAlvo[] = custom
    .filter((c) => !c.arquivada)
    .map((c) => ({ id: c.chave, nome: c.rotulo, tipo: c.tipo === "entrada" ? "receita" : "despesa" }));

  // A conta MAIS ANTIGA sem pagar primeiro: "paguei a luz" quita a atrasada antes da do mês.
  const itensPagar = new Map<string, ItemDoMes>();
  for (const i of [...(mesDeContas?.itens ?? [])].filter((x) => !x.pagamento).sort((a, b) => a.vence.localeCompare(b.vence))) {
    itensPagar.set(`${i.conta.id}|${i.competencia}`, i);
  }
  const itensReceber = new Map<string, LinhaReceber>();
  for (const l of receber.filter((x) => x.situacao !== "recebido")) itensReceber.set(l.item.id, l);

  return {
    // As próprias ANTES das fixas: quem criou "Pet" quer "ração 80" lá, não em Outros.
    categorias: [...minhas, ...CATEGORIAS_ALVO],
    contas: contas.filter((c) => c.tipo === "conta").map(({ id, nome }) => ({ id, nome })),
    cartoes: contas.filter((c) => c.tipo === "cartao").map(({ id, nome }) => ({ id, nome })),
    contasAPagar: [...itensPagar.entries()].map(([id, i]) => ({ id, nome: i.conta.descricao })),
    aReceber: [...itensReceber.entries()].map(([id, l]) => ({ id, nome: l.item.pessoa })),
    itensPagar,
    itensReceber,
    listaCategorias,
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

  if (intencao.tipo === "conta-pagar" && !intencao.conta.categoria_id) {
    const chave = adivinharCategoria(intencao.conta.descricao, "saida");
    if (chave !== "outros") {
      return { ...intencao, conta: { ...intencao.conta, categoria_id: chave, categoria_nome: categoriaNcash(chave).rotulo } };
    }
    return intencao;
  }
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
 * PARCELADO PELO WHATSAPP (15/11/2026): as N parcelas, uma por fatura, com o
 * mesmo `compra_id` — as MESMAS regras do "Lançar compra" da tela Cartões
 * (`dividirEmParcelas`, `datasDasParcelas`). Num insert só: ou entram todas, ou
 * nenhuma. `externo_id` = id da mensagem + "#n", para o índice único recusar a
 * mensagem reenviada. Devolve o id da 1ª parcela (é o que o log guarda; o
 * "desfazer" apaga a compra inteira pelo `compra_id`).
 */
async function gravarParcelado(userId: string, r: RascunhoLancamento, externoId: string): Promise<string | null> {
  const s = servico();
  const n = r.parcelas ?? 1;
  if (!r.cartao_id || n < 2) return gravarTransacao(userId, r, externoId);
  const cartao = await lerCartao(s, userId, r.cartao_id).catch(() => null);
  if (!cartao) return null;

  const valores = dividirEmParcelas(r.valor, n);
  const datas = datasDasParcelas(r.data, n, cartao);
  const compra_id = crypto.randomUUID();
  const linhas = valores.map((valor, i) => ({
    user_id: userId,
    conta_id: r.cartao_id,
    data: datas[i],
    descricao: descricaoDaParcela(r.descricao, i + 1, n),
    valor,
    tipo: "saida",
    categoria: chaveDaCategoria(r),
    origem: "whatsapp",
    externo_id: i === 0 ? externoId : `${externoId}#${i + 1}`,
    parcela: i + 1,
    parcelas: n,
    compra_id,
  }));
  const { data, error } = await s.from("ncash_transacoes").insert(linhas).select("id, parcela");
  if (!error) {
    const primeira = (data ?? []).find((l) => Number(l.parcela) === 1);
    return primeira ? String(primeira.id) : null;
  }
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
  console.warn("[whatsapp] nao gravou parcelado:", error.message);
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
  // Parcelado: o que entrou NESTE mês é só a 1ª parcela.
  const n = r.parcelas ?? 1;
  const agora = n > 1 ? Math.round((r.valor / n) * 100) / 100 : r.valor;
  const antes = total - agora;
  const nome = r.categoria_nome ?? categoriaNcash(chave).rotulo;

  // Cruzou os 100% com ESTE gasto.
  if (antes <= limite && total > limite) {
    return `Atenção: com este gasto você passou o limite de *${nome}* (${formatarBRL(limite)}). Já são ${formatarBRL(total)} no mês.`;
  }
  // 15/11/2026: cruzou os 80% com ESTE gasto (um aviso só, como o de 100%).
  const oitenta = limite * 0.8;
  if (antes <= oitenta && total > oitenta && total <= limite) {
    return `Atenção: você já usou ${Math.round((total / limite) * 100)}% do limite de *${nome}*. Sobram ${formatarBRL(limite - total)} até o fim do mês.`;
  }
  return null;
}

/**
 * As perguntas, respondidas com o extrato do NovareCash.
 *
 * "contas" e "fatura" continuam sendo entendidas pelo interpretador, mas o
 * NovareCash não tem contas fixas nem data de fechamento de cartão: a resposta
 * diz isso e aponta o que ele SABE responder, em vez de inventar.
 */
async function responderConsulta(userId: string, c: Consulta, ctx?: Contexto): Promise<string> {
  const s = servico();

  if (c.escopo === "hoje") {
    const hoje = hojeNoBrasil();
    const { data } = await s
      .from("ncash_transacoes")
      .select("descricao, valor, tipo, categoria")
      .eq("user_id", userId)
      .eq("data", hoje)
      .order("criado_em", { ascending: true })
      .limit(50);
    const linhas = (data ?? []).filter((l) => !NAO_E_GASTO.has(String(l.categoria)));
    if (!linhas.length) return "Nada lançado hoje ainda. Manda um gasto: “Uber 35”.";
    let saiu = 0;
    let entrou = 0;
    const lista = linhas.slice(0, 12).map((l) => {
      const v = Number(l.valor);
      if (l.tipo === "entrada") entrou += v;
      else saiu += v;
      return `• ${l.descricao}: ${l.tipo === "entrada" ? "+" : ""}${formatarBRL(v)}`;
    });
    for (const l of linhas.slice(12)) {
      if (l.tipo === "entrada") entrou += Number(l.valor);
      else saiu += Number(l.valor);
    }
    if (linhas.length > 12) lista.push(`• e mais ${linhas.length - 12}`);
    return [
      `*Hoje* (${dataCurta(hoje)})`,
      ...lista,
      "",
      `Saiu: ${formatarBRL(saiu)}${entrou > 0 ? ` · Entrou: ${formatarBRL(entrou)}` : ""}`,
    ].join("\n");
  }

  if (c.escopo === "receber") {
    const link = `${SITE_URL}/novarecash/app/receber`;
    const abertas = ctx ? [...ctx.itensReceber.values()] : (await carregarReceber(s, userId).catch(() => [])).filter((l) => l.situacao !== "recebido");
    if (!abertas.length) return `Ninguém te deve nada anotado. Para anotar: “vendi 150 fiado pro João, cobrar dia 10”. A lista fica em ${link}`;
    const total = abertas.reduce((soma, l) => soma + l.falta, 0);
    const linhas = abertas.slice(0, 10).map((l) => {
      const quando = !l.item.vence_em ? "" : l.dias !== null && l.dias < 0 ? `, atrasado desde ${dataCurta(l.item.vence_em)}` : `, cobrar ${dataCurta(l.item.vence_em)}`;
      return `• ${l.item.pessoa}: ${formatarBRL(l.falta)}${quando}`;
    });
    if (abertas.length > 10) linhas.push(`• e mais ${abertas.length - 10}`);
    return [`*A receber*: ${formatarBRL(total)}`, ...linhas, "", `Quando pagarem, me diga: “o ${abertas[0].item.pessoa.split(" ")[0]} pagou”.`].join("\n");
  }

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
      if (!itens.length) return `Você ainda não cadastrou contas a pagar. Cadastre em ${linkContas} e, quando você me escrever, eu mostro o que vence hoje e amanhã.`;
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
    .select("descricao, valor, compra_id, parcelas")
    .eq("id", alvo.ncash_transacao_id)
    .eq("user_id", donoId)
    .eq("origem", "whatsapp")
    .maybeSingle();

  if (!transacao) return respostaNadaParaDesfazer();

  // 15/11/2026: compra PARCELADA sai inteira (todas as parcelas, pelo `compra_id`).
  if (transacao.compra_id && Number(transacao.parcelas) > 1) {
    const { error } = await s
      .from("ncash_transacoes")
      .delete()
      .eq("user_id", donoId)
      .eq("compra_id", transacao.compra_id)
      .eq("origem", "whatsapp");
    if (error) return "Não consegui apagar agora. Tente pelo extrato do NovareCash.";
    await s.from("fin_whatsapp_mensagens").update({ ncash_transacao_id: null }).eq("id", alvo.id);
    const nome = String(transacao.descricao).replace(/\s*\(\d+\/\d+\)$/, "");
    return `Apaguei a compra parcelada: *${nome}* (${transacao.parcelas} parcelas).`;
  }

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
 * O último lançamento que o ASSISTENTE criou para esta pessoa (24 h), com as
 * mesmas travas do "desfazer": log de quem mandou + transação do dono com
 * `origem = 'whatsapp'`. Base do "corrigir" e do "criar categoria".
 */
async function ultimoDoAssistente(userId: string, donoId: string) {
  const s = servico();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await s
    .from("fin_whatsapp_mensagens")
    .select("ncash_transacao_id")
    .eq("user_id", userId)
    .eq("direcao", "entrada")
    .not("ncash_transacao_id", "is", null)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1);
  const id = (data?.[0] as { ncash_transacao_id: string } | undefined)?.ncash_transacao_id;
  if (!id) return null;
  const { data: t } = await s
    .from("ncash_transacoes")
    .select("id, descricao, valor, tipo, categoria, compra_id, parcelas, observacao")
    .eq("id", id)
    .eq("user_id", donoId)
    .eq("origem", "whatsapp")
    .maybeSingle();
  return t as
    | { id: string; descricao: string; valor: number; tipo: string; categoria: string; compra_id: string | null; parcelas: number | null; observacao: string | null }
    | null;
}

/** "corrigir 15" / "corrigir para lazer": muda o último lançamento do assistente. */
async function corrigirUltimo(
  vinculo: Vinculo,
  i: Extract<Intencao, { tipo: "corrigir" }>,
  ctx: Contexto,
): Promise<string> {
  const t = await ultimoDoAssistente(vinculo.user_id, vinculo.dono_id);
  if (!t) return "Não achei nenhum lançamento recente meu para corrigir. Corrija pelo extrato do NovareCash.";
  if (i.valor !== null && t.compra_id && Number(t.parcelas) > 1) {
    return "Essa foi uma compra parcelada. Para mudar o valor, responda *desfazer* e mande de novo com o valor certo.";
  }
  if (i.valor !== null && t.observacao === "A receber · baixa") {
    return "Esse lançamento foi um recebimento de fiado. Para mudar o valor, responda *desfazer* e mande de novo.";
  }
  const campos: Record<string, unknown> = {};
  if (i.valor !== null) campos.valor = i.valor;
  if (i.categoria_id) {
    const cat = ctx.listaCategorias.find((c) => c.chave === i.categoria_id);
    const tipoCerto = t.tipo === "entrada" ? "entrada" : "saida";
    if (cat && cat.tipo !== tipoCerto) {
      return `*${cat.rotulo}* é categoria de ${cat.tipo === "entrada" ? "entrada" : "gasto"}, e o último lançamento é ${tipoCerto === "entrada" ? "uma entrada" : "um gasto"}. Escolha outra.`;
    }
    campos.categoria = i.categoria_id;
  }
  const s = servico();
  let q = s.from("ncash_transacoes").update(campos).eq("user_id", vinculo.dono_id).eq("origem", "whatsapp");
  // Categoria de compra parcelada muda em TODAS as parcelas.
  q = t.compra_id && Number(t.parcelas) > 1 && i.valor === null ? q.eq("compra_id", t.compra_id) : q.eq("id", t.id);
  const { error } = await q;
  if (error) return "Não consegui corrigir agora. Tente pelo extrato do NovareCash.";

  const valor = i.valor ?? Number(t.valor);
  const rotulo = ctx.listaCategorias.find((c) => c.chave === (i.categoria_id ?? t.categoria))?.rotulo ?? categoriaNcash(i.categoria_id ?? t.categoria).rotulo;
  return `Corrigido: *${t.descricao}* — ${formatarBRL(valor)} · ${rotulo}.`;
}

/** "criar categoria Pet": cria e, se o último lançamento caiu em Outros, já o move para ela. */
async function criarCategoriaPeloZap(
  vinculo: Vinculo,
  i: Extract<Intencao, { tipo: "criar-categoria" }>,
): Promise<string> {
  const s = servico();
  const tipo = i.tipoCategoria === "receita" ? "entrada" : "saida";
  const existentes = await lerCategoriasCustomOuNada(s, vinculo.dono_id);
  const fixa = CATEGORIAS.find((c) => c.rotulo.toLowerCase() === i.nome.toLowerCase());
  if (fixa) return `*${fixa.rotulo}* já existe no NovareCash. Use-a direto: “${i.nome.toLowerCase()} 50”.`;

  let chave: string;
  const ja = existentes.find((c) => c.rotulo.toLowerCase() === i.nome.toLowerCase() && c.tipo === tipo);
  if (ja) {
    chave = ja.chave;
    if (ja.arquivada) await s.from("ncash_categorias_custom").update({ arquivada: false }).eq("user_id", vinculo.dono_id).eq("chave", chave);
  } else {
    try {
      const r = await criarCategoriaCustom(s, vinculo.dono_id, i.nome, tipo, existentes);
      if (!r.ok) return r.mensagem;
      chave = r.chave;
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") return "Categorias próprias ainda não estão ligadas na sua conta. Crie em *Ajustes* no app.";
      return "Não consegui criar agora. Tente de novo em instantes, ou crie em *Ajustes* no app.";
    }
  }

  // O último lançamento do assistente que ficou em "Outros" vai para a categoria nova.
  const t = await ultimoDoAssistente(vinculo.user_id, vinculo.dono_id);
  const resto = tipo === "entrada" ? "outras_entradas" : "outros";
  const tipoT = t?.tipo === "entrada" ? "entrada" : "saida";
  if (t && t.categoria === resto && tipoT === tipo) {
    let q = s.from("ncash_transacoes").update({ categoria: chave }).eq("user_id", vinculo.dono_id).eq("origem", "whatsapp");
    q = t.compra_id ? q.eq("compra_id", t.compra_id) : q.eq("id", t.id);
    const { error } = await q;
    if (!error) return `Categoria *${i.nome}* criada. Já mudei *${t.descricao}* (${formatarBRL(Number(t.valor))}) para ela. Daqui em diante, é só escrever “${i.nome.toLowerCase()} 50”.`;
  }
  return `Categoria *${i.nome}* criada${ja ? " (ela já existia, reativei)" : ""}. Daqui em diante, é só escrever “${i.nome.toLowerCase()} 50”.`;
}

/** "limite mercado 800": o orçamento mensal da categoria, com o retrato do mês. */
async function definirLimite(donoId: string, i: Extract<Intencao, { tipo: "limite" }>, hoje: Date): Promise<string> {
  const { error } = await servico()
    .from("ncash_orcamentos")
    .upsert({ user_id: donoId, categoria: i.categoria_id, limite: i.valor }, { onConflict: "user_id,categoria" });
  if (error) return "Não consegui salvar o limite agora. Defina em *Orçamento* no app.";
  const ref = refDoMes(hoje);
  const { total } = await saidasDoMes(donoId, ref, i.categoria_id);
  const pct = i.valor > 0 ? Math.round((total / i.valor) * 100) : 0;
  return [
    `Limite de *${i.categoria_nome}*: ${formatarBRL(i.valor)} por mês.`,
    `Neste mês: ${formatarBRL(total)} (${pct}%)${total > i.valor ? " — já passou" : `, sobram ${formatarBRL(i.valor - total)}`}.`,
    "Eu aviso quando chegar em 80% e se passar.",
  ].join("\n");
}

/** "luz 180 vence dia 10": cadastra em Contas a pagar. */
async function anotarContaPagar(donoId: string, i: Extract<Intencao, { tipo: "conta-pagar" }>): Promise<string> {
  const c = i.conta;
  try {
    await salvarContaPagar(servico(), donoId, null, {
      descricao: c.descricao,
      valor: c.valor,
      categoria: c.categoria_id ?? "outros",
      recorrencia: c.recorrencia,
      vence_dia: c.vence_dia,
      vence_em: c.vence_em,
      conta_id: null,
      ativa: true,
    });
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return "Contas a pagar ainda não estão ligadas na sua conta. Cadastre em *Contas* no app.";
    return "Não consegui anotar a conta agora. Tente de novo em instantes.";
  }
  const quando = c.recorrencia === "mensal" ? `todo dia ${c.vence_dia}` : `vence ${dataCurta(c.vence_em ?? "")}`;
  const nome = c.descricao.toLowerCase();
  return [
    `Conta anotada: *${c.descricao}* — ${formatarBRL(c.valor)}, ${quando}.`,
    c.categoria_nome ? `Categoria: ${c.categoria_nome}.` : "",
    `Eu te lembro na véspera e no dia. Quando pagar, me diga: “paguei ${/^(a|o) /.test(nome) ? nome : `a ${nome}`}”.`,
    c.recorrencia === "unica" ? "Se ela repete todo mês, mande assim: “" + nome + " " + c.valor + " todo dia " + Number((c.vence_em ?? "").slice(8, 10)) + "”." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** "paguei a luz": baixa na conta pendente, com o lançamento no Extrato. */
async function pagarContaPeloZap(vinculo: Vinculo, i: Extract<Intencao, { tipo: "pagar-conta" }>, ctx: Contexto): Promise<string> {
  const item = ctx.itensPagar.get(i.alvo);
  if (!item) return "Não achei essa conta pendente. Veja em *Contas* no app.";
  const valor = i.valor ?? item.conta.valor;
  const padrao = vinculo.ncash_conta_padrao_id;
  const contaId = item.conta.conta_id ?? (padrao && ctx.contas.some((c) => c.id === padrao) ? padrao : ctx.contas.length === 1 ? ctx.contas[0].id : null);
  try {
    await marcarComoPaga(servico(), vinculo.dono_id, item, { valor, data: hojeNoBrasil(), conta_id: contaId });
  } catch (e) {
    if (e instanceof ErroDados && e.message === "ja-paga") return `*${item.conta.descricao}* deste mês já estava paga.`;
    return "Não consegui dar baixa agora. Marque em *Contas* no app.";
  }
  const competencia = `${item.competencia.slice(5, 7)}/${item.competencia.slice(0, 4)}`;
  const outras = ctx.contasAPagar.length - 1;
  return [
    `Pago: *${item.conta.descricao}* (${competencia}) — ${formatarBRL(valor)}. Já entrou no extrato.`,
    outras > 0 ? `Ainda ${outras === 1 ? "falta 1 conta" : `faltam ${outras} contas`} este mês. Responda “contas a pagar” para ver.` : "Todas as contas do mês estão pagas.",
    "Desfazer: em *Contas* no app, na aba Pagas.",
  ].join("\n");
}

/** "vendi 150 fiado pro João, cobrar dia 10": um item em A receber. */
async function anotarAReceber(donoId: string, i: Extract<Intencao, { tipo: "a-receber" }>): Promise<string> {
  const it = i.item;
  try {
    await salvarReceber(servico(), donoId, null, {
      pessoa: it.pessoa,
      telefone: null,
      descricao: it.descricao,
      valor: it.valor,
      categoria: "renda_extra",
      vence_em: it.vence_em,
      origem: "whatsapp",
    });
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return "O *A receber* ainda está sendo ligado na sua conta. Tente de novo mais tarde.";
    return "Não consegui anotar agora. Tente de novo em instantes.";
  }
  const primeiro = it.pessoa.split(" ")[0];
  return [
    `Anotado: *${it.pessoa}* te deve ${formatarBRL(it.valor)} (${it.descricao}).`,
    it.vence_em ? `Cobrar em ${dataCurta(it.vence_em)} — eu te lembro no dia, com a mensagem de cobrança pronta.` : "Sem data de cobrança. Quer uma? Edite em *A receber* no app.",
    `Quando pagar, me diga: “o ${primeiro} pagou” (ou “recebi 50 do ${primeiro}”, se for só uma parte).`,
  ].join("\n");
}

/** "o João pagou" / "recebi 50 do João": baixa total ou parcial, com a entrada no Extrato. */
async function receberPeloZap(vinculo: Vinculo, i: Extract<Intencao, { tipo: "receber" }>, ctx: Contexto, externoId: string): Promise<{ texto: string; transacaoId: string | null }> {
  const linha = ctx.itensReceber.get(i.alvo);
  if (!linha) return { texto: "Não achei esse valor em aberto. Veja em *A receber* no app.", transacaoId: null };
  const padrao = vinculo.ncash_conta_padrao_id;
  const contaId = padrao && ctx.contas.some((c) => c.id === padrao) ? padrao : ctx.contas.length === 1 ? ctx.contas[0].id : null;
  try {
    const r = await darBaixa(servico(), vinculo.dono_id, linha, {
      valor: i.valor ?? linha.falta,
      data: hojeNoBrasil(),
      conta_id: contaId,
      externo_id: externoId,
    });
    const sobra = Math.max(0, linha.falta - r.valor);
    return {
      transacaoId: r.transacaoId,
      texto: [
        `Recebido: ${formatarBRL(r.valor)} de *${linha.item.pessoa}*. Entrou no extrato.`,
        r.quitou ? "Quitado." : `Ainda falta ${formatarBRL(sobra)}.`,
        i.valor !== null && i.valor > linha.falta + 0.004 ? `(Faltavam só ${formatarBRL(linha.falta)}; dei baixa nisso.)` : "",
        "Errei? Responda *desfazer*.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  } catch {
    return { texto: "Não consegui dar baixa agora. Marque em *A receber* no app.", transacaoId: null };
  }
}

/** "2026-11" a partir de uma data local. */
function refDoMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

    await tratarDoAssinante(vinculo, msg, mensagemId);
    // Depois da resposta, e só para assinante: as contas do dia, de graça
    // porque a pessoa acabou de escrever (ver `avisarContasDoDia`).
    await avisarContasDoDia(vinculo, msg.de, mensagemId);
  } catch (e) {
    console.error("[whatsapp] falhou ao processar:", e);
  }
}

/** A mensagem de quem é vinculado E assinante: mídia, "sim/não" da foto ou texto. */
async function tratarDoAssinante(vinculo: Vinculo, msg: MensagemRecebida, mensagemId: string) {
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

  await executar(vinculo, intencao, mensagemId, msg, undefined, ctx);
}

/**
 * AS CONTAS DO DIA, DENTRO DA JANELA GRÁTIS (07/11/2026, decisão do dono).
 *
 * ⚠️ O SISTEMA NUNCA INICIA CONVERSA. A Meta cobra a mensagem que a EMPRESA
 * puxa fora da janela de 24 h (template); a resposta a quem acabou de escrever
 * é de graça. Por isso o lembrete das 9h (cron + template) foi APAGADO, e no
 * lugar dele a primeira mensagem do dia recebe, logo depois da resposta, o que
 * está atrasado, vence hoje ou vence amanhã.
 *
 * Uma vez por dono por dia: `ncash_lembretes_enviados` (user_id, dia) é a
 * reserva — gravada ANTES do envio, para dois "oi" seguidos não mandarem duas
 * listas. Nada a mostrar = nada reservado, e a próxima mensagem confere de novo.
 * Nunca lança: aviso que falha não pode estragar a resposta que já saiu.
 */
async function avisarContasDoDia(vinculo: Vinculo, telefone: string, mensagemId: string) {
  try {
    const s = servico();
    const hoje = hojeNoBrasil();
    const amanha = somarDias(hoje, 1);

    const { itens } = await carregarMesDeContas(s, vinculo.dono_id, hoje.slice(0, 7), hoje);
    const urgentes = itens.filter((i) => !i.pagamento && i.dias <= 1);
    // Dia 30/31: o vencimento de amanhã é do mês seguinte, que a lista de hoje não traz.
    if (amanha.slice(0, 7) !== hoje.slice(0, 7)) {
      const proximo = await carregarMesDeContas(s, vinculo.dono_id, amanha.slice(0, 7), hoje);
      urgentes.push(...proximo.itens.filter((i) => !i.pagamento && i.vence === amanha));
    }
    // 15/11/2026: as COBRANÇAS do dia (fiado que vence hoje ou atrasou) entram no mesmo aviso.
    const cobrar = (await carregarReceber(s, vinculo.dono_id, hoje).catch(() => [] as LinhaReceber[])).filter(
      (l) => l.situacao === "atrasado" || l.situacao === "hoje",
    );
    if (!urgentes.length && !cobrar.length) return;

    const { error: reserva } = await s
      .from("ncash_lembretes_enviados")
      .insert({ user_id: vinculo.dono_id, dia: hoje, contas: urgentes.length + cobrar.length });
    if (reserva) return; // 23505 = já avisado hoje; sem o SQL dos cartões, segue sem aviso.

    if (!urgentes.length) {
      await responder({ telefone, userId: vinculo.user_id, mensagemId, texto: textoDeCobrancas(cobrar) });
      return;
    }

    const quando = (i: (typeof urgentes)[number]) =>
      i.dias < 0 ? `venceu ${dataCurta(i.vence)}` : i.dias === 0 ? "vence *hoje*" : "vence *amanhã*";
    const linhas = urgentes.slice(0, 8).map((i) => `• ${i.conta.descricao}: ${formatarBRL(i.conta.valor)}, ${quando(i)}`);
    if (urgentes.length > 8) linhas.push(`• e mais ${urgentes.length - 8}`);
    const total = urgentes.reduce((soma, i) => soma + i.conta.valor, 0);

    await responder({
      telefone,
      userId: vinculo.user_id,
      mensagemId,
      texto: [
        `*Contas para ficar de olho* (${formatarBRL(total)}):`,
        ...linhas,
        "Pagou? Me diga “paguei a …” ou marque em " + `${SITE_URL}/novarecash/app/contas`,
        cobrar.length ? `\n${textoDeCobrancas(cobrar)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (e) {
    console.warn("[whatsapp] nao avisou as contas do dia:", e instanceof Error ? e.message : e);
  }
}

/** "Para cobrar hoje": quem deve, quanto, e o caminho para a mensagem de cobrança pronta. */
function textoDeCobrancas(cobrar: LinhaReceber[]): string {
  const total = cobrar.reduce((soma, l) => soma + l.falta, 0);
  const linhas = cobrar
    .slice(0, 8)
    .map((l) => `• ${l.item.pessoa}: ${formatarBRL(l.falta)}${l.situacao === "atrasado" && l.item.vence_em ? `, desde ${dataCurta(l.item.vence_em)}` : ", *hoje*"}`);
  if (cobrar.length > 8) linhas.push(`• e mais ${cobrar.length - 8}`);
  return [
    `*Para cobrar* (${formatarBRL(total)}):`,
    ...linhas,
    `A mensagem de cobrança pronta está em ${SITE_URL}/novarecash/app/receber`,
  ].join("\n");
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
  ctxPronto?: Contexto,
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

  // Os comandos novos precisam do contexto (pendências, categorias). O texto já o
  // carregou; o áudio carrega aqui, só quando precisa.
  const ctx = async () => ctxPronto ?? (await carregarContexto(vinculo.dono_id));

  switch (intencao.tipo) {
    case "conta-pagar":
      await responder({ ...base, texto: comAudio(await anotarContaPagar(vinculo.dono_id, intencao)) });
      return;

    case "pagar-conta":
      await responder({ ...base, texto: comAudio(await pagarContaPeloZap(vinculo, intencao, await ctx())) });
      return;

    case "a-receber":
      await responder({ ...base, texto: comAudio(await anotarAReceber(vinculo.dono_id, intencao)) });
      return;

    case "receber": {
      const r = await receberPeloZap(vinculo, intencao, await ctx(), msg.idMensagem);
      // O log guarda a entrada: "desfazer" apaga o lançamento e, junto (cascade), a baixa.
      await responder({ ...base, transacaoId: r.transacaoId, texto: comAudio(r.texto) });
      return;
    }

    case "limite":
      await responder({ ...base, texto: comAudio(await definirLimite(vinculo.dono_id, intencao, agoraNoBrasil())) });
      return;

    case "corrigir":
      await responder({ ...base, texto: comAudio(await corrigirUltimo(vinculo, intencao, await ctx())) });
      return;

    case "criar-categoria":
      await responder({ ...base, texto: comAudio(await criarCategoriaPeloZap(vinculo, intencao)) });
      return;

    case "registrar": {
      // `externo_id` = id DESTA mensagem no provedor (texto ou áudio).
      const id = (intencao.rascunho.parcelas ?? 1) > 1
        ? await gravarParcelado(vinculo.dono_id, intencao.rascunho, msg.idMensagem)
        : await gravarTransacao(vinculo.dono_id, intencao.rascunho, msg.idMensagem);
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
        texto: comAudio(await responderConsulta(vinculo.dono_id, intencao.consulta, ctxPronto)),
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
