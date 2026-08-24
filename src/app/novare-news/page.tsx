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
    ? "Todos os artigos"
    : (FAMILIAS[categoriaAtiva as Familia] ?? "Artigos");

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
          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-4xl">
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
                {listaBase.length}{" "}
                {listaBase.length === 1 ? "publicação" : "publicações"}
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
      aria-pressed={ativo}
      className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
        ativo
          ? "bg-accent-btn text-accent-foreground shadow-[0_6px_16px_-6px_hsl(16_80%_45%_/_0.6)]"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}

function CardArtigo({ artigo, grande = false }: { artigo: Artigo; grande?: boolean }) {
  return (
    <Link
      href={`/novare-news/${artigo.slug}`}
      className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-primary/30"
    >
      <div className={`relative overflow-hidden ${grande ? "h-56 sm:h-64" : "h-32"}`}>
        <Image
          src={artigo.capa}
          alt=""
          fill
          sizes={grande ? "480px" : "320px"}
          className="object-cover opacity-90 grayscale-[15%] transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary backdrop-blur-sm">
          {FAMILIAS[artigo.categoria]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className={`font-display font-bold leading-snug text-foreground ${
            grande ? "text-xl sm:text-2xl" : "text-[15px]"
          }`}
        >
          {artigo.titulo}
        </h3>
        <p
          className={`mt-1.5 flex-1 leading-relaxed text-muted-foreground ${
            grande ? "line-clamp-3 text-sm" : "line-clamp-2 text-xs"
          }`}
        >
          {artigo.resumo}
        </p>
        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
          <span>{formatarData(artigo.data)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {artigo.tempoLeituraMin} min
          </span>
        </div>
      </div>
    </Link>
  );
}

function SidebarNews() {
  const recentes = artigosOrdenados().slice(0, 5);

  return (
    <aside className="space-y-5">
      <UltimosVideos />
      <SigaInstagram />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-foreground">Últimas publicações</h2>
        <ul className="mt-3 space-y-3">
          {recentes.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/novare-news/${a.slug}`}
                className="block text-[13px] font-medium leading-snug text-slate-600 hover:text-primary"
              >
                {a.titulo}
              </Link>
              <span className="text-[11px] text-slate-500">{formatarData(a.data)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl p-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(16_90%_75%)]">
          Sem cadastro
        </p>
        <h2 className="mt-1.5 font-display text-lg font-bold">
          Experimente o Vida Plan
        </h2>
        <p className="mt-1.5 text-xs text-white/70">
          Entre agora numa conta de demonstração — sem e-mail, sem senha — e
          veja o Marco Horizonte por dentro.
        </p>
        <a
          href="/vidaplan/login?demo=1"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-primary hover:bg-white/90"
        >
          Ver por dentro
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-2xl border border-accent-soft bg-accent-tint p-5">
        <h2 className="text-sm font-bold text-primary">Ferramentas mais usadas</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
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
              className="rounded-full border border-accent/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-accent hover:text-accent-strong"
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
    <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(16_90%_75%)]">
          Workspace Novare
        </p>
        <h3 className="mt-1 font-display text-lg font-bold sm:text-xl">
          Todas as ferramentas, o Vida Plan e a Íris num lugar só
        </h3>
        <p className="mt-1 text-sm text-white/70">
          E desconto exclusivo nas consultorias — com a primeira análise grátis.
        </p>
      </div>
      <Link
        href="/assinar"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
      >
        Conhecer o Workspace
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
