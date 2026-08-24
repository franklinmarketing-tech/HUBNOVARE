/**
 * Estado comercial do Workspace.
 *
 * Hoje TUDO está liberado: as 22 ferramentas, o Vida Plan, a Íris. A
 * assinatura existe como plano de futuro, não como produto à venda — e
 * enquanto for assim, nenhuma tela pode empurrar o usuário para uma
 * página de compra que não tem preço nem checkout.
 *
 * Virar `true` religa a venda: os CTAs voltam a levar para /assinar, que
 * volta a mostrar os planos. Uma chave só, um lugar só.
 */
export const ASSINATURA_ATIVA = false;

/** Selo usado onde o produto será PRO no futuro. */
export const ROTULO_PRO = "PRO em breve";

/**
 * O que dizer hoje, no lugar do convite de assinatura.
 * Mantém o destaque de que vai virar PRO, sem prometer data nem preço.
 */
export const AVISO_LIBERADO =
  "Hoje está tudo liberado, sem assinatura. Em breve o Workspace vira um plano PRO — quem já usa continua tendo acesso ao que é gratuito.";
