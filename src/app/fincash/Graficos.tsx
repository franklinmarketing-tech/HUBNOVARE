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
  const escada = [
    "hsl(215 50% 20%)",
    "hsl(215 45% 32%)",
    "hsl(215 40% 44%)",
    "hsl(215 34% 56%)",
    "hsl(215 30% 68%)",
    "hsl(215 28% 78%)",
    "hsl(215 26% 86%)",
  ];

  /* Os sete valores somam exatamente os R$ 6.718 da captura ao lado. Mexer em
     um deles sem mexer no total quebra a única coisa que esta peça promete. */
  const gastos: [string, string, number][] = [
    ["moradia", "Moradia", 2400],
    ["mercado", "Mercado", 1180],
    ["fora", "Alimentação fora de casa", 830],
    ["educacao", "Educação", 738],
    ["transporte", "Transporte", 640],
    ["lazer", "Lazer", 520],
    ["saude", "Saúde", 410],
  ];

  return (
    <RoscaComposicao
      formatar={brl}
      /* O furo é estreito, e "R$ 6.718,00" por extenso encosta nas duas
         bordas dele. O total redondo cabe, e os centavos não têm o que fazer
         num número que serve para comparar com a renda. */
      centro="R$ 6.718"
      legendaCentro="em setembro"
      fatias={gastos.map(([id, nome, valor], i) => ({
        id,
        nome,
        valor,
        cor: escada[i],
      }))}
    />
  );
}

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
