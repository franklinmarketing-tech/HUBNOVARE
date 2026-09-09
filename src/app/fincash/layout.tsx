import type { Metadata } from "next";
import {
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";

/**
 * Metadata da landing do FINCASH.
 *
 * ⚠️ ESTE LAYOUT NÃO DESENHA NADA, e é de propósito: ele fica ACIMA de
 * `/fincash/app`, então qualquer marcação daqui apareceria dentro do produto
 * logado, duplicando o cabeçalho que a casca do app já monta. Ele existe só
 * para carregar o `metadata`: a página é um server component e poderia
 * exportá-lo sozinha, mas mantendo-o aqui a landing e o app dividem um único
 * ponto de configuração de SEO, e o app sobrescreve o que precisa (título,
 * descrição e o `robots: noindex` da área logada).
 *
 * O preço nunca é escrito à mão: vem de `lib/assinatura`, a fonte única. Uma
 * descrição de busca prometendo um valor diferente do checkout é o tipo de
 * divergência que só aparece quando o cliente já está com o cartão na mão.
 *
 * ⚠️ NADA DE TRAVESSÃO AQUI. O título e a descrição são texto VISÍVEL (aba do
 * navegador, resultado do Google, prévia no WhatsApp), e o padrão da casa
 * proíbe o travessão em texto visível. O separador do título é o dois-pontos.
 *
 * A DESCRIÇÃO CITA AS TELAS QUE EXISTEM, e a lista cresceu: faturas de cartão,
 * metas, investimentos e a projeção de 12 meses saíram da obra e entraram no
 * ar. Descrição de busca que subestima o produto custa clique tanto quanto
 * uma que o superestima custa confiança.
 */
const TITULO = "FINCASH";
const DESCRICAO = `Saiba quanto ainda dá para gastar até o fim do mês, não só quanto você já gastou. Lançamentos, contas fixas, faturas de cartão, orçamento, metas, investimentos e projeção de 12 meses em um lugar só, sem conectar banco. ${ASSINATURA_TRIAL_DIAS} dias grátis, depois ${ASSINATURA_PRECO_ROTULO}/mês com o Workspace inteiro liberado.`;

/** O preview que o WhatsApp e o Google mostram. Curto, porque é cortado. */
const OG_SUB =
  "Quanto ainda dá para gastar até o fim do mês, contando o que ainda vai sair.";

export const metadata: Metadata = {
  title: `${TITULO}: quanto ainda dá para gastar este mês`,
  description: DESCRICAO,
  alternates: { canonical: "/fincash" },
  openGraph: {
    title: `${TITULO} · Novare`,
    description: OG_SUB,
    url: "/fincash",
    type: "website",
    locale: "pt_BR",
    images: [
      `/api/og?t=${encodeURIComponent(TITULO)}&s=${encodeURIComponent(OG_SUB)}`,
    ],
  },
};

export default function FincashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
