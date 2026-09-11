import type { Metadata } from "next";
import {
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
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
 * ⚠️ A DESCRIÇÃO TERMINAVA EM "7 DIAS GRÁTIS", e essa oferta não existe mais:
 * virou garantia de reembolso, que é a promessa contrária (paga-se e devolve-se
 * em vez de usar antes de pagar). É o pior lugar possível para o texto velho
 * sobreviver, porque a descrição é o que o Google e o WhatsApp mostram antes
 * de a pessoa abrir a página e descobrir que a promessa era outra.
 *
 * Ela lidera pelo ANUAL pelo mesmo motivo da página: é o plano que a casa quer
 * vender, e o mensal aparece ao lado para a comparação acontecer na própria
 * linha do resultado de busca.
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
const DESCRICAO = `Saiba quanto ainda dá para gastar até o fim do mês, não só quanto você já gastou. Lançamentos, contas fixas, faturas de cartão, orçamento, dívidas com Price e SAC, metas, investimentos, importação do extrato em OFX e projeção de 12 meses em um lugar só, sem conectar banco. ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no plano anual ou ${ASSINATURA_PRECO_ROTULO}/mês sem compromisso, com o Workspace inteiro liberado e ${ASSINATURA_GARANTIA_DIAS} dias de garantia.`;

/** O preview que o WhatsApp e o Google mostram. Curto, porque é cortado. */
const OG_SUB =
  "Quanto ainda dá para gastar até o fim do mês, contando o que ainda vai sair.";

/**
 * A imagem de compartilhamento: o PAINEL DE VERDADE, não um cartão de texto.
 *
 * Era `/api/og?t=...`, o cartão genérico que as 57 ferramentas dividem: navy,
 * título, subtítulo. Ele serve bem uma calculadora que não tem cara, e serve
 * mal um produto que tem: quem recebe o link no WhatsApp vê a miniatura antes
 * de ler qualquer palavra, e uma tarja de texto não prova que existe app do
 * outro lado. Aqui vai a captura do painel recortada em 1200x630, com o número
 * grande, o velocímetro de renda comprometida e a barra lateral com as telas.
 *
 * É JPEG, e é de propósito: o material original é WebP, que o Facebook e o
 * WhatsApp ainda tratam de forma irregular na prévia de link. O arquivo tem
 * 57 kB, então a economia do WebP aqui não pagaria o risco de a prévia sair
 * em branco.
 */
const OG_IMAGEM = "/fincash/og.jpg";

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
      {
        url: OG_IMAGEM,
        width: 1200,
        height: 630,
        alt: "Painel do FINCASH fechando setembro com R$ 1.066 e 86% da renda já comprometida.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITULO} · Novare`,
    description: OG_SUB,
    images: [OG_IMAGEM],
  },
};

export default function FincashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
