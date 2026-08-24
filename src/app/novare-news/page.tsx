import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { CabecalhoNews } from "@/components/CabecalhoNews";
import { UltimosVideos } from "@/components/UltimosVideos";
import { SigaInstagram } from "@/components/SigaInstagram";
import { RodapeNovare } from "@/components/RodapeNovare";
import { artigosOrdenados, type Artigo } from "@/lib/news";
import { FAMILIAS, ORDEM_FAMILIAS, type Familia } from "@/lib/apps";
import { CONTAGEM } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Novare News",
  description:
    "Conteúdo educativo da Novare sobre salário, rescisão, investimentos e o dia a dia do dinheiro — sempre ligado à ferramenta que resolve o que acabou de ser explicado.",
};

const POR_PAGINA = 6;

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "14 jul 2026" — data de jornal, não de formulário. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${Number(dia)} ${MESES[Number(mes) - 1] ?? ""} ${ano}`;
}

export default async function NovareNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const categoriaAtiva = (params.categoria ?? "todos") as Familia | "todos";
  const pagina = Math.max(1, Number(params.pagina) || 1);

  const todos = artigosOrdenados();

  // A vitrine de destaque só existe na home do canal, sem filtro — é o
  // convite de entrada. Filtrando por categoria, vai direto para a lista.
  const semFiltro = categoriaAtiva === "todos";

  // Manchete = a publicação mais recente. As duas chamadas ao lado são os
  // destaques marcados na fonte. O conjunto é calculado SEMPRE (não só na
  // página 1), senão a lista paginada mudaria de tamanho a cada página e
  // os mesmos artigos apareceriam duas vezes.
  const principal = semFiltro ? todos[0] : undefined;
  const secundarias = principal
    ? todos.filter((a) => a.destaque && a.slug !== principal.slug).slice(0, 2)
    : [];
  const noTopo = new Set([principal?.slug, ...secundarias.map((a) => a.slug)]);
  const mostrarTopo = pagina === 1;

  const listaBase = semFiltro
    ? todos.filter((a) => !noTopo.has(a.slug))
    : todos.filter((a) => a.categoria === categoriaAtiva);

  const rotuloLista = semFiltro
    ? "Mais publicações"
    : (FAMILIAS[categoriaAtiva as Familia] ?? "Publicações");

  const totalPaginas = Math.max(1, Math.ceil(listaBase.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const pagina_ = listaBase.slice(inicio, inicio + POR_PAGINA);

  const linkFiltro = (cat: string) => (cat === "todos" ? "/novare-news" : `/novare-news?categoria=${cat}`);
  const linkPagina = (n: number) =>
    `/novare-news?${semFiltro ? "" : `categoria=${categoriaAtiva}&`}pagina=${n}`;

  return (
    <div className="min-h-dvh bg-white">
      <CabecalhoNews />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-2xs font-bold uppercase tracking-[0.2em] text-accent-strong">
            Novare News
            <span aria-hidden className="h-px w-10 bg-accent-soft" />
          </p>
          <h1 className="mt-4 text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-4xl">
            Dinheiro explicado, sem letra miúda
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Salário, rescisão, investimento e o dia a dia das contas — cada
            artigo termina na ferramenta que resolve o que você acabou de ler.
          </p>
        </header>

        {/* Categorias: mesmas áreas do catálogo, para não inventar um
            segundo vocabulário de navegação. */}
        <nav
          aria-label="Categorias"
          className="mt-8 border-y border-border sm:mt-10"
        >
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex w-max gap-1 py-2.5">
              <FiltroChip href={linkFiltro("todos")} ativo={semFiltro}>
                Tudo
              </FiltroChip>
              {ORDEM_FAMILIAS.map((f) => (
                <FiltroChip key={f} href={linkFiltro(f)} ativo={categoriaAtiva === f}>
                  {FAMILIAS[f]}
                </FiltroChip>
              ))}
            </div>
          </div>
        </nav>

        {/* A primeira dobra é uma capa de jornal: uma manchete grande e
            duas chamadas ao lado — não uma parede de cards iguais. */}
        {mostrarTopo && principal && <Manchete artigo={principal} />}

        {mostrarTopo && secundarias.length > 0 && (
          <section className="mt-10 grid gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2">
            {secundarias.map((a) => (
              <ChamadaSecundaria key={a.slug} artigo={a} />
            ))}
          </section>
        )}

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3 font-display text-lg font-bold tracking-tight text-primary">
              {rotuloLista}
              <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {listaBase.length} {listaBase.length === 1 ? "artigo" : "artigos"}
              </span>
            </h2>

            {pagina_.length > 0 ? (
              <section className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-7">
                {pagina_.slice(0, 4).map((a) => (
                  <CardArtigo key={a.slug} artigo={a} />
                ))}

                {/* O CTA no meio da leitura, não no rodapé: é onde o olho
                    ainda está. Só na primeira dobra de cada página. */}
                <div className="sm:col-span-2">
                  <BannerWorkspace />
                </div>

                {pagina_.slice(4).map((a) => (
                  <CardArtigo key={a.slug} artigo={a} />
                ))}
              </section>
            ) : (
              <p className="mt-8 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Ainda não tem artigo nessa categoria. Volte em breve.
              </p>
            )}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <nav
                aria-label="Paginação"
                className="mt-12 flex items-center justify-center gap-1.5 border-t border-border pt-8"
              >
                {pagina > 1 && (
                  <Link
                    href={linkPagina(pagina - 1)}
                    aria-label="Página anterior"
                    className="flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Link>
                )}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={linkPagina(n)}
                    aria-current={n === pagina ? "page" : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      n === pagina
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {pagina < totalPaginas && (
                  <Link
                    href={linkPagina(pagina + 1)}
                    aria-label="Próxima página"
                    className="flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    Próxima
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </nav>
            )}
          </div>

          <SidebarNews />
        </div>
      </main>

      <RodapeNovare />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FiltroChip({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        ativo
          ? "bg-primary text-white"
          : "text-muted-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

/** Data e tempo de leitura, no mesmo formato em toda a página. */
function MetaArtigo({ artigo }: { artigo: Artigo }) {
  return (
    <>
      <time dateTime={artigo.data}>{formatarData(artigo.data)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {artigo.tempoLeituraMin} min de leitura
      </span>
    </>
  );
}

/**
 * A manchete: a publicação mais recente ocupa a primeira dobra inteira,
 * capa de um lado e texto do outro. É o que separa uma capa de jornal de
 * uma grade de cards todos do mesmo tamanho.
 */
function Manchete({ artigo }: { artigo: Artigo }) {
  return (
    <section className="mt-10 sm:mt-12">
      <Link
        href={`/novare-news/${artigo.slug}`}
        className="group grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
          <Image
            src={artigo.capa}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 620px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-accent-strong">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            {FAMILIAS[artigo.categoria]}
          </p>
          <h2 className="mt-3 text-balance font-display text-2xl font-bold leading-[1.15] tracking-tight text-primary underline-offset-[6px] group-hover:underline sm:text-3xl lg:text-[2.25rem] lg:leading-[1.1]">
            {artigo.titulo}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {artigo.resumo}
          </p>
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted-foreground">
            <MetaArtigo artigo={artigo} />
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent-strong">
            Ler a matéria
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}

/** Chamada de apoio: texto na frente, miniatura como âncora visual. */
function ChamadaSecundaria({ artigo }: { artigo: Artigo }) {
  return (
    <Link href={`/novare-news/${artigo.slug}`} className="group flex gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-24 sm:w-24">
        <Image
          src={artigo.capa}
          alt=""
          fill
          sizes="96px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0">
        <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {FAMILIAS[artigo.categoria]}
        </p>
        <h3 className="mt-1.5 font-display text-base font-bold leading-snug tracking-tight text-primary underline-offset-4 group-hover:underline">
          {artigo.titulo}
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted-foreground">
          <MetaArtigo artigo={artigo} />
        </p>
      </div>
    </Link>
  );
}

function CardArtigo({ artigo }: { artigo: Artigo }) {
  return (
    <Link
      href={`/novare-news/${artigo.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-subtle transition-all duration-300 hover:border-accent-soft hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={artigo.capa}
          alt=""
          fill
          sizes="(min-width: 640px) 340px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {FAMILIAS[artigo.categoria]}
        </p>
        <h3 className="mt-2 font-display text-base font-bold leading-snug tracking-tight text-primary underline-offset-4 group-hover:underline">
          {artigo.titulo}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {artigo.resumo}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-2xs text-muted-foreground">
          <MetaArtigo artigo={artigo} />
        </p>
      </div>
    </Link>
  );
}

function SidebarNews() {
  const recentes = artigosOrdenados().slice(0, 5);

  return (
    <aside className="min-w-0 space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="font-display text-2xs font-bold uppercase tracking-[0.16em] text-primary">
          Últimas publicações
        </h2>
        <ol className="mt-4 space-y-4">
          {recentes.map((a, i) => (
            <li
              key={a.slug}
              className="flex gap-3 border-t border-border pt-4 first:border-0 first:pt-0"
            >
              <span
                aria-hidden
                className="font-display text-xs font-bold tabular-nums text-muted-foreground"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/novare-news/${a.slug}`}
                  className="block text-sm font-semibold leading-snug text-primary underline-offset-4 hover:underline"
                >
                  {a.titulo}
                </Link>
                <time
                  dateTime={a.data}
                  className="mt-1 block text-2xs text-muted-foreground"
                >
                  {formatarData(a.data)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <UltimosVideos />
      <SigaInstagram />

      <div className="glass-card overflow-hidden rounded-2xl bg-primary p-5 text-white">
        <p className="text-2xs font-bold uppercase tracking-[0.16em] text-accent-claro">
          Sem cadastro
        </p>
        <h2 className="mt-1.5 font-display text-lg font-bold">
          Experimente o Vida Plan
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-white/75">
          Entre agora numa conta de demonstração — sem e-mail, sem senha — e
          veja o Marco Horizonte por dentro.
        </p>
        <a
          href="/vidaplan/login?demo=1"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-white/90"
        >
          Ver por dentro
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-2xl border border-accent-soft bg-accent-tint p-5">
        <h2 className="font-display text-2xs font-bold uppercase tracking-[0.16em] text-primary">
          Ferramentas mais usadas
        </h2>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {[
            { nome: "Salário Líquido", href: "/ferramentas/salario-liquido" },
            { nome: "Rescisão", href: "/ferramentas/rescisao" },
            { nome: "Juros Compostos", href: "/ferramentas/juros-compostos" },
            { nome: "Financiamento", href: "/ferramentas/financiamento?tipo=casa" },
            { nome: "13º Salário", href: "/ferramentas/decimo-terceiro" },
            { nome: "Férias", href: "/ferramentas/ferias" },
          ].map((f) => (
            <Link
              key={f.nome}
              href={f.href}
              className="rounded-full border border-accent/25 bg-white px-3 py-1.5 text-2xs font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-accent-strong"
            >
              {f.nome}
            </Link>
          ))}
        </div>
        <Link
          href="/aplicativos"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-strong hover:underline"
        >
          Ver as {CONTAGEM.ferramentas} ferramentas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}

/**
 * O banner do Workspace no meio da grade: é o "inscreva-se" dos portais,
 * traduzido para o que a casa realmente vende.
 */
function BannerWorkspace() {
  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-primary p-6 text-white sm:p-7">
      <div className="min-w-0">
        <p className="text-2xs font-bold uppercase tracking-[0.16em] text-accent-claro">
          Workspace Novare
        </p>
        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug sm:text-xl">
          Todas as ferramentas, o Vida Plan e a Íris num lugar só
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/75">
          E desconto exclusivo nas consultorias — com a primeira análise grátis.
        </p>
      </div>
      <Link
        href="/assinar"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-white/90"
      >
        Conhecer o Workspace
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
