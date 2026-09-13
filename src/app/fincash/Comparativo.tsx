import { Fragment } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";

/**
 * O comparativo de TRÊS colunas: app do banco × planilha × FINCASH.
 *
 * ── POR QUE TRÊS, SE A PÁGINA JÁ TINHA UM DE DUAS ─────────────────────────
 * A versão anterior (`Comparativo` de `components/SecoesVenda`) juntava os
 * dois concorrentes numa coluna só, "App do banco ou planilha". Juntos, eles
 * se anulam: o banco perde por não olhar para a frente, a planilha perde por
 * não fazer nada sozinha, e cada linha da tabela só podia dizer a verdade
 * sobre UM dos dois. Separados, cada coluna pode ganhar onde de fato ganha.
 *
 * ⚠️ ESTE ARQUIVO TEM O MESMO NOME DO COMPONENTE DE `SecoesVenda`. Quem for
 * ligá-lo na página precisa TROCAR o import, não acrescentar: os dois
 * `Comparativo` no mesmo arquivo é erro de compilação, e o de duas colunas
 * continua sendo o certo para a /finplan e a /assinar, que comparam a
 * assinatura com uma coisa só.
 *
 * ── A REGRA QUE MANTÉM ISTO HONESTO ───────────────────────────────────────
 * Toda linha aqui é conferível no produto (código ou captura em
 * `public/fincash/telas`). O que não pôde ser conferido não entrou — e o que
 * mais faria falta aqui é o assistente de WhatsApp, que ficou de fora pelo
 * mesmo motivo de sempre: enquanto a linha oficial não estiver ligada, um
 * tique nele seria promessa, não comparação.
 *
 * ── E A REGRA QUE O TORNA CRÍVEL ──────────────────────────────────────────
 * O BANCO E A PLANILHA GANHAM LINHAS. Comparativo em que o concorrente é "não"
 * em tudo não lê como comparação, lê como anúncio, e a pessoa desconta o
 * resto da página junto. O banco tem o dado na fonte, sem digitação, e não
 * cobra nada; a planilha aceita qualquer formato que você inventar, funciona
 * com qualquer banco e é de graça. As três coisas são verdade e estão escritas
 * aqui. O FINCASH, em troca, leva "não" em duas linhas.
 *
 * ⚠️ NENHUMA MARCA É CITADA. "App do banco" é genérico de propósito: nomear o
 * concorrente é entregar a régua dele e convidar a comparação item a item numa
 * página que é nossa.
 */

type Veredito = "sim" | "nao" | "parcial";

/** A nota é o que o desktop mostra embaixo do ícone — sem ela a coluna fica muda. */
type Celula = { v: Veredito; nota?: string };

type Linha = {
  criterio: string;
  banco: Celula;
  planilha: Celula;
  fincash: Celula;
  /**
   * Fica ABERTO no celular. Ver o bloco "A DOBRA DO CELULAR" abaixo: sete
   * critérios abertos, quatro atrás do "ver os 11 critérios" — e os DOIS em
   * que o FINCASH perde são obrigatoriamente `true`.
   */
  decide?: boolean;
};

/**
 * DE ONDE VEM CADA LINHA, para a próxima pessoa não ter de caçar:
 *  • "Somar o que ainda vai sair" e "Doze meses à frente": tela `projecao-*` e
 *    a seção "O saldo do banco mente por omissão".
 *  • "Funcionar com qualquer banco": FAQ da página, "não pede a senha do seu
 *    banco nem usa Open Finance".
 *  • "Todos os cartões juntos": tela `cartoes-*` ("fecha 20/09 · vence 28/09",
 *    "somando todos os cartões, mês a mês").
 *  • "Uma revisão trimestral": `ASSINATURA_INCLUI[0]`.
 *  • "Não custar nada": a própria página — uma assinatura só libera o FINCASH,
 *    o FINPLAN, a Íris e as ferramentas.
 *  • "Ver o que já saiu sem digitar": `TELAS_LISTA` (Importar extrato, com
 *    deduplicação por data/valor/identificador do banco).
 *  • "Parcelamento" e "contas fixas": o Ciclo Novare (Registre / Estruture) e a
 *    tela de Contas fixas.
 *  • "Um limite por categoria": tela `orcamento-*` ("Nos últimos 6 meses · mín
 *    · média · máx").
 *
 * ═══ A ORDEM MUDOU, E A ORDEM AGORA É A DOBRA DO CELULAR ═══════════════════
 *
 * Empilhados, os onze critérios viravam onze cards de ~270px: 2.972px, quase
 * quatro telas de rolagem numa seção cujo trabalho é fazer a pessoa comparar.
 * Os SETE primeiros ficam abertos no celular; os quatro últimos entram num
 * `<details>` nativo ("ver os 11 critérios"), e no desktop os onze continuam
 * na tabela, todos, sem nada recolhido.
 *
 * ⚠️ O QUE MANDA NA ESCOLHA DOS SETE NÃO É A FORÇA DO ARGUMENTO — é o que
 * decide a compra, e as DUAS LINHAS EM QUE O FINCASH PERDE decidem tanto
 * quanto as que ele ganha. "Do seu jeito, com as colunas que você inventar"
 * (a planilha ganha) e "Não custar nada" (o banco e a planilha ganham) são as
 * DUAS ÚLTIMAS visíveis, e é proibido empurrá-las para dentro do recolhido.
 * Um comparativo que esconde justamente onde o produto perde deixa de ser
 * comparativo e vira anúncio — e leva junto a credibilidade das outras nove,
 * que é a única coisa que esta seção tem para oferecer.
 *
 * O que foi recolhido são os quatro critérios de MECÂNICA (digitação, parcela,
 * conta fixa, limite por categoria): eles importam, estão no HTML, estão a um
 * toque — e nenhum deles é onde alguém desiste da compra.
 */
const LINHAS: Linha[] = [
  {
    criterio: "Somar o que ainda vai sair até o fim do mês",
    banco: { v: "nao", nota: "O extrato é o passado." },
    planilha: { v: "parcial", nota: "Se você montar a fórmula." },
    fincash: { v: "sim", nota: "É o número que o Painel abre." },
    decide: true,
  },
  {
    criterio: "Funcionar com qualquer banco, sem senha e sem Open Finance",
    banco: { v: "nao", nota: "Só a conta que é dele." },
    planilha: { v: "sim", nota: "Você digita o que quiser, de onde quiser." },
    fincash: { v: "sim", nota: "Não pede senha nem conecta conta nenhuma." },
    decide: true,
  },
  {
    criterio: "Todos os cartões juntos, cada um no ciclo dele",
    banco: { v: "parcial", nota: "Só o cartão daquele banco." },
    planilha: { v: "parcial", nota: "Fechamento e vencimento na mão." },
    fincash: {
      v: "sim",
      nota: "Fecha 20, vence 28 — e soma os cartões mês a mês.",
    },
    decide: true,
  },
  {
    criterio: "Doze meses à frente, com o primeiro mês no vermelho apontado",
    banco: { v: "nao", nota: "Não projeta o que ainda não caiu." },
    planilha: { v: "parcial", nota: "Se você montar a projeção inteira." },
    fincash: {
      v: "sim",
      nota: "Tela de Projeção, com o menor saldo do período.",
    },
    decide: true,
  },
  {
    criterio: "Uma revisão trimestral escrita por um consultor",
    banco: { v: "nao" },
    planilha: { v: "nao" },
    fincash: {
      v: "sim",
      nota: "Vem na assinatura, e é a única linha que não é software.",
    },
    decide: true,
  },
  /* ⚠️ AS DUAS DERROTAS, e elas ficam abertas no celular por decisão escrita
     no bloco acima. Quem mexer na ordem lê aquele bloco antes. */
  {
    criterio: "Do seu jeito, com as colunas que você inventar",
    banco: { v: "nao" },
    planilha: { v: "sim", nota: "É a força dela, e não tem limite." },
    fincash: { v: "nao", nota: "As telas são as que são." },
    decide: true,
  },
  {
    criterio: "Não custar nada",
    banco: { v: "sim", nota: "Vem junto com a conta." },
    planilha: { v: "sim", nota: "De graça, para sempre." },
    fincash: {
      v: "nao",
      nota: "Uma assinatura, a mesma que libera o FINPLAN e a Íris.",
    },
    decide: true,
  },
  /* Daqui para baixo é a mecânica do dia a dia: importa, está no HTML, e no
     celular mora atrás do "ver os 11 critérios". */
  {
    criterio: "Ver o que já saiu da conta, sem digitar",
    banco: { v: "sim", nota: "O dado nasce lá — é a casa dele." },
    planilha: { v: "nao", nota: "Você digita, ou cola e arruma." },
    fincash: {
      v: "sim",
      nota: "Lançando, ou pelo OFX: o que já entrou não entra de novo.",
    },
  },
  {
    criterio: "Um parcelamento que já nasce com todas as parcelas",
    banco: { v: "nao", nota: "Aparece uma por vez, quando cai." },
    planilha: { v: "parcial", nota: "Uma linha por parcela, digitada." },
    fincash: { v: "sim", nota: "12x vira doze parcelas na linha do tempo." },
  },
  {
    criterio: "As contas fixas voltarem sozinhas todo mês",
    banco: { v: "nao" },
    planilha: { v: "parcial", nota: "Copiando o mês anterior." },
    fincash: {
      v: "sim",
      nota: "Cadastrou uma vez; o mês seguinte já abre preenchido.",
    },
  },
  {
    criterio: "Um limite por categoria tirado do seu histórico",
    banco: { v: "parcial", nota: "Categoriza o que já passou." },
    planilha: { v: "nao", nota: "O número é chute seu." },
    fincash: { v: "sim", nota: "Mín, média e máx dos últimos seis meses." },
  },
];


/**
 * Quantos critérios ficam ABERTOS no celular. Os sete primeiros de `LINHAS`,
 * que terminam nas duas derrotas do FINCASH — ver o bloco de ordem acima antes
 * de mexer neste número.
 */
const ABERTOS_NO_CELULAR = 7;

const COLUNAS = [
  { chave: "banco", rotulo: "App do banco" },
  { chave: "planilha", rotulo: "Planilha" },
  { chave: "fincash", rotulo: "FINCASH" },
] as const;

/**
 * A GRADE, escrita uma vez e usada no cabeçalho e em toda linha.
 *
 * ⚠️ Se mudar aqui, mude nos dois: cabeçalho e corpo desalinhados é o defeito
 * que faz a tabela inteira parecer quebrada. A primeira coluna é a mais larga
 * porque carrega a frase; as três de veredito são idênticas de propósito, para
 * o olho não achar que a do FINCASH é maior por ser a nossa.
 */
const GRADE =
  "md:grid md:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,1fr))]";

/**
 * SIM, NÃO E EM PARTE — três FORMAS antes de três cores.
 *
 * O tique, o xis e o traço se distinguem sem cor nenhuma, que é o que salva
 * quem não separa verde de vermelho e quem imprime a página em preto e branco.
 * A cor é reforço, nunca o sinal — e o `sr-only` ao lado de cada ícone diz a
 * palavra inteira, porque um `aria-label` de "sim" num SVG não é lido por
 * todos os leitores da mesma forma.
 *
 * CONTRASTE MEDIDO sobre os dois fundos em que estes ícones de fato aparecem —
 * o branco do card e a faixa `primary/4%` da coluna do FINCASH:
 *   • `success-strong`   5,52:1 / 5,15:1
 *   • `destructive`      4,80:1 / 4,47:1
 *   • `muted-foreground` 5,61:1 / 5,23:1
 * Todos acima de 4,5:1 no branco, e os três acima de 3:1 (a régua de
 * componente gráfico) em qualquer um dos dois.
 *
 * ⚠️ O `success` de 41% NÃO SERVE AQUI: dá 3,23:1 no branco e 3,01:1 na
 * faixa, ou seja, passa raspando como ícone e reprova no instante em que
 * alguém resolver colorir o texto junto. `success-strong` aguenta as duas
 * coisas.
 */
const VEREDITOS = {
  sim: { Icone: Check, cor: "text-success-strong", leitura: "Sim" },
  nao: { Icone: X, cor: "text-destructive", leitura: "Não" },
  parcial: { Icone: Minus, cor: "text-muted-foreground", leitura: "Em parte" },
} as const;

/**
 * Uma célula de veredito.
 *
 * ── O RÓTULO DA COLUNA VIVE AQUI DENTRO, E NÃO SÓ NO CABEÇALHO ────────────
 * No celular ele é visível (é o que transforma a linha empilhada em card
 * legível); a partir de `md` vira `sr-only`, porque aí o cabeçalho já diz a
 * mesma coisa para quem enxerga. Quem navega por leitor de tela ouve, nas duas
 * larguras, "App do banco: Não — o extrato é o passado", sem precisar guardar
 * a ordem das colunas de cabeça. É por isso que o cabeçalho visual é
 * `aria-hidden`: anunciado também por ele, o rótulo dobraria na fala.
 */
function Celula({
  rotulo,
  celula,
  destaque,
  primeira,
}: {
  rotulo: string;
  celula: Celula;
  destaque?: boolean;
  primeira?: boolean;
}) {
  const { Icone, cor, leitura } = VEREDITOS[celula.v];

  return (
    <div
      className={`flex items-start gap-3 ${primeira ? "mt-3" : "mt-2.5"} md:mt-0 md:block md:px-4 md:py-4 md:text-center ${
        destaque ? "rounded-xl bg-primary/[0.04] p-3 md:rounded-none md:p-0 md:px-4 md:py-4" : ""
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center md:mx-auto ${cor}`}
      >
        <Icone className="h-4 w-4" aria-hidden />
        <span className="sr-only">{leitura}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground md:sr-only">
          {rotulo}
        </p>
        {celula.nota && (
          <p className="text-xs leading-snug text-muted-foreground md:mt-1.5">
            {celula.nota}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ── POR QUE ISTO NÃO É UMA `<table>` ──────────────────────────────────────
 * Três colunas de veredito mais a coluna do critério não cabem em 390px, e a
 * saída de sempre — `<table>` dentro de `overflow-x-auto` — esconde duas
 * colunas fora da tela num rolo horizontal que quase ninguém descobre, numa
 * seção cujo trabalho é exatamente comparar três coisas ao mesmo tempo. Pior:
 * `<table>` trata `width` como MÍNIMO, então nenhuma largura a encolhe.
 *
 * A saída foi trocar a FORMA por largura, com uma marcação só: no celular cada
 * critério é um card com as três avaliações empilhadas e o nome da coluna ao
 * lado de cada uma; a partir de `md` os mesmos elementos entram numa grade de
 * quatro colunas e leem como tabela. Nada é duplicado no HTML e a página nunca
 * ganha rolagem lateral.
 *
 * ⚠️ NÃO "SIMPLIFIQUE" ISTO PARA DUAS ÁRVORES (uma `hidden md:block` e outra
 * `md:hidden`): seria o mesmo texto duas vezes no HTML, e a primeira
 * divergência entre as duas cópias vira uma tabela que diz uma coisa no
 * celular e outra no computador.
 *
 * ── A LISTA É `<ul>`, E NÃO `role="table"` ────────────────────────────────
 * ARIA de tabela sobre uma grade que muda de forma é a receita de uma
 * marcação que mente em uma das duas larguras. Uma lista de critérios, cada um
 * com seu título e três avaliações rotuladas, é verdade nas duas — e é como um
 * leitor de tela percorre a comparação sem depender de navegação de tabela.
 */
export default function Comparativo({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* O CABEÇALHO SÓ EXISTE NO DESKTOP. No celular ele não teria a quem
          rotular: lá os nomes das colunas estão dentro de cada card, ao lado do
          próprio veredito, que é a única forma de a comparação sobreviver ao
          empilhamento. */}
      <div
        aria-hidden
        className={`hidden ${GRADE} md:rounded-t-2xl md:border md:border-b-0 md:border-border md:bg-card`}
      >
        <span className="md:px-5 md:py-3.5 md:text-2xs md:font-semibold md:uppercase md:tracking-wider md:text-muted-foreground">
          O que você precisa
        </span>
        {COLUNAS.map((c) => (
          <span
            key={c.chave}
            className={`md:px-4 md:py-3.5 md:text-center md:text-2xs md:font-semibold md:uppercase md:tracking-wider ${
              c.chave === "fincash"
                ? "md:bg-primary/[0.04] md:text-accent-strong"
                : "md:text-muted-foreground"
            }`}
          >
            {c.rotulo}
          </span>
        ))}
      </div>

      <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-border/60 md:overflow-hidden md:rounded-b-2xl md:border md:border-border md:bg-card md:shadow-subtle">
        {LINHAS.map((linha, i) => (
          <Fragment key={linha.criterio}>
            {/* ⚠️ O `<details>` É UM ITEM DA LISTA, e precisa vir ANTES dos
                critérios que ele comanda: quem os revela é o `peer-has-` do
                Tailwind, que só enxerga IRMÃOS POSTERIORES. Mover este `li`
                para depois deles, ou para fora do `<ul>`, quebra a revelação
                em silêncio — os quatro somem e nada mais os traz de volta.

                Ele é `md:hidden` porque no desktop os onze critérios são a
                tabela inteira, sem nada recolhido. E é `<details>` nativo pelo
                mesmo motivo do cartão de preço: já abre no Enter, já entra na
                ordem de tabulação e já é anunciado como expansível, sem uma
                linha de JavaScript numa página que não manda nenhum.

                A CONTAGEM É CALCULADA. Cravar "11" aqui é o erro que envelhece
                calado no dia em que um critério entrar ou sair. */}
            {i === ABERTOS_NO_CELULAR && (
              <li className="peer list-none md:hidden">
                <details className="group">
                  <summary className="flex w-full cursor-pointer list-none items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3.5 text-sm font-semibold text-accent-strong shadow-subtle outline-none focus-visible:ring-2 focus-visible:ring-accent-strong [&::-webkit-details-marker]:hidden">
                    <ChevronDown
                      aria-hidden
                      className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                    Ver os {LINHAS.length} critérios
                  </summary>
                </details>
              </li>
            )}
            <li
              className={`rounded-2xl border border-border bg-card p-4 shadow-subtle ${GRADE} md:items-stretch md:rounded-none md:border-0 md:p-0 md:shadow-none ${
                /* ⚠️ O SELETOR OLHA PARA DENTRO DO IRMÃO: o `peer` é o `li`
                   (é ele que é irmão destes), e quem guarda o estado é o
                   `<details>` dentro dele — daí o `:has(details[open])`, e
                   não um `peer-open` que procuraria o `open` no próprio `li`
                   e nunca o encontraria.

                   ⚠️ `max-md` e não a regra solta: a
                   regra do `md:grid` e a da revelação vivem na mesma
                   camada, e qual delas ganha depende da ordem em que o
                   Tailwind escreve o CSS. Prendendo a revelação a
                   `max-md`, as duas deixam de disputar — no desktop só
                   existe `md:grid`, e a tabela nunca corre o risco de
                   virar um bloco porque alguém abriu o acordeão no
                   celular e depois girou o aparelho. */
                i >= ABERTOS_NO_CELULAR
                  ? "hidden peer-has-[details[open]]:max-md:block md:grid"
                  : ""
              }`}
            >
              {/* `h3` e não `p`: cada critério é um assunto que a pessoa
                  pode procurar, e o sumário do leitor de tela é o índice
                  dela. */}
              <h3 className="font-display text-sm font-semibold leading-snug text-primary md:self-center md:px-5 md:py-4">
                {linha.criterio}
              </h3>
              {COLUNAS.map((c, j) => (
                <Celula
                  key={c.chave}
                  rotulo={c.rotulo}
                  celula={linha[c.chave]}
                  destaque={c.chave === "fincash"}
                  primeira={j === 0}
                />
              ))}
            </li>
          </Fragment>
        ))}
      </ul>

      {/* A RESSALVA É PARTE DO ARGUMENTO, e não letra miúda de defesa. Quem lê
          um comparativo procura o truque; dizer qual é a régua antes de
          perguntarem é o que faz o resto da tabela ser lido como boa-fé. */}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        &ldquo;App do banco&rdquo; é o aplicativo de qualquer banco, sem citar
        marca — a comparação é com o que a tela faz, não com quem a fez. Toda
        linha acima é conferível no FINCASH hoje: o assistente de WhatsApp ficou
        de fora da tabela porque a linha oficial ainda não está ligada.
      </p>
    </div>
  );
}
