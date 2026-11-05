import {
  BLACK,
  linkDeCompra,
  descontoPercentual,
  faseBlack,
  PLANO_DESTAQUE,
  PLANOS,
  precoAtual,
  RECURSOS,
  type ChavePlano,
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
 * 05/11/2026: TRÊS PLANOS MENSAIS (Essencial, Plus, Premium), que só mudam no
 * limite de bancos. Uma `Oferta` por plano, na ordem de `PLANOS`.
 *
 * Sem "use client" e sem nada de servidor: a página (servidor) e o pop-up
 * (navegador) leem a mesma regra.
 */

export type Oferta = {
  plano: ChavePlano;
  nome: string;
  /** Quantos bancos o plano conecta pelo Open Finance. */
  bancos: number;
  /** O selo do cartão ("Mais escolhido"), se houver. */
  selo: string | null;
  /** O plano em destaque na página. */
  destaque: boolean;
  /** O que se paga AGORA por mês (Black dentro da janela, cheio fora). */
  porMes: number;
  /** O cheio por mês, para riscar. Só existe com a Black aberta e o preço dela abaixo do cheio. */
  cheioPorMes: number | null;
  /** % OFF. Só com a Black aberta: fora dela o preço exibido já é o cheio. */
  desconto: number | null;
  checkout: string;
  /** Sem link da Hotmart ainda: o botão leva ao WhatsApp da casa. */
  peloWhatsApp: boolean;
};

/** Os três planos, com o preço que vale em `agora`. */
export function ofertas(agora = new Date()): Oferta[] {
  const aberta = faseBlack(agora) === "aberta";
  return PLANOS.map((p) => {
    const valor = precoAtual(p.chave, agora);
    const riscar = aberta && p.black != null && p.black < p.cheio ? p.cheio : null;
    const compra = linkDeCompra(p.chave);
    return {
      plano: p.chave,
      nome: p.nome,
      bancos: p.bancos,
      selo: p.selo ?? null,
      destaque: p.chave === PLANO_DESTAQUE,
      porMes: valor,
      cheioPorMes: riscar,
      desconto: riscar != null ? descontoPercentual(p.chave) : null,
      checkout: compra.href,
      peloWhatsApp: compra.peloWhatsApp,
    };
  });
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
  return `A conexão com bancos ${banco.liberaEm ? `libera em ${banco.liberaEm}` : "está em preparação"}; até lá, todos os recursos que já funcionam vêm em qualquer plano.`;
}

/** R$ 1.234,56 */
export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * O texto do botão de compra — O MESMO no herói, no fecho e no pop-up (04/11:
 * copy no modelo "Black November"). O valor é o menor plano (`aPartirDe`): com
 * três planos, "por R$ 29,90" sozinho diria que tudo custa isso, então é
 * "a partir de". O botão de cada cartão diz o nome do plano ("Assinar o Plus").
 */
export function textoCompra(valor: number | null): string {
  return valor != null ? `Assinar a partir de ${brl(valor)}` : "Assinar o NovareCash";
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
