import {
  BLACK,
  linkDeCompra,
  aVenda,
  descontoPercentual,
  faseBlack,
  PRECOS,
  precoAtual,
  RECURSOS,
  type Recurso,
} from "@/lib/novarecash/config";

/**
 * A OFERTA DO NOVARECASH, PRONTA PARA A TELA — derivada de `config.ts`.
 *
 * Este arquivo não guarda preço nenhum: ele só lê `config.ts` e responde as
 * perguntas que a página de venda e o pop-up da Black fazem ("está à venda?",
 * "qual valor riscar?", "quanto por mês no anual?"). Se uma tela precisar de
 * um número, ele sai daqui ou de lá, nunca de um literal no JSX.
 *
 * Sem "use client" e sem nada de servidor: a página (servidor) e o pop-up
 * (navegador) leem a mesma regra.
 */

export type Prazo = "mensal" | "anual";

export type Oferta = {
  prazo: Prazo;
  /** O que se paga AGORA no prazo (no anual, o ano inteiro). */
  agora: number;
  /** O mesmo valor dividido por mês (no mensal, igual a `agora`). */
  porMes: number;
  /** O preço cheio, para riscar. Só existe com a Black aberta e o preço dela abaixo do cheio. */
  cheio: number | null;
  /** O cheio por mês, para riscar ao lado de `porMes`. */
  cheioPorMes: number | null;
  /** % OFF. Só com a Black aberta: fora dela o preço exibido já é o cheio. */
  desconto: number | null;
  checkout: string;
  /** Sem link da Hotmart ainda: o botão leva ao WhatsApp da casa. */
  peloWhatsApp: boolean;
};

const PRAZOS: Prazo[] = ["mensal", "anual"];

/** Só os prazos com preço (hoje, só o mensal). */
export function ofertas(agora = new Date()): Oferta[] {
  const aberta = faseBlack(agora) === "aberta";
  return PRAZOS.filter((prazo) => aVenda(prazo)).map((prazo) => {
    const valor = precoAtual(prazo, agora) as number;
    const { cheio, black } = PRECOS[prazo];
    const riscar = aberta && black != null && cheio != null && black < cheio ? cheio : null;
    const meses = prazo === "anual" ? 12 : 1;
    const compra = linkDeCompra(prazo);
    return {
      prazo,
      agora: valor,
      porMes: valor / meses,
      cheio: riscar,
      cheioPorMes: riscar != null ? riscar / meses : null,
      desconto: riscar != null ? descontoPercentual(prazo) : null,
      checkout: compra.href,
      peloWhatsApp: compra.peloWhatsApp,
    };
  });
}

/** Há alguma coisa à venda? (Hoje sempre: o mensal tem preço.) */
export const emVenda = (agora = new Date()) => ofertas(agora).length > 0;

/** O maior % OFF entre o que está à venda — o "até X% OFF" da faixa e do pop-up. */
export function maiorDesconto(lista: Oferta[]): number | null {
  const ds = lista.map((o) => o.desconto).filter((d): d is number => d != null && d > 0);
  return ds.length ? Math.max(...ds) : null;
}

/** O "a partir de": o menor valor por mês entre o que está à venda. */
export function aPartirDe(lista: Oferta[]): number | null {
  return lista.length ? Math.min(...lista.map((o) => o.porMes)) : null;
}

/** R$ 1.234,56 */
export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
