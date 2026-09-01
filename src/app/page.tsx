import Link from "next/link";
import { ArrowRight, Crown, ShieldCheck } from "lucide-react";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { BarraLateral } from "@/components/BarraLateral";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CardPortal } from "@/components/CardPortal";
import { CardPlanejamentoHome } from "@/components/CardPlanejamentoHome";
import { BannerEbooks } from "@/components/BannerEbooks";
import { BannerIris } from "@/components/BannerIris";
import { Rodape } from "@/components/Rodape";
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
  const apps = appsParaBusca("cliente", "free");
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

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-5 pb-4 pt-2 [@media(max-height:900px)]:gap-2.5">
          {/* Fita de indicadores do mercado ao vivo (SELIC, CDI, IPCA...) */}
          <BarraMercado />

          <section className="surgir flex flex-wrap items-end justify-between gap-4">
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

          {/* As quatro vitrines: o PRO laranja abre, três áreas navy seguem. */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surgir">
              <CardPlanejamentoHome />
            </div>
            {areas
              .filter((area) => area.chave !== "trabalho")
              .map((area, i) => (
                <div
                  key={area.chave}
                  className="surgir"
                  style={{ animationDelay: `${(i + 1) * 70}ms` }}
                >
                  <CardPortal portal={area} />
                </div>
              ))}
          </section>

          <FerramentasDestaque />

          {/* Duas faixas finas: a Íris (o diferencial da casa) e a estante. */}
          <section className="grid gap-3 lg:grid-cols-5">
            <BannerIris className="lg:col-span-3" />

            <BannerEbooks className="lg:col-span-2" />
          </section>

          <ConviteWorkspace assinante={assinante} />
        </main>

        <Rodape />
      </div>
    </div>
  );
}

/* ============================================================ FERRAMENTAS */

/**
 * As seis calculadoras mais buscadas do Brasil, direto na capa.
 *
 * A seleção segue o ranking real de procura (o que Mobills, iDinheiro e o
 * Google Trends mostram): juros compostos é a campeã nacional, seguida de
 * salário líquido, rescisão, financiamento, CDI e 13º.
 */
const FERRAMENTAS_CAPA: {
  href: string;
  nome: string;
  chamada: string;
  emoji: string;
  externo?: boolean;
}[] = [
  { href: "/ferramentas/juros-compostos", nome: "Juros Compostos", chamada: "Veja seu dinheiro crescer", emoji: "📈" },
  { href: "/ferramentas/salario-liquido", nome: "Salário Líquido", chamada: "Quanto cai na conta", emoji: "💰" },
  { href: "/ferramentas/rescisao", nome: "Rescisão", chamada: "Confira antes de assinar", emoji: "🧾" },
  { href: "/ferramentas/financiamento", nome: "Financiamento", chamada: "Casa e carro na conta certa", emoji: "🏠" },
  { href: "https://novareapp.com.br/ferramentas/simulador-de-renda-fixa", nome: "Simulador CDI", chamada: "CDB e renda fixa no líquido", emoji: "📊", externo: true },
  { href: "/ferramentas/decimo-terceiro", nome: "13º Salário", chamada: "As duas parcelas", emoji: "🎁" },
];

function FerramentasDestaque() {
  return (
    <section className="surgir">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-extrabold tracking-tight text-primary">
          Ferramentas gratuitas
        </h2>
        <Link
          href="/aplicativos"
          className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong underline-offset-2 hover:underline"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {FERRAMENTAS_CAPA.map(({ href, nome, chamada, emoji, externo }, i) => (
          <li key={href} className="surgir" style={{ animationDelay: `${i * 50}ms` }}>
            <Link
              href={href}
              target={externo ? "_blank" : undefined}
              rel={externo ? "noopener noreferrer" : undefined}
              className="group flex h-full items-center gap-2 rounded-2xl bg-white p-2.5 shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-accent/25"
            >
              {/* Emoji vivo, sem chip: leveza é a modernidade aqui. */}
              <span
                className="emoji-vivo text-lg transition-transform duration-200 group-hover:scale-110"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                {emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xs font-bold leading-tight text-primary">
                  {nome}
                </span>
                <span className="block truncate text-2xs leading-tight text-muted-foreground [@media(max-height:820px)]:hidden">
                  {chamada}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
      <section className="surgir flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success/10 px-5 py-3 ring-1 ring-success/20">
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
      className="surgir flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
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
        href="/assinar"
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-warning-claro px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-warning"
      >
        Experimentar gratuitamente
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
