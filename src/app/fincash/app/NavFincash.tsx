"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Database,
  Flag,
  Home,
  LayoutDashboard,
  LineChart,
  ListPlus,
  LogOut,
  MessageCircle,
  Tags,
  MoreHorizontal,
  PiggyBank,
  Repeat,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";

import { usarFecharFora } from "@/lib/usarFecharFora";
import { SEM_AVISOS, type AvisosDoMenu } from "./avisos";

/**
 * O menu do FINCASH.
 *
 * NÃO é a trilha do Planejamento. Lá a barra mostra uma sequência com
 * progresso e tique, porque a pessoa percorre as seis etapas uma vez. Aqui são
 * telas que ela visita todo dia, em qualquer ordem, e nenhuma se "conclui" —
 * barra de progresso aqui seria mentira.
 *
 * Ícone de traço, e não emblema 3D: o emblema é da trilha, que é percorrida
 * uma vez e merece o peso. Um menu de uso diário com dez emblemas 3D vira
 * carnaval na terceira visita.
 *
 * DE FITA NO TOPO PARA TRILHO NA LATERAL
 * A fita horizontal do cabeçalho saiu. Dez telas numa faixa só rendiam itens
 * espremidos com rolagem lateral — e menu que rola é menu que esconde. Na
 * vertical sobra altura para as dez de uma vez, com rótulo inteiro, e a
 * navegação para de disputar a faixa mais valiosa da tela: o topo, onde moram
 * o mês e o botão de lançar.
 *
 * SÃO DOIS COMPONENTES, e não um com duas metades, pelo mesmo motivo de
 * sempre: o cabeçalho do app tem `backdrop-blur`, e um ancestral com filtro
 * vira bloco de contenção — `position: fixed` lá dentro se ancora no
 * cabeçalho, não na janela. Por isso NADA de fixo mora dentro do cabeçalho: o
 * trilho e a barra do polegar são montados na raiz do layout.
 *
 * OS GRUPOS SOBREVIVEM — mas agora são TRÊS.
 * Eles nasceram de falta de espaço horizontal: dez itens não cabiam numa grade
 * de cinco colunas do polegar. Na vertical o espaço existe, então o "Mais"
 * some do computador e as catorze ficam visíveis. O que fica é o AGRUPAMENTO,
 * explícito, com rótulo de seção. A divisão nunca foi por importância, é por
 * FREQUÊNCIA, e dizer isso em voz alta ajuda mais que o traço mudo de antes: a
 * pessoa entende por que Projeção mora longe do Painel.
 *
 * O terceiro grupo saiu de dentro do segundo porque nove itens seguidos sob um
 * rótulo só voltavam a ser o que o rótulo tinha vindo resolver: uma coluna
 * uniforme. A régua continua sendo frequência — diário, eventual, raro —, e o
 * corte cai onde ela muda de natureza: WhatsApp, a ponte do Planejamento, os
 * dados e as categorias são CANOS E AJUSTES, coisas que se configuram uma vez
 * e depois só se visita quando algo precisa mudar. No celular a divisão
 * continua fazendo o trabalho original — lá o espaço segue sendo o problema —,
 * e os dois grupos de baixo se juntam de novo atrás do "Mais".
 */
type Secao = "dia" | "quando-precisa" | "canos";

type Tela = {
  href: string;
  rotulo: string;
  /** O nome curto da barra do rodapé — no celular não cabe "Lançamentos". */
  curto?: string;
  Icone: typeof LayoutDashboard;
  /** O Painel é prefixo de todas as outras rotas: sem isto, ele ficaria
      aceso em todas as telas. */
  exato?: boolean;
  /** `dia` vai para o polegar; as outras duas vivem atrás do "Mais". */
  secao: Secao;
  /** Qual contador de `avisos.ts` acende aqui. Só existe em tela onde o
      número é ACIONÁVEL: dizer "3" em Projeção não sugere gesto nenhum. */
  aviso?: keyof AvisosDoMenu;
};

const TELAS: Tela[] = [
  {
    href: "/fincash/app",
    rotulo: "Painel",
    Icone: LayoutDashboard,
    exato: true,
    secao: "dia",
  },
  {
    href: "/fincash/app/lancamentos",
    rotulo: "Lançamentos",
    curto: "Lançar",
    Icone: ListPlus,
    secao: "dia",
    aviso: "vencidos",
  },
  {
    href: "/fincash/app/faturas",
    rotulo: "Cartões",
    Icone: CreditCard,
    secao: "dia",
    aviso: "faturasVencidas",
  },
  {
    href: "/fincash/app/orcamento",
    rotulo: "Orçamento",
    curto: "Orça",
    Icone: Target,
    secao: "dia",
  },
  {
    /* Importar mora no dia a dia porque extrato se importa toda semana, e é
       justamente o atalho que evita digitar lançamento a lançamento. */
    href: "/fincash/app/importar",
    rotulo: "Importar",
    Icone: Upload,
    secao: "dia",
  },
  {
    href: "/fincash/app/fixas",
    rotulo: "Contas fixas",
    curto: "Fixas",
    Icone: Repeat,
    secao: "quando-precisa",
  },
  {
    href: "/fincash/app/contas",
    rotulo: "Contas",
    Icone: PiggyBank,
    secao: "quando-precisa",
  },
  {
    /* Dívidas vem ANTES de Metas de propósito: quem tem as duas coisas precisa
       ver primeiro o que drena, e só depois o que constrói. Guardar dívida no
       fim da lista, como o concorrente faz ao tratá-la como indicador solto, é
       a mesma escolha editorial de fingir que ela não é o problema central. */
    href: "/fincash/app/dividas",
    rotulo: "Dívidas",
    Icone: TrendingDown,
    secao: "quando-precisa",
  },
  {
    href: "/fincash/app/metas",
    rotulo: "Metas",
    Icone: Flag,
    secao: "quando-precisa",
  },
  {
    href: "/fincash/app/investimentos",
    rotulo: "Investimentos",
    curto: "Investir",
    Icone: TrendingUp,
    secao: "quando-precisa",
  },
  {
    href: "/fincash/app/projecao",
    rotulo: "Projeção",
    Icone: LineChart,
    secao: "quando-precisa",
  },
  {
    href: "/fincash/app/whatsapp",
    rotulo: "WhatsApp",
    Icone: MessageCircle,
    secao: "canos",
  },
  {
    /* A ponte para o Planejamento. Fica perto do fim porque não é gesto
       diário: leva-se um mês fechado de cada vez, e o mês fecha uma vez por
       mês. Mas é o item que liga os dois apps da casa, então não pode ficar
       escondido atrás de "Mais" no celular sem rótulo próprio. */
    href: "/fincash/app/planejamento",
    rotulo: "Levar ao Planejamento",
    curto: "Planejar",
    Icone: ArrowRightLeft,
    secao: "canos",
  },
  {
    /* Exportar e lixeira. Vem antes de Categorias porque "quero meus dados de
       volta" é pedido mais urgente que "quero renomear uma categoria" — e
       porque o botão de exportar é o que prova que o app não prende ninguém. */
    href: "/fincash/app/dados",
    rotulo: "Meus dados",
    curto: "Dados",
    Icone: Database,
    secao: "canos",
  },
  {
    /* Última da lista de propósito: categoria se ajusta uma vez e se esquece.
       Item de configuração no meio da navegação diária rouba a vez de quem a
       pessoa abre todo dia. */
    href: "/fincash/app/categorias",
    rotulo: "Categorias",
    Icone: Tags,
    secao: "canos",
  },
];

/** As três faixas do trilho, na ordem em que aparecem. */
const SECOES = (
  [
    ["dia", "Todo dia"],
    ["quando-precisa", "Quando precisar"],
    ["canos", "Conexões e ajustes"],
  ] as const
).map(([id, titulo]) => ({
  id,
  titulo,
  telas: TELAS.filter((t) => t.secao === id),
}));

const DO_DIA = TELAS.filter((t) => t.secao === "dia");
/** O conteúdo do "Mais" do celular: tudo o que não é do dia, na mesma ordem
    de sempre. As duas seções de baixo voltam a ser uma lista só — a divisão
    delas resolve ritmo numa coluna de 900px, não numa lista de 9 linhas. */
const ATRAS_DO_MAIS = TELAS.filter((t) => t.secao !== "dia");

/** A mesma regra de "estou aqui" nas duas barras. */
function estaAtivo(caminho: string, t: Tela) {
  return t.exato
    ? caminho === t.href
    : caminho === t.href || caminho.startsWith(`${t.href}/`);
}

/* -------------------------------------------------------------- o aviso --

   O CONTADOR SOME QUANDO A PESSOA ESTÁ NA TELA, e só por isso.
   A regra da casa manda o badge apagar na visita. Aqui ele apaga enquanto a
   tela está aberta e volta se a pessoa sair sem resolver — porque o número não
   é notificação, é FATO: a conta continua vencida. Guardar um "já vi" que
   sobrevive à visita transformaria o aviso numa mentira educada, que é
   exatamente o defeito que faz alguém perder juros confiando no app.

   NUNCA SÓ COR: o aviso é um número, isto é, texto. E o número exato entra no
   `aria-label` do item, então o trilho recolhido (76px, onde só cabe a
   pastilha) continua dizendo "Cartões, 1 fatura atrasada" em voz alta.
   ---------------------------------------------------------------------------- */

/**
 * QUANDO O RÓTULO DE SEÇÃO CABE — e por que isto é uma conta, não um gosto.
 *
 * Quinze itens de 32px são 480px de lista. Tire o cabeçalho (49px) e o rodapé
 * (65px) de uma janela de 650px e sobram 536px: são 56px para TODA a
 * estrutura. Três rótulos com o respiro que os faz valer a pena pedem esses
 * mesmos 56px, e ainda faltam os separadores. Não cabe — e "não cabe" aqui
 * significa menu que rola, que é o defeito que este trilho existe para não
 * ter.
 *
 * Então o rótulo aparece onde há altura para ele e vira TRAÇO onde não há: o
 * corte de blocos continua acontecendo nos dois casos, só que um deles é
 * nomeado. É a mesma troca que o trilho estreito já fazia por falta de
 * LARGURA, aplicada agora à falta de ALTURA.
 *
 * Media query e não JavaScript: altura de janela não existe no servidor, e ler
 * `innerHeight` no primeiro render é erro de hidratação garantido. As duas
 * condições vivem numa consulta só — encadear `lg:` com uma variante de altura
 * deixaria dois utilitários de `display` disputando ordem no CSS gerado.
 *
 * ⚠️ E a classe precisa aparecer INTEIRA aqui, montada à mão em vez de colada
 * no JSX a partir de pedaços. O Tailwind gera CSS para o que ele LÊ no
 * código-fonte; uma classe que só existe depois que o template literal roda
 * ele nunca vê, e o resultado é uma regra que simplesmente não é emitida —
 * silenciosamente, sem erro nenhum. Custou uma rodada inteira de medição
 * achando que a media query não funcionava.
 */
const CABE_ROTULO =
  "hidden [@media_(min-width:1024px)_and_(min-height:740px)]:block";
const NAO_CABE_ROTULO =
  "[@media_(min-width:1024px)_and_(min-height:740px)]:hidden";

/** Dois dígitos é o teto do que cabe na pastilha de 76px sem virar elipse. */
function curtinho(n: number) {
  return n > 99 ? "99+" : String(n);
}

/** "atrasada", e não "vencida": é a palavra que as telas de Lançamentos e de
    Cartões usam nas próprias pastilhas. Dois nomes para a mesma coisa fazem
    parecer que são duas coisas. */
function comoSeFala(chave: keyof AvisosDoMenu, n: number) {
  if (chave === "faturasVencidas") {
    return n === 1 ? "1 fatura atrasada" : `${n} faturas atrasadas`;
  }
  return n === 1 ? "1 conta atrasada" : `${n} contas atrasadas`;
}

/** Âmbar com o número em navy: 5,72:1 medido, e o mesmo par invertido (o âmbar
    sobre o navy do trilho) dá os mesmos 5,72:1 de separação da pastilha contra
    o fundo — passa nos dois papéis com uma cor só.
    Laranja está fora — neste app laranja é AÇÃO, e o aviso não é botão. */
const PASTILHA =
  "h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold leading-none text-primary tabular-nums";

/* ------------------------------------------------------------------ trilho --

   TRÊS FAIXAS DE TELA, TRÊS DECISÕES

   Abaixo de 768px (celular): trilho lateral não cabe — comeria um quinto de
   uma tela de 390px, justamente onde as tabelas já sofrem. Fica a barra do
   polegar, que continua sendo a resposta certa: quem usa este app usa em pé,
   com uma mão, e o alto da tela é onde o polegar não chega. Gaveta deslizante
   custaria dois toques (abrir, escolher) para trocar de tela; a barra custa
   um. Não se troca um toque por uma animação.

   768–1023px (tablet, ou janela em meia tela): o trilho aparece, mas SEMPRE
   estreito, só ícones. É o vão onde layout de app quebra: 256px de lateral
   sobre 768px deixariam 512px de conteúdo, e as tabelas de Faturas e Projeção
   passariam a rolar de lado. 76px cobram 10% da largura e devolvem navegação
   permanente. Aqui não há botão de recolher — não há o que recolher, e botão
   que não muda nada é pior que botão nenhum.

   1024px para cima: trilho com rótulo, recolhível, escolha lembrada.

   As duas larguras saem de classes (`md:` e `lg:`), não de media query em
   JavaScript: assim o servidor já manda o HTML certo e não há salto na
   primeira pintura. O único estado real é o recolher, e ele só existe no `lg`.
   ---------------------------------------------------------------------------- */

export function BarraLateralFincash({
  nome,
  avisos = SEM_AVISOS,
  recolhida,
  aoAlternar,
  sair,
}: {
  nome?: string;
  /** Vem do layout, que é servidor e já tem a sessão. Ver `avisos.ts`. */
  avisos?: AvisosDoMenu;
  recolhida: boolean;
  aoAlternar: () => void;
  /** Server action vinda do layout: a saída não pode virar `fetch` à mão. */
  sair: () => Promise<void>;
}) {
  const caminho = usePathname();

  /* Rótulo só existe quando há largura E a pessoa não recolheu. Em `md` ele
     nunca aparece — por isso `hidden lg:inline`, e não só `inline`. */
  const classeRotulo = recolhida ? "hidden" : "hidden lg:inline";
  /** O par de `classeRotulo`: visível justamente quando o rótulo não cabe. */
  const soEstreito = recolhida ? "flex" : "flex lg:hidden";
  /** E o inverso, para quem precisa ser `flex` e não `inline`. Repare que
      NENHUM destes acumula dois utilitários de `display` na mesma classe: dois
      valores de `display` num elemento só resolvem por ordem no CSS gerado, e
      quem depende dessa ordem quebra na primeira vez que o Tailwind reordena
      a folha. */
  const soLargo = recolhida ? "hidden" : "hidden lg:flex";
  /* Recolhido o item centraliza sempre; expandido, só até `lg`, porque abaixo
     disso o trilho ainda é a versão estreita. */
  const classeAlinha = recolhida
    ? "justify-center"
    : "justify-center lg:justify-start";

  /* O anel de foco vale para item, rodapé e botão: 2px de ciano com 2px de
     folga na cor do trilho. Ciano dá 3,47:1 contra o navy E 3,43:1 contra o
     branco do item aceso — é a única cor da paleta que passa nos DOIS fundos,
     e por isso o anel não precisa mudar de cor conforme o estado. A folga
     (`ring-offset`) cabe: o anel cresce 4px e a lista tem 8px de respiro
     lateral, então nada é cortado pela borda do trilho. */
  const anel =
    "outline-none focus-visible:ring-2 focus-visible:ring-ciano focus-visible:ring-offset-2 focus-visible:ring-offset-primary";

  /* `active:` é só COR, nunca transform. Afundar 2% é o gesto certo num card
     que ocupa meia tela; numa linha de 32px o mesmo 2% lê como tremida — e
     movimento aqui ainda teria de ser desfeito no `prefers-reduced-motion`.
     Clarear o fundo resolve os dois casos sem nenhuma exceção. */
  /* 28px, e não os 32px dos itens de navegação: o rodapé não é destino de uso
     diário, a linha inteira continua clicável (é o alvo real, não o texto) e
     os 8px devolvidos são o que dá folga real para a lista na janela de
     650px — a mesma lógica de "altura se ganha tirando linha, não espremendo
     item", aplicada agora às linhas que menos cobram por isso. */
  const classeRodape = `flex min-h-7 w-full items-center gap-3 rounded-lg px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25 motion-reduce:transition-none ${anel} ${classeAlinha}`;

  function Item({ t }: { t: Tela }) {
    const ativo = estaAtivo(caminho, t);
    const n = t.aviso && !ativo ? avisos[t.aviso] : 0;
    const dito = n > 0 && t.aviso ? `, ${comoSeFala(t.aviso, n)}` : "";

    return (
      <li>
        <Link
          href={t.href}
          /* `title` e `aria-label` sempre, e não só quando recolhido:
             em `md` o trilho é estreito por definição, e o ícone de
             Projeção contra o de Investimentos é adivinhação. */
          title={`${t.rotulo}${dito}`}
          aria-label={`${t.rotulo}${dito}`}
          aria-current={ativo ? "page" : undefined}
          className={`relative flex min-h-8 items-center gap-3 rounded-lg px-3 py-1 text-sm font-medium transition-colors motion-reduce:transition-none ${anel} ${classeAlinha} ${
            ativo
              ? "bg-white text-primary shadow-[0_8px_20px_-10px_hsl(215_60%_8%_/_0.8)] active:bg-white/85"
              : "text-white/75 hover:bg-white/15 hover:text-white active:bg-white/25"
          }`}
        >
          {/* Traço ciano à esquerda do item aceso. O fundo navy já
              grita — mas num trilho só de ícones, uma pastilha escura
              é COR, e cor sozinha não é estado. Forma, sempre. */}
          {ativo && (
            <span
              aria-hidden
              className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-ciano"
            />
          )}
          {/* O ícone é `relative` porque a pastilha do estreito se pendura
              nele: no trilho de 76px não existe "ponta direita da linha" onde
              encostar o número sem encostar na borda. */}
          <span className="relative shrink-0">
            {/* Ícone em ciano quando apagado: é a cor de "informação" da
                casa. Aceso, o item é navy sólido e o ícone some dentro
                dele — como tem de ser. */}
            <t.Icone
              className={`h-[18px] w-[18px] ${ativo ? "" : "text-ciano-claro"}`}
              strokeWidth={2}
            />
            {n > 0 && (
              <span
                aria-hidden
                className={`absolute -right-3 -top-2 ${soEstreito} ${PASTILHA}`}
              >
                {curtinho(n)}
              </span>
            )}
          </span>
          <span className={`${classeRotulo} min-w-0 flex-1 truncate`}>
            {t.rotulo}
          </span>
          {n > 0 && (
            <span aria-hidden className={`${soLargo} ${PASTILHA}`}>
              {curtinho(n)}
            </span>
          )}
        </Link>
      </li>
    );
  }

  function Bloco({
    titulo,
    telas,
    primeira,
  }: {
    titulo: string;
    telas: Tela[];
    primeira: boolean;
  }) {
    return (
      <li className="shrink-0">
        {/* O rótulo da seção é texto quando há largura e vira um traço quando
            não há: o agrupamento continua legível sem inventar letrinha de 8px
            que ninguém lê. Os dois são decorativos — quem usa leitor de tela
            recebe o nome do grupo pelo `aria-label` da lista abaixo.

            `white/60` e não `white/45`: o antigo dava 3,8:1 num texto de 10px,
            que é reprovação direta no mínimo de 4,5:1. Este dá 5,34:1 — passa
            com folga e continua abaixo dos 7,4:1 dos itens, que é o que
            mantém o rótulo como legenda em vez de concorrente. */}
        <p
          aria-hidden
          className={`mb-0.5 px-3 text-[10px] font-semibold uppercase leading-[14px] tracking-[0.14em] text-white/60 ${
            primeira ? "mt-0" : "mt-1"
          } ${recolhida ? "hidden" : CABE_ROTULO}`}
        >
          {titulo}
        </p>
        {/* O traço é o rótulo de quem não tem espaço para rótulo — e é o
            mesmo desenho que o trilho estreito já usava. Só ENTRE blocos: em
            cima do primeiro item ele duplicaria a borda do cabeçalho, que
            está a 1px dali. */}
        {!primeira && (
          <hr
            aria-hidden
            /* `my-0.5` e não mais: o respiro entre blocos é trabalho do
               espaçador elástico logo acima, que cresce quando há janela. Dar
               margem grande ao traço também seria gastar altura fixa
               justamente na janela baixa, que é onde ela falta. */
            className={`mx-auto my-0.5 w-7 border-white/20 ${recolhida ? "" : NAO_CABE_ROTULO}`}
          />
        )}

        <ul aria-label={titulo} className="flex flex-col">
          {telas.map((t) => (
            <Item key={t.href} t={t} />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <aside
      /* Sem `backdrop-blur` de propósito: a lateral é a moldura fixa do app, e
         moldura translúcida fica suja quando o conteúdo rola por trás dela. */
      className={`nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-white/10 bg-primary md:flex ${
        recolhida ? "" : "lg:w-64"
      }`}
    >
      {/* ------------------------------------------------- marca e recolher -- */}
      {/* Os dois na MESMA linha, e não em duas.

          A marca da NOVARE volta porque ela sumiu junto com o cabeçalho
          horizontal, e o Hub abriga vários apps na mesma casca: sem ela, o
          FINCASH parecia um produto solto de outra empresa. A hierarquia é a
          da casa — Novare primeiro, produto depois.

          E juntar o recolher aqui devolve os ~42px que a linha própria dele
          custava. Era exatamente o que faltava para as catorze telas nunca
          rolarem, inclusive em janela baixa. Altura ganha tirando linha, não
          espremendo item. */}
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        {/* O lockup inteiro desaparece quando a pessoa recolhe, e é o conserto
            de um estouro real: em 76px o emblema (28px) mais o botão (36px)
            mais os respiros pediam 96px de uma linha que tem 76, e os dois se
            atropelavam. Some o lockup, e não o botão, porque quem acabou de
            recolher o menu sabe em que app está — a identidade só é
            indispensável em `md`, onde o trilho é estreito por imposição da
            largura e NÃO por escolha de ninguém. Lá o emblema fica. */}
        <Link
          href="/fincash/app"
          aria-label="FINCASH, da Novare. Ir para o painel"
          className={`${recolhida ? "hidden" : "flex"} min-w-0 flex-1 items-center gap-2 rounded-lg ${anel} ${classeAlinha}`}
        >
          {/* A marca da casa em branco: o arquivo é escuro, e sobre o navy do
              trilho ele sumiria. `brightness-0 invert` vira branco puro sem
              precisar de um segundo arquivo para manter em sincronia. */}
          <Image
            src="/marca/logo-novare.png"
            alt=""
            width={96}
            height={24}
            aria-hidden
            className={`${classeRotulo} h-5 w-auto shrink-0 brightness-0 invert`}
          />
          <span
            aria-hidden
            className={`${classeRotulo} h-3.5 w-px shrink-0 bg-white/25`}
          />
          <span
            className={`${classeRotulo} font-display text-[13px] font-semibold tracking-[0.1em] text-white`}
          >
            FINCASH
          </span>
          {/* O emblema do produto aparece só no trilho estreito de `md`.
              Expandido, "NOVARE | FINCASH" já identifica tudo, e o emblema a
              mais era justamente o que espremia a palavra até ela truncar em
              "FINCA...". */}
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/20 lg:hidden"
          >
            <Wallet className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
        </Link>

        {/* O recolher só existe a partir de `lg`: abaixo disso o trilho já está
            na largura mínima e o botão não teria efeito.

            Ele mora no ALTO, e não no pé do trilho, porque o pé da janela é
            território do aviso de cookies — uma faixa `fixed` de largura
            inteira, do Hub todo, que cobre o rodapé da lateral enquanto não for
            aceita. Alto também é onde a mão já está: quem acabou de clicar na
            marca não atravessa a tela para encolher o menu. */}
        <button
          type="button"
          onClick={aoAlternar}
          aria-pressed={recolhida}
          title={recolhida ? "Expandir o menu" : "Recolher o menu"}
          aria-label={recolhida ? "Expandir o menu" : "Recolher o menu"}
          className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25 motion-reduce:transition-none lg:inline-flex ${anel} ${
            recolhida ? "mx-auto" : ""
          }`}
        >
          {recolhida ? (
            <ChevronsRight className="h-[18px] w-[18px]" strokeWidth={2} />
          ) : (
            <ChevronsLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* ------------------------------------------------------- as telas --
          O VÃO ABAIXO DO ÚLTIMO ITEM É DE PROPÓSITO, e a conta é esta: as
          catorze linhas pedem ~575px, e num monitor de 900px sobram mais de
          300. Encher isso com um resumo do mês seria criar um segundo lugar
          onde o mesmo número aparece — e dois números iguais em telas
          diferentes é como um app de dinheiro passa a se contradizer. O vão
          fica, e é ele que faz o rodapé ler como rodapé em vez de "o item
          seguinte da lista".

          O QUE NÃO FICA PARADO É O RESPIRO ENTRE OS BLOCOS. Os separadores
          crescem com a janela e encolhem com ela (`flex-1` com teto e piso):
          em 900px os três grupos se afastam e leem como blocos; em 650px eles
          se encostam de volta no mínimo e a lista continua cabendo sem rolar.
          Espaço elástico é o que deixa o mesmo menu certo nas duas janelas sem
          media query nenhuma. */}
      <nav
        aria-label="Telas do FINCASH"
        /* `pb-2` e não `py`: o respiro de baixo é fixo para o último item
           nunca encostar na borda do rodapé, e é o único pedaço deste vão que
           não é elástico. */
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 pt-0.5"
      >
        <ul className="flex min-h-0 flex-1 flex-col">
          {SECOES.map((s, i) => (
            <Fragment key={s.id}>
              {/* O respiro elástico: piso de 4px para a lista nunca rolar na
                  janela baixa, teto de 28px para o menu não virar cartaz na
                  janela alta. O que sobra além do teto fica embaixo do último
                  item, que é onde vão morto não atrapalha ninguém. */}
              {i > 0 && <li aria-hidden className="max-h-7 flex-1" />}
              <Bloco titulo={s.titulo} telas={s.telas} primeira={i === 0} />
            </Fragment>
          ))}
        </ul>
      </nav>

      {/* -------------------------------------------------------- o rodapé --
          A conta e a porta de saída moravam no cabeçalho. Com o cabeçalho
          reduzido ao celular, elas descem para cá — que é onde se espera
          achá-las num app de trilho lateral: longe dos itens de navegação,
          para ninguém sair da conta mirando o "WhatsApp". */}
      <div className="shrink-0 border-t border-white/10 px-2 py-0.5">
        <Link
          href="/"
          title="Voltar ao Workspace"
          aria-label="Voltar ao Workspace"
          className={classeRodape}
        >
          {/* Casinha, e não a seta dupla que estava aqui: o botão de recolher,
              no alto do mesmo trilho, já é uma seta dupla apontando para a
              esquerda. Dois «« na mesma coluna fazendo coisas diferentes é
              como um menu ensina a pessoa a clicar errado — e no trilho
              estreito, onde só sobra o ícone, os dois eram idênticos. */}
          <Home
            className="h-[18px] w-[18px] shrink-0 text-ciano-claro"
            strokeWidth={2}
          />
          <span className={`${classeRotulo} truncate`}>Voltar ao Workspace</span>
        </Link>

        <form action={sair}>
          <button
            type="submit"
            title={nome ? `Sair da conta de ${nome}` : "Sair"}
            aria-label={nome ? `Sair da conta de ${nome}` : "Sair"}
            className={classeRodape}
          >
            <LogOut
              className="h-[18px] w-[18px] shrink-0 text-ciano-claro"
              strokeWidth={2}
            />
            {/* Expandido, o nome vem junto: é o que transforma um botão
                genérico em "esta é a SUA conta". */}
            <span className={`${classeRotulo} truncate`}>
              {nome ? `Sair · ${nome}` : "Sair"}
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}

/** A barra do polegar — vai no fim do layout, fora do cabeçalho.
    Vale até 767px agora (era 639px): entre 640 e 767 ainda é celular deitado
    ou janela estreita, onde um trilho lateral roubaria largura demais. */
export function NavFincashCelular({
  avisos = SEM_AVISOS,
}: {
  avisos?: AvisosDoMenu;
}) {
  const caminho = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const fechar = useCallback(() => setMaisAberto(false), []);
  const area = usarFecharFora<HTMLLIElement>(maisAberto, fechar);

  /* Navegou, fecha. Sem isto o painel fica aberto por cima da tela nova —
     e como a barra é `fixed`, ele cobriria justamente o conteúdo que a
     pessoa acabou de pedir. */
  useEffect(() => {
    setMaisAberto(false);
  }, [caminho]);

  /* "Mais" aceso quando a tela atual mora lá dentro: a pessoa precisa
     conseguir responder "onde eu estou?" olhando só para a barra. */
  const algumDentroAtivo = ATRAS_DO_MAIS.some((t) => estaAtivo(caminho, t));

  return (
    <nav
      aria-label="Telas do FINCASH"
      className="nao-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur-md md:hidden"
      /* A faixa do gesto de voltar do iPhone come 34px do rodapé: sem isto,
           o último item fica embaixo da barrinha do sistema. */
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-5">
        {DO_DIA.map((t) => {
          const ativo = estaAtivo(caminho, t);
          const n = t.aviso && !ativo ? avisos[t.aviso] : 0;
          const dito = n > 0 && t.aviso ? `, ${comoSeFala(t.aviso, n)}` : "";

          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={ativo ? "page" : undefined}
                /* `aria-label` só quando há aviso: sem ele o rótulo visível já
                   diz tudo, e um rótulo acessível que repete o texto da tela é
                   ruído para quem navega por voz. */
                aria-label={n > 0 ? `${t.rotulo}${dito}` : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors active:bg-primary/[0.06] motion-reduce:transition-none ${
                  ativo ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {/* Um risco navy encostado no topo da barra marca a tela
                    atual. A pastilha atrás do ícone sozinha comunica por COR,
                    e cor sozinha não é estado — quem não a distingue ficava
                    sem saber onde está. O risco é forma, e forma todo mundo
                    vê. */}
                {ativo && (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-primary"
                  />
                )}
                <span
                  className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
                    ativo ? "bg-primary/[0.08]" : ""
                  }`}
                >
                  <t.Icone
                    className={`h-[18px] w-[18px] ${ativo ? "text-primary" : "text-ciano"}`}
                    strokeWidth={ativo ? 2.4 : 2}
                  />
                  {/* Aqui a pastilha é a mesma do trilho, e é âmbar sobre
                      BRANCO — 1,9:1, que não passaria se ela fosse texto
                      solto. Não é: o número dentro dela é navy sobre âmbar
                      (5,57:1), e a pastilha ganha um contorno branco para não
                      encostar no ícone. */}
                  {n > 0 && (
                    <span
                      aria-hidden
                      className={`absolute -right-0.5 -top-1 flex ring-2 ring-white ${PASTILHA}`}
                    >
                      {curtinho(n)}
                    </span>
                  )}
                </span>
                <span className="truncate">{t.curto ?? t.rotulo}</span>
              </Link>
            </li>
          );
        })}

        <li ref={area} className="relative">
          <button
            type="button"
            onClick={() => setMaisAberto((v) => !v)}
            aria-expanded={maisAberto}
            aria-haspopup="true"
            className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors active:bg-primary/[0.06] motion-reduce:transition-none ${
              maisAberto || algumDentroAtivo
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
                maisAberto || algumDentroAtivo ? "bg-primary/[0.08]" : ""
              }`}
            >
              <MoreHorizontal
                className={`h-[18px] w-[18px] ${
                  maisAberto || algumDentroAtivo ? "text-primary" : "text-ciano"
                }`}
                strokeWidth={maisAberto || algumDentroAtivo ? 2.4 : 2}
              />
            </span>
            <span className="truncate">Mais</span>
          </button>

          {maisAberto && (
            <div
              /* Ancorado à DIREITA da barra e subindo: aberto para a esquerda
                 ele sairia da tela, e para baixo ficaria fora dela. */
              className="absolute bottom-full right-0 mb-1 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--fin-sombra-flutua)]"
            >
              <ul className="py-1">
                {ATRAS_DO_MAIS.map((t, i) => {
                  const ativo = estaAtivo(caminho, t);
                  /* Um fio entre "quando precisar" e "conexões e ajustes". É a
                     mesma divisão do trilho, mas sem os dois rótulos: nove
                     linhas de 44px já pedem 400px do celular, e duas legendas
                     a mais empurrariam o topo do painel para fora da tela. Um
                     fio custa 9px e faz o mesmo serviço de ritmo. */
                  const abreBloco =
                    i > 0 && t.secao !== ATRAS_DO_MAIS[i - 1].secao;

                  return (
                    <li
                      key={t.href}
                      className={
                        abreBloco ? "mt-1 border-t border-border pt-1" : ""
                      }
                    >
                      <Link
                        href={t.href}
                        aria-current={ativo ? "page" : undefined}
                        /* 44px de altura: é o alvo de toque mínimo, e um menu
                           que só se abre no celular é o último lugar onde dá
                           para economizar altura. */
                        className={`flex min-h-11 items-center gap-3 px-4 text-sm font-medium transition-colors active:bg-primary/[0.12] motion-reduce:transition-none ${
                          ativo
                            ? "bg-primary/[0.08] text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <t.Icone
                          className={`h-[18px] w-[18px] shrink-0 ${
                            ativo ? "text-primary" : "text-ciano"
                          }`}
                          strokeWidth={2}
                        />
                        {t.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}
