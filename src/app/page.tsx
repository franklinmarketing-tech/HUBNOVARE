import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { PaletaComandosSessao, TopoAppSessao } from "@/components/SessaoNoNavegador";
import { CardFincashHomeSessao, SegundaParteHome, SetaPainelHome, TituloHome } from "@/components/HomeSessao";
import { QuemEstaPorTras } from "@/components/QuemEstaPorTras";
import { ComoTrabalhamos } from "@/components/ComoTrabalhamos";
import { TudoDeGraca } from "@/components/TudoDeGraca";
import { Suspense } from "react";
import { UltimoVideo } from "@/components/UltimoVideo";
import { ultimoVideoYoutube } from "@/lib/youtube";
import { ProximosEventos } from "@/components/ProximosEventos";
import { getCalendarioEconomico } from "@/lib/calendario-economico";
import { ChamadaJefferson } from "@/components/ChamadaJefferson";
import { buildTrackingUrl, CARTEIRA_PONTUAL_LP } from "@/lib/consultoria";
import { CardPortal } from "@/components/CardPortal";
import { BannerEbooks } from "@/components/BannerEbooks";
import { BannerNews } from "@/components/BannerNews";
import { BannerIris } from "@/components/BannerIris";
import { Rodape } from "@/components/Rodape";
import { InscreverNews } from "@/components/InscreverNews";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { portais } from "@/lib/categorias";
import { artigosOrdenados } from "@/lib/news";
import { FAMILIAS, ORDEM_FAMILIAS } from "@/lib/apps";
import { FitaMercado } from "@/components/FitaMercado";
import { Stories } from "@/components/Stories";
import { getStories } from "@/lib/stories";
import { QuizComeco } from "@/components/QuizComeco";

/**
 * Só o canonical: title, description e Open Graph da home são os do layout
 * raiz, e é o certo — o padrão do site É o texto da home.
 *
 * O canonical, porém, tem de ficar AQUI e não no layout: declarado lá em
 * cima, toda rota que não define o seu herdaria "/" e diria ao Google que
 * é uma cópia da home.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ⚠️ A HOME SAI PRONTA (21/11/2026). Ela era montada no servidor a cada visita
   — lia perfil, avisos e assinatura de quem abria, inclusive de robô — e era a
   página que mais gastava processamento na Vercel. Agora é igual para todos e
   remontada no máximo a cada 30 min (vídeo do canal e calendário); o que é de
   cada pessoa se completa no navegador (`components/HomeSessao.tsx`). */
export const revalidate = 1800;

/**
 * A home no formato "hub limpo": quatro vitrines grandes com a ação num
 * rodapé branco, uma fileira de calculadoras-isca, duas faixas finas (Íris e
 * eBooks) e a faixa de assinatura. Poucas fileiras, um só botão colorido.
 * O catálogo completo vive em /aplicativos; os eBooks, em /ebooks.
 */
export default function Home() {
  const areas = portais("cliente");

  return (
    // Fundo gelo, não creme (20/10/2026): é o `#F4F8FB` da página da Carteira
    // Pontual, que o dono pediu como modelo. O creme deixava a home quente
    // demais ao lado das seções noite.
    <div className="aurora-clara flex min-h-dvh flex-col bg-background pb-14 md:pb-0">
      <RevelarAoRolar />
      <PaletaComandosSessao />
      <BarraLateral />
      <BarraInferior />

      {/* `flex-1` já estica esta coluna até o fim: repetir `min-h-dvh` aqui
          (o pai já tem) somava altura que não dava para rolar, e os últimos
          pixels do rodapé ficavam fora de alcance no celular. */}
      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoAppSessao portais={areas} />
        {/* A fita do mercado, logo abaixo do topo (TradeMap, 21/10/2026). */}
        <FitaMercado />

        {/* O ritmo vertical da home.
            Era `gap-2.5` (10px) com `pt-2`, e media queries que encolhiam
            isso para 8px em telas baixas — tudo a serviço de uma regra não
            escrita: a home NÃO PODE ROLAR. O custo dessa regra era o aperto:
            seis blocos empilhados com 10px de folga não respiram, e é daí
            que vinha a sensação de peso, mais do que das cores.
            Rolar não é defeito — é como todo mundo lê uma página. O ar entre
            as seções vale mais do que a promessa de caber numa tela. */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 pb-10 pt-6">
          {/* OS "STORIES" (05/11/2026, benchmark com a Nord): a faixa de círculos no topo, cada um
              com perguntas e respostas de uma matéria do News. Só na home, por ora — levar para o
              /novare-news é decisão do dono. Conteúdo em `lib/stories.ts`. */}
          <Stories stories={getStories()} />

          {/* ⚠️ A FITA DO BANCO CENTRAL (`BarraMercado`) ABRIA A HOME até
              19/10/2026. Saiu daqui a pedido do dono ("deixar mais
              humanizado"): a primeira coisa da página eram siglas soltas.
              Os mesmos números agora vêm traduzidos em frases, mais abaixo
              (`MercadoEmPortugues`). */}

          {/* A abertura conversa: saudação pela hora para todos, e a
              pergunta que leva ao "Comece por aqui" logo abaixo. */}
          {/* A FOTO DO TOPO (19/10/2026): alguém em casa, de manhã, tranquilo
              com as contas — o oposto de painel de banco. Gerada na Magnific,
              ilustrativa: não é cliente, e nenhum texto fala por ela. */}
          {/* O TOPO NO MOLDE DA CARTEIRA PONTUAL (20/10/2026): um painel
              noite com as ondas prateadas por trás (`.secao-noite`), título
              branco de peso médio e as três pílulas de vidro no pé — o mesmo
              desenho do topo de diagnostico.novareapp.com.br/carteira-pontual. */}
          <section className="cine secao-noite rounded-[1.75rem] px-5 pb-5 pt-8 sm:px-9 sm:pb-7 sm:pt-12 lg:pb-6 lg:pt-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <p className="chapeu chapeu-claro">Novare Workspace</p>
              <TituloHome />
              <div className="mt-6 max-w-md lg:mt-5">
                <BuscaDestaque />
              </div>
              {/* No computador, embaixo da busca (25/10/2026): embaixo da foto ele empurrava o botão
                  para fora da primeira tela em 1366×768, e por cima dela cobria o rosto. */}
              <CartaoCarteiraPontual className="mt-5 hidden max-w-md lg:block" compacto />
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] ring-1 ring-white/10">
                {/* A capa é o Jefferson (pedido do dono, 25/10/2026): saíram a foto da mulher com café e o
                    vídeo em laço dela. Em 27/10 o dono pediu a foto em que ele sorri, à mesa do
                    escritório (a do Instagram era marcada "Conteúdo de IA"). */}
                {/* A foto leva à Consultoria (27/10/2026): no Clarity, era o elemento mais tocado da home
                    no celular, e não fazia nada (clique morto). */}
                <Link href="/consultoria" aria-label="Conhecer a consultoria da Novare com o Jefferson" className="absolute inset-0 z-[1]" />
                <Image
                  src="/home/topo-jefferson-sorrindo.webp"
                  alt="Jefferson Freitas, sócio-fundador da Novare, sorrindo à mesa do escritório"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-top"
                />
              </div>

              {/* No celular e no tablet o cartão da Carteira Pontual fica embaixo da foto, encostando
                  só na borda. No computador ele mora na coluna da esquerda (ver acima). */}
              <CartaoCarteiraPontual className="relative mx-3 -mt-6 sm:mx-6 sm:-mt-8 lg:hidden" />
            </div>
          </div>

          {/* As pílulas de vidro do pé do topo — as três promessas da casa,
              no mesmo formato "Recomendação isenta · NÃO VENDEMOS PRODUTO". */}
          {/* Em tela de computador baixa (até 800px de altura útil) as pílulas saem: o resto da capa
              cabe inteiro sem rolar, e as três promessas se repetem logo abaixo (25/10/2026). */}
          <ul className="mt-8 flex flex-wrap gap-2.5 lg:mt-6 [@media(min-width:1024px)_and_(max-height:800px)]:hidden" aria-label="O que a Novare garante">
            {[
              ["Tudo de graça", "sem cartão"],
              ["Independente", "não vendemos produto"],
              ["Feito por gente", "equipe Novare"],
            ].map(([forte, fraco]) => (
              <li key={forte} className="pilula-vidro">
                <span className="text-sm font-semibold">{forte}</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">{fraco}</span>
              </li>
            ))}
          </ul>
          </section>

          {/* ⚠️ O "COMECE POR AQUI" (`ComecePorAqui`) SAIU DAQUI em 20/10/2026 —
              pedido do dono: "home está muito poluída com textos". Quatro
              cartões de frase + linha logo abaixo do topo eram texto demais
              antes das vitrines. O componente continua pronto. */}

          {/* O painel de quem assina NÃO fica aqui.

              Ele já morou neste ponto, logo abaixo da saudação — era a
              inversão de hierarquia do briefing. Na prática a vitrine saía
              da primeira tela e a home virava uma segunda cópia de
              /meu-dia. A decisão foi voltar atrás: a home abre com a
              vitrine, e os números da pessoa ficam na segunda tela do
              scroll (ver `SegundaParte`, no fim do arquivo). */}

          {/* A barra "Pergunte à Íris" morava aqui e saiu.
          
              Além do peso — era o terceiro bloco antes de a pessoa ver um
              aplicativo sequer —, ela ficava a poucos pixels da busca, e os
              dois PARECIAM o mesmo campo fazendo coisas diferentes: um acha
              aplicativo pelo nome, o outro responde pergunta. O próprio
              PerguntarIris tinha um comentário explicando essa diferença, que
              é o sinal clássico de que a tela não estava explicando sozinha.
          
              A Íris continua com porta na home, na faixa logo abaixo das
              ferramentas, e no trilho lateral. */}

          {/* As quatro vitrines: UM CARD DE PRODUTO em laranja, três áreas
              navy seguem.

              ⚠️ ERAM CINCO ATÉ 14/09/2026 — FINCASH e FINPLAN em cards
              separados (12 e 13/09). O dono pediu para virar um só: "FINCASH
              e FINPLAN vira um só card". Fazia sentido além do visual — uma
              assinatura, um preço, dois produtos que já se apresentavam como
              irmãos (o FINCASH mede o mês, o FINPLAN planeja o ano). O porquê
              da fusão, com os dois destinos preservados, está inteiro em
              `CardFincashFinplanHome` — inclusive por que ela NÃO é a volta
              do card antigo que deixou o FINPLAN sem porta na home.

              ⚠️ E A ORDEM DESTA FILEIRA NÃO SAI DO CATÁLOGO: o card de
              produto é montado aqui, à mão, e só as três áreas vêm de
              `portais()`. Quem quiser mexer nele edita ESTE arquivo (ou o
              componente) — reordenar `lib/apps.ts` não move nada aqui. */}
          {/* 4 itens, não 5: `lg:grid-cols-4` sozinho já fecha a fileira sem
              degrau intermediário. O `xl` de antes existia para acomodar
              CINCO cards sem apertar (4 numa tela média empurrava o quinto
              para baixo) — com 4 cards, `lg` já é largura de sobra. */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="cine" style={{ transitionDelay: "120ms" }}>
              <div className="h-full rounded-3xl">
                {/* O destino e o preço saem da `assinatura`: quem já paga
                    entra direto no app, e não vê preço nenhum. */}
                <CardFincashHomeSessao />
              </div>
            </div>
            {areas
              .filter((area) => area.chave !== "trabalho")
              .map((area, i) => (
                <div
                  key={area.chave}
                  className="cine"
                  style={{ transitionDelay: `${170 + i * 70}ms` }}
                >
                  <div className="h-full">
                    <CardPortal portal={area} />
                  </div>
                </div>
              ))}
          </section>

          {/* "POR ONDE EU COMEÇO?" (05/11/2026): logo depois das vitrines, para quem chegou e não
              sabe qual delas abrir. Três perguntas, uma porta principal, uma alternativa e o
              próximo passo — nunca ativo nem perfil de investidor. Regra em `lib/quiz-comeco.ts`. */}
          <QuizComeco origem="home" />

          {/* ⚠️ OS CARTÕES DE INDICADORES (`IndicadoresHome`) SAÍRAM DAQUI em
              21/10/2026: os números agora correm na fita fina do topo
              (`FitaMercado`), no formato do TradeMap, a pedido do dono. */}

          {/* O "Continue de onde parou" (components/Recentes) já morou aqui e
              saiu a pedido: mais uma fileira de pílulas entre as vitrines e as
              ferramentas deixava a dobra carregada demais. O componente
              continua pronto e o histórico continua sendo gravado a cada
              visita — religar é uma linha, se um dia a home tiver folga. */}

          {/* ⚠️ A FILEIRA DE 6 CALCULADORAS (`FerramentasHome`) SAIU DAQUI em
              14/09/2026 — pedido do dono: "está muito poluído". A home tinha
              vitrine + 6 pílulas de calculadora + 3 faixas de banner + o
              convite de assinatura, tudo antes da segunda parte — muita
              coisa competindo por atenção na mesma rolagem, e as calculadoras
              já têm porta própria em /aplicativos e na busca.
              O componente (`components/FerramentasHome.tsx`) não foi apagado
              porque guarda a lógica de favoritar/fixar atalho, que pode
              voltar a servir outra tela — religar aqui é uma linha. */}

          {/* Três faixas finas: a Íris (o diferencial da casa), a estante e
              o canal de conteúdo. O News tinha porta na home, perdeu numa
              reescrita e voltou — sem ela o canal só existia para quem já
              conhecia o trilho lateral. */}
          <section className="cine grid gap-3 lg:grid-cols-6" style={{ transitionDelay: "500ms" }}>
            {/* Três faixas de mesma largura. A primeira divisão que tentei
                dava uma coluna de seis para os eBooks, e o leque de capas
                não cabia: a estante aparecia cortada. Em partes iguais cada
                faixa recebe o que precisa. */}
            <BannerIris className="lg:col-span-6 xl:col-span-2" />

            <BannerNews className="lg:col-span-3 xl:col-span-2" />

            <BannerEbooks className="lg:col-span-3 xl:col-span-2" />
          </section>

          {/* Os três próximos eventos fortes do calendário econômico
              (22/10/2026). Em Suspense: as fontes são de fora e a primeira
              leitura sem cache não pode segurar a home. */}
          <Suspense fallback={null}>
            <CalendarioEVideo />
          </Suspense>

          {/* O rosto da casa e os números do mês em frases — as duas peças
              que tiram a home do tom de painel de banco (19/10/2026). */}
          <ComoTrabalhamos />

          <QuemEstaPorTras />

          {/* ⚠️ O "MERCADO EM PORTUGUÊS" SAIU DAQUI em 20/10/2026: os mesmos
              números agora ficam no painel de indicadores, logo abaixo das vitrines
              (`IndicadoresHome`), a pedido do dono. */}

          {/* ⚠️ ERA A FAIXA NAVY "Novare Workspace completo · Ver o que tem
              aqui" (`ConviteWorkspace`), trocada em 19/10/2026 por um fecho que
              mostra o TAMANHO do que é de graça. */}
          <TudoDeGraca />

          {/* A chamada de destaque com o Jefferson (pedido dele, 20/10/2026). */}
          <ChamadaJefferson />

          {/* A seta que avisa que a página continua. Sem ela, quem chega numa
              tela cheia e sem barra de rolagem visível acredita que acabou —
              e o painel inteiro deixa de existir para essa pessoa. */}
          <SetaPainelHome />
        </main>

        {/* ================================= A SEGUNDA PARTE: O SEU PAINEL

            A primeira tela é a vitrine e cabe inteira na dobra. Daqui para
            baixo é a vida financeira de quem está logado.

            Quem assina vê os próprios números; quem está no free vê o
            convite, porque para ele ainda não existe painel. Visitante
            deslogado não entra aqui: a casca vazia seria pior do que não
            mostrar nada. */}
        <SegundaParteHome />

        {/* A INSCRIÇÃO NO NEWS TAMBÉM AQUI, pedido do dono.

            Vale para os dois públicos da home, por motivos opostos: o
            visitante que ainda não assina deixa um e-mail sem precisar
            decidir nada, e quem já assina descobre que existe um conteúdo
            semanal que ele não sabia que tinha direito.

            Fica DEPOIS do painel e antes do rodapé: acima disso a home tem
            uma ordem pensada (vitrine na dobra, painel em seguida), e
            enfiar captação no meio empurraria o produto para baixo. */}
        <div className="mx-auto w-full max-w-7xl px-5 pb-6 pt-2">
          {/* Mesmos dados reais da página do News: assuntos das categorias,
              contagem e a última publicada. */}
          <InscreverNews
            compacto
            assuntos={ORDEM_FAMILIAS.map((f) => ({
              chave: f,
              rotulo: FAMILIAS[f],
            }))}
            totalEdicoes={artigosOrdenados().length}
            ultimaEdicao={artigosOrdenados()[0]?.titulo}
            ultimaEdicaoHref={
              artigosOrdenados()[0]
                ? `/novare-news/${artigosOrdenados()[0].slug}`
                : undefined
            }
          />
        </div>

        <Rodape />
      </div>
    </div>
  );
}

/**
 * O calendário econômico e, ao lado, o último vídeo do canal (pedido do dono, 25/10/2026: "nem que
 * encurte uma seção pela metade para caber uma preview"). Sem vídeo (feed fora do ar), o calendário
 * volta a ocupar a largura toda.
 */
async function CalendarioEVideo() {
  // As duas buscas EM PARALELO (05/11/2026): antes o calendário só começava depois de o feed do
  // YouTube responder. O `cache` do React em `getCalendarioEconomico` faz o `ProximosEventos`
  // abaixo reaproveitar esta mesma busca, sem pedir de novo.
  const [video] = await Promise.all([ultimoVideoYoutube(), getCalendarioEconomico()]);
  if (!video) return <ProximosEventos />;
  return (
    <div className="grid items-stretch gap-3 lg:grid-cols-2">
      <ProximosEventos compacto />
      <UltimoVideo video={video} />
    </div>
  );
}

/**
 * A CARTEIRA PONTUAL NO TOPO (pedido do dono, 19/10/2026): título na dor — dinheiro parado no
 * lugar errado, carteira montada pelo banco — e o botão direto para a página oficial. Montado em
 * dois lugares da capa conforme a largura (só um aparece por vez: o outro fica `hidden`).
 */
function CartaoCarteiraPontual({ className = "", compacto = false }: { className?: string; compacto?: boolean }) {
  return (
    <div style={{ transitionDelay: "650ms" }} className={`cine rounded-[1.25rem] bg-white/95 p-4 shadow-vidro ring-1 ring-white/40 backdrop-blur-md ${compacto ? "" : "sm:p-5"} ${className}`}>
      <p className="chapeu">Carteira Pontual</p>
      <p className={`mt-1.5 font-display text-lg font-semibold leading-snug tracking-[-0.03em] text-primary ${compacto ? "" : "sm:text-xl"}`}>
        Seu dinheiro está parado no lugar errado?
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        A Novare analisa a sua carteira sem ganhar comissão de nenhum produto.
      </p>
      <a
        href={buildTrackingUrl(CARTEIRA_PONTUAL_LP, "home-topo")}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-3 flex items-center gap-2"
      >
        <span className="btn-cp">Quero analisar minha carteira</span>
        <span className="btn-seta" aria-hidden>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </a>
    </div>
  );
}
