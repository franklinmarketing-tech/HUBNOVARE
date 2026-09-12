import { ArrowDown, Landmark } from "lucide-react";
import { Foto } from "./Molduras";
import "./antesdepois.css";

/**
 * O MESMO SETEMBRO, DUAS VEZES: o extrato do banco e o painel do FINCASH.
 *
 * ── O QUE ESTA PEÇA PROVA, E POR QUE SÓ ELA PODE PROVAR ───────────────────
 * A página inteira defende uma frase: o extrato está certo e mesmo assim não
 * responde a pergunta que importa. Escrever isso custa uma linha e não
 * convence ninguém — todo concorrente escreve a mesma. Pôr os dois lado a
 * lado, com os números do MESMO mês batendo, é a versão que não dá para
 * copiar sem ter produto rodando: à esquerda há datas, descrições e valores,
 * e nenhuma conclusão; à direita há uma conclusão, e ela é um número.
 *
 * ── ⚠️ A PEÇA CONVIVE COM A `<Calculo />`, E NÃO PODE REPETI-LA ───────────
 * A `Calculo` já diz `2.392 − 1.926 + 600 = 1.066` na mesma rolagem, em duas
 * barras da mesma régua — e o comentário dela conta que essa aritmética JÁ
 * tinha sido dita antes, em lista, pelo `ContaAberta`, e que a lista foi
 * apagada por isso. Escrever a subtração aqui de novo seria a terceira vez, e
 * o olho pula o que reconhece.
 *
 * Então a PONTE desta peça não é a conta: é a PERGUNTA. Ela nomeia as três
 * coisas que o extrato não tem como saber (o aluguel do dia 5, a parcela que
 * vai até dezembro, a fatura que fecha semana que vem) e para aí. Os dois
 * números continuam confrontados, mas cada um no seu lado e no seu tamanho de
 * documento: R$ 2.392 é o rodapé do extrato, R$ 1.066 está impresso na
 * captura do produto. Nenhum número herói, nenhum sinal de igual.
 *
 * ⚠️ E É POR ISSO QUE A ORDEM NA PÁGINA IMPORTA: esta peça é a PROVA (dois
 * documentos), a `Calculo` é a EXPLICAÇÃO (a geometria da subtração). Prova
 * antes de explicação. Encaixar as duas na ordem inversa faz a `Calculo`
 * responder uma pergunta que a página ainda não fez.
 *
 * ── POR QUE O EXTRATO É DESENHADO, E GENÉRICO ─────────────────────────────
 * Não existe captura de extrato no projeto, e não vai existir: imitar o
 * cabeçalho, o nome ou a cor de um banco de verdade numa peça de marketing é
 * problema jurídico, não escolha de design. O que está aqui é um extrato sem
 * marca — ícone genérico de instituição, tipografia da própria casa, nenhuma
 * cor que pertença a alguém. Ele não precisa parecer o banco de ninguém para
 * funcionar; precisa parecer um DOCUMENTO, e é isso que o cinza do cabeçalho,
 * a régua de datas e o rodapé de totais entregam.
 *
 * ── AS DESCRIÇÕES SÃO OPACAS DE PROPÓSITO ─────────────────────────────────
 * "Título pago", "Débito automático", "Compra no débito". É assim que banco
 * escreve, e é exatamente o argumento: R$ 1.508 saíram no dia 10 e o extrato
 * não sabe dizer se era a fatura do cartão, a escola ou o seguro do carro —
 * muito menos se aquilo se repete em outubro. Trocar isso por "Fatura do
 * cartão · Assinaturas" deixaria o lado esquerdo mais bonito e destruiria a
 * peça: um extrato que já categoriza tudo não precisa do FINCASH.
 *
 * ── ONDE CADA NÚMERO FOI CONFERIDO ────────────────────────────────────────
 * `public/fincash/telas/lancamentos-desktop.webp` — "Do que já entrou e saiu
 * em setembro, sobrou R$ 2.392", com as pastilhas "R$ 7.184 entrou",
 * "R$ 4.793 saiu" e "2 atrasadas · R$ 533", o rodapé "Ainda a receber R$ 600
 * / Ainda a pagar R$ 1.926 / O mês fecha com R$ 1.066", e o anel "83% do mês
 * já confirmado · 10 de 20" — é dele que sai o total de dez lançamentos
 * confirmados que o extrato desenhado respeita.
 * `public/fincash/telas/painel-celular.webp` — "Se nada mudar, você fecha o
 * mês com R$ 1.066", "R$ 1.926 a pagar", "R$ 600 a receber", "2 contas
 * atrasadas" e o velocímetro de 86%.
 *
 * ⚠️ 7.184 − 4.793 DÁ 2.391, E O PRODUTO MOSTRA 2.392. Não é erro desta peça
 * nem daquela tela: o app arredonda os três valores separadamente, e três
 * arredondamentos independentes não fecham na casa do real. A trava lá
 * embaixo aceita essa folga de 1 real DE PROPÓSITO — quem "corrigir" um dos
 * números para a conta fechar vai estar desmentindo a captura que está ao
 * lado dele na mesma página.
 */

/* ------------------------------------------------------------- os números --
   Em reais inteiros, como o próprio produto exibe em todas as telas. A
   tentação é pôr centavos para o extrato parecer mais real; o preço disso
   seria um rodapé com três valores que não batem com a captura ao lado, que
   é justamente o defeito que esta peça existe para não ter. */
const ENTRADAS = 7184;
const SAIDAS = 4793;
const SALDO = 2392;

/** Quantos lançamentos de setembro já estão confirmados na conta de demonstração. */
const CONFIRMADOS = 10;

/**
 * As sete linhas mostradas. São um RECORTE dos dez confirmados, e é assim que
 * extrato se comporta mesmo: mostra uma página e avisa que há mais. O resto
 * vira a linha "e mais N lançamentos" logo abaixo da lista, com o valor
 * DERIVADO — nunca escrito à mão, senão a soma da tela pode divergir do
 * rodapé sem ninguém perceber.
 */
const LINHAS: { dia: string; texto: string; valor: number }[] = [
  { dia: "02/09", texto: "Título pago", valor: -1450 },
  { dia: "05/09", texto: "Crédito em conta", valor: +5984 },
  { dia: "08/09", texto: "Compra no débito", valor: -413 },
  { dia: "10/09", texto: "Débito automático", valor: -1508 },
  { dia: "12/09", texto: "Pix recebido", valor: +1200 },
  { dia: "12/09", texto: "Compra no débito", valor: -280 },
  { dia: "15/09", texto: "Compra no débito", valor: -96 },
];

const soma = (sinal: 1 | -1) =>
  LINHAS.filter((l) => Math.sign(l.valor) === sinal).reduce(
    (t, l) => t + Math.abs(l.valor),
    0,
  );

const OUTRAS = CONFIRMADOS - LINHAS.length;
const OUTRAS_VALOR = SAIDAS - soma(-1);

/**
 * A trava, no mesmo espírito da que a `Calculo` já tem: roda no build (a peça
 * é Server Component e a landing é estática) e derruba a publicação com
 * mensagem em vez de pôr no ar um extrato que desmente o painel ao lado.
 *
 * Uma landing que vende um app de fazer conta não pode errar a conta da
 * própria vitrine — e aqui há três jeitos de errar sem parecer: somar mais
 * entradas do que o mês teve, somar mais saídas do que o mês teve, ou mexer
 * no recorte e deixar de bater com os dez lançamentos confirmados da captura.
 */
if (soma(1) > ENTRADAS || soma(-1) > SAIDAS) {
  throw new Error(
    `AntesDepois.tsx: as linhas mostradas passam do mês. Entradas ${soma(1)} ` +
      `de ${ENTRADAS}, saídas ${soma(-1)} de ${SAIDAS}. As linhas são um ` +
      `recorte do mês, nunca um total.`,
  );
}
if (OUTRAS < 1) {
  throw new Error(
    `AntesDepois.tsx: o extrato mostraria ${LINHAS.length} dos ` +
      `${CONFIRMADOS} lançamentos confirmados, e a linha "e mais N" ficaria ` +
      `vazia ou negativa. Confira o anel "10 de 20" em ` +
      `public/fincash/telas/lancamentos-desktop.webp.`,
  );
}
if (Math.abs(ENTRADAS - SAIDAS - SALDO) > 1) {
  throw new Error(
    `AntesDepois.tsx: ${ENTRADAS} - ${SAIDAS} = ${ENTRADAS - SAIDAS}, e o ` +
      `rodapé anuncia ${SALDO}. Uma folga de 1 real é esperada (o produto ` +
      `arredonda os três valores em separado); mais que isso é número errado.`,
  );
}

/** `pt-BR` com ponto de milhar e sem centavos, igual às telas do produto. */
const brl = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR")}`;
const comSinal = (v: number) => `${v < 0 ? "−" : "+"} ${brl(v)}`;

/**
 * O rótulo de um dos lados.
 *
 * ⚠️ É `<p>`, e NÃO `<h3>`, pelo mesmo motivo documentado na `Calculo`: o
 * componente não sabe em que altura da página vai ser encaixado, e chutar um
 * nível de título aqui fura o sumário da landing para quem navega por
 * cabeçalhos. Quem encaixar a peça põe o `<h2>` da seção por fora.
 *
 * E os rótulos dizem o TRABALHO de cada lado, não "antes" e "depois": "antes"
 * e "depois" descrevem a peça para quem já entendeu o argumento; "o que o
 * banco te mostra" e "o que é seu de verdade" fazem o argumento sozinhos,
 * que é o que precisa acontecer em quem só passou o olho.
 */
function Rotulo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mb-3">
      <p className="font-display text-base font-semibold leading-snug text-primary sm:text-lg">
        {titulo}
      </p>
      <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
        {texto}
      </p>
    </div>
  );
}

export default function AntesDepois({ className }: { className?: string }) {
  return (
    /* ⚠️ A PEÇA PRESSUPÕE FUNDO CLARO. O extrato traz o próprio cartão branco,
       mas a ponte no meio é transparente de propósito (uma terceira caixa ali
       mataria a leitura de "passagem" e viraria um trio de cards). Os pares de
       contraste da ponte foram medidos contra a superfície clara mais escura
       da casa, `--color-creme-forte` (92% de luz): muted-foreground 4,83:1,
       primary 10,53:1, accent-strong 5,60:1. Encaixada sobre o navy do palco,
       todos caem de uma vez.

       `items-center` no desktop: a captura de celular fica mais alta que o
       cartão do extrato, e alinhar pelo topo deixaria a ponte grudada no céu
       com um vão de 90px embaixo.

       ⚠️ O EXTRATO TEM TETO DE 26rem, e não `1fr`. Com `1fr` ele engolia toda
       a sobra do contêiner (592px numa página de 1152) e as linhas viravam um
       vão enorme entre a descrição e o valor — o olho perde a associação e a
       peça lê como tabela de relatório em vez de comprovante. O `justify-center`
       devolve a sobra para as margens, onde ela não atrapalha. */
    <div
      className={`grid items-start gap-6 lg:grid-cols-[minmax(18rem,26rem)_minmax(10rem,13rem)_minmax(13rem,16rem)] lg:items-center lg:justify-center lg:gap-6 xl:gap-8 ${
        className ?? ""
      }`}
    >
      {/* ── LADO ESQUERDO: O EXTRATO ────────────────────────────────────────
          `<ul>` de linhas, e NÃO `<table>`. A tabela seria a marcação
          semanticamente certa, mas `width` numa `<table>` é MÍNIMO, não
          máximo: a 390px a coluna de descrição empurra o valor para fora e a
          página inteira ganha rolagem lateral. A lista com grade de três
          colunas diz a mesma coisa ao leitor de tela ("05/09, crédito em
          conta, mais R$ 5.984") e encolhe quando precisa. */}
      <section aria-label="Extrato do banco em setembro">
        <Rotulo
          titulo="O que o banco te mostra"
          texto="Está tudo certo, e está tudo no passado."
        />

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {/* Sem logo, sem nome e sem cor de banco: o ícone é o genérico de
              instituição financeira do mesmo pacote que a página inteira já
              usa, em cinza de texto secundário. */}
          <header className="flex items-center gap-2.5 border-b border-border bg-muted/60 px-4 py-3 sm:px-5">
            <Landmark
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extrato · conta corrente
              </p>
              <p className="mt-0.5 font-display text-sm font-semibold text-primary">
                Setembro
              </p>
            </div>
            <p className="shrink-0 text-2xs tabular-nums text-muted-foreground">
              01/09 a 30/09
            </p>
          </header>

          <ul className="divide-y divide-border">
            {LINHAS.map((l, i) => (
              /* Três colunas fixas-flexíveis: o dia e o valor têm largura de
                 conteúdo, a descrição fica com o que sobrar. `items-baseline`
                 para o dia miúdo assentar na mesma linha do texto, e
                 `whitespace-nowrap` no valor porque "− R$ 1.450" quebrado em
                 duas linhas num extrato lê como erro de renderização. */
              <li
                key={`${l.dia}-${i}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2.5 px-4 py-2.5 sm:gap-x-4 sm:px-5"
              >
                <span className="text-2xs tabular-nums text-muted-foreground">
                  {l.dia}
                </span>
                <span className="text-xs text-foreground sm:text-sm">
                  {l.texto}
                </span>
                {/* Entrada em verde, saída em PRETO — e não em vermelho. O
                    extrato não é o vilão desta página (a `Calculo` fixou esse
                    enquadramento: ele não mente, responde outra pergunta), e
                    sete linhas vermelhas o acusariam de algo que ele não fez.
                    O verde fica porque ali a cor É o dado: é o mesmo verde de
                    "R$ 600 a receber" na captura ao lado. */}
                <span
                  className={`whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm ${
                    l.valor > 0 ? "text-success-strong" : "text-foreground"
                  }`}
                >
                  {comSinal(l.valor)}
                </span>
              </li>
            ))}
          </ul>

          <p className="flex items-baseline justify-between gap-3 border-t border-border px-4 py-2.5 text-2xs text-muted-foreground sm:px-5">
            <span>
              e mais {OUTRAS} lançamento{OUTRAS > 1 ? "s" : ""} em setembro
            </span>
            <span className="whitespace-nowrap tabular-nums">
              {comSinal(-OUTRAS_VALOR)}
            </span>
          </p>

          {/* O rodapé de totais é o que faz a peça: é aqui que o extrato
              entrega o resultado do mês e PARA. A última linha em cinza não é
              opinião nossa sobre o banco, é a descrição literal do que o
              documento acima contém. */}
          <footer className="border-t border-border bg-muted/60 px-4 py-3.5 sm:px-5">
            <dl className="space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Entradas</dt>
                <dd className="whitespace-nowrap font-semibold tabular-nums text-success-strong">
                  {comSinal(ENTRADAS)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Saídas</dt>
                <dd className="whitespace-nowrap font-semibold tabular-nums text-foreground">
                  {comSinal(-SAIDAS)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <dt className="font-semibold text-primary">
                  Saldo do período
                </dt>
                <dd className="whitespace-nowrap font-display text-base font-semibold tabular-nums text-primary">
                  {comSinal(SALDO)}
                </dd>
              </div>
            </dl>
            <p className="mt-2.5 text-2xs leading-snug text-muted-foreground">
              É tudo o que já aconteceu. O extrato termina aqui.
            </p>
          </footer>
        </article>
      </section>

      {/* ── A PONTE ─────────────────────────────────────────────────────────
          O que transforma duas imagens vizinhas numa demonstração é o que fica
          ENTRE elas. Aqui é: o fio tracejado com a seta (a direção da leitura,
          que muda de eixo com a largura) e as três coisas que o extrato não
          tem como saber.

          NÃO É A ARITMÉTICA. A `Calculo`, na mesma rolagem, já desenha
          2.392 − 1.926 + 600 = 1.066 em duas barras, e o `ContaAberta` que
          dizia isso em lista foi apagado da página por repetição. A ponte
          aqui faz o trabalho que falta: nomear o que está FALTANDO no
          documento da esquerda. Três itens, três coisas que têm data marcada e
          não aparecem em extrato nenhum.

          ⚠️ SEM FUNDO E SEM BORDA. Uma terceira caixa aqui faria a peça ler
          como três cards enfileirados, e a passagem some. O que separa a ponte
          dos dois lados é o fio e o respiro. */}
      <div className="lg:self-center">
        <div aria-hidden className="flex items-center gap-2.5">
          <span className="ad-fio" />
          <span className="ad-seta inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-btn text-white shadow-card">
            {/* Um ícone só, girado: a seta aponta para baixo no celular
                (extrato em cima) e para a direita a partir de `lg` (extrato à
                esquerda). Dois ícones alternados por breakpoint dariam o mesmo
                resultado e um nó a mais para manter. */}
            <ArrowDown className="size-4 lg:-rotate-90" />
          </span>
          <span className="ad-fio" />
        </div>

        <p className="mt-4 font-display text-sm font-semibold leading-snug text-primary sm:text-base">
          A diferença é o que ainda não aconteceu.
        </p>

        <ul className="mt-2.5 space-y-1.5">
          {[
            "o aluguel do dia 5",
            "a parcela que vai até dezembro",
            "a fatura que fecha semana que vem",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-2xs leading-snug text-muted-foreground"
            >
              {/* `items-start` e não `items-baseline`: um `<span>` vazio não
                  tem linha de base, e o ponto cai no fundo da caixa. */}
              <span
                aria-hidden
                className="mt-[0.42rem] size-1.5 shrink-0 rounded-full bg-accent"
              />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-2xs leading-snug text-muted-foreground">
          Tudo com data marcada, e nada disso cabe num extrato.
        </p>
      </div>

      {/* ── LADO DIREITO: O PAINEL ──────────────────────────────────────────
          É a captura de CELULAR, e a de desktop foi recusada por geometria: o
          `painel-desktop.webp` é 16:10 e, numa coluna de 16rem ao lado de um
          extrato alto, ele renderiza a 256x160px — o R$ 1.066 vira um borrão e
          o resumo do Fin some. A de celular ocupa a mesma coluna estreita com
          proporção 780x1688 e entrega TODAS as conclusões em tamanho legível:
          o número grande, "R$ 1.926 a pagar", "R$ 600 a receber", "2 contas
          atrasadas" e o velocímetro de 86%.

          ⚠️ É O MESMO ARQUIVO QUE A `<Vitrine />` usa no centro do leque, e
          isso é de propósito: não custa um byte a mais (mesma URL, mesmo
          cache, e lá ela já é `priority`) e a repetição ajuda — a tela que a
          página apresentou como herói volta aqui no papel de resposta. Por
          isso `prioridade` NÃO é passado aqui: a peça vive no meio da rolagem,
          e uma segunda prioridade na mesma página é o mesmo que nenhuma.

          A moldura vem da `Foto` de `Molduras.tsx`, com o `alt` já escrito no
          catálogo — que descreve os números da tela, e não o fato de ser uma
          captura. Desenhar uma moldura nova aqui criaria dois aparelhos que
          envelhecem separados. */}
      <section aria-label="O mesmo mês no painel do FINCASH">
        <Rotulo
          titulo="O que é seu de verdade"
          texto="O mesmo setembro, contando o que ainda vence."
        />
        <div className="mx-auto w-full max-w-[17rem] lg:max-w-none">
          <Foto
            tela="painelCelular"
            aparelho="telefone"
            sizes="(max-width: 1024px) 272px, 256px"
          />
          {/* A folha de respostas, numa linha. Não repete o R$ 1.066 (ele está
              impresso grande na captura logo acima): traz as três pastilhas
              pequenas que, numa coluna de 256px, ficam no limite do legível —
              e traz com as PALAVRAS DO PRODUTO ("a pagar", "a receber",
              "atrasadas"), não com sinônimos nossos. Legenda que reescreve o
              que a foto diz ensina a pessoa a desconfiar da foto. */}
          <p className="mt-3 text-2xs leading-snug tabular-nums text-muted-foreground">
            R$ 1.926 a pagar · R$ 600 a receber · 2 contas atrasadas, R$ 533
          </p>
        </div>
      </section>
    </div>
  );
}
