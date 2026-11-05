/**
 * NOVARECASH — O ÚNICO LUGAR ONDE PREÇO, CAMPANHA E "O QUE ESTÁ NO AR" MORAM.
 *
 * Decisão do dono (03/11/2026): os apps da casa continuam GRATUITOS; o NovareCash é um
 * produto NOVO e PAGO — a solução mais avançada da Novare: conexão com o banco
 * (Open Finance), assistente no WhatsApp e IA com os dados da pessoa.
 *
 * ⚠️ O HUB É "NADA À VENDA" DESDE 18/10/2026, e o NovareCash é a ÚNICA exceção.
 * O guardião `scripts/testar-nada-a-venda.mjs` continua barrando preço no resto
 * do site; aqui dentro, todo preço exibido sai DESTE arquivo — nunca escrito à
 * mão numa tela. Preço em dois lugares é preço que diverge.
 *
 * ⚠️ NÃO PROMETER O QUE NÃO ESTÁ NO AR. `RECURSOS[].noAr` decide se a página de
 * venda diz "incluso" ou "libera em <data>". Vender função que não funciona é
 * problema de Código de Defesa do Consumidor, não só de reputação. Ligou o
 * WhatsApp/Open Finance de verdade? Troque o `noAr` aqui e mais nada.
 *
 * CVM: o NovareCash ORGANIZA e EXPLICA o dinheiro da pessoa. Não indica ativo,
 * produto, fundo nem corretora — nem a IA, nem o WhatsApp, nem a página.
 */

export const NOVARECASH_NOME = "NovareCash";

import { falarNoWhatsApp } from "@/lib/contato";

/**
 * OS PLANOS (05/11/2026, aprovado pelo dono): TRÊS, pela quantidade de bancos
 * conectados pelo Open Finance — o modelo do Pierre e do Organizze. Cada um em
 * DOIS PRAZOS: MENSAL (cobrado todo mês) e ANUAL (os 12 meses pagos de uma vez,
 * mais barato por mês). Todo valor abaixo é POR MÊS; o total do anual sai de
 * `totalAnual()` (por mês × 12), nunca escrito à mão.
 * ⚠️ TODOS OS PLANOS TÊM TODOS OS RECURSOS: muda SÓ o limite de bancos
 * (`bancos`). Quem aplica o limite no app é `bancosDoPlano()`.
 *
 * Histórico: em 04/11 só um mensal (R$ 34,90, Black R$ 29,90), pela pesquisa de
 * 04/11/2026 dos apps COM Open Finance: Pierre Pro R$ 39/mês · Organizze
 * Conectado R$ 39,90 · Mobills mensal R$ 42,90 · Meu Planner Premium (com
 * WhatsApp) 12x R$ 34,90. Em 05/11 o dono passou o cheio a R$ 59,90 ("de 59,90
 * por 29,90"), no mesmo dia para os três planos e, ainda em 05/11, acrescentou o
 * prazo ANUAL em cada um.
 *
 * ⚠️ O CHEIO É O PREÇO REAL COBRADO DEPOIS DA BLACK: de 1º/12 em diante a página
 * cobra exatamente esse valor, no mensal e no anual. Riscar um valor que nunca se
 * cobra é preço de referência falso (CDC) — mudou o cheio, mude aqui e ele vale
 * para os dois lugares. A âncora do anual é o MENSAL cheio do mesmo plano, que
 * também é preço real (`ancoraPorMes`).
 *
 * ⚠️ PISO DO DONO (04/11, confirmado em 05/11): R$ 29,90 por mês é o MENOR preço
 * do MENSAL — nenhuma campanha desce disso no mensal. O ANUAL pode ficar abaixo
 * (o anual da Black do Essencial é R$ 24,90/mês), porque recebe os 12 meses de uma vez.
 *
 * O checkout de cada plano E PRAZO vem da Vercel (para trocar oferta sem deploy):
 * mensal em `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL`, `_PLUS` e `_PREMIUM`;
 * anual em `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL_ANUAL`, `_PLUS_ANUAL` e
 * `_PREMIUM_ANUAL`. Sem a env, o botão vai ao WhatsApp da casa (`linkDeCompra`).
 * ⚠️ As envs ficam escritas por extenso: o Next só embute no navegador o
 * `process.env.NEXT_PUBLIC_…` literal.
 */
export type ChavePlano = "essencial" | "plus" | "premium";

/** Mensal = cobrado todo mês. Anual = os 12 meses pagos de uma vez. */
export type Prazo = "mensal" | "anual";
export const PRAZOS: readonly Prazo[] = ["mensal", "anual"];
/** O prazo marcado quando a página abre (decisão do dono, 05/11/2026). */
export const PRAZO_INICIAL: Prazo = "anual";

export type PrecoPrazo = {
  /** Preço REAL por mês fora da Black (o que se cobra de 1º/12 em diante). */
  cheio: number;
  /** Preço por mês na Black Novare. `null` = sem preço de campanha. */
  black: number | null;
  /** Link de pagamento da Hotmart. Vazio = o botão vai ao WhatsApp da casa. */
  checkout: string;
};

export type Plano = {
  chave: ChavePlano;
  nome: string;
  /** Quantos bancos dá para conectar pelo Open Finance. */
  bancos: number;
  /** O preço POR MÊS em cada prazo. */
  precos: Record<Prazo, PrecoPrazo>;
  /** O selo do cartão de destaque. */
  selo?: string;
};

export const PLANOS: readonly Plano[] = [
  {
    chave: "essencial",
    nome: "Essencial",
    bancos: 1,
    precos: {
      mensal: { cheio: 59.9, black: 29.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL ?? "" },
      anual: { cheio: 49.9, black: 24.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL_ANUAL ?? "" },
    },
  },
  {
    chave: "plus",
    nome: "Plus",
    bancos: 3,
    precos: {
      mensal: { cheio: 79.9, black: 39.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS ?? "" },
      anual: { cheio: 69.9, black: 34.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS_ANUAL ?? "" },
    },
    // ⚠️ Decisão do dono (05/11). Sem clientes ainda, é uma afirmação sem fonte: troque por
    // "Recomendado" se a página tiver de seguir à risca a regra de prova social.
    selo: "Recomendado", // 05/11: "Mais escolhido" sem clientes seria afirmação sem prova (CDC)
  },
  {
    chave: "premium",
    nome: "Premium",
    bancos: 10,
    precos: {
      mensal: { cheio: 119.9, black: 59.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM ?? "" },
      anual: { cheio: 109.9, black: 54.9, checkout: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM_ANUAL ?? "" },
    },
  },
];

/** O plano em destaque na venda (o que tem selo). */
export const PLANO_DESTAQUE: ChavePlano = "plus";

export const ehChavePlano = (v: unknown): v is ChavePlano => PLANOS.some((p) => p.chave === v);

/** O plano pela chave; chave desconhecida (inclusive o antigo 'mensal') = o Essencial. */
export function planoPorChave(chave: string | null | undefined): Plano {
  const c = (chave ?? "").trim().toLowerCase();
  return PLANOS.find((p) => p.chave === c) ?? PLANOS[0];
}

/**
 * Quantos bancos o assinante pode conectar. Lê `ncash_assinantes.plano`.
 * Plano desconhecido ou antigo ('mensal', 'anual', vazio) vale o do Essencial:
 * o menor limite, nunca mais do que foi pago.
 */
export function bancosDoPlano(chave: string | null | undefined): number {
  return planoPorChave(chave).bancos;
}

export const GARANTIA_DIAS = 7;

/**
 * Para onde vai o botão de assinar um plano. Com o link da Hotmart na Vercel, vai
 * direto ao pagamento. SEM ele, cai no WhatsApp da casa com a mensagem pronta,
 * citando o plano (e "anual", no anual) — a venda não espera a integração ficar pronta.
 */
export function linkDeCompra(chave: ChavePlano, prazo: Prazo = "mensal"): { href: string; peloWhatsApp: boolean } {
  const p = planoPorChave(chave);
  const checkout = p.precos[prazo].checkout;
  if (checkout) return { href: checkout, peloWhatsApp: false };
  const qual = prazo === "anual" ? `${p.nome} anual` : p.nome;
  return { href: falarNoWhatsApp(`Olá! Quero assinar o NovareCash ${qual}.`), peloWhatsApp: true };
}

/**
 * A campanha da Black — no estilo "Black November": vale o MÊS (a partir de
 * 04/11). Fora da janela, a página volta ao preço cheio e o pop-up some
 * sozinho — ninguém precisa lembrar de desligar nada no dia 1º de dezembro.
 */
export const BLACK = {
  nome: "Black Novare",
  avisoDesde: "2026-11-04T00:00:00-03:00", // igual a `inicio`: não há mais fase "vem aí"
  inicio: "2026-11-04T00:00:00-03:00",
  fim: "2026-11-30T23:59:59-03:00",
  /** A sexta-feira da Black Friday de verdade (a quarta de novembro). */
  blackFriday: "2026-11-27T00:00:00-03:00",
};

export type FaseBlack = "antes" | "aviso" | "aberta" | "encerrada";

export function faseBlack(agora = new Date()): FaseBlack {
  const t = agora.getTime();
  if (t < Date.parse(BLACK.avisoDesde)) return "antes";
  if (t < Date.parse(BLACK.inicio)) return "aviso";
  if (t <= Date.parse(BLACK.fim)) return "aberta";
  return "encerrada";
}

/**
 * A URGÊNCIA COM DATA DE VERDADE (05/11/2026), dentro da Black aberta:
 *   • "Última semana" — dos 7 dias antes do fim (23/11) até a véspera da sexta;
 *   • "Hoje é Black Friday" — na sexta (27/11);
 *   • "Últimos dias" — do dia seguinte (28/11) até a véspera do fim (29/11);
 *   • "Últimas horas: acaba hoje às 23h59" — no dia do fim (30/11), COM DESTAQUE.
 * Antes de 23/11 (e fora da campanha), `null`: não há rótulo nenhum.
 *
 * ⚠️ TUDO SAI DE `BLACK.fim` E `BLACK.blackFriday`: mudou a data do fim, o "acaba
 * hoje" e a hora mudam junto. Escassez inventada aqui é proibida — o rótulo só
 * diz o que o calendário diz. Lido pela faixa do topo de /novarecash e pelo pop-up.
 */
export type UrgenciaBlack = { rotulo: string; destaque: boolean };

const DIA_MS = 86_400_000;
/** Meia-noite (Brasília) do dia de uma data ISO da campanha. */
const inicioDoDia = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00-03:00`);

/** "23h59": a hora do fim, no fuso de Brasília. */
export function horaFimBlack(): string {
  return new Date(BLACK.fim)
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    .replace(":", "h");
}

export function urgenciaBlack(agora = new Date()): UrgenciaBlack | null {
  if (faseBlack(agora) !== "aberta") return null;
  const t = agora.getTime();
  const diaDoFim = inicioDoDia(BLACK.fim);
  const sexta = inicioDoDia(BLACK.blackFriday);
  if (t >= diaDoFim) return { rotulo: `Últimas horas: acaba hoje às ${horaFimBlack()}`, destaque: true };
  if (t >= sexta + DIA_MS) return { rotulo: "Últimos dias", destaque: false };
  if (t >= sexta) return { rotulo: "Hoje é Black Friday", destaque: false };
  if (t >= diaDoFim - 7 * DIA_MS) return { rotulo: "Última semana", destaque: false };
  return null;
}

/**
 * O MODO PRÉVIA: `?simular=AAAA-MM-DD` vira o meio-dia daquele dia em
 * Brasília, para a equipe ver a página e o pop-up como estarão naquela data.
 * `null` se não for uma data de verdade (31/02 não passa).
 *
 * ⚠️ ESTA FUNÇÃO NÃO CONFERE QUEM PEDIU. Quem a chama confere o perfil
 * (`getPerfil`, admin ou equipe) antes — a página em /novarecash e a rota
 * `/api/black/simular`, que o pop-up consulta. O público nunca simula.
 */
export function dataSimulada(texto: string | null | undefined): Date | null {
  if (!texto || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const d = new Date(`${texto}T12:00:00-03:00`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texto) return null;
  return d;
}

/** Centavos certos: 24,90 × 12 dá 298,80, não 298,79999… */
const centavos = (v: number) => Math.round(v * 100) / 100;

/** O preço POR MÊS que vale AGORA para um plano e prazo: o da Black dentro da janela, o cheio fora. */
export function precoAtual(chave: ChavePlano, agora = new Date(), prazo: Prazo = "mensal"): number {
  const p = planoPorChave(chave).precos[prazo];
  if (faseBlack(agora) === "aberta" && p.black != null) return p.black;
  return p.cheio;
}

/** O que o anual cobra de uma vez AGORA: o preço por mês do anual × 12. */
export function totalAnual(chave: ChavePlano, agora = new Date()): number {
  return centavos(precoAtual(chave, agora, "anual") * 12);
}

/**
 * O valor a riscar (por mês) ao lado do preço de agora: o MENSAL cheio do plano —
 * no mensal só com a Black aberta; no anual sempre que ele sai mais barato que o
 * mensal cheio (o que é verdade também fora da Black). `null` = nada a riscar.
 * ⚠️ É sempre um preço que se cobra de verdade (CDC).
 */
export function ancoraPorMes(chave: ChavePlano, prazo: Prazo = "mensal", agora = new Date()): number | null {
  if (prazo === "mensal" && faseBlack(agora) !== "aberta") return null;
  const cheioMensal = planoPorChave(chave).precos.mensal.cheio;
  return cheioMensal > 0 && precoAtual(chave, agora, prazo) < cheioMensal ? cheioMensal : null;
}

/**
 * O % OFF de um plano no prazo, AGORA, contra a âncora de `ancoraPorMes`:
 *   • mensal: a Black contra o mensal cheio (fora da Black, `null`);
 *   • anual: o anual de agora contra o MENSAL cheio do mesmo plano.
 */
export function descontoPercentual(chave: ChavePlano, prazo: Prazo = "mensal", agora = new Date()): number | null {
  const ancora = ancoraPorMes(chave, prazo, agora);
  if (ancora == null) return null;
  return Math.round((1 - precoAtual(chave, agora, prazo) / ancora) * 100);
}

/** Quanto o anual economiza por ano contra o mensal, no MESMO período: mensal × 12 − anual × 12. */
export function economiaAnual(chave: ChavePlano, agora = new Date()): number {
  return Math.max(0, centavos((precoAtual(chave, agora, "mensal") - precoAtual(chave, agora, "anual")) * 12));
}

export type Recurso = {
  chave: "ia" | "whatsapp" | "banco" | "extrato" | "cartoes" | "contas" | "alertas" | "metas" | "compartilhada" | "consultor";
  titulo: string;
  texto: string;
  /** Funciona de verdade hoje? Se não, a venda diz "libera em `liberaEm`". */
  noAr: boolean;
  liberaEm?: string;
};

export const RECURSOS: Recurso[] = [
  {
    chave: "ia",
    titulo: "IA que conhece o seu dinheiro",
    texto: "Pergunte em português, como \"posso gastar R$ 300 este mês?\", e a resposta sai dos SEUS lançamentos, não de uma média da internet.",
    noAr: true,
  },
  {
    chave: "whatsapp",
    titulo: "Lançou no WhatsApp, está no app",
    texto: "Mande \"gastei 45 no mercado\", um áudio ou a foto da nota. O NovareCash entende e registra.",
    noAr: false, // ⚠️ liga quando as chaves da Meta estiverem na Vercel (ver docs/NOVARECASH-ATIVAR.md)
    liberaEm: "dezembro de 2026",
  },
  {
    chave: "banco",
    titulo: "Conectado ao seu banco",
    texto: "Pelo Open Finance oficial do Banco Central: saldo e extrato entram sozinhos, sem digitar nada.",
    noAr: false, // ⚠️ liga quando o plano do Banco MCP permitir uma conexão por cliente
    liberaEm: "dezembro de 2026",
  },
  {
    // 03/11 (noite): o NovareCash é um app independente — extrato, contas e orçamento são dele (tabelas ncash_*).
    chave: "extrato",
    titulo: "Extrato e orçamento que se organizam",
    texto: "Cada gasto cai na categoria certa, e o orçamento do mês avisa antes de estourar. Lança à mão quando quiser.",
    noAr: true,
  },
  // 04/11/2026 ("todas as melhorias"): o que faltava para brigar com Mobills, Organizze, Pierre e Meu Planner.
  {
    chave: "cartoes",
    titulo: "Cartões com a fatura de verdade",
    texto: "Fechamento, vencimento, compras parceladas e quanto vem na próxima fatura. O pagamento da fatura não conta duas vezes.",
    noAr: true,
  },
  {
    chave: "contas",
    titulo: "Contas a pagar que não passam batido",
    texto: "Aluguel, luz, escola: veja o que vence, marque como paga e saiba quanto vai sobrar no fim do mês. Quando o WhatsApp ligar, o lembrete do vencimento chega por lá.",
    noAr: true,
  },
  {
    chave: "alertas",
    titulo: "Alertas do dinheiro que some",
    texto: "Assinatura esquecida, tarifa, cobrança duplicada e gasto fora do normal aparecem sozinhos, com quanto dá para economizar por mês.",
    noAr: true,
  },
  {
    chave: "metas",
    titulo: "Metas e relatórios",
    texto: "Quanto guardar por mês para chegar lá, os últimos 6 meses lado a lado, e o mês em planilha ou PDF.",
    noAr: true,
  },
  {
    chave: "compartilhada",
    titulo: "Para o casal ou a família",
    texto: "Convide quem divide as contas com você: os dois veem e lançam no mesmo NovareCash, com uma assinatura só.",
    noAr: true,
  },
  {
    chave: "consultor",
    titulo: "Um consultor de verdade do outro lado",
    texto: "Ficou em dúvida? Fale com um consultor da Novare pelo WhatsApp, direto do app. Gente, não robô, e sem vender produto.",
    noAr: true,
  },
];
