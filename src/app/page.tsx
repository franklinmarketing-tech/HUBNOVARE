import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, Crown } from "lucide-react";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { ComecePorAqui } from "@/components/ComecePorAqui";
import { QuemEstaPorTras } from "@/components/QuemEstaPorTras";
import { MercadoEmPortugues } from "@/components/MercadoEmPortugues";
import { ComoTrabalhamos } from "@/components/ComoTrabalhamos";
import { TudoDeGraca } from "@/components/TudoDeGraca";
import { buildTrackingUrl, CARTEIRA_PONTUAL_LP } from "@/lib/consultoria";
import { CardPortal } from "@/components/CardPortal";
import { CardFincashHome } from "@/components/CardFincashHome";
import { BannerEbooks } from "@/components/BannerEbooks";
import { BannerNews } from "@/components/BannerNews";
import { BannerIris } from "@/components/BannerIris";
import { PainelMeuDia } from "@/components/PainelMeuDia";
import { Rodape } from "@/components/Rodape";
import { InscreverNews } from "@/components/InscreverNews";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { portais } from "@/lib/categorias";
import { artigosOrdenados } from "@/lib/news";
import { FAMILIAS, ORDEM_FAMILIAS } from "@/lib/apps";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil, temFichaPreenchida } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";
import { estadoDaAssinatura } from "@/lib/assinatura-servidor";
import { ASSINATURA_GARANTIA, ASSINATURA_OFERTA_CURTA } from "@/lib/assinatura";

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

/**
 * A home no formato "hub limpo": quatro vitrines grandes com a ação num
 * rodapé branco, uma fileira de calculadoras-isca, duas faixas finas (Íris e
 * eBooks) e a faixa de assinatura. Poucas fileiras, um só botão colorido.
 * O catálogo completo vive em /aplicativos; os eBooks, em /ebooks.
 */
export default async function Home() {
  // As duas primeiras não dependem uma da outra: em série eram dois
  // round-trips ao Supabase antes de a home começar a pintar, e a tela ficava
  // no "Carregando…" por mais tempo do que precisava.
  const [perfil, notificacoes] = await Promise.all([
    getPerfil(),
    getNotificacoes(),
  ]);

  // Esta depende do id, então fica de fora do paralelo. Quem já respondeu a
  // trilha inteira não pode ser tratado como quem nunca abriu o app — ver o
  // convite do painel, no fim do arquivo.
  const temFicha = perfil ? await temFichaPreenchida(perfil.id) : false;
  // Sem/teste/ativa: é o que decide se o card do FINCASH — o primeiro da
  // fileira — pode falar em preço, e para onde ele leva. Ver
  // `assinatura-servidor.ts`.
  const assinatura = await estadoDaAssinatura();
  // "cliente"/"free" continua o padrão para visitante anônimo; logado=!!perfil
  // é o que diferencia um cliente em teste de um visitante sem conta — sem
  // isso o FINPLAN aparecia bloqueado até para quem já tinha acesso.
  const apps = appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil);
  const areas = portais("cliente");
  const assinante =
    perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  // Saudação pela hora de Brasília: a página é dinâmica (perfil vem de
  // cookie), então o horário renderiza fresco a cada visita.
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const saudacao = hora < 6 || hora >= 18 ? "Boa noite" : hora < 12 ? "Bom dia" : "Boa tarde";

  // Só sauda pelo nome quando parece nome de gente. Handle de login
  // ("franklin.trader", "ana_c88") vira saudação sem nome — pior que não
  // personalizar é chamar a pessoa pelo usuário do sistema.
  const primeiraPalavra = perfil?.nome?.trim().split(/\s+/)[0] ?? "";
  const primeiroNome = /^[a-záàâãéêíóôõúüç]{2,15}$/i.test(primeiraPalavra)
    ? primeiraPalavra[0].toUpperCase() + primeiraPalavra.slice(1).toLowerCase()
    : undefined;

  return (
    <div className="aurora-clara flex min-h-dvh flex-col bg-gradient-to-b from-creme via-creme to-creme-forte pb-14 md:pb-0">
      <RevelarAoRolar />
      <PaletaComandos apps={apps} />
      <BarraLateral />
      <BarraInferior />

      {/* `flex-1` já estica esta coluna até o fim: repetir `min-h-dvh` aqui
          (o pai já tem) somava altura que não dava para rolar, e os últimos
          pixels do rodapé ficavam fora de alcance no celular. */}
      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          email={perfil?.email}
          assinante={assinante}
          admin={perfil?.role === "admin"}
          logado={!!perfil}
          portais={areas}
          notificacoes={notificacoes}
        />

        {/* O ritmo vertical da home.
            Era `gap-2.5` (10px) com `pt-2`, e media queries que encolhiam
            isso para 8px em telas baixas — tudo a serviço de uma regra não
            escrita: a home NÃO PODE ROLAR. O custo dessa regra era o aperto:
            seis blocos empilhados com 10px de folga não respiram, e é daí
            que vinha a sensação de peso, mais do que das cores.
            Rolar não é defeito — é como todo mundo lê uma página. O ar entre
            as seções vale mais do que a promessa de caber numa tela. */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 pb-10 pt-6">
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
          <section className="cine grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <h1 className="titulo-secao text-[1.75rem] leading-tight sm:text-4xl">
                {/* Palavra por palavra (`.cine-palavra`, globals.css): a saudação
                    entra primeiro e a pergunta assenta logo depois. */}
                {palavras(primeiroNome ? `${saudacao}, ${primeiroNome}!` : `${saudacao}!`, 0)}
                <span className="text-accent-strong">
                  {palavras("O que você quer resolver hoje?", 3)}
                </span>
              </h1>
              {/* Não some mais em tela baixa: escondê-lo era parte da mesma
                  corrida por caber numa tela, e a página perdia a única
                  linha que diz o que a Novare faz. */}
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                {perfil
                  ? "Tudo o que você usa, num lugar só — e a gente por perto se precisar."
                  : "Ferramentas de graça para entender e organizar o seu dinheiro, feitas por gente da Novare. Gratuitas e independentes, para você decidir com clareza."}
              </p>
              <div className="mt-5 max-w-md">
                <BuscaDestaque />
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card">
                <Image
                  src="/home/topo.webp"
                  alt="Mulher sorrindo em casa, com café e celular, organizando o mês"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="cine-ken-burns object-cover"
                />
              </div>

              {/* A CARTEIRA PONTUAL NA FOTO DO TOPO (pedido do dono, 19/10/2026):
                  título na dor — dinheiro parado no lugar errado, carteira
                  montada pelo banco — e o botão direto para a página oficial.
                  No celular o cartão desce para baixo da foto, sobrepondo só a
                  borda: em cima dela, cobriria a pessoa inteira. */}
              <div style={{ transitionDelay: "650ms" }} className="cine relative mx-3 -mt-12 rounded-2xl bg-white/95 p-4 shadow-card-hover ring-1 ring-primary/5 backdrop-blur-sm sm:absolute sm:bottom-4 sm:left-4 sm:mx-0 sm:mt-0 sm:max-w-sm sm:p-5">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  Carteira Pontual
                </p>
                <p className="mt-1.5 font-display text-lg font-bold leading-snug text-primary sm:text-xl">
                  Seu dinheiro está parado no lugar errado?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  A Novare analisa a sua carteira sem ganhar comissão de nenhum produto.
                </p>
                <a
                  href={buildTrackingUrl(CARTEIRA_PONTUAL_LP, "home-topo")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  Quero analisar minha carteira
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </section>

          <ComecePorAqui />

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
                <CardFincashHome assinatura={assinatura} />
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
              já têm porta própria em /aplicativos e na busca (⌘K).
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

          {/* O rosto da casa e os números do mês em frases — as duas peças
              que tiram a home do tom de painel de banco (19/10/2026). */}
          <ComoTrabalhamos />

          <QuemEstaPorTras />

          <MercadoEmPortugues />

          {/* ⚠️ ERA A FAIXA NAVY "Novare Workspace completo · Ver o que tem
              aqui" (`ConviteWorkspace`), trocada em 19/10/2026 por um fecho que
              mostra o TAMANHO do que é de graça. */}
          <TudoDeGraca />

          {/* A seta que avisa que a página continua. Sem ela, quem chega numa
              tela cheia e sem barra de rolagem visível acredita que acabou —
              e o painel inteiro deixa de existir para essa pessoa. */}
          {perfil && (
            <a
              href="#meu-painel"
              className="mx-auto -mb-1 mt-1 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {/* Quem não assina encontra lá embaixo um convite de
                  assinatura, não um painel: prometer o que a rolagem não
                  entrega gasta a confiança de quem clica. */}
              {assinante ? "Seu painel logo abaixo" : "Veja o que tem mais abaixo"}
              <ChevronDown className="h-3.5 w-3.5 motion-safe:animate-bounce" />
            </a>
          )}
        </main>

        {/* ================================= A SEGUNDA PARTE: O SEU PAINEL

            A primeira tela é a vitrine e cabe inteira na dobra. Daqui para
            baixo é a vida financeira de quem está logado.

            Quem assina vê os próprios números; quem está no free vê o
            convite, porque para ele ainda não existe painel. Visitante
            deslogado não entra aqui: a casca vazia seria pior do que não
            mostrar nada. */}
        {perfil && (
          <SegundaParte
            assinante={assinante}
            primeiroNome={primeiroNome}
            temFicha={temFicha}
          />
        )}

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

/* ========================================================= SEGUNDA PARTE */

/**
 * A parte de baixo da home: o painel de quem está logado.
 *
 * Vive FORA do `<main>` da vitrine de propósito — aquele bloco é medido
 * para caber numa tela, e enfiar o painel dentro dele estouraria a conta de
 * altura que mantém a primeira dobra inteira.
 *
 * Quem assina vê os próprios números; quem está no plano free vê o convite,
 * porque para ele não existe painel nenhum ainda.
 */
function SegundaParte({
  assinante,
  primeiroNome,
  temFicha,
}: {
  assinante: boolean;
  primeiroNome?: string;
  /** Já respondeu a trilha do FINPLAN — muda o convite, não o acesso. */
  temFicha: boolean;
}) {
  return (
    <section
      id="meu-painel"
      className="scroll-mt-4 border-t border-primary/8 bg-white/40"
    >
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-8 md:px-5">
        <header className="cine">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-ciano-forte">
            Seu Workspace
          </p>
          <h2 className="titulo-secao mt-1 text-xl sm:text-2xl">
            {primeiroNome ? `A vida financeira de ${primeiroNome}` : "Sua vida financeira"}
          </h2>
        </header>

        {/* `resumo`: só a primeira seção do painel. O painel inteiro são
            seis, e as seis aqui fariam da home uma cópia de /meu-dia — que
            é a página que existe justamente para isso. */}
        {assinante ? (
          <PainelMeuDia resumo />
        ) : (
          <ConvitePainelHome temFicha={temFicha} />
        )}
      </div>
    </section>
  );
}

/**
 * Free logado: o painel existe, mas ainda não é dele.
 *
 * Duas versões, e a diferença importa: quem já respondeu as oito perguntas
 * inteiras via exatamente o mesmo texto de quem nunca abriu o app — "aqui
 * entra o seu painel", como se não tivesse dado nada. Depois de dez minutos
 * preenchendo, isso lê como se o trabalho não tivesse sido registrado.
 *
 * O acesso continua igual (o painel é o produto pago). O que muda é o
 * reconhecimento: para quem preencheu, os números JÁ existem e o que falta é
 * destravar — que por acaso é também o argumento de venda mais forte.
 */
function ConvitePainelHome({ temFicha }: { temFicha: boolean }) {
  return (
    <div
      className="cine palco-cta mt-5 overflow-hidden rounded-3xl p-7 text-white sm:p-9"
      style={{
        background:
          "linear-gradient(140deg, hsl(216 54% 16%) 0%, hsl(219 58% 11%) 100%)",
      }}
    >
      <Crown className="h-6 w-6 text-warning-claro" strokeWidth={1.75} />
      <h3 className="mt-4 font-display text-2xl font-bold leading-tight">
        {temFicha
          ? "Seus números já estão prontos"
          : "Aqui entra o seu painel"}
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
        {temFicha
          ? "Você já respondeu a trilha, e o diagnóstico foi calculado com os seus dados. O painel completo — saúde financeira, patrimônio, dívidas, objetivos e projeção, mês a mês — abre com a assinatura."
          : "Nota de saúde financeira, patrimônio, dívidas, objetivos e projeção — calculados a partir dos seus números, atualizados a cada mês."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href="/assinar"
          className="group inline-flex items-center gap-2 rounded-xl bg-warning-claro px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-warning"
        >
          {temFicha ? "Liberar meus números" : "Liberar meu painel"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Quem preencheu tem para onde ir sem pagar: o diagnóstico é a parte
            que já é dele. Esconder isso seria cobrar pelo que já entregamos. */}
        {temFicha && (
          <Link
            href="/finplan/app/diagnostico"
            className="text-xs font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Rever meu diagnóstico
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Fatia um texto em palavras para a entrada em cascata (`.cine-palavra`).
 * `inicio` desloca o atraso, para uma frase continuar a cascata da anterior.
 * O espaço fica FORA do span: com inline-block, espaço dentro dele sumiria.
 */
function palavras(texto: string, inicio: number) {
  return texto.split(" ").map((p, i) => (
    <span key={i}>
      <span className="cine-palavra" style={{ "--i": inicio + i } as React.CSSProperties}>
        {p}
      </span>{" "}
    </span>
  ));
}
