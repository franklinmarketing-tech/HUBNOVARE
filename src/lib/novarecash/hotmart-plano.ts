import type { ChavePlano, Prazo } from "@/lib/novarecash/config";
import { planoPelosNomes, prazoPelosNomes } from "@/lib/novarecash/plano-pelo-nome";

/**
 * O QUE O AVISO DA HOTMART COMPROU: o PLANO (essencial/plus/premium) e o PRAZO
 * (mensal/anual), lidos dos NOMES do plano da assinatura e da oferta. Mora aqui,
 * e não na rota, para poder ser testado com `npx tsx` (uma rota do Next só pode
 * exportar GET/POST/…).
 *
 * 05/11/2026: a REGRA de leitura passou para `plano-pelo-nome.ts`, a mesma da
 * Kiwify (a plataforma principal; a Hotmart ficou de reserva). Aqui fica só
 * QUAIS campos do aviso da Hotmart se leem.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Payload = Record<string, any>;

/** Os nomes que dizem o que foi comprado, na ordem em que valem. */
const nomesDoPlano = (p: Payload) => [
  p?.data?.subscription?.plan?.name,
  p?.data?.purchase?.offer?.name,
  p?.data?.purchase?.offer?.code,
  p?.data?.product?.name,
];

/**
 * 'anual' se o nome do plano da assinatura, o nome da oferta ou o código da
 * oferta disser; senão 'mensal'. O nome do PRODUTO fica de fora de propósito.
 */
export function prazoDo(p: Payload): Prazo {
  return prazoPelosNomes(nomesDoPlano(p).slice(0, 3));
}

/** 'essencial', 'plus' ou 'premium' — o primeiro campo que disser; nenhum, 'essencial'. */
export function planoDo(p: Payload): ChavePlano {
  return planoPelosNomes(nomesDoPlano(p));
}
