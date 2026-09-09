"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Flag,
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
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";

import { usarFecharFora } from "@/lib/usarFecharFora";

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
 * OS DOIS GRUPOS SOBREVIVEM — mas mudam de função.
 * Eles nasceram de falta de espaço horizontal: dez itens não cabiam numa grade
 * de cinco colunas do polegar. Na vertical o espaço existe, então o "Mais"
 * some do computador e as dez ficam visíveis. O que fica é o AGRUPAMENTO,
 * agora explícito, com rótulo de seção — "Todo dia" e "Quando precisar". A
 * divisão nunca foi por importância, é por FREQUÊNCIA, e dizer isso em voz
 * alta ajuda mais que o traço mudo de antes: a pessoa entende por que Projeção
 * mora longe do Painel. No celular a divisão continua fazendo o trabalho
 * original — lá o espaço segue sendo o problema.
 */
type Tela = {
  href: string;
  rotulo: string;
  /** O nome curto da barra do rodapé — no celular não cabe "Lançamentos". */
  curto?: string;
  Icone: typeof LayoutDashboard;
  /** O Painel é prefixo de todas as outras rotas: sem isto, ele ficaria
      aceso em todas as telas. */
  exato?: boolean;
  /** `dia` vai para o polegar; `quando-precisa` vive atrás do "Mais". */
  grupo: "dia" | "quando-precisa";
};

const TELAS: Tela[] = [
  {
    href: "/fincash/app",
    rotulo: "Painel",
    Icone: LayoutDashboard,
    exato: true,
    grupo: "dia",
  },
  {
    href: "/fincash/app/lancamentos",
    rotulo: "Lançamentos",
    curto: "Lançar",
    Icone: ListPlus,
    grupo: "dia",
  },
  {
    href: "/fincash/app/faturas",
    rotulo: "Cartões",
    Icone: CreditCard,
    grupo: "dia",
  },
  {
    href: "/fincash/app/orcamento",
    rotulo: "Orçamento",
    curto: "Orça",
    Icone: Target,
    grupo: "dia",
  },
  {
    /* Importar mora no dia a dia porque extrato se importa toda semana, e é
       justamente o atalho que evita digitar lançamento a lançamento. */
    href: "/fincash/app/importar",
    rotulo: "Importar",
    Icone: Upload,
    grupo: "dia",
  },
  {
    href: "/fincash/app/fixas",
    rotulo: "Contas fixas",
    curto: "Fixas",
    Icone: Repeat,
    grupo: "quando-precisa",
  },
  {
    href: "/fincash/app/contas",
    rotulo: "Contas",
    Icone: PiggyBank,
    grupo: "quando-precisa",
  },
  {
    href: "/fincash/app/metas",
    rotulo: "Metas",
    Icone: Flag,
    grupo: "quando-precisa",
  },
  {
    href: "/fincash/app/investimentos",
    rotulo: "Investimentos",
    curto: "Investir",
    Icone: TrendingUp,
    grupo: "quando-precisa",
  },
  {
    href: "/fincash/app/projecao",
    rotulo: "Projeção",
    Icone: LineChart,
    grupo: "quando-precisa",
  },
  {
    href: "/fincash/app/whatsapp",
    rotulo: "WhatsApp",
    Icone: MessageCircle,
    grupo: "quando-precisa",
  },
  {
    /* Última da lista de propósito: categoria se ajusta uma vez e se esquece.
       Item de configuração no meio da navegação diária rouba a vez de quem a
       pessoa abre todo dia. */
    href: "/fincash/app/categorias",
    rotulo: "Categorias",
    Icone: Tags,
    grupo: "quando-precisa",
  },
];

const DO_DIA = TELAS.filter((t) => t.grupo === "dia");
const QUANDO_PRECISA = TELAS.filter((t) => t.grupo === "quando-precisa");

/** A mesma regra de "estou aqui" nas duas barras. */
function estaAtivo(caminho: string, t: Tela) {
  return t.exato
    ? caminho === t.href
    : caminho === t.href || caminho.startsWith(`${t.href}/`);
}

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
  recolhida,
  aoAlternar,
  sair,
}: {
  nome?: string;
  recolhida: boolean;
  aoAlternar: () => void;
  /** Server action vinda do layout: a saída não pode virar `fetch` à mão. */
  sair: () => Promise<void>;
}) {
  const caminho = usePathname();

  /* Rótulo só existe quando há largura E a pessoa não recolheu. Em `md` ele
     nunca aparece — por isso `hidden lg:inline`, e não só `inline`. */
  const classeRotulo = recolhida ? "hidden" : "hidden lg:inline";
  /* Recolhido o item centraliza sempre; expandido, só até `lg`, porque abaixo
     disso o trilho ainda é a versão estreita. */
  const classeAlinha = recolhida
    ? "justify-center"
    : "justify-center lg:justify-start";
  const classeRodape = `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-gelo hover:text-primary focus-visible:ring-2 focus-visible:ring-ciano motion-reduce:transition-none ${classeAlinha}`;

  function Secao({ titulo, telas }: { titulo: string; telas: Tela[] }) {
    return (
      <li>
        {/* O rótulo da seção é texto quando há largura e vira um traço quando
            não há: o agrupamento continua legível sem inventar letrinha de 8px
            que ninguém lê. Os dois são decorativos — quem usa leitor de tela
            recebe o nome do grupo pelo `aria-label` da lista abaixo. */}
        <p
          aria-hidden
          className={`mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground ${
            recolhida ? "hidden" : "hidden lg:block"
          }`}
        >
          {titulo}
        </p>
        <hr
          aria-hidden
          className={`mx-auto my-2 w-8 border-border ${recolhida ? "" : "lg:hidden"}`}
        />

        <ul aria-label={titulo} className="flex flex-col gap-0.5">
          {telas.map((t) => {
            const ativo = estaAtivo(caminho, t);

            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  /* `title` e `aria-label` sempre, e não só quando recolhido:
                     em `md` o trilho é estreito por definição, e o ícone de
                     Projeção contra o de Investimentos é adivinhação. */
                  title={t.rotulo}
                  aria-label={t.rotulo}
                  aria-current={ativo ? "page" : undefined}
                  className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ciano motion-reduce:transition-none ${classeAlinha} ${
                    ativo
                      ? "bg-primary text-white shadow-[0_8px_20px_-10px_hsl(215_50%_23%_/_0.7)]"
                      : "text-muted-foreground hover:bg-gelo hover:text-primary"
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
                  {/* Ícone em ciano quando apagado: é a cor de "informação" da
                      casa. Aceso, o item é navy sólido e o ícone some dentro
                      dele — como tem de ser. */}
                  <t.Icone
                    className={`h-[18px] w-[18px] shrink-0 ${ativo ? "" : "text-ciano"}`}
                    strokeWidth={2}
                  />
                  <span className={`${classeRotulo} truncate`}>{t.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  }

  return (
    <aside
      /* Sem `backdrop-blur` de propósito: a lateral é a moldura fixa do app, e
         moldura translúcida fica suja quando o conteúdo rola por trás dela. */
      className={`nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-border/70 bg-white/95 md:flex ${
        recolhida ? "" : "lg:w-64"
      }`}
    >
      {/* -------------------------------------------------------- a marca -- */}
      <Link
        href="/fincash/app"
        aria-label="FINCASH, painel"
        className={`flex min-h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4 outline-none focus-visible:ring-2 focus-visible:ring-ciano ${classeAlinha}`}
      >
        {/* O emblema é navy→ciano, e não laranja: laranja neste app é AÇÃO (o
            botão de lançar), e uma marca laranja competiria com o único botão
            que a pessoa realmente precisa achar. */}
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(140deg,hsl(215_50%_23%),hsl(197_70%_38%))] text-white shadow-[0_4px_10px_-4px_hsl(215_50%_23%/0.7)]"
        >
          <Wallet className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span
          className={`${classeRotulo} font-display text-sm font-semibold tracking-[0.14em] text-primary`}
        >
          FINCASH
        </span>
      </Link>

      {/* O recolher só existe a partir de `lg`: abaixo disso o trilho já está
          na largura mínima e o botão não teria efeito.

          Ele mora no ALTO, e não no pé do trilho, porque o pé da janela é
          território do aviso de cookies — uma faixa `fixed` de largura
          inteira, do Hub todo, que cobre o rodapé da lateral enquanto não for
          aceita. Alto também é onde a mão já está: quem acabou de clicar na
          marca não atravessa a tela para encolher o menu. */}
      <div
        className={`hidden shrink-0 px-2 pt-2 lg:block ${recolhida ? "" : "text-right"}`}
      >
        <button
          type="button"
          onClick={aoAlternar}
          aria-pressed={recolhida}
          title={recolhida ? "Expandir o menu" : "Recolher o menu"}
          aria-label={recolhida ? "Expandir o menu" : "Recolher o menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-gelo hover:text-primary focus-visible:ring-2 focus-visible:ring-ciano motion-reduce:transition-none"
        >
          {recolhida ? (
            <ChevronsRight className="h-[18px] w-[18px]" strokeWidth={2} />
          ) : (
            <ChevronsLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* ------------------------------------------------------- as telas -- */}
      <nav
        aria-label="Telas do FINCASH"
        className="flex-1 overflow-y-auto px-2 py-1"
      >
        <ul className="flex flex-col">
          <Secao titulo="Todo dia" telas={DO_DIA} />
          <Secao titulo="Quando precisar" telas={QUANDO_PRECISA} />
        </ul>
      </nav>

      {/* -------------------------------------------------------- o rodapé --
          A conta e a porta de saída moravam no cabeçalho. Com o cabeçalho
          reduzido ao celular, elas descem para cá — que é onde se espera
          achá-las num app de trilho lateral: longe dos itens de navegação,
          para ninguém sair da conta mirando o "WhatsApp". */}
      <div className="shrink-0 border-t border-border/60 px-2 py-2">
        <Link
          href="/"
          title="Voltar ao Workspace"
          aria-label="Voltar ao Workspace"
          className={classeRodape}
        >
          <ChevronsLeft
            className="h-[18px] w-[18px] shrink-0 text-ciano"
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
              className="h-[18px] w-[18px] shrink-0 text-ciano"
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
export function NavFincashCelular() {
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
  const algumDentroAtivo = QUANDO_PRECISA.some((t) => estaAtivo(caminho, t));

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

          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors motion-reduce:transition-none ${
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
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
                    ativo ? "bg-primary/[0.08]" : ""
                  }`}
                >
                  <t.Icone
                    className={`h-[18px] w-[18px] ${ativo ? "text-primary" : "text-ciano"}`}
                    strokeWidth={ativo ? 2.4 : 2}
                  />
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
            className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors motion-reduce:transition-none ${
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
                {QUANDO_PRECISA.map((t) => {
                  const ativo = estaAtivo(caminho, t);

                  return (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        aria-current={ativo ? "page" : undefined}
                        /* 44px de altura: é o alvo de toque mínimo, e um menu
                           que só se abre no celular é o último lugar onde dá
                           para economizar altura. */
                        className={`flex min-h-11 items-center gap-3 px-4 text-sm font-medium transition-colors motion-reduce:transition-none ${
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
