import Image from "next/image";

/**
 * As fotografias de gente da landing do FINCASH.
 *
 * ── POR QUE ELAS ENTRARAM ──────────────────────────────────────────────────
 * A página provava o produto e não provava a SITUAÇÃO. Vinte e uma capturas
 * mostram o app funcionando, e nenhuma delas mostra a mesa da cozinha às onze
 * da noite com as contas espalhadas, que é o momento em que alguém decide
 * procurar um app de dinheiro. Captura convence de que a ferramenta existe;
 * foto de gente convence de que o problema é o seu.
 *
 * ── A REGRA QUE NÃO SE NEGOCIA ─────────────────────────────────────────────
 * ⚠️ SÃO ILUSTRAÇÕES, NÃO CLIENTES. Nenhuma destas pessoas assina a Novare, e
 * nenhuma delas jamais recebe legenda, nome, aspas ou número ao lado. A página
 * inteira foi escrita sobre a recusa de inventar prova social (ver a seção de
 * credibilidade, que diz isso com todas as letras); uma foto bonita com um
 * depoimento embaixo derrubaria o argumento mais caro do texto para ganhar
 * três segundos de simpatia. Por isso elas aparecem sempre como CENÁRIO, atrás
 * ou ao lado do produto, e nunca como sujeito que afirma alguma coisa.
 *
 * Por isso também nenhuma peça daqui aceita legenda: não é esquecimento de
 * API, é a porta que não existe para o erro não poder acontecer depois.
 *
 * ── ALT ────────────────────────────────────────────────────────────────────
 * O texto alternativo descreve A CENA, e só. Onde o `alt` de uma captura
 * carrega os números da tela (é o argumento dela), o de uma foto carrega o
 * ambiente, porque é o que ela entrega a quem enxerga. Dizer "casal satisfeito
 * com o FINCASH" seria escrever no alt exatamente o depoimento que a página se
 * proibiu de escrever na tela.
 */

type Retrato = {
  src: string;
  /** Em pixels do arquivo. Todas são 3:2, e o corte é feito no CSS. */
  largura: number;
  altura: number;
  alt: string;
};

export const PESSOAS = {
  casalPreocupado: {
    src: "/fincash/pessoas/casal-preocupado.webp",
    largura: 1600,
    altura: 1067,
    alt: "Casal sentado à mesa da cozinha diante de um notebook aberto, com contas de papel, calculadora e caneta espalhadas na mesa, os dois olhando a tela com expressão preocupada.",
  },
  casalContas: {
    src: "/fincash/pessoas/casal-contas.webp",
    largura: 1600,
    altura: 1068,
    alt: "Casal sentado no sofá da sala conversando sobre documentos financeiros que segura nas mãos.",
  },
  cozinhaCelular: {
    src: "/fincash/pessoas/cozinha-celular.webp",
    largura: 1600,
    altura: 1067,
    alt: "Mulher de pé na bancada da cozinha, sorrindo enquanto usa o celular com uma das mãos.",
  },
  mesaNotebook: {
    src: "/fincash/pessoas/mesa-notebook.webp",
    largura: 1600,
    altura: 1066,
    alt: "Mulher sentada à mesa de casa com um notebook aberto à frente e o celular na mão.",
  },
  /**
   * A ÚNICA DAQUI QUE NÃO É SÓ CENÁRIO, e por isso a única com regra extra.
   *
   * A mão é fotografia; a conversa na tela é COMPOSIÇÃO, montada com as
   * frases que o interpretador reconhece de verdade (as mesmas de
   * `lib/fincash/whatsapp.ts`, listadas em `app/whatsapp/guia.tsx`) e com os
   * números da conta de demonstração, inclusive a sobra de R$ 1.066 que
   * aparece nas capturas do painel.
   *
   * ⚠️ ELA É A ÚNICA IMAGEM DA PÁGINA QUE PEDE RESSALVA ESCRITA AO LADO, e o
   * motivo é o oposto do das outras: as outras poderiam ser lidas como
   * depoimento de cliente, esta pode ser lida como "já funciona". O
   * assistente ainda não está ligado na API da Meta. Enquanto não estiver, a
   * pastilha "Construído, ainda não ligado" e a linha embaixo da imagem são
   * obrigatórias, e quem tirar uma tem de tirar a imagem junto.
   */
  whatsappNaMao: {
    src: "/fincash/pessoas/whatsapp-na-mao.webp",
    largura: 1200,
    altura: 1800,
    alt: "Mão segurando um celular com uma conversa do FINCASH no WhatsApp. A pessoa escreve “mercado R$ 280 ontem” e recebe “Lancei R$ 280,00 em Mercado, ontem, na conta Nubank”; pergunta “quanto gastei com alimentação esse mês?” e recebe “Alimentação em setembro: R$ 1.284,60. O seu limite é R$ 1.200, então passou R$ 84,60”; escreve “recebi 5000 de salário” e recebe “Receita de R$ 5.000,00 lançada hoje. Sobra prevista do mês: R$ 1.066,00”.",
  },
} satisfies Record<string, Retrato>;

export type NomePessoa = keyof typeof PESSOAS;

/**
 * A foto, cortada pelo contêiner de quem chama.
 *
 * `object-cover` sobre `h-full w-full` em vez de proporção fixa aqui dentro:
 * a mesma fotografia entra como faixa larga (21:9) numa seção e como painel
 * alto (3:4) em outra, e uma peça que decidisse o recorte por conta própria
 * obrigaria a landing a escolher composições iguais para todas.
 *
 * ⚠️ NENHUMA DELAS É `priority`. A prioridade da página inteira já é a captura
 * do herói, e ela é a única imagem acima da dobra; uma foto prioritária aqui
 * disputaria banda com a única imagem que a pessoa está de fato esperando.
 */
export function Pessoa({
  quem,
  sizes,
  className = "",
  qualidade,
}: {
  quem: NomePessoa;
  sizes: string;
  /** O recorte, sempre decidido pela seção: `aspect-*`, `h-full`, etc. */
  className?: string;
  /**
   * Abaixo do padrão (75) só onde a foto vive ATRÁS de alguma coisa.
   *
   * Fotografia coberta por um véu navy de 75% não tem detalhe que a pessoa
   * possa perder: o que sobra dela é forma e luz, e forma sobrevive a uma
   * compressão que o texto de uma captura não sobreviveria. Vale trinta
   * quilobytes no celular, e é a diferença entre a foto valer o peso e não
   * valer.
   */
  qualidade?: number;
}) {
  const p = PESSOAS[quem];

  return (
    <Image
      src={p.src}
      alt={p.alt}
      width={p.largura}
      height={p.altura}
      sizes={sizes}
      quality={qualidade}
      loading="lazy"
      className={`w-full object-cover ${className}`}
    />
  );
}
