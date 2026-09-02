import Link from "next/link";
import { ArrowRight, ChevronDown, Crown, ShieldCheck } from "lucide-react";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { BarraLateral } from "@/components/BarraLateral";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CardPortal } from "@/components/CardPortal";
import { CardPlanejamentoHome } from "@/components/CardPlanejamentoHome";
import { BannerEbooks } from "@/components/BannerEbooks";
import { FerramentasHome } from "@/components/FerramentasHome";
import { BannerIris } from "@/components/BannerIris";
import { PerguntarIris } from "@/components/PerguntarIris";
import { PainelMeuDia } from "@/components/PainelMeuDia";
import { Rodape } from "@/components/Rodape";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { portais } from "@/lib/categorias";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";

/**
 * A home no formato "hub limpo": quatro vitrines grandes com a ação num
 * rodapé branco, uma fileira de calculadoras-isca, duas faixas finas (Íris e
 * eBooks) e a faixa de assinatura. Poucas fileiras, um só botão colorido.
 * O catálogo completo vive em /aplicativos; os eBooks, em /ebooks.
 */
export default async function Home() {
  const perfil = await getPerfil();
  const notificacoes = await getNotificacoes();
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
    <div className="aurora-clara flex min-h-dvh flex-col bg-gradient-to-b from-creme via-creme to-white">
      <RevelarAoRolar />
      <PaletaComandos apps={apps} />
      <BarraLateral />

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

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2.5 px-5 pb-3 pt-2 [@media(max-height:820px)]:gap-2 [@media(max-height:800px)]:pb-1.5 [@media(max-height:800px)]:pt-1">
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
              <p className="mt-1 text-sm text-muted-foreground [@media(max-height:900px)]:hidden">
                {perfil
                  ? "Seu ecossistema, pronto para hoje."
                  : "Organizar, investir e decidir com clareza. Sem comissão."}
              </p>
            </div>
            <BuscaDestaque />
          </section>

          {/* A pergunta à Íris vem antes das vitrines: é a ação mais barata
              da página e a que mostra o diferencial da casa em um gesto. */}
          <PerguntarIris className="cine" delay={60} />

          {/* As quatro vitrines: o PRO laranja abre, três áreas navy seguem. */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* O card PRO é o único com borda girando: ele é a oferta da
                casa, e o efeito perde a graça se estiver em tudo. */}
            <div className="cine" style={{ transitionDelay: "120ms" }}>
              {/* O card PRO é o único com borda girando: ele é a oferta da
                  casa, e o efeito perde a graça se estiver em tudo. */}
              <div className="inclina borda-girando rounded-2xl">
                <CardPlanejamentoHome
                  href={perfil ? "/planejamento/app" : "/planejamento"}
                />
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

          <FerramentasHome />

          {/* Duas faixas finas: a Íris (o diferencial da casa) e a estante. */}
          <section className="cine grid gap-3 lg:grid-cols-5" style={{ transitionDelay: "500ms" }}>
            <BannerIris className="lg:col-span-3" />

            <BannerEbooks className="lg:col-span-2" />
          </section>

          <ConviteWorkspace assinante={assinante} />

          {/* A seta que avisa que a página continua. Sem ela, quem chega numa
              tela cheia e sem barra de rolagem visível acredita que acabou —
              e o painel inteiro deixa de existir para essa pessoa. */}
          {perfil && (
            <a
              href="#meu-painel"
              className="mx-auto -mb-1 mt-1 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              Seu painel logo abaixo
              <ChevronDown className="h-3.5 w-3.5 motion-safe:animate-bounce" />
            </a>
          )}
        </main>

        {/* ================================= A SEGUNDA PARTE: O SEU PAINEL

            A primeira tela é a vitrine e cabe inteira na dobra. Daqui para
            baixo é a vida financeira de quem está logado — é o que faz a
            home deixar de ser um cartaz e virar o lugar da pessoa.

            Só para quem tem sessão: visitante deslogado não tem painel
            nenhum, e mostrar a casca vazia seria pior do que não mostrar. */}
        {perfil && (
          <SegundaParte assinante={assinante} primeiroNome={primeiroNome} />
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
}: {
  assinante: boolean;
  primeiroNome?: string;
}) {
  return (
    <section id="meu-painel" className="scroll-mt-4 border-t border-primary/8 bg-white/40">
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-8 md:px-5">
        <header className="cine">
          <p className="text-2xs font-bold uppercase tracking-[0.16em] text-ciano-forte">
            Seu Workspace
          </p>
          <h2 className="titulo-secao mt-1 text-xl sm:text-2xl">
            {primeiroNome ? `A vida financeira de ${primeiroNome}` : "Sua vida financeira"}
          </h2>
        </header>

        {assinante ? (
          <PainelMeuDia />
        ) : (
          <ConvitePainelHome />
        )}
      </div>
    </section>
  );
}

/** Free logado: o painel existe, mas ainda não é dele. */
function ConvitePainelHome() {
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
        Aqui entra o seu painel
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
        Nota de saúde financeira, patrimônio, dívidas, objetivos e projeção —
        calculados a partir dos seus números, atualizados a cada mês.
      </p>
      <Link
        href="/assinar/workspace"
        className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-warning-claro px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-warning"
      >
        Liberar meu painel
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
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
  if (assinante) {
    return (
      <section className="cine flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success/10 px-5 py-3 ring-1 ring-success/20 [@media(max-height:800px)]:py-2">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success-strong">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-primary">
              Seu Workspace está ativo
            </h2>
            <p className="text-xs text-muted-foreground">
              Planejamento, Íris e todas as ferramentas liberadas na sua conta.
            </p>
          </div>
        </div>
        <Link
          href="/planejamento"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-soft"
        >
          Abrir meu plano
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    );
  }

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
            Planejamento, Íris e todos os recursos liberados por 7 dias.
          </p>
        </div>
      </div>
      <Link
        href="/assinar/workspace"
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-warning-claro px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-warning"
      >
        Experimentar gratuitamente
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
