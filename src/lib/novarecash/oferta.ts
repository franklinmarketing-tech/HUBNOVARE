import {
  ancoraPorMes,
  BLACK,
  linkDeCompra,
  descontoPercentual,
  economiaAnual,
  faseBlack,
  PLANO_DESTAQUE,
  PLANOS,
  PRAZOS,
  precoAtual,
  RECURSOS,
  totalAnual,
  type ChavePlano,
  type Prazo,
  type Recurso,
} from "@/lib/novarecash/config";

/**
 * A OFERTA DO NOVARECASH, PRONTA PARA A TELA — derivada de `config.ts`.
 *
 * Este arquivo não guarda preço nenhum: ele só lê `config.ts` e responde as
 * perguntas que a página de venda e o pop-up da Black fazem ("qual o menor
 * preço?", "qual valor riscar?", "quanto por dia?"). Se uma tela precisar de
 * um número, ele sai daqui ou de lá, nunca de um literal no JSX.
 *
 * 05/11/2026: TRÊS PLANOS (Essencial, Plus, Premium), que só mudam no limite de
 * bancos, cada um em DOIS PRAZOS (mensal e anual). Uma `Oferta` por plano e
 * prazo: `ofertas(agora, prazo)` devolve os três de um prazo, na ordem de
 * `PLANOS`; `todasAsOfertas(agora)` devolve os seis.
 *
 * Sem "use client" e sem nada de servidor: a página (servidor) e o pop-up
 * (navegador) leem a mesma regra.
 */

export type Oferta = {
  plano: ChavePlano;
  nome: string;
  prazo: Prazo;
  /** Quantos bancos o plano conecta pelo Open Finance. */
  bancos: number;
  /** O selo do cartão ("Recomendado"), se houver. */
  selo: string | null;
  /** O plano em destaque na página. */
  destaque: boolean;
  /** O que se paga AGORA por mês (Black dentro da janela, cheio fora). No anual, por mês do ano pago. */
  porMes: number;
  /** O valor a riscar, por mês: o MENSAL cheio (`ancoraPorMes`). `null` = nada a riscar. */
  cheioPorMes: number | null;
  /** % OFF contra o valor riscado. `null` quando não há riscado. */
  desconto: number | null;
  /** Só no anual: o que se paga de uma vez (por mês × 12). */
  totalAno: number | null;
  /** Só no anual: quanto ele economiza por ano contra o mensal do mesmo período. */
  economiaAno: number | null;
  /**
   * O preço por mês deste prazo DEPOIS da Black, quando a campanha mexe nele e ele
   * não é o próprio valor riscado (no anual, o riscado é o mensal). `null` fora disso.
   */
  depoisDaBlack: number | null;
  checkout: string;
  /** Sem link de pagamento ainda: o botão leva ao WhatsApp da casa. */
  peloWhatsApp: boolean;
};

/** Os três planos de um prazo, com o preço que vale em `agora`. */
export function ofertas(agora = new Date(), prazo: Prazo = "mensal"): Oferta[] {
  const aberta = faseBlack(agora) === "aberta";
  return PLANOS.map((p) => {
    const preco = p.precos[prazo];
    const valor = precoAtual(p.chave, agora, prazo);
    const riscar = ancoraPorMes(p.chave, prazo, agora);
    const compra = linkDeCompra(p.chave, prazo);
    const anual = prazo === "anual";
    const depois = aberta && preco.black != null && preco.black < preco.cheio && preco.cheio !== riscar ? preco.cheio : null;
    return {
      plano: p.chave,
      nome: p.nome,
      prazo,
      bancos: p.bancos,
      selo: p.selo ?? null,
      destaque: p.chave === PLANO_DESTAQUE,
      porMes: valor,
      cheioPorMes: riscar,
      desconto: riscar != null ? descontoPercentual(p.chave, prazo, agora) : null,
      totalAno: anual ? totalAnual(p.chave, agora) : null,
      economiaAno: anual ? economiaAnual(p.chave, agora) : null,
      depoisDaBlack: depois,
      checkout: compra.href,
      peloWhatsApp: compra.peloWhatsApp,
    };
  });
}

/** As ofertas por prazo — o que a chave "Mensal | Anual" dos planos troca. */
export function ofertasPorPrazo(agora = new Date()): Record<Prazo, Oferta[]> {
  return { mensal: ofertas(agora, "mensal"), anual: ofertas(agora, "anual") };
}

/** As seis ofertas (3 planos × 2 prazos): é delas que sai o "a partir de" do herói, do pop-up e da barra. */
export function todasAsOfertas(agora = new Date()): Oferta[] {
  return PRAZOS.flatMap((prazo) => ofertas(agora, prazo));
}

/**
 * O selo da chave Mensal | Anual: "economize R$ 60 por ano" — calculado. Se os
 * planos economizarem valores diferentes, "economize até R$ X por ano".
 * `null` quando o anual não economiza nada.
 */
export function textoEconomia(anuais: Oferta[]): string | null {
  const vs = anuais.map((o) => o.economiaAno ?? 0).filter((v) => v > 0);
  if (!vs.length) return null;
  const maior = Math.max(...vs);
  const iguais = vs.length === anuais.length && vs.every((v) => v === maior);
  return `economize ${iguais ? "" : "até "}${brlCurto(maior)} por ano`;
}

/** "no anual" ao lado do "a partir de" quando o menor preço é o do anual (honestidade: é pago de uma vez). */
export function rotuloPrazo(prazo: Prazo | null | undefined): string | null {
  return prazo === "anual" ? "no anual" : null;
}

/** O maior % OFF entre o que está à venda — o "até X% OFF" da faixa e do pop-up. */
export function maiorDesconto(lista: Oferta[]): number | null {
  const ds = lista.map((o) => o.desconto).filter((d): d is number => d != null && d > 0);
  return ds.length ? Math.max(...ds) : null;
}

/** A oferta mais barata — a do "a partir de" (hoje, o Essencial). */
export function maisBarata(lista: Oferta[]): Oferta | null {
  return lista.reduce<Oferta | null>((m, o) => (m == null || o.porMes < m.porMes ? o : m), null);
}

/** O "a partir de": o menor valor por mês entre o que está à venda. */
export function aPartirDe(lista: Oferta[]): number | null {
  return maisBarata(lista)?.porMes ?? null;
}

/** "Conecta até 1 banco" / "Conecta até 3 bancos". */
export function textoBancos(n: number): string {
  return `Conecta até ${n} ${n === 1 ? "banco" : "bancos"}`;
}

/**
 * A frase honesta dos planos enquanto o Open Finance não está no ar (CDC):
 * "A conexão com bancos libera em dezembro de 2026; até lá, todos os recursos
 * que já funcionam vêm em qualquer plano." `null` quando o banco já funciona.
 */
export function avisoBancos(): string | null {
  const banco = RECURSOS.find((r) => r.chave === "banco");
  if (!banco || banco.noAr) return null;
  return `A conexão com bancos ${banco.liberaEm ? `libera em ${banco.liberaEm}` : "está em preparação"}; até lá, o que já funciona vem em qualquer plano (os agentes de IA variam por plano).`;
}

/** R$ 1.234,56 */
export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** R$ 60 (sem ",00" quando o valor é inteiro); R$ 60,50 quando não é. */
export function brlCurto(v: number): string {
  return Number.isInteger(v) ? brl(v).replace(/,00$/, "") : brl(v);
}

/**
 * O texto do botão de compra — O MESMO no herói, no fecho e no pop-up (04/11:
 * copy no modelo "Black November"). O valor é o menor plano (`aPartirDe`): com
 * três planos, "por R$ 29,90" sozinho diria que tudo custa isso, então é
 * "a partir de". O botão de cada cartão diz o nome do plano ("Assinar o Plus").
 * 05/11/2026: com o anual, o menor valor é o do anual — e o botão diz "/mês no anual".
 */
export function textoCompra(valor: number | null, prazo?: Prazo | null): string {
  if (valor == null) return "Assinar o NovareCash";
  const rotulo = rotuloPrazo(prazo);
  return `Assinar a partir de ${brl(valor)}${rotulo ? `/mês ${rotulo}` : ""}`;
}

/**
 * O preço do mês em DIAS (05/11/2026): `precoAtual / 30`, nunca escrito à mão.
 * "menos de R$ N por dia", com N = o real inteiro logo acima (R$ 29,90 dá R$ 0,997:
 * "menos de R$ 1"; R$ 39,90 dá R$ 1,33: "menos de R$ 2"). Sempre verdade, para
 * qualquer preço que entrar em `config.ts`. Valor exato em real inteiro: "R$ 1,00 por dia".
 * ⚠️ É conta de preço, não promessa: nada de "se paga em X meses".
 */
export function textoPorDia(porMes: number): string {
  const dia = porMes / 30;
  const teto = Math.ceil(dia);
  return teto > dia ? `menos de R$\u00a0${teto} por dia` : `${brl(dia)} por dia`;
}

/** "30 de novembro", no fuso de Brasília. */
export function dataBlack(qual: "inicio" | "fim"): string {
  return new Date(BLACK[qual]).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * O status de um recurso, com a palavra que o CDC permite.
 *
 * ⚠️ "Incluso" SÓ para o que funciona hoje (`noAr`). O resto diz quando libera
 * e, sem data, "Em preparação" — nunca "incluso", nunca "em breve" solto.
 */
export function statusRecurso(r: Recurso): { noAr: boolean; rotulo: string } {
  if (r.noAr) return { noAr: true, rotulo: "Incluso, já funciona" };
  return { noAr: false, rotulo: r.liberaEm ? `Libera em ${r.liberaEm}` : "Em preparação" };
}

/**
 * O selo CURTO de um recurso que ainda não está no ar, para caber num cartão
 * pequeno da ilustração ("Libera em dez/2026"). `null` = já funciona, sem selo.
 * Sai de `liberaEm`, como `statusRecurso`: a data nunca é escrita à mão.
 */
export function seloCurto(r: Recurso): string | null {
  if (r.noAr) return null;
  if (!r.liberaEm) return "Em preparação";
  const m = r.liberaEm.match(/^(\p{L}{3})\p{L}*\s+de\s+(\d{4})$/u);
  return `Libera em ${m ? `${m[1]}/${m[2]}` : r.liberaEm}`;
}

/** O nome curto de cada recurso, para frases que não cabem o título inteiro. */
export const NOME_CURTO: Record<Recurso["chave"], string> = {
  ia: "IA",
  whatsapp: "WhatsApp",
  banco: "conexão com o banco",
  extrato: "extrato com orçamento",
  cartoes: "cartões com fatura",
  contas: "contas a pagar",
  alertas: "alertas",
  metas: "metas e relatórios",
  compartilhada: "conta compartilhada",
  consultor: "consultor",
};

/** "a, b e c" */
export function juntar(lista: string[]): string {
  return lista.length > 1 ? `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}` : (lista[0] ?? "");
}

/**
 * A ressalva honesta do que ainda não está no ar, numa frase só:
 * "Conexão com o banco e WhatsApp liberam em dezembro de 2026." `null` = tudo funciona.
 *
 * É ela que acompanha qualquer texto que fale do banco ou do WhatsApp lançando
 * sozinhos (herói, pop-up, metadata): a promessa vem sempre com a data ao lado.
 */
export function avisoPendentes(): string | null {
  const grupos = new Map<string, string[]>();
  for (const r of RECURSOS) {
    if (r.noAr) continue;
    const quando = r.liberaEm ?? "";
    grupos.set(quando, [...(grupos.get(quando) ?? []), NOME_CURTO[r.chave]]);
  }
  if (!grupos.size) return null;
  const partes = [...grupos].map(([quando, nomes]) => {
    const verbo = nomes.length > 1 ? "liberam" : "libera";
    return quando ? `${juntar(nomes)} ${verbo} em ${quando}` : `${juntar(nomes)}: em preparação`;
  });
  const frase = juntar(partes);
  return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`;
}
