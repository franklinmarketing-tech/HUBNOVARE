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

/** Valores em REAIS. `null` = aquele prazo não é vendido (não aparece na página). */
export type Preco = { cheio: number | null; black: number | null };

/**
 * A OFERTA (04/11/2026, decisão do dono: "já vamos vender, valor mensal, nada de Lista VIP",
 * e "precifique igual ou um pouco mais barato que o mercado, quero competir").
 * Só o MENSAL é vendido. Pesquisa de 04/11/2026 dos apps COM Open Finance:
 *   Pierre Pro R$ 39/mês · Organizze Conectado R$ 39,90 · Mobills mensal R$ 42,90 ·
 *   Meu Planner Premium (com WhatsApp) 12x R$ 34,90 · Minhas Finanças ~R$ 16,66 (só anual).
 * Cheio R$ 34,90 = o empate com o Meu Planner e abaixo de Pierre/Organizze/Mobills, com
 * banco + WhatsApp + IA juntos. ⚠️ PISO DO DONO (04/11): R$ 29,90 é o MENOR preço que se
 * cobra — nenhuma campanha desce disso. Na Black, R$ 29,90.
 */
export const PRECOS: { mensal: Preco; anual: Preco } = {
  mensal: { cheio: 34.9, black: 29.9 },
  anual: { cheio: null, black: null }, // não vendido; valor do ANO inteiro se um dia for
};

export const GARANTIA_DIAS = 7;

/**
 * Links de checkout da Hotmart — vêm da Vercel, não do código, para trocar
 * oferta sem deploy de código (`NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL`).
 */
export const CHECKOUT = {
  mensal: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL ?? "",
  anual: process.env.NEXT_PUBLIC_NOVARECASH_CHECKOUT_ANUAL ?? "",
};

/**
 * Para onde vai o botão de assinar. Com o link da Hotmart na Vercel, vai direto
 * ao pagamento. SEM ele (04/11: o dono passa o link depois), cai no WhatsApp da
 * casa com a mensagem pronta — a venda não espera a integração ficar pronta.
 */
export function linkDeCompra(prazo: "mensal" | "anual"): { href: string; peloWhatsApp: boolean } {
  if (CHECKOUT[prazo]) return { href: CHECKOUT[prazo], peloWhatsApp: false };
  return { href: falarNoWhatsApp("Olá! Quero assinar o NovareCash."), peloWhatsApp: true };
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
};

export type FaseBlack = "antes" | "aviso" | "aberta" | "encerrada";

export function faseBlack(agora = new Date()): FaseBlack {
  const t = agora.getTime();
  if (t < Date.parse(BLACK.avisoDesde)) return "antes";
  if (t < Date.parse(BLACK.inicio)) return "aviso";
  if (t <= Date.parse(BLACK.fim)) return "aberta";
  return "encerrada";
}

/** Preço que vale AGORA para um prazo (Black dentro da janela, cheio fora). `null` = não está à venda. */
export function precoAtual(prazo: "mensal" | "anual", agora = new Date()): number | null {
  const p = PRECOS[prazo];
  if (faseBlack(agora) === "aberta" && p.black != null) return p.black;
  return p.cheio;
}

/** O prazo tem preço? Então está à venda (sem checkout, o botão vai ao WhatsApp — ver `linkDeCompra`). */
export function aVenda(prazo: "mensal" | "anual"): boolean {
  return precoAtual(prazo) != null;
}

export function descontoPercentual(prazo: "mensal" | "anual"): number | null {
  const p = PRECOS[prazo];
  if (p.cheio == null || p.black == null || p.cheio <= 0) return null;
  return Math.round((1 - p.black / p.cheio) * 100);
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
