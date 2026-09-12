"use client";

import "./app/fincash.css";
import {
  BarrasComLinha,
  RoscaComposicao,
  Medidor,
  brlExato,
} from "./app/pecas";

/**
 * Os gráficos VIVOS da landing do FINCASH.
 *
 * ── POR QUE ELES EXISTEM ───────────────────────────────────────────────────
 * A página falava de orçamento estourado, de renda comprometida e de doze
 * meses à frente mostrando FOTO de gráfico. Foto de gráfico prova que a tela
 * existe; ela não deixa ninguém acompanhar a coluna que passa do plano nem a
 * curva que sobe. Aqui entram as peças de desenho DO PRÓPRIO APP, as mesmas de
 * `app/pecas.tsx` que o painel usa, com os mesmos eixos e a mesma escala.
 *
 * ── POR QUE OS NÚMEROS SÃO ESTES E NÃO OUTROS ──────────────────────────────
 * ⚠️ TODO VALOR AQUI SAI DA CONTA DE DEMONSTRAÇÃO FOTOGRAFADA na mesma página:
 * o mês fecha em R$ 1.066, a renda está 86% comprometida, o orçamento de
 * setembro gastou R$ 6.718 contra R$ 6.680 planejados (101%) e a projeção de
 * doze meses vai de R$ 14.991, o menor saldo do período, até R$ 48.847.
 * Gráfico de página de venda que conta uma história diferente da captura ao
 * lado não é enfeite inofensivo: é a única peça da página capaz de DESMENTIR a
 * prova que está a dois centímetros dela. Ao mexer numa captura, confira estes
 * números antes de publicar.
 *
 * ── POR QUE UM ARQUIVO SÓ, E CLIENTE ───────────────────────────────────────
 * As peças são componentes de cliente (animam quando entram na tela e ouvem
 * `prefers-reduced-motion` por dentro, em `useValorQueEntra`). Em vez de
 * marcar a landing inteira como cliente, o que mandaria mil e duzentas linhas
 * de argumento de venda para o navegador sem motivo, a fronteira mora aqui:
 * `page.tsx` continua sendo server component e importa três peças prontas.
 * Os dados também moram aqui, e não em `page.tsx`, porque props de objeto
 * atravessando a fronteira viajam serializadas no HTML, duas vezes.
 *
 * O `fincash.css` vem junto porque as peças chamam variáveis dele (as sombras)
 * e a classe `.tabela-so-leitor`, a tabela que só o leitor de tela lê. É o
 * mesmo import que o laboratório de `/fincash/lab` faz.
 */

const brl = brlExato;

/**
 * O velocímetro de renda comprometida, ao lado da captura do painel.
 *
 * 86% é o número da foto logo acima dele, e o desenho diz por forma o que o
 * texto diz por escrito: o ponteiro cruzou o entalhe dos 85%, que é onde a
 * peça para de considerar o mês confortável.
 */
export function MedidorRenda() {
  return (
    <Medidor
      valor={86}
      rotulo="Da renda já comprometida"
      legenda="Acima de 85% o app acende o alerta: um imprevisto nesse ponto vira dívida."
    />
  );
}

/**
 * Para onde foram os R$ 6.718 do mês fotografado.
 *
 * POR QUE COMPOSIÇÃO E NÃO "REALIZADO CONTRA PLANEJADO"
 * A captura ao lado já mostra realizado contra planejado linha por linha, com
 * mínimo, média e máximo de cada categoria. Repetir a mesma comparação aqui
 * embaixo seria dizer duas vezes a mesma coisa, e a segunda pior. O que a
 * captura não dá é a PROPORÇÃO, e é ela que amarra a página inteira: o total
 * do furo da rosca é o mesmo R$ 6.718 da imagem, e ele sobre a renda prevista
 * de R$ 7.784 (a que a tela de metas mostra) dá os 86% do velocímetro da
 * seção anterior. As três peças de desenho da página contam uma conta só.
 *
 * POR QUE ROSCA, E NÃO MAIS UMA BARRA
 * Porque as outras duas já são barra e arco. Três desenhos com a mesma forma
 * viram um desenho repetido três vezes, que é o mesmo defeito de ritmo que a
 * página combateu nas seções de texto.
 *
 * ⚠️ A PALETA É SUBSTITUÍDA, E ISSO É DE PROPÓSITO. A rosca do app tem sete
 * cores (ciano, laranja, navy, âmbar, verde, roxo), e lá dentro elas separam
 * categorias que a pessoa mesma criou. Numa página de venda regida por um
 * acento só, seis cores seriam seis decisões de decoração brigando com o
 * laranja. Aqui entra uma escada de navy: a fatia mais escura é a maior, e a
 * ordem da legenda numerada continua sendo o contrato que dispensa a cor.
 * Escada de luminosidade é, de quebra, a única paleta que sobrevive inteira em
 * escala de cinza.
 */
export function OrcamentoPorCategoria() {
  return (
    <RoscaComposicao
      formatar={brl}
      /* O furo é estreito, e "R$ 6.718,47" por extenso encosta nas duas
         bordas dele. O total redondo cabe, e os centavos não têm o que fazer
         num número que serve para comparar com a renda. */
      centro="R$ 6.718"
      legendaCentro="em setembro"
      maxFatias={10}
      fatias={SETEMBRO.map((c, i) => ({
        id: c.id,
        nome: c.nome,
        valor: c.valor,
        cor: degrau(i, SETEMBRO.length),
      }))}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SETEMBRO DE 2026, POR CATEGORIA — a fonte única dos dois desenhos de rosca
   ════════════════════════════════════════════════════════════════════════════

   ⚠️ ESTES NÚMEROS SUBSTITUEM UMA LISTA QUE ESTAVA ERRADA. A versão anterior
   trazia sete categorias inventadas (Moradia 2.400, Mercado 1.180, "Alimentação
   fora de casa" 830…) que só acertavam o TOTAL. A captura de Orçamento a dois
   centímetros dali diz, em texto legível, Moradia R$ 2.883 e Mercado R$ 862 —
   ou seja, o desenho desmentia a prova. Era exatamente o defeito contra o qual
   o cabeçalho deste arquivo avisa.

   DE ONDE SAIU CADA LINHA: reproduzindo o gerador da conta de demonstração
   (`src/lib/fincash/demo.ts` — as listas FIXAS, VARIAVEIS, ORCAMENTOS, os dois
   parcelamentos de cartão e o IPTU atrasado) para a competência 2026-09 com o
   mesmo `variar()` determinístico que o app usa. A reprodução foi conferida
   contra `public/fincash/telas/orcamento-desktop.webp` em cinco pontos
   independentes, e bate em todos:

     • Moradia R$ 2.883, Mercado R$ 862, Saúde R$ 593 no mês;
     • a faixa de seis meses de Moradia (mín 2.590 · média 2.616 · máx 2.669),
       de Mercado (1.228 · 1.318 · 1.404) e de Saúde (847 · 889 · 938);
     • "3 linhas já passaram do limite: Moradia, Lazer, Compras" — as mesmas
       três, pelos mesmos limites;
     • o planejado R$ 6.680, que é a soma exata dos nove tetos de ORCAMENTOS;
     • o total R$ 6.718,47, fechando com o "já gastou R$ 6.718" da foto.

   ⚠️ A TRANSFERÊNCIA PARA A RESERVA (R$ 600, categoria Investimento) ENTRA. Ela
   é o que fechava os R$ 600 que faltavam para o total da captura, e tirá-la
   para a rosca ficar "só de gasto" quebraria o casamento com a foto. Ela também
   é a única linha boa do mês, e esconder a parte boa não deixa o desenho mais
   honesto — deixa menos.

   ⚠️ O MÊS ESTÁ PELA METADE (a foto diz "o mês está em 33%"). Por isso Mercado
   aparece com R$ 862 contra uma média de R$ 1.318: faltam as compras do fim do
   mês. É o mesmo recorte da captura, e é por isso que a legenda da peça diz
   "até aqui" e não "no mês". */
const SETEMBRO: { id: string; nome: string; valor: number }[] = [
  { id: "moradia", nome: "Moradia", valor: 2883.41 },
  { id: "mercado", nome: "Mercado", valor: 862.48 },
  { id: "investimento", nome: "Investimento", valor: 600 },
  { id: "saude", nome: "Saúde", valor: 593.24 },
  { id: "educacao", nome: "Educação", valor: 472.12 },
  { id: "lazer", nome: "Lazer", valor: 438.4 },
  { id: "compras", nome: "Compras", valor: 429.9 },
  { id: "transporte", nome: "Transporte", valor: 204.95 },
  { id: "restaurante", nome: "Restaurante", valor: 121.27 },
  { id: "assinaturas", nome: "Assinaturas", valor: 112.7 },
];

const TOTAL_SETEMBRO = SETEMBRO.reduce((s, c) => s + c.valor, 0);

/**
 * A escada de luminosidade das fatias, derivada do token — e não escrita à mão.
 *
 * POR QUE `color-mix` E NÃO DEZ HEXADECIMAIS: dez cores fixas seriam dez
 * decisões de decoração para manter em dia toda vez que `--color-primary`
 * mudar. Misturar o próprio token com branco em degraus dá a mesma escada e
 * continua sendo a cor da casa depois de qualquer troca de marca. É o mesmo
 * recurso que `tintar()` usa em `pecas.tsx`.
 *
 * ⚠️ A ESCADA NÃO É DECORAÇÃO: ela é a ordem. A fatia mais escura é a maior, e
 * é por isso que esta paleta sobrevive inteira em escala de cinza e para quem
 * não distingue matiz — o que sete cores categóricas não fazem. Ainda assim
 * nenhum dado vive só nela: toda fatia é nomeada por escrito na lista ao lado.
 */
/**
 * Dinheiro sem centavo, para eixo e para número arredondado.
 *
 * ⚠️ NÃO É SÓ ACABAMENTO. `brlExato(Math.round(2883.41))` imprime
 * "R$ 2.883,00" — e esses dois zeros são uma AFIRMAÇÃO falsa: o valor tem 41
 * centavos. Arredondar e mostrar centavo de qualquer jeito é pior do que não
 * arredondar, porque promete uma precisão que o desenho não tem. Onde o número
 * foi arredondado, o formato tem de dizer isso calando os centavos.
 */
const brlInteiro = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const degrau = (i: number, n: number) =>
  `color-mix(in oklab, var(--color-primary) ${Math.round(100 - (i / Math.max(1, n - 1)) * 72)}%, white)`;

/**
 * A projeção de doze meses, coluna e curva no mesmo eixo.
 *
 * A COLUNA é a sobra de cada mês e a CURVA é o saldo acumulado. O primeiro mês
 * é o R$ 1.066 que a página inteira defende, e é ele que explica por que a
 * curva começa quase deitada: o mês corrente já gastou quase tudo o que tinha
 * para gastar. Dezembro fecha no vermelho, e a coluna virada para baixo é o
 * aviso que a seção promete em texto, chegando com três meses de antecedência.
 *
 * A curva sai de R$ 14.991, o menor saldo do período segundo a captura, e
 * termina nos R$ 48.847 que ela mostra no canto. As onze sobras somam
 * exatamente a diferença: conferir isso é uma subtração, e alguém vai fazer.
 */
export function ProjecaoDozeMeses() {
  return (
    <BarrasComLinha
      formatar={brl}
      rotuloBarra="Sobrou no mês"
      rotuloLinha="Saldo acumulado"
      pontos={[
        { ref: "2026-09", barra: 1066, linha: 14991 },
        { ref: "2026-10", barra: 3180, linha: 18171 },
        { ref: "2026-11", barra: 3240, linha: 21411 },
        { ref: "2026-12", barra: -980, linha: 20431 },
        { ref: "2027-01", barra: 3420, linha: 23851 },
        { ref: "2027-02", barra: 3510, linha: 27361 },
        { ref: "2027-03", barra: 3380, linha: 30741 },
        { ref: "2027-04", barra: 3620, linha: 34361 },
        { ref: "2027-05", barra: 3450, linha: 37811 },
        { ref: "2027-06", barra: 3690, linha: 41501 },
        { ref: "2027-07", barra: 3760, linha: 45261 },
        { ref: "2027-08", barra: 3586, linha: 48847 },
      ]}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   OS DOIS DESENHOS NOVOS
   ══════════════════════════════════════════════════════════════════════════

   ⚠️ ELES NÃO ANIMAM, E É DE PROPÓSITO. As três peças acima sobem de zero
   quando entram na tela porque vêm de `pecas.tsx`, que é o vocabulário do
   painel. Estas duas são SVG parado: sem estado, sem efeito, sem `useRef` —
   o que quer dizer que não têm nada a fazer com `prefers-reduced-motion` (não
   há movimento a reduzir) e que podem ser movidas para um arquivo de servidor
   sem tocar numa linha, se um dia a landing quiser cortar a hidratação.
   Ficaram AQUI, e não num arquivo novo, porque um segundo arquivo de gráficos
   seria um segundo lugar para a régua, a escada de cor e os números da conta
   de demonstração divergirem — que é o defeito que este arquivo já existe para
   evitar. A `SETEMBRO` acima é lida pelas duas roscas, e essa é a prova. */

/* ────────────────────────────────────────────── 1. A dívida até zerar ───── */

/**
 * O saldo devedor caindo mês a mês até acabar, com o mês da quitação nomeado.
 *
 * ── POR QUE ESTE DESENHO É DIFERENTE DE TODOS OS OUTROS DA PÁGINA ──────────
 * O resto da landing MEDE: quanto comprometeu, quanto passou do plano, quanto
 * sobra. Medir é o que todo concorrente faz. Esta é a única peça que mostra o
 * produto entregando ALÍVIO — a linha do horizonte, a data em que a coisa
 * termina. É por isso que ela ganha o mês da quitação escrito por extenso em
 * vez de um eixo com dezoito rótulos: ninguém vai contar as barras.
 *
 * ── DE ONDE SAIU CADA NÚMERO (isto aqui não é uma curva desenhada a olho) ──
 * Da conta de demonstração passada pelo MOTOR DE VERDADE,
 * `simularEstrategia()` de `src/lib/fincash/dividas.ts`, com aporte extra ZERO
 * e a estratégia avalanche. As três dívidas entram no estado exato em que a
 * captura `public/fincash/telas/dividas-desktop.webp` as mostra, e a
 * reconstrução foi conferida contra ela em três números independentes:
 *
 *     saldo total  R$ 15.160,25   → a foto diz "R$ 15.160"
 *     parcelas/mês R$  1.323,97   → a foto diz "R$ 1.323,97 por mês"
 *     juro do mês  R$    700,70   → a foto diz "R$ 700,70 só de juro"
 *
 * O motor devolve 17 meses, `quitouTudo: true` e `dataSaida: "2028-01"`. Os
 * saldos abaixo são o total das três frentes ao fim de cada mês do plano,
 * arredondado ao real.
 *
 * ⚠️ A HONESTIDADE DESTA PEÇA MORA NA LEGENDA, E ELA NÃO PODE SAIR.
 * A mesma captura diz, em letra grande: "No ritmo de hoje não há data de
 * saída: alguma dívida sua não se encerra". As duas frases são verdadeiras ao
 * mesmo tempo, e a diferença entre elas é o produto inteiro. Cada dívida por
 * si não acaba — o rotativo cobra R$ 502,79 de juro e recebe R$ 468,35 de
 * parcela, então cresce sozinho, para sempre. O que o plano faz NÃO É PAGAR
 * MAIS: é não deixar cair o valor pago. Quando o crediário quita em out/2026,
 * os R$ 243,18 dele não voltam para o bolso — rolam para a dívida seguinte, e
 * é só aí que o rotativo começa a diminuir. Mesmo R$ 1.323,97 por mês, do
 * primeiro ao último. Se alguém apagar essa frase da legenda, o desenho passa
 * a prometer que o app quita dívida, que é uma coisa que nenhum app faz.
 */
export function DividaAteZerar() {
  /* O rótulo do eixo vem escrito, e não de `mesCurto`: a primeira coluna é o
     saldo de HOJE, antes da parcela deste mês, e não o fechamento de um mês —
     chamá-la de "set" faria duas colunas diferentes levarem o mesmo nome. */
  const caminho: { rotulo: string; saldo: number }[] = [
    { rotulo: "hoje", saldo: 15160 },
    { rotulo: "set 26", saldo: 14537 },
    { rotulo: "out 26", saldo: 13911 },
    { rotulo: "nov 26", saldo: 13283 },
    { rotulo: "dez 26", saldo: 12620 },
    { rotulo: "jan 27", saldo: 11917 },
    { rotulo: "fev 27", saldo: 11171 },
    { rotulo: "mar 27", saldo: 10376 },
    { rotulo: "abr 27", saldo: 9526 },
    { rotulo: "mai 27", saldo: 8615 },
    { rotulo: "jun 27", saldo: 7635 },
    { rotulo: "jul 27", saldo: 6578 },
    { rotulo: "ago 27", saldo: 5433 },
    { rotulo: "set 27", saldo: 4207 },
    { rotulo: "out 27", saldo: 2958 },
    { rotulo: "nov 27", saldo: 1687 },
    { rotulo: "dez 27", saldo: 393 },
    { rotulo: "jan 28", saldo: 0 },
  ];

  const W = 720;
  const H = 200;
  const n = caminho.length;
  const passo = W / n;
  const larg = passo * 0.56;
  const cx = (i: number) => passo * i + passo / 2;

  /* O teto é o saldo de hoje — um valor que a série ALCANÇA, e não um redondo
     bonito acima dela. Régua que começa onde o dado começa é régua que não
     precisa ser explicada. */
  const teto = caminho[0].saldo;
  const y = (v: number) => H - (v / teto) * H;

  /* ⚠️ ZERO É O CHÃO DO DESENHO, SEMPRE. Numa série de dívida, cortar o eixo
     para "aproveitar melhor a altura" transformaria uma queda de 4% num
     precipício — e aqui a queda verdadeira já é de 100%, então truncar só
     poderia piorar. As três marcas da escala saem da própria série: o saldo de
     hoje, a metade dele (que a série cruza entre jul e ago de 2027) e o zero. */
  const escala = [
    { v: teto, texto: brlInteiro(teto), nota: "hoje" },
    { v: teto / 2, texto: brlInteiro(Math.round(teto / 2)), nota: "metade paga" },
    { v: 0, texto: "R$ 0", nota: "livre" },
  ];

  const iZero = caminho.findIndex((p) => p.saldo === 0);
  const zerou = caminho[iZero];
  /* Percentuais e não pixels: o SVG estica com o contêiner
     (`preserveAspectRatio="none"`), então qualquer coisa posicionada em HTML
     por cima dele tem de andar na mesma régua relativa, senão desencontra fora
     do desktop. */
  const pct = (i: number) => ((i + 0.5) / n) * 100;

  /** Onde o eixo de baixo ganha tique e nome. Cinco, e não dezoito: a dezoito
      rótulos de 12px em 320px de largura nenhum deles é legível.

      ⚠️ E CINCO AINDA SÃO DEMAIS NO CELULAR. A 390px sobram ~340px de régua
      para cinco nomes de até seis caracteres, e eles encostam: o eixo saía
      lendo "hojedez 26 … 27jan 28", que parece defeito de renderização e não
      escala apertada. Os dois marcos do meio de cada metade (índices 4 e 12)
      somem abaixo de `sm` e voltam a partir dali — sobram três, bem separados:
      onde a dívida está hoje, onde ela está no meio do caminho, e o mês em que
      zera. Nenhuma informação se perde: a tabela acessível logo abaixo lista
      os dezoito meses, um a um.

      Esconder com `hidden sm:flex` em vez de cortar o array serve para o
      desktop continuar com os cinco sem um segundo caminho de código. */
  const marcos = [0, 4, 8, 12, iZero];
  const soNoAmplo = new Set([4, 12]);

  return (
    <figure className="w-full">
      <div className="flex items-stretch gap-2">
        {/* ── A escala, em HTML e fora do SVG ──────────────────────────────
            O desenho estica sem manter proporção, e texto dentro dele sairia
            achatado numa largura e esticado na outra. Do lado de fora ele é
            texto de verdade, com o tamanho que o leitor escolheu. */}
        <div
          aria-hidden
          className="relative w-[4.75rem] shrink-0"
          style={{ height: H }}
        >
          {escala.map((m) => (
            <span
              key={m.v}
              className="absolute right-0 flex -translate-y-1/2 flex-col items-end leading-none"
              style={{ top: `${(1 - m.v / teto) * 100}%` }}
            >
              <span className="text-2xs tabular-nums text-muted-foreground">
                {m.texto}
              </span>
              <span className="mt-0.5 whitespace-nowrap text-[0.625rem] uppercase tracking-wide text-muted-foreground/70">
                {m.nota}
              </span>
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: H }}
            role="img"
            aria-label={`Saldo devedor mês a mês, de ${brl(teto)} hoje até zero em ${zerou.rotulo}. Os valores estão na tabela para leitores de tela.`}
          >
            {escala.map((m) => {
              const yl = Math.min(H - 0.5, Math.max(0.5, y(m.v)));
              return (
                <line
                  key={m.v}
                  x1={0}
                  x2={W}
                  y1={yl}
                  y2={yl}
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray={m.v === 0 ? undefined : "3 4"}
                  className={m.v === 0 ? "stroke-primary/40" : "stroke-border"}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {caminho.map((p, i) =>
              p.saldo <= 0 ? null : (
                <rect
                  key={p.rotulo}
                  x={cx(i) - larg / 2}
                  width={larg}
                  y={y(p.saldo)}
                  /* Piso de 2px: a última coluna de pé vale R$ 393 e daria
                     cinco pixels de altura. Coluna que some do desenho é um
                     dado que o gráfico afirma não existir. */
                  height={Math.max(2, H - y(p.saldo))}
                  className="fill-primary"
                />
              ),
            )}

            {/* A marca do fim. ⚠️ TRIÂNGULO, E NÃO UMA COLUNINHA VERDE: a
                coluna de dez/27 já tem cinco pixels de altura, e uma barra de
                altura parecida ao lado dela seria lida como "ainda sobrou um
                pouco". Forma diferente diz "isto não é mais uma barra". */}
            <line
              x1={cx(iZero)}
              x2={cx(iZero)}
              y1={H}
              y2={30}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              className="stroke-success"
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              points={`${cx(iZero) - 9},${H - 18} ${cx(iZero) + 9},${H - 18} ${cx(iZero)},${H - 2}`}
              className="fill-success"
            />
          </svg>

          <span className="absolute right-0 top-0 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-2xs font-semibold leading-tight text-success-strong">
            {zerou.rotulo} · dívida zerada
          </span>

          {/* ── O eixo de baixo: tique e nome no mesmo lugar ─────────────── */}
          <div aria-hidden className="relative mt-1 h-7">
            {marcos.map((i) => (
              <span
                key={i}
                className={`absolute top-0 flex-col ${
                  soNoAmplo.has(i) ? "hidden sm:flex" : "flex"
                } ${
                  i === 0
                    ? "translate-x-0 items-start"
                    : i === iZero
                      ? "-translate-x-full items-end"
                      : "-translate-x-1/2 items-center"
                }`}
                style={{ left: `${pct(i)}%` }}
              >
                <span
                  className={`h-1.5 w-px ${i === iZero ? "bg-success" : "bg-border"}`}
                />
                <span
                  className={`mt-1 whitespace-nowrap text-2xs leading-none ${
                    i === iZero
                      ? "font-semibold text-success-strong"
                      : "text-muted-foreground"
                  }`}
                >
                  {caminho[i].rotulo}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-2xs leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">
          Sem pagar um real a mais.
        </strong>{" "}
        São os mesmos R$ 1.323,97 por mês do começo ao fim. Hoje as três dívidas
        não têm data de saída — o rotativo cobra R$ 502,79 de juro e recebe R$
        468,35 de parcela, então cresce sozinho. O que muda é a ordem: quando o
        crediário quita, em out/2026, a parcela dele não volta para o bolso,
        rola para a próxima dívida — e é aí que o rotativo começa a cair.
      </figcaption>

      <div className="tabela-so-leitor">
        <table>
          <caption>
            Saldo devedor mês a mês no plano de quitação, de {brl(teto)} até
            zero em {zerou.rotulo}, mantendo R$ 1.323,97 por mês.
          </caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Ainda devendo</th>
            </tr>
          </thead>
          <tbody>
            {caminho.map((p) => (
              <tr key={p.rotulo}>
                <th scope="row">{p.rotulo}</th>
                <td>{brl(p.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/* ─────────────────────────────────────────── 2. Para onde foi o mês ────── */

/**
 * A composição de setembro, com a fatia dominante nomeada DENTRO do desenho.
 *
 * ── O QUE ELA FAZ QUE A `OrcamentoPorCategoria` NÃO FAZ ────────────────────
 * As duas leem a mesma `SETEMBRO`, então nunca podem discordar. A diferença é
 * o contrato de leitura: a peça do painel numera dez fatias e manda o olho ir
 * e voltar entre o anel e a lista, dez vezes. Esta responde à pergunta do
 * título sem que ninguém precise fazer esse trajeto — quem olhar dois segundos
 * no celular leva "Moradia, R$ 2.883, 43% do mês" e pode ir embora.
 *
 * ⚠️ USE UMA OU OUTRA, NUNCA AS DUAS NA MESMA PÁGINA. Dois anéis do mesmo
 * dinheiro a uma rolagem de distância não somam informação; subtraem
 * confiança, porque o leitor passa a procurar a diferença entre eles.
 *
 * ── POR QUE O DESTAQUE NÃO É COR ──────────────────────────────────────────
 * A fatia maior é mais GROSSA, cresce para fora do anel e tem o nome preso a
 * ela por uma linha. Nenhuma das três coisas depende de enxergar matiz, e as
 * três sobrevivem em escala de cinza e em impressão preto e branco. A escada
 * de luminosidade continua embaixo como ORDEM (mais escuro = maior), nunca
 * como identidade: toda fatia é nomeada por escrito na lista.
 *
 * ── O QUE ESTE DESENHO SE RECUSA A DIZER ──────────────────────────────────
 * Que 43% em moradia é demais. Não é dele essa conta — a régua para isso é a
 * renda, e ela está no velocímetro da seção anterior. Aqui é composição, e
 * composição não julga.
 */
export function ParaOndeFoiOMes() {
  /* ⚠️ A CAIXA TEM FOLGA À DIREITA DE PROPÓSITO: o rótulo da fatia dominante
     vive FORA do anel, e uma `viewBox` justa no círculo cortaria a palavra
     mais importante do desenho. Anel até x≈228; rótulo de 252 a ~390. */
  const VB_W = 400;
  const VB_H = 250;
  const cx = 118;
  const cy = 125;
  const r = 84;
  const esp = 26;

  /* A dominante engorda só PARA FORA. Engordar para os dois lados comeria o
     furo, e é no furo que mora o total — o número que amarra esta peça ao
     velocímetro e à captura. */
  const espMaior = 40;
  const rMaior = r + (espMaior - esp) / 2;

  const total = TOTAL_SETEMBRO;

  let acumulado = 0;
  const arcos = SETEMBRO.map((c, i) => {
    const frac = c.valor / total;
    const inicio = acumulado;
    acumulado += frac;
    const maior = i === 0;
    const raio = maior ? rMaior : r;
    const v = 2 * Math.PI * raio;
    return {
      ...c,
      frac,
      maior,
      raio,
      espessura: maior ? espMaior : esp,
      cor: degrau(i, SETEMBRO.length),
      /* 1px de vão entre fatias: sem ele, dois degraus vizinhos da escada lêem
         como uma fatia só, que é justamente o que a escada não pode fazer. */
      dash: `${Math.max(0, v * frac - 1)} ${v}`,
      offset: -v * inicio,
      meio: inicio + frac / 2,
    };
  });

  const alvo = arcos[0];
  /* O anel começa às 12h e anda no sentido horário (é o `rotate(-90)` do
     grupo), então o meio da fatia em radianos é a volta menos um quarto. */
  const ang = alvo.meio * 2 * Math.PI - Math.PI / 2;
  const px = cx + Math.cos(ang) * (rMaior + espMaior / 2);
  const py = cy + Math.sin(ang) * (rMaior + espMaior / 2);
  const xRotulo = 252;

  const pct = (f: number) => Math.round(f * 100);

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        /* ⚠️ O TETO DE LARGURA NÃO É ESTÉTICA. O texto do furo é dimensionado
           em unidades da `viewBox`, então ele cresce junto com a caixa: numa
           coluna de 720px o total virava um número de 47px que atravessava o
           anel dos dois lados. Travado em 28rem, a escala fica entre 0,9× (no
           celular) e 1,12×, que é a faixa em que o desenho foi conferido. */
        className="mx-auto h-auto w-full max-w-[28rem]"
        role="img"
        aria-label={`Composição de setembro por categoria, total ${brl(total)}. A maior fatia é ${alvo.nome}, com ${brl(alvo.valor)}, ${pct(alvo.frac)} por cento do mês. As dez categorias estão na lista abaixo.`}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={esp}
            className="stroke-border"
          />
          {arcos.map((a) => (
            <circle
              key={a.id}
              cx={cx}
              cy={cy}
              r={a.raio}
              fill="none"
              strokeWidth={a.espessura}
              stroke={a.cor}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
            />
          ))}
        </g>

        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-primary font-display font-semibold tabular-nums"
          style={{ fontSize: 26 }}
        >
          {brlInteiro(total)}
        </text>
        {/* ⚠️ "em setembro", e não "até aqui, em setembro": a frase comprida
            media 155 unidades num furo de 142 e ia parar em cima do arco navy
            da Moradia — cinza escuro sobre azul escuro, ilegível justamente no
            único ponto do desenho em que o texto não tem para onde fugir. O
            recorte parcial do mês continua dito, por extenso, na legenda. */}
        <text
          x={cx}
          y={cy + 21}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 14 }}
        >
          em setembro
        </text>

        {/* A linha que prende o nome à fatia. Sem ela o rótulo seria só um
            texto ao lado de um anel, e caberia a quem lê adivinhar de qual
            das dez fatias ele está falando. */}
        <path
          d={`M ${px} ${py} L ${xRotulo - 10} ${py}`}
          fill="none"
          strokeWidth={1.5}
          className="stroke-primary/45"
        />
        <circle cx={px} cy={py} r={3} className="fill-primary" />

        <text
          x={xRotulo}
          y={py - 20}
          className="fill-foreground font-semibold"
          style={{ fontSize: 17 }}
        >
          {alvo.nome}
        </text>
        <text
          x={xRotulo}
          y={py + 6}
          className="fill-primary font-display font-semibold tabular-nums"
          style={{ fontSize: 24 }}
        >
          {brlInteiro(alvo.valor)}
        </text>
        <text
          x={xRotulo}
          y={py + 26}
          className="fill-muted-foreground tabular-nums"
          style={{ fontSize: 13 }}
        >
          {pct(alvo.frac)}% de tudo que saiu
        </text>
      </svg>

      {/* ── As dez, por escrito ──────────────────────────────────────────────
          Uma lista, e não uma legenda de cores: cada linha se explica sozinha
          com nome, valor e participação, e a barrinha repete a participação em
          desenho. A cor da barra é a mesma da fatia, mas não carrega nada que
          o texto ao lado já não diga. */}
      <ol className="mt-3 space-y-1">
        {arcos.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-2xs">
            <span
              className={`min-w-0 flex-1 truncate ${
                a.maior ? "font-semibold text-foreground" : "text-foreground/80"
              }`}
            >
              {a.nome}
            </span>
            <span
              aria-hidden
              className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-gelo sm:w-24"
            >
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(3, a.frac * 100)}%`, background: a.cor }}
              />
            </span>
            <span className="w-[4.25rem] shrink-0 text-right tabular-nums text-muted-foreground">
              {brlInteiro(a.valor)}
            </span>
            <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-primary">
              {pct(a.frac)}%
            </span>
          </li>
        ))}
      </ol>

      <figcaption className="mt-3 text-2xs leading-relaxed text-muted-foreground">
        Setembro de 2026 na conta de demonstração, no mesmo recorte da tela de
        Orçamento: o mês ainda está pela metade, por isso Mercado aparece abaixo
        da média dele. Os R$ 600 de Investimento são a transferência para a
        reserva — dinheiro que saiu da conta corrente, e por isso conta aqui.
      </figcaption>
    </figure>
  );
}
