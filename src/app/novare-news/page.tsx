import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
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

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
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
  const destaques = semFiltro && pagina === 1 ? todos.filter((a) => a.destaque).slice(0, 3) : [];

  const listaBase = semFiltro
    ? todos.filter((a) => !destaques.includes(a))
    : todos.filter((a) => a.categoria === categoriaAtiva);

  const totalPaginas = Math.max(1, Math.ceil(listaBase.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const pagina_ = listaBase.slice(inicio, inicio + POR_PAGINA);

  const linkFiltro = (cat: string) => (cat === "todos" ? "/novare-news" : `/novare-news?categoria=${cat}`);
  const linkPagina = (n: number) =>
    `/novare-news?${semFiltro ? "" : `categoria=${categoriaAtiva}&`}pagina=${n}`;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <CabecalhoNews />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Novare News
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
            Dinheiro explicado, sem letra miúda
          </h1>
          <p className="mt-3 text-muted-foreground">
            Salário, rescisão, investimento e o dia a dia das contas — cada
            artigo termina na ferramenta que resolve o que você acabou de ler.
          </p>
        </header>

        {/* Categorias: mesmas áreas do catálogo, para não inventar um
            segundo vocabulário de navegação. */}
        <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-1.5">
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {/* Destaques: os 3 primeiros, maiores — só na home do canal. */}
            {destaques.length > 0 && (
              <section className="grid gap-4 sm:grid-cols-2">
                {destaques.map((a, i) => (
                  <div key={a.slug} className={i === 0 ? "sm:col-span-2" : ""}>
                    <CardArtigo artigo={a} grande={i === 0} />
                  </div>
                ))}
              </section>
            )}

            {pagina_.length > 0 ? (
              <section
                className={`grid gap-4 sm:grid-cols-2 ${destaques.length > 0 ? "mt-8" : ""}`}
              >
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
              <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
                Ainda não tem artigo nessa categoria. Volte em breve.
              </p>
            )}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5">
                {pagina > 1 && (
                  <Link
                    href={linkPagina(pagina - 1)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    « Anterior
                  </Link>
                )}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={linkPagina(n)}
                    aria-current={n === pagina ? "page" : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
                      n === pagina
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {pagina < totalPaginas && (
                  <Link
                    href={linkPagina(pagina + 1)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Próxima »
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
