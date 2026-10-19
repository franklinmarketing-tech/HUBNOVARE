/**
 * As situações de um lead — onde a conversa parou.
 *
 * ⚠️ ESTE ARQUIVO EXISTE PORQUE A TELA DE LEADS QUEBRAVA EM PRODUÇÃO
 * (19/10/2026, "TypeError: SITUACOES.map is not a function").
 *
 * A lista morava em `MarcarSituacao.tsx`, que é `"use client"`. A página de
 * leads é Server Component e importava a lista de lá para desenhar o
 * filtro. No Next, TUDO que sai de um arquivo client vira uma *referência*
 * no servidor, não o valor: componente funciona (o servidor só aponta para
 * ele), mas um array chega como um objeto opaco, e o `.map` estoura. A tela
 * inteira caía em "Alguma coisa quebrou aqui".
 *
 * Constante compartilhada entre servidor e navegador mora em arquivo SEM
 * `"use client"` — como este. Os dois lados leem o valor de verdade.
 *
 * Os valores casam com o `check` da coluna `hub_leads.situacao`
 * (`painel_novare_INSTALAR.sql`). Mudar um sem o outro faz o banco recusar.
 */
export const SITUACOES = [
  { valor: "novo", rotulo: "Novo", cls: "bg-slate-100 text-slate-600" },
  { valor: "falando", rotulo: "Falando", cls: "bg-amber-100 text-amber-700" },
  { valor: "cliente", rotulo: "Virou cliente", cls: "bg-emerald-100 text-emerald-700" },
  { valor: "sem_interesse", rotulo: "Sem interesse", cls: "bg-slate-100 text-slate-400" },
] as const;
