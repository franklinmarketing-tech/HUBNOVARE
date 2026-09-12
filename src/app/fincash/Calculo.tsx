import "./calculo.css";

/**
 * A CONTA QUE O EXTRATO NÃO FAZ, desenhada.
 *
 * ── O QUE ESTA PEÇA PRECISA RESOLVER ──────────────────────────────────────
 * A pessoa abre o app do banco, vê um número e decide em cima dele. O número
 * está certo e a decisão está errada, porque falta subtrair o que ainda vence
 * no mês e somar o que ainda cai. A peça existe para essa distância ser vista
 * antes de ser lida — em três segundos, sem parágrafo.
 *
 * ── A FORMA: UMA RÉGUA SÓ, LIDA DUAS VEZES ────────────────────────────────
 * As duas barras têm EXATAMENTE o mesmo comprimento e cortes diferentes.
 * A de cima corta em "o que já está na conta | o que ainda entra"; a de baixo
 * corta em "o que já tem dono | o que sobra". Mesmo dinheiro, duas leituras —
 * que é a frase do Jefferson desenhada: o dinheiro não mudou, só a leitura
 * dele. O argumento vira geometria: o trecho aceso da segunda barra é
 * visivelmente um terço da régua, e não há como ler isso como "sobra bastante".
 *
 * ⚠️ POR QUE NÃO OS TRÊS DEGRAUS (2.392 → −1.926 → +600 → =1.066), que era o
 * caminho mais curto: a página JÁ TEM isso. O `ContaAberta` da seção 3 é
 * exatamente uma lista de três linhas e um resultado. Repetir a forma aqui
 * daria à pessoa a sensação de já ter lido esta peça, e o olho pula o que
 * reconhece. A barra diz a mesma aritmética numa gramática que a página ainda
 * não gastou.
 *
 * ⚠️ POR QUE NÃO O "LADO A LADO" de dois números em escala: dois números
 * grandes um do lado do outro provam que são diferentes, e é só isso que
 * provam. Não mostram POR QUE são diferentes, que é a parte que convence.
 *
 * ── O TOTAL DA RÉGUA NÃO É UM NÚMERO DA PÁGINA, E ISSO É PROPOSITAL ───────
 * A régua inteira vale R$ 2.992 (os 2.392 que já estão na conta mais os 600
 * que ainda entram), e esse valor NÃO está escrito em lugar nenhum da peça —
 * ele é só a escala. Uma landing de finanças não pode pedir que se aceite um
 * número novo: os quatro que a peça diz em voz alta são os quatro que estão
 * nas capturas do produto nesta mesma página.
 *
 * ── OS NÚMEROS, E ONDE ELES FORAM CONFERIDOS ──────────────────────────────
 * `public/fincash/telas/lancamentos-celular.webp` — "Do que já entrou e saiu
 * em setembro, sobrou R$ 2.392", com "Ainda a receber R$ 600" e "Ainda a
 * pagar R$ 1.926" no rodapé do cartão.
 * `public/fincash/telas/painel-celular.webp` — "Se nada mudar, você fecha o
 * mês com R$ 1.066", "R$ 1.926 a pagar", "R$ 600 a receber".
 * As duas capturas saem da mesma conta de demonstração, e fecham: 2.392 menos
 * 1.926 mais 600 dá 1.066, na casa do real.
 *
 * ⚠️ O RÓTULO DIZ "EXTRATO", E NÃO "SALDO DA CONTA". Os R$ 2.392 são o
 * resultado do mês (o que entrou menos o que saiu em setembro), não o saldo
 * total da conta — o saldo acumulado desta mesma demonstração é R$ 14.991, e
 * está na captura da projeção. Chamar 2.392 de "seu saldo no banco" seria a
 * página se desmentir para quem abrir a tela de projeção. A frase da seção
 * pode falar de saldo, que é o vocabulário de quem chega; o NÚMERO é rotulado
 * pelo que ele é.
 */

/* ---------------------------------------------------------------- números --
   Constantes, e não literais espalhados pelo JSX, porque as LARGURAS das
   barras são calculadas a partir delas logo abaixo. Editar um número no texto
   e deixar a largura antiga produziria uma barra que desmente a própria
   legenda — o defeito mais caro possível numa peça cujo único trabalho é
   provar uma subtração. */
const EXTRATO = 2392;
const A_PAGAR = 1926;
const A_RECEBER = 600;
const SOBRA = 1066;

/** A régua inteira: o que passa pela conta no mês. Só escala, nunca rótulo. */
const REGUA = EXTRATO + A_RECEBER;

/**
 * A trava.
 *
 * Roda no build (é Server Component, e a landing é estática), e derruba o
 * build com mensagem em vez de publicar uma conta que não fecha. Parece
 * exagero até lembrar do que esta página vende: um app que promete fazer a
 * conta certa não pode errar a própria conta na vitrine. Se alguém atualizar a
 * conta de demonstração e mexer em três dos quatro números, é aqui que descobre.
 */
if (EXTRATO - A_PAGAR + A_RECEBER !== SOBRA) {
  throw new Error(
    `Calculo.tsx: a conta não fecha. ${EXTRATO} - ${A_PAGAR} + ${A_RECEBER} ` +
      `= ${EXTRATO - A_PAGAR + A_RECEBER}, e a peça anuncia ${SOBRA}. ` +
      `Confira as capturas em public/fincash/telas/ antes de corrigir.`,
  );
}

/** Três casas para os quatro trechos somarem 100% sem deixar fio de fundo. */
const larg = (valor: number) => `${((valor / REGUA) * 100).toFixed(3)}%`;

/**
 * Uma legenda de trecho: o rótulo forte em cima, o que ele significa embaixo.
 *
 * As legendas ficam FORA das barras, e é por isso que as barras podem ser
 * animadas e marcadas como decorativas sem custo: todo o texto da peça está
 * aqui, em fluxo normal, na ordem em que a conta acontece.
 *
 * `tabular-nums` em todas, inclusive nas que hoje não têm número: as duas
 * colunas de uma barra ficam na mesma linha de base, e basta uma delas ganhar
 * um valor amanhã para a dupla desalinhar se a classe não estiver nas duas.
 */
function Legenda({
  titulo,
  texto,
  cor,
  alinhar = "esquerda",
}: {
  titulo: string;
  texto: string;
  cor: string;
  alinhar?: "esquerda" | "direita";
}) {
  const direita = alinhar === "direita";
  return (
    /* `basis-0 grow` nas duas: as legendas partem a largura ao meio em vez de
       se dimensionarem pelo próprio texto. Sem isso, a legenda longa da
       esquerda empurra a da direita para fora do lugar a 390px, e a coluna
       direita encolhe até quebrar "R$ 600" no meio. */
    <div className={`min-w-0 basis-0 grow ${direita ? "text-right" : ""}`}>
      <p className={`text-sm font-semibold tabular-nums ${cor}`}>{titulo}</p>
      <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
        {texto}
      </p>
    </div>
  );
}

export default function Calculo({ className }: { className?: string }) {
  return (
    /* A PEÇA TRAZ O PRÓPRIO CARTÃO BRANCO, e isso não é preferência estética:
       a tampa que descobre as barras (`.fin-conta-medir`) é pintada com
       `--color-card`, e os pares de contraste da peça inteira foram medidos
       contra branco. Encaixada solta sobre uma seção navy, os dois pressupostos
       caem juntos. O cartão é o contrato. */
    <div
      className={`rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8 ${
        className ?? ""
      }`}
    >
      <p className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-2xs font-semibold text-primary">
        Setembro · conta de demonstração
      </p>

      {/* A FRASE, palavra por palavra, e deliberadamente em `<p>` e não em
          `<h2>`: o componente não sabe em que altura da página vai ser
          encaixado, e um nível de título chutado aqui fura o sumário da
          landing para quem navega por cabeçalhos. Quem encaixar a peça põe o
          título da seção por fora. O `<strong>` marca a virada da frase — é a
          metade que a página está vendendo. */}
      <p className="mt-4 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight text-primary sm:text-2xl">
        Seu saldo mostra quanto você tem.{" "}
        <strong className="font-semibold text-accent-strong">
          O FINCASH mostra quanto você realmente pode gastar.
        </strong>
      </p>

      {/* ── PRIMEIRA LEITURA: O EXTRATO ───────────────────────────────────
          O número grande vem ANTES da barra, no DOM e na tela. É o número que
          a pessoa já conhece — abrir a peça com ele é começar no lugar onde
          ela está, e não onde queremos que ela chegue.

          `text-primary` e não laranja: o extrato não é o vilão da história, é
          informação incompleta. Pintar de vermelho ou de laranja acusaria o
          banco de mentir, e ele não mente — ele responde outra pergunta. */}
      <div className="mt-8">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          O que o extrato te mostra
        </p>
        <p className="mt-1 font-display text-4xl font-semibold tabular-nums leading-none text-primary sm:text-5xl">
          R$ 2.392
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          o que já entrou e saiu na sua conta em setembro
        </p>

        {/* `aria-hidden` na régua inteira: ela não tem um dado que as legendas
            abaixo não digam por escrito, e narrada vira uma sequência de
            divisões vazias no meio da conta. */}
        <div
          aria-hidden
          className="fin-conta-medir mt-4 flex h-3.5 w-full overflow-hidden rounded-full sm:h-4"
        >
          <span className="bg-primary" style={{ width: larg(EXTRATO) }} />
          {/* O trecho que ainda vai cair é OCO: o dinheiro existe no
              calendário e não na conta, e um bloco cheio afirmaria o
              contrário. Verde porque aqui a cor É o dado — é o mesmo verde de
              "R$ 600 a receber" na tela do produto, que a captura logo acima
              nesta página mostra. */}
          <span
            className="border-2 border-dashed border-success-strong/70 bg-success/15"
            style={{ width: larg(A_RECEBER) }}
          />
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-4">
          <Legenda
            titulo="já na sua conta"
            texto="é este o número que o app do banco te dá"
            cor="text-primary"
          />
          <Legenda
            titulo="+ R$ 600"
            texto="ainda entram até o dia 30, e o extrato não conta"
            cor="text-success-strong"
            alinhar="direita"
          />
        </div>
      </div>

      {/* ── SEGUNDA LEITURA: O MESMO DINHEIRO, OUTRO CORTE ────────────────
          Mesmo `w-full`, mesma altura, mesma régua. Se algum dia alguém der
          largura própria a uma das duas barras, a peça perde o argumento
          inteiro e continua parecendo certa — é o tipo de mudança que passa
          numa revisão e some na produção.

          ⚠️ E NÃO VOLTE A PÔR UM FILETE (`border-t`) ENTRE AS DUAS. Ele estava
          aqui e destruía o mesmo argumento por outro caminho: uma linha
          horizontal entre elas diz "são duas coisas diferentes", quando a peça
          existe para dizer que são a MESMA régua lida duas vezes. O que separa
          as duas leituras é o respiro e o rótulo em versalete, e só. */}
      <div className="mt-7">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          O que o FINCASH mostra
        </p>

        <div
          aria-hidden
          className="fin-conta-medir fin-conta-medir-tarde mt-3 flex h-3.5 w-full overflow-hidden rounded-full sm:h-4"
        >
          <span
            className="fin-conta-dono bg-primary"
            style={{ width: larg(A_PAGAR) }}
          />
          <span className="bg-accent" style={{ width: larg(SOBRA) }} />
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-4">
          <Legenda
            titulo="− R$ 1.926"
            texto="já têm dono: contas e faturas que ainda vencem no mês"
            cor="text-primary"
          />
          <Legenda
            titulo="o que sobra"
            texto="livre de verdade"
            cor="text-accent-strong"
            alinhar="direita"
          />
        </div>

        {/* O HERÓI.
            Ele fica FORA da barra, em bloco próprio e largura cheia, porque
            dentro da barra ele moraria num trecho de 35% — a 390px são ~120px,
            onde "R$ 1.066" no tamanho que ele precisa ter não cabe de jeito
            nenhum. Aqui ele é maior que o número do extrato lá em cima em
            qualquer largura, que é a única hierarquia que a peça não pode
            perder.

            ⚠️ SEM BRILHO, SEM PULSO. O `.fin-lustro` cabia aqui e foi
            recusado: a peça já tem duas barras se descobrindo, e um terceiro
            movimento na mesma dobra transforma a prova num banner. */}
        <div className="mt-6 rounded-xl bg-accent-tint px-4 py-4 sm:px-5 sm:py-5">
          <p className="font-display text-5xl font-semibold tabular-nums leading-none text-accent-strong sm:text-[3.75rem]">
            R$ 1.066
          </p>
          <p className="mt-2 text-sm font-medium leading-snug text-primary">
            é o que você realmente pode gastar até o dia 30
          </p>
        </div>
      </div>

      <p className="mt-5 text-2xs leading-relaxed text-muted-foreground">
        Os quatro números são os da conta de demonstração do FINCASH, os mesmos
        que aparecem nas telas desta página.
      </p>
    </div>
  );
}
