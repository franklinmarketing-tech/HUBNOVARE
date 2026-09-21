/**
 * OS PREÇOS COMO A LANDING DE /assinar OS NOMEIA.
 *
 * A landing foi escrita contra uma versão de `lib/assinatura.ts` em que
 * `ASSINATURA_PRECO_ROTULO` era o "a partir de" (o anual dividido por 12).
 * Na versão atual ele é o MENSAL cheio, e trocar só o nome do import faria a
 * página anunciar R$ 29,90 onde promete R$ 19,90.
 *
 * Este arquivo traduz um vocabulário no outro. Nenhum número é digitado
 * aqui: tudo deriva de `lib/assinatura.ts`, que continua sendo a única fonte
 * do preço, e o checkout não passa por este arquivo.
 */
import {
  ASSINATURA_ANUAL_ECONOMIA_MESES,
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_ANUAL_REFERENCIA_ROTULO,
  ASSINATURA_GARANTIA_DIAS as GARANTIA_DIAS,
  ASSINATURA_PRECO as PRECO_MENSAL,
  ASSINATURA_PRECO_ANUAL as PRECO_ANUAL,
  ASSINATURA_PRECO_ANUAL_MENSAL,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO as PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO as PRECO_MENSAL_ROTULO,
} from "@/lib/assinatura";

/** O nome que a landing usa para o pacote inteiro. */
export const ASSINATURA_NOME = "Workspace Novare";

/** "A partir de": o anual dividido por 12. */
export const ASSINATURA_PRECO = ASSINATURA_PRECO_ANUAL_MENSAL;
export const ASSINATURA_PRECO_ROTULO = ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO;

export const ASSINATURA_PRECO_MENSAL = PRECO_MENSAL;
export const ASSINATURA_PRECO_MENSAL_ROTULO = PRECO_MENSAL_ROTULO;

export const ASSINATURA_PRECO_ANUAL = PRECO_ANUAL;
export const ASSINATURA_PRECO_ANUAL_ROTULO = PRECO_ANUAL_ROTULO;

/** Doze mensalidades: o "de" do "de R$ 358,80 por R$ 238,80". */
export const ASSINATURA_PRECO_ANUAL_CHEIO_ROTULO = ASSINATURA_ANUAL_REFERENCIA_ROTULO;

export const ASSINATURA_ECONOMIA_ROTULO = ASSINATURA_ANUAL_ECONOMIA_ROTULO;
export const ASSINATURA_ECONOMIA_MESES = ASSINATURA_ANUAL_ECONOMIA_MESES;

export const ASSINATURA_GARANTIA_DIAS = GARANTIA_DIAS;
export const ASSINATURA_PROVEDOR = "Hotmart";

/** O desconto do assinante na consultoria particular. */
export const ROTULO_DESCONTO = "30% OFF";
