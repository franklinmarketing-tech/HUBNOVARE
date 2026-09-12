import {
  BadgeCheck,
  Check,
  FileUp,
  Layers,
  MapPin,
  PenLine,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Chapeu, TituloSecao } from "@/components/SecoesVenda";
import { APPS, CONTAGEM } from "@/lib/apps";
import {
  ASSINATURA_INCLUI,
  ASSINATURA_PILARES,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import "./vitrine.css";
import "./cinema.css";

/**
 * O PACOTE: o que a mensalidade abre além do FINCASH.
 *
 * ── O ARGUMENTO QUE ESTA PEÇA CARREGA ────────────────────────────────────
 * A landing vendia o app sozinho, e sozinho ele fica CARO: R$ 29,90 contra os
 * R$ 19,90 do concorrente mais direto, pelo mesmo tipo de produto. A verdade
 * da casa é outra — a mesma mensalidade abre o FINCASH, o Planejamento, a
 * Íris, as ferramentas e uma revisão trimestral escrita por um consultor. Isso
 * não se compara com app; se compara com consultoria. Hoje o argumento existia
 * só como item de lista dentro do cartão de preço, que é onde ninguém lê.
 *
 * ── A FORMA: UMA CAIXA, E NÃO UMA CONSTELAÇÃO ────────────────────────────
 * O plano pedia constelação — os produtos como nós em volta de um centro. Foi
 * descartada por três motivos, e o terceiro é o que decidiu:
 *
 * 1. A 390px ela vira sopa. Nó posicionado em volta de um centro só existe
 *    enquanto há largura para o raio; num celular o raio é zero e sobra uma
 *    pilha — ou seja, o layout de reserva vira o layout de verdade para a
 *    maioria do tráfego, e o desktop passa a ser a exceção decorada.
 * 2. Os conectores não fecham. Linha de SVG esticada sobre uma grade fluida
 *    erra o centro das células assim que o `gap` entra na conta, e linha que
 *    quase acerta lê como defeito de renderização, não como diagrama.
 * 3. Constelação diz "estas coisas são parentes". O que esta peça precisa
 *    dizer é "estas coisas vêm na MESMA COBRANÇA" — e o desenho que prova
 *    isso é a CAIXA: uma moldura só, com o preço no alto e tudo o que cabe
 *    dentro embaixo dele. A contenção é o argumento.
 *
 * Também foram descartadas a pilha de camadas (sugere ordem e hierarquia
 * entre produtos que são irmãos) e a grade solta de cards (não tem centro:
 * vira mais uma seção de recursos, que é o que a página já tem demais).
 *
 * ── CELULAR ──────────────────────────────────────────────────────────────
 * Uma coluna, na mesma ordem do DOM, sem nada escondido: faixa do preço, o
 * item humano, os quatro produtos e o rodapé de condições. Nenhum breakpoint
 * troca conteúdo de lugar — o `sm:grid-cols-2` só deixa de empilhar. Foi
 * medido a 390px: rolagem horizontal zero.
 *
 * ── O QUE NÃO ENTROU, E POR QUÊ ──────────────────────────────────────────
 * O ASSISTENTE DE WHATSAPP. Ele está construído e não está ligado (falta a
 * linha oficial da Meta), e a página inteira trata isso com ressalva escrita.
 * Numa peça cujo trabalho é ser entendida numa olhada, um item com asterisco
 * custa mais do que rende: ou a ressalva some e a peça mente, ou a ressalva
 * fica e o único item duvidoso ganha o mesmo peso dos cinco que já estão no
 * ar. Ele já tem seção própria na página, com a ressalva por extenso — é lá
 * que ele convence. Aqui só entra o que funciona hoje.
 *
 * ⚠️ SE ELE FOR LIGADO: entra como sexto nó, sem ressalva nenhuma. Se alguém
 * o trouxer ANTES disso, a ressalva vem junto, obrigatoriamente.
 *
 * ── DE ONDE VEM CADA PALAVRA ─────────────────────────────────────────────
 * Nada nesta lista é digitado à mão, e o motivo está escrito em
 * `assinatura.ts` e em `apps.ts`: os dois já foram pegos pela auditoria
 * publicando número cravado que o catálogo desmentia.
 *
 *   • a revisão trimestral → `ASSINATURA_PILARES` (chave `revisao`)
 *   • FINCASH, Planejamento e Íris → `APPS`, por slug (nome, chamada e
 *     `pontosFortes`)
 *   • as contagens de ferramenta → `CONTAGEM`, nunca um literal
 *   • as promessas de cada nó → `ASSINATURA_INCLUI`, repartido por `minha()`
 *
 * ⚠️ E O REPARTIDOR NÃO DESCARTA NADA. Toda linha de `ASSINATURA_INCLUI` que
 * nenhum nó reivindicar cai no rodapé "E ainda" em vez de sumir. É isso que
 * faz a peça acompanhar sozinha: no dia em que um produto entrar na
 * assinatura, ele APARECE aqui — no lugar errado, visível, pedindo um nó —,
 * em vez de a peça continuar anunciando um pacote que mudou sem ela.
 *
 * ⚠️ O FINCASH NÃO ESTÁ EM `ASSINATURA_INCLUI`. Não é esquecimento: aquela
 * lista é escrita para quem chega pelo Planejamento, e lá o FINCASH é um dos
 * apps. Nesta página ele é O produto, então o nó dele é montado do catálogo
 * (`APPS`), que é onde o app tem nome, chamada e pontos fortes próprios.
 */

/* ------------------------------------------------------------- as fontes -- */

/**
 * QUEBRAR O BUILD é de propósito, e é o mesmo remédio de `assinatura.ts`.
 *
 * Um `?.` silencioso aqui renderizaria um cartão sem nome no meio da peça de
 * venda, e ninguém descobre isso olhando o código — descobre olhando a página
 * publicada. Se o slug sumir do catálogo, o `npm run build` para com o nome do
 * culpado escrito.
 */
function doCatalogo(slug: string) {
  const achado = APPS.find((a) => a.slug === slug);
  if (!achado) {
    throw new Error(
      `Pacote.tsx: não existe app com slug "${slug}" em lib/apps.ts. ` +
        `Se o produto saiu da assinatura, tire o nó desta peça; se só mudou ` +
        `de slug, corrija aqui — publicar a seção sem ele anuncia um pacote ` +
        `menor do que o cobrado.`,
    );
  }
  return achado;
}

function doPilar(chave: (typeof ASSINATURA_PILARES)[number]["chave"]) {
  const achado = ASSINATURA_PILARES.find((p) => p.chave === chave);
  if (!achado) {
    throw new Error(
      `Pacote.tsx: não existe pilar "${chave}" em lib/assinatura.ts.`,
    );
  }
  return achado;
}

const FINCASH = doCatalogo("fincash");
const PLANEJAMENTO = doCatalogo("planejamento");
const IRIS = doCatalogo("iris");
const REVISAO = doPilar("revisao");

/**
 * A Íris é GRÁTIS NO CATÁLOGO, e a peça lê isso em vez de confiar na memória
 * de quem escreveu. Anunciá-la como exclusiva de assinante seria vender o que
 * a pessoa já tem — e a conta chega no dia em que ela percebe, que é o dia em
 * que o resto da página também deixa de valer. O que a assinatura tira é o
 * TETO, e é isso que a ressalva diz.
 *
 * Se um dia ela virar `plano: "pago"`, a ressalva desaparece sozinha.
 */
const IRIS_E_ABERTA = IRIS.plano === "gratis";

/** Termos em minúscula; o item chega como veio de `ASSINATURA_INCLUI`. */
const contem =
  (...termos: string[]) =>
  (item: string) =>
    termos.some((t) => item.toLowerCase().includes(t));

type No = {
  chave: string;
  nome: string;
  chamada: string;
  Icone: LucideIcon;
  /** A verdade incômoda do nó, quando existe. Vem em destaque, não em rodapé. */
  ressalva?: string;
  /** Promessas que não moram em `ASSINATURA_INCLUI` (o caso do FINCASH). */
  extras?: readonly string[];
  /** Quais linhas de `ASSINATURA_INCLUI` este nó reivindica. */
  minha: (item: string) => boolean;
};

/**
 * O ÚNICO QUE NÃO É SOFTWARE, e por isso o primeiro — a mesma ordem e o mesmo
 * motivo de `ASSINATURA_INCLUI`, onde a revisão também abre a lista. Ele ganha
 * a faixa larga, a cor de acento e um selo próprio: os outros quatro são
 * telas, e tela com IA parou de ser diferencial no dia em que qualquer chatbot
 * passou a montar um plano de graça. O que um chatbot não faz é assinar
 * embaixo.
 *
 * ⚠️ O TEXTO É O `detalhe` DO PILAR, e não o `resumo` como nos outros quatro.
 * O `resumo` ("Revisão a cada trimestre, escrita por gente") diz quase
 * palavra por palavra o que a linha de `ASSINATURA_INCLUI` logo abaixo já diz,
 * e duas frases idênticas coladas fazem a peça parecer preenchida no peso, não
 * escrita. O `detalhe` acrescenta o que só ele tem: que a primeira revisão vem
 * no primeiro mês e que o ESCOPO é financeiro — organizar, projetar,
 * priorizar —, não indicação de onde investir. Essa última parte não é
 * enfeite: é a fronteira que a casa não pode cruzar, e ela cabe aqui porque
 * esta é a única faixa larga da peça.
 */
const DESTAQUE: No = {
  chave: "revisao",
  nome: REVISAO.nome,
  chamada: REVISAO.detalhe,
  Icone: PenLine,
  minha: contem("revisão trimestral"),
};

const NOS: No[] = [
  {
    chave: "fincash",
    nome: FINCASH.nome,
    chamada: FINCASH.chamada,
    Icone: Wallet,
    /* Do catálogo, porque `ASSINATURA_INCLUI` não fala dele — ver o aviso no
       cabeçalho do arquivo. */
    extras: FINCASH.pontosFortes,
    minha: () => false,
  },
  {
    chave: "planejamento",
    nome: PLANEJAMENTO.nome,
    chamada: PLANEJAMENTO.chamada,
    Icone: MapPin,
    /* Marco Horizonte, plano de ação, fechamento mensal e o PDF: são quatro
       linhas seguidas de `ASSINATURA_INCLUI` e todas descrevem o mesmo app. */
    minha: contem(
      "marco horizonte",
      "plano de ação",
      "fechamento mensal",
      "relatório em pdf",
    ),
  },
  {
    chave: "iris",
    nome: IRIS.nome,
    chamada: IRIS.chamada,
    Icone: FileUp,
    ressalva: IRIS_E_ABERTA
      ? "A Íris é aberta a todo mundo, com limite de leituras. O que a assinatura tira é o teto — não é a IA que você passa a ter, é o limite que sai."
      : undefined,
    minha: contem("íris"),
  },
  {
    chave: "ferramentas",
    nome: "As ferramentas da casa",
    /* Os dois números saem de `CONTAGEM`, que conta o catálogo. Dizer só o
       total seria inflar: boa parte delas abre sem assinar, e quem descobre
       isso depois de pagar não descobre sozinho — conta para os outros. */
    chamada: `${CONTAGEM.exclusivasAssinante} só abrem assinando. As outras ${CONTAGEM.ferramentas} são abertas a qualquer um, e continuam sendo.`,
    Icone: Layers,
    minha: contem("ferramentas exclusivas", "calculadoras"),
  },
];

/* ------------------------------------------------------ o repartidor ----- */

/** O `{EXCLUSIVAS}` da lista é substituído aqui pela mesma conta que a
    /assinar e o cartão de preço usam — o marcador existe porque
    `assinatura.ts` é fonte pura e não importa o catálogo. */
const INCLUI = ASSINATURA_INCLUI.map((i) =>
  i.replace("{EXCLUSIVAS}", String(CONTAGEM.exclusivasAssinante)),
);

/* A ORDEM DE MONTAGEM É A ORDEM DA DISPUTA: quem reivindica primeiro fica com
   a linha. Sem isto, "Íris ilimitada" poderia aparecer em dois nós, e a mesma
   promessa contada duas vezes faz o pacote parecer inventado. */
const jaUsado = new Set<string>();

function montar(no: No) {
  const meus = INCLUI.filter((i) => !jaUsado.has(i) && no.minha(i));
  meus.forEach((i) => jaUsado.add(i));
  return { ...no, itens: [...(no.extras ?? []), ...meus] };
}

const PRINCIPAL = montar(DESTAQUE);
const SECUNDARIOS = NOS.map((no) => montar(no));

/** Garantia, cancelamento e desconto na consultoria: são CONDIÇÕES da compra,
    não produtos, e por isso viram rodapé em vez de nó. O que ninguém
    reivindicou cai aqui também — de propósito. */
const SOBRARAM = INCLUI.filter((i) => !jaUsado.has(i));

/* ------------------------------------------------------------- as peças -- */

/** O tique das promessas. `strokeWidth` 1,75 é o da página inteira. */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
      <Check
        aria-hidden
        className="mt-[0.3rem] h-3.5 w-3.5 shrink-0 text-accent-strong"
        strokeWidth={1.75}
      />
      <span>{children}</span>
    </li>
  );
}

export default function Pacote({ className }: { className?: string }) {
  const IconePrincipal = PRINCIPAL.Icone;

  return (
    <section className={className}>
      <TituloSecao
        sobre="O que a assinatura abre"
        titulo="Quem assina o FINCASH leva a casa inteira"
        apoio="Não existe plano do FINCASH. Existe uma assinatura da Novare, e ela abre este app, o Planejamento Financeiro, a Íris, as ferramentas da casa e uma revisão trimestral escrita por um consultor. Pelo mesmo preço."
      />

      {/* ⚠️ SÃO DUAS CAIXAS ANINHADAS, E ISSO É OBRIGATÓRIO — a mesma regra da
          garantia no cartão de preço. O `fin-anel` pinta o contorno aceso num
          `::before` de `inset: -1px`; a caixa de dentro precisa de
          `overflow-hidden` para o navy respeitar o raio do topo. Numa caixa só,
          o `overflow` recorta justamente o pixel do anel e o contorno some sem
          erro nenhum aparecer. */}
      <div className="fin-anel mt-9 rounded-[1.75rem]">
        <div className="overflow-hidden rounded-[1.75rem] border border-accent-soft bg-card">
          {/* ═══ A TAMPA: o preço, que é o denominador do argumento ═══════
              O número vem grande porque a peça inteira é uma fração — muita
              coisa EM CIMA, um preço EMBAIXO —, e fração sem denominador não
              prova nada.

              MENSAL no número grande e anual na linha fina, na mesma ordem de
              `ASSINATURA_OFERTA_CURTA`. Liderar pelos R$ 19,90 daria a peça
              mais barata e a promessa mais frágil: é o preço de quem fecha
              doze meses, e anunciá-lo como se fosse o de entrada é a pegadinha
              que o cartão de preço logo abaixo desmentiria na mesma rolagem.

              `fin-lustro` dá UMA passada de luz e para (a lâmina fica fora do
              quadro com `forwards`). Exige o fundo opaco e o `overflow` que
              esta faixa já tem. */}
          <div className="fin-lustro bg-primary p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="min-w-0">
                <Chapeu escuro>
                  <BadgeCheck
                    aria-hidden
                    className="mr-1.5 h-3.5 w-3.5"
                    strokeWidth={1.75}
                  />
                  Uma assinatura só
                </Chapeu>

                {/* Parágrafo, e não título: o `<h2>` da seção já foi dado, e
                    os nós são `<h3>`. Um heading aqui furaria a ordem da fala
                    de quem navega por leitor de tela. */}
                {/* `sm:max-w-xl` e não `max-w-md`: a 28rem a frase quebrava
                    com "ela." sozinho na segunda linha, e órfão de duas
                    sílabas no meio de uma faixa navy lê como erro de
                    digitação. A largura maior ainda para bem antes do bloco de
                    preço, que é `shrink-0`. */}
                <p className="mt-3.5 max-w-md font-display text-xl font-semibold leading-snug text-white sm:max-w-xl sm:text-2xl">
                  Tudo o que está aqui embaixo abre com ela.
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                  Sem taxa de entrada, sem fidelidade e sem comissão embutida em
                  produto nenhum.
                </p>
              </div>

              {/* `shrink-0` + `tabular-nums`: o preço não pode quebrar linha no
                  meio nem dançar quando o número mudar. */}
              <div className="shrink-0 sm:text-right">
                <p className="whitespace-nowrap font-display text-3xl font-extrabold leading-none tabular-nums text-white sm:text-4xl">
                  {ASSINATURA_PRECO_ROTULO}
                  <span className="ml-1 text-base font-semibold text-white/80">
                    /mês
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/80">
                  ou {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no plano anual
                </p>
              </div>
            </div>
          </div>

          {/* ═══ O CORPO ═════════════════════════════════════════════════ */}
          <div className="relative p-4 sm:p-6">
            {/* A PONTA que desce da tampa. Metade dela cobre a borda do navy e
                a outra metade cai no branco, então o que se vê é um triângulo
                apontando para dentro da caixa — o "isto desce daqui" que o
                diagrama precisava, sem uma única linha de SVG para desalinhar.
                Decoração pura: `aria-hidden`. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary"
            />

            {/* ── O ITEM HUMANO ────────────────────────────────────────────
                Faixa larga, fundo de acento e selo: o peso visual diferente
                que ele merece por ser o único que não é software. Os outros
                quatro são brancos e do mesmo tamanho — entre irmãos não há
                destaque.

                Contraste medido sobre `accent-tint`: título em `primary`
                11,03:1, apoio em `muted-foreground` 5,06:1, ícone e tiques em
                `accent-strong` 5,86:1. O selo é branco sobre `primary`:
                12,22:1. */}
            <div className="fin-relevo rounded-2xl border border-accent-soft bg-accent-tint p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent-soft bg-card text-accent-strong">
                  <IconePrincipal
                    aria-hidden
                    className="h-5 w-5"
                    strokeWidth={1.75}
                  />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="font-display text-lg font-bold leading-snug text-primary sm:text-xl">
                      {PRINCIPAL.nome}
                    </h3>
                    <span className="rounded-full bg-primary px-2.5 py-1 text-2xs font-semibold uppercase leading-none tracking-[0.14em] text-white">
                      Não é software
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {PRINCIPAL.chamada}
                  </p>

                  <ul className="mt-3.5 flex flex-col gap-2">
                    {PRINCIPAL.itens.map((i) => (
                      <Item key={i}>{i}</Item>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── OS QUATRO PRODUTOS ───────────────────────────────────────
                DUAS COLUNAS NO MÁXIMO, e não quatro: dentro da caixa sobram
                pouco mais de mil pixels no monitor, e quatro colunas dariam
                cartões de 250px em que cada promessa quebra em cinco linhas.
                Duas colunas deixam cada tique em uma ou duas linhas, que é o
                que permite ler a peça inteira numa passada.

                `fin-escada` escalona a entrada dos filhos (só `opacity` e
                `transform`, e o próprio arquivo desliga em
                `prefers-reduced-motion`). É a LISTA que recebe a classe, nunca
                cada cartão. */}
            <div className="fin-escada mt-4 grid gap-4 sm:grid-cols-2">
              {SECUNDARIOS.map((no) => {
                const Icone = no.Icone;
                return (
                  <div
                    key={no.chave}
                    className="fin-relevo flex flex-col rounded-2xl border border-border bg-card p-5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                      <Icone
                        aria-hidden
                        className="h-5 w-5"
                        strokeWidth={1.75}
                      />
                    </span>

                    <h3 className="mt-4 font-display text-base font-bold leading-snug text-primary">
                      {no.nome}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {no.chamada}
                    </p>

                    {/* A ressalva vem ANTES das promessas, e não depois: letra
                        miúda no pé de um cartão é letra miúda. Em cima, é
                        contexto — e é assim que ela vira argumento de confiança
                        em vez de pegadinha desarmada. */}
                    {no.ressalva && (
                      <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-primary">
                        {no.ressalva}
                      </p>
                    )}

                    {no.itens.length > 0 && (
                      <ul className="mt-3.5 flex flex-col gap-2">
                        {no.itens.map((i) => (
                          <Item key={i}>{i}</Item>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── O RODAPÉ DAS CONDIÇÕES ───────────────────────────────────
                Garantia, cancelamento e desconto na consultoria não são
                produtos: são os termos da mesma compra, e por isso vêm em peso
                menor, numa linha só.

                ⚠️ É TAMBÉM O PARA-QUEDAS do repartidor. Item novo em
                `ASSINATURA_INCLUI` que nenhum nó reivindicar aparece AQUI, e
                não some. Se algum dia surgir algo que claramente é produto
                nesta linha, o conserto é dar um nó a ele lá em cima — a peça
                pediu, por escrito, na própria tela. */}
            {SOBRARAM.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-muted p-4 sm:p-5">
                <p className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  <ShieldCheck
                    aria-hidden
                    className="h-4 w-4 shrink-0"
                    strokeWidth={1.75}
                  />
                  E ainda
                </p>
                <ul className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-7">
                  {SOBRARAM.map((i) => (
                    <Item key={i}>{i}</Item>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
