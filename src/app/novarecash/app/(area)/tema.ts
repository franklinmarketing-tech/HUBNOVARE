/**
 * Os nomes dos cookies da casca do NovareCash: o tema (claro/escuro) e o trilho
 * lateral (aberto/recolhido).
 *
 * Mora num módulo COMUM (sem "use client") de propósito: o layout e a página de
 * convite são de SERVIDOR, e uma constante importada de um arquivo "use client"
 * chega ao servidor como referência de cliente, não como o texto — o
 * `cookies().get(...)` procurava um cookie sem nome e o escuro nunca era lembrado.
 */
export const COOKIE_TEMA = "ncash_tema";

/** `ncash_menu=recolhido` deixa o trilho só com os ícones (05/11/2026). Lido no servidor: não pisca. */
export const COOKIE_MENU = "ncash_menu";

/** Os cookies valem só dentro do NovareCash e por um ano. */
export const COOKIE_OPCOES = "path=/novarecash; max-age=31536000; samesite=lax";

export type Tema = "claro" | "escuro";
