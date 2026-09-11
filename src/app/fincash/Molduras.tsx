import Image from "next/image";

/**
 * As molduras de aparelho da landing do FINCASH, e o catálogo das capturas.
 *
 * ── POR QUE ISTO SAIU DA PÁGINA ────────────────────────────────────────────
 * A `Moldura` nasceu dentro de `page.tsx` quando só existia UMA peça (a prévia
 * do painel remontada em HTML). Agora ela precisa vestir três coisas
 * diferentes (prévia em HTML, print de desktop e print de celular) e carregar
 * junto o texto alternativo de cada captura. Deixar isso no meio do argumento
 * de venda faria a página de 1.200 linhas passar de 1.600 sem que uma frase a
 * mais fosse escrita.
 *
 * ── POR QUE FOTO, DEPOIS DE A PÁGINA TER DEFENDIDO O CONTRÁRIO ─────────────
 * A versão anterior remontava as telas em HTML de propósito: print envelhece
 * calado, borra em retina e some no celular. Os três argumentos continuam de
 * pé, e dois deles foram RESOLVIDOS: as capturas saem em `deviceScaleFactor: 2`
 * (não borram) e existem em três larguras (não somem). Sobra o envelhecimento,
 * que é preço, não impedimento: em troca dele a página passa a mostrar o
 * produto INTEIRO, com a barra lateral, o menu do rodapé, o velocímetro de
 * renda comprometida e o resumo do Fin. Nada disso cabia numa remontagem
 * honesta, e é justamente o que separava o material do concorrente do nosso.
 *
 * ONDE A PRÉVIA EM HTML FICOU, ficou por mérito, não por inércia:
 *   • a conta aberta da terceira seção é aritmética, não tela: mostrar um
 *     print ali seria trocar um argumento por uma ilustração dele;
 *   • a seção de Dívidas não tem captura entre as 21 disponíveis, e inventar
 *     uma seria pior que desenhá-la;
 *   • a conversa do WhatsApp descreve algo que AINDA NÃO ESTÁ LIGADO, e um
 *     print de conversa faria parecer que está.
 */

/** Uma captura, com as três larguras e o texto alternativo já escrito. */
type Captura = {
  src: string;
  /** Em pixels do arquivo, que é o dobro da tela por causa do scale 2. */
  largura: number;
  altura: number;
  alt: string;
};

/**
 * O catálogo.
 *
 * ⚠️ O `alt` DESCREVE OS NÚMEROS DA TELA, não o fato de ser uma captura.
 * Quem navega por leitor de tela precisa receber o mesmo argumento que a
 * imagem entrega a quem enxerga: "captura do painel" não vende nada, e
 * "fecha o mês com R$ 1.066 e 86% da renda comprometida" vende exatamente o
 * que a foto está ali para provar.
 */
export const TELAS = {
  painelCelular: {
    src: "/fincash/telas/painel-celular.webp",
    largura: 780,
    altura: 1688,
    alt: "Painel do FINCASH no celular: se nada mudar, o mês fecha com R$ 1.066, com R$ 1.926 a pagar, R$ 600 a receber, duas contas atrasadas e um velocímetro marcando 86% da renda já comprometida.",
  },
  painelDesktop: {
    src: "/fincash/telas/painel-desktop.webp",
    largura: 2880,
    altura: 1800,
    alt: "Painel do FINCASH em setembro de 2026: fecha o mês com R$ 1.066, 86% da renda comprometida, R$ 4.793 já saíram dos R$ 6.718 previstos e um resumo automático avisa que 2 contas venceram sem pagamento, somando R$ 533.",
  },
  cartoesCelular: {
    src: "/fincash/telas/cartoes-celular.webp",
    largura: 780,
    altura: 1688,
    alt: "Tela de cartões no celular: ainda faltam R$ 770 de fatura em setembro, uma fatura está atrasada, R$ 2.278 já foram pagos e 75% das faturas do mês estão quitadas.",
  },
  orcamentoDesktop: {
    src: "/fincash/telas/orcamento-desktop.webp",
    largura: 2880,
    altura: 1800,
    alt: "Orçamento de setembro de 2026: R$ 6.718 gastos contra R$ 6.680 planejados, 101% do orçamento consumido, três categorias acima do limite, e a linha de Moradia mostrando mínimo, média e máximo dos últimos seis meses.",
  },
  projecaoDesktop: {
    src: "/fincash/telas/projecao-desktop.webp",
    largura: 2880,
    altura: 1800,
    alt: "Projeção dos próximos 12 meses: o período termina com R$ 48.847, o menor saldo é de R$ 14.991 em setembro de 2026, e um gráfico mostra o saldo do fim de cada mês, de setembro a agosto.",
  },
  lancamentosCelular: {
    src: "/fincash/telas/lancamentos-celular.webp",
    largura: 780,
    altura: 1688,
    alt: "Lançamentos no celular: do que já entrou e saiu em setembro sobraram R$ 2.392, com R$ 7.184 de entrada, R$ 4.793 de saída, duas contas atrasadas somando R$ 533 e 83% do mês já confirmado.",
  },
  metasCelular: {
    src: "/fincash/telas/metas-celular.webp",
    largura: 780,
    altura: 1688,
    alt: "Tela de metas: todas as metas ativas juntas pedem R$ 1.617 por mês, contra uma renda prevista de R$ 7.784, ocupando 21% da renda.",
  },
  investimentosCelular: {
    src: "/fincash/telas/investimentos-celular.webp",
    largura: 780,
    altura: 1688,
    alt: "Investimentos no celular: Selic 14,00% ao ano, CDI 13,90%, IPCA 4,44% e juro real 9,15%, com a fonte Banco Central citada embaixo, e patrimônio de R$ 97.913 dividido entre R$ 88.620 investidos e R$ 9.293 parados em conta.",
  },
} satisfies Record<string, Captura>;

export type NomeTela = keyof typeof TELAS;

/**
 * O anel de aparelho, comum às duas molduras.
 *
 * As três camadas (anel escuro, sombra funda, tela) são o que faz a peça
 * parecer objeto pousado sobre a seção em vez de desenho impresso nela. Sem
 * elas, uma captura lê como "mais um card da página".
 */
const ANEL =
  "bg-primary/90 p-1.5 shadow-[0_24px_60px_-24px_hsl(215_50%_12%_/_0.55)] ring-1 ring-white/10";

/**
 * A moldura de JANELA: barra de topo com dois pontos e um rótulo no lugar da
 * URL. Veste tanto a prévia em HTML quanto a captura de desktop, e é a mesma
 * peça que já existia na página, só que com uma porta a mais (`semRespiro`)
 * para a foto poder encostar na borda da tela.
 *
 * A inclinação vem de `.moldura-produto`, que se desliga sozinha em
 * `prefers-reduced-motion`.
 */
export function Moldura({
  barra,
  children,
  inclinar = false,
  semRespiro = false,
}: {
  /** O que aparece na barra de topo do aparelho, no lugar da URL. */
  barra: string;
  children: React.ReactNode;
  inclinar?: boolean;
  /** Foto encosta na borda; prévia em HTML precisa do respiro interno. */
  semRespiro?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl ${ANEL} ${inclinar ? "moldura-produto" : ""}`}
    >
      <div className="overflow-hidden rounded-3xl bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-border" />
          <span aria-hidden className="h-2 w-2 rounded-full bg-border" />
          <p className="ml-1 truncate text-[11px] font-semibold text-muted-foreground">
            {barra}
          </p>
        </div>
        <div className={semRespiro ? "" : "p-4 sm:p-5"}>{children}</div>
      </div>
    </div>
  );
}

/**
 * A moldura de TELEFONE.
 *
 * Existe porque a captura de celular já traz o menu do rodapé e o cabeçalho da
 * marca: dentro da moldura de janela ela leria como um site espremido, que é o
 * contrário do que o app é. O entalhe é o único enfeite, e ele é o que faz o
 * olho reconhecer o aparelho antes de ler o conteúdo.
 */
export function Telefone({
  children,
  inclinar = false,
}: {
  children: React.ReactNode;
  inclinar?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl ${ANEL} ${
        inclinar ? "moldura-produto" : ""
      }`}
    >
      <div className="relative overflow-hidden rounded-3xl bg-card">
        <span
          aria-hidden
          className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-primary/25"
        />
        {children}
      </div>
    </div>
  );
}

/**
 * A captura, dentro do aparelho que couber melhor nela.
 *
 * ⚠️ `prioridade` vale para UMA imagem da página inteira, a do herói. Toda
 * imagem marcada como prioritária disputa banda com o que a pessoa está
 * tentando ler; duas prioridades numa landing é o mesmo que nenhuma.
 *
 * O `sizes` não é decoração: sem ele o Next serve a largura máxima para todo
 * mundo, e a captura de desktop pesa 136 kB no celular de quem só ia ver 340
 * pixels dela.
 */
export function Foto({
  tela,
  aparelho,
  barra,
  sizes,
  prioridade = false,
  inclinar = false,
}: {
  tela: NomeTela;
  aparelho: "janela" | "telefone";
  /** Só para a janela: o rótulo da barra de topo. */
  barra?: string;
  sizes: string;
  prioridade?: boolean;
  inclinar?: boolean;
}) {
  const t = TELAS[tela];

  const img = (
    <Image
      src={t.src}
      alt={t.alt}
      width={t.largura}
      height={t.altura}
      sizes={sizes}
      priority={prioridade}
      loading={prioridade ? undefined : "lazy"}
      className="h-auto w-full"
    />
  );

  if (aparelho === "telefone") {
    return <Telefone inclinar={inclinar}>{img}</Telefone>;
  }

  return (
    <Moldura barra={barra ?? "FINCASH"} inclinar={inclinar} semRespiro>
      {img}
    </Moldura>
  );
}
