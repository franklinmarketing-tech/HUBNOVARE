/**
 * A PERGUNTA DO VALOR (pedido do dono, 21/10/2026): o PDF das ferramentas e os
 * eBooks só liberam com nome, e-mail, WhatsApp E quanto a pessoa pretende
 * investir ou já tem investido — é o que diz ao Jefferson o tamanho do caso.
 * Substituiu a "faixa de renda" opcional dos eBooks.
 *
 * ⚠️ MORA FORA DE `CamposLead.tsx` (que é "use client") porque o painel de
 * leads e o e-mail de aviso à equipe, que rodam no servidor, também leem a
 * lista — e valor importado de arquivo client chega no servidor como
 * referência opaca (ver `admin/leads/situacoes.ts`).
 *
 * ⚠️ A ORDEM IMPORTA: da menor para a maior. É a escala da temperatura do
 * lead (`lib/lead-quente.ts`), que lê a posição na lista. Mudar o texto de
 * uma faixa deixa os leads antigos com o texto velho fora da escala.
 */
export const FAIXAS_INVESTIMENTO = [
  "Até R$ 10 mil",
  "R$ 10 mil a R$ 50 mil",
  "R$ 50 mil a R$ 100 mil",
  "R$ 100 mil a R$ 300 mil",
  "R$ 300 mil a R$ 1 milhão",
  "Acima de R$ 1 milhão",
] as const;

export const investimentoValido = (v: string | undefined) =>
  !!v && (FAIXAS_INVESTIMENTO as readonly string[]).includes(v);
