/**
 * O nome do cookie do tema claro/escuro do NovareCash.
 *
 * Mora num módulo COMUM (sem "use client") de propósito: o layout e a página de
 * convite são de SERVIDOR, e uma constante importada de um arquivo "use client"
 * chega ao servidor como referência de cliente, não como o texto — o
 * `cookies().get(...)` procurava um cookie sem nome e o escuro nunca era lembrado.
 */
export const COOKIE_TEMA = "ncash_tema";
