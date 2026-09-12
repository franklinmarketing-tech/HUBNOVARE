import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown, Crown } from "lucide-react";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CardPortal } from "@/components/CardPortal";
import { CardFincashHome } from "@/components/CardFincashHome";
import { BannerEbooks } from "@/components/BannerEbooks";
import { BannerNews } from "@/components/BannerNews";
import { FerramentasHome } from "@/components/FerramentasHome";
import { BannerIris } from "@/components/BannerIris";
import { PainelMeuDia } from "@/components/PainelMeuDia";
import { Rodape } from "@/components/Rodape";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { portais } from "@/lib/categorias";
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
  // isso o Planejamento aparecia bloqueado até para quem já tinha acesso.
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
          {/* Fita de indicadores do mercado ao vivo (SELIC, CDI, IPCA...).
              Some abaixo de 740px de altura: em 720p ela era justamente os
              pixels que faziam a home rolar, e é o bloco menos essencial da
              tela — os índices continuam em /aplicativos e no Novare News. */}
          <div className="[@media(max-height:740px)]:hidden">
            <BarraMercado />
          </div>

          <section className="cine flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="titulo-secao text-xl sm:text-2xl">
                {perfil
                  ? primeiroNome
                    ? `${saudacao}, ${primeiroNome}`
                    : `${saudacao}!`
                  : "Ecossistema Novare"}
              </h1>
              {/* Não some mais em tela baixa: escondê-lo era parte da mesma
                  corrida por caber numa tela, e a página perdia a única
                  linha que diz o que a Novare faz. */}
              <p className="mt-1.5 text-sm text-muted-foreground">
                {perfil
                  ? "Seu ecossistema, pronto para hoje."
                  : "Organizar, investir e decidir com clareza. Sem comissão."}
              </p>
            </div>
            <BuscaDestaque />
          </section>

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

          {/* As quatro vitrines: o PRO laranja abre, três áreas navy seguem.

              ⚠️ O PRIMEIRO É O FINCASH desde 12/09/2026 — decisão do dono, o
              produto-âncora da casa (o porquê está em `CardFincashHome` e em
              `lib/assinatura.ts`). Até essa data era o Planejamento, que
              continua inteiro e agora se apresenta como o que vem junto.

              ⚠️ E A ORDEM DESTA FILEIRA NÃO SAI DO CATÁLOGO: o âncora é
              montado aqui, à mão, e só as três áreas vêm de `portais()`. Quem
              quiser trocar o primeiro card mexe NESTE arquivo — reordenar
              `lib/apps.ts` não move nada aqui. */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* O card PRO é o único com borda girando: ele é a oferta da
                casa, e o efeito perde a graça se estiver em tudo. */}
            <div className="cine" style={{ transitionDelay: "120ms" }}>
              <div className="inclina borda-girando rounded-2xl">
                {/* O destino e o texto do rodapé saem da `assinatura`: quem
                    já paga entra no app sem passar pela venda, e não vê
                    preço nenhum. */}
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
                  <div className="inclina h-full">
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

          <FerramentasHome />

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

          <ConviteWorkspace assinante={assinante} />

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
  /** Já respondeu a trilha do Planejamento — muda o convite, não o acesso. */
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
            href="/planejamento/app/diagnostico"
            className="text-xs font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Rever meu diagnóstico
          </Link>
        )}
      </div>
    </div>
  );
}

/* ============================================================ CONVITE PRO */

/**
 * A faixa de fechamento, clara como o resto da página: quem NÃO assina vê o
 * convite com o único botão colorido da home; quem já assina vê a
 * confirmação de que está tudo liberado.
 */
function ConviteWorkspace({ assinante }: { assinante: boolean }) {
  /**
   * Quem assina não vê nada aqui.
   *
   * Havia um banner verde "Seu Workspace está ativo · Planejamento, Íris e
   * todas as ferramentas liberadas", com botão para abrir o plano. Era a
   * mesma informação que o card do Planejamento, na mesma tela, já dá — e
   * ocupava a largura inteira para repeti-la. Quem já pagou não precisa de
   * um aviso de que pagou; precisa do produto, que está logo acima.
   */
  if (assinante) return null;

  return (
    <section
      className="cine flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 [@media(max-height:800px)]:py-2"
      style={{
        background:
          "linear-gradient(120deg, hsl(216 46% 22%) 0%, hsl(219 54% 13%) 100%)",
        boxShadow: "inset 0 1px 0 hsl(210 60% 80% / 0.14)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* A coroa em warning-claro é o único dourado da home: ela marca o
            que é pago sem precisar escrever "PRO" em lugar nenhum. */}
        <Crown
          className="h-5 w-5 shrink-0 text-warning-claro"
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-white">
            Novare Workspace completo
          </p>
          <p className="truncate text-xs text-white/70">
            {/* Era "Planejamento, Íris e todos os recursos liberados por 7
                dias." — número escrito à mão, e ainda por cima do teste
                grátis que não existe mais. Agora sai da fonte única. */}
            {ASSINATURA_OFERTA_CURTA} · {ASSINATURA_GARANTIA}
          </p>
        </div>
      </div>
      <Link
        href="/assinar"
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-warning-claro px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-warning"
      >
        Ver a assinatura
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
