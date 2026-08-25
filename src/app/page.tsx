import Link from "next/link";
import Image from "next/image";
import { ArrowRight, HardHat, Scale, Smile, Sparkles, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { artigosOrdenados } from "@/lib/news";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { RoboNovare } from "@/components/RoboNovare";
import { BarraLateral } from "@/components/BarraLateral";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CardPortal } from "@/components/CardPortal";
import { CardPlanejamentoHome } from "@/components/CardPlanejamentoHome";
import { Rodape } from "@/components/Rodape";
import { portais } from "@/lib/categorias";
import { appsParaBusca } from "@/lib/navegacao";
import { PROFISSOES } from "@/lib/profissoes";
import { getPerfil } from "@/lib/perfil";

/**
 * A porta de entrada do ecossistema: cinco áreas como portais grandes,
 * o Workspace em destaque e o retorno de quem já usou. O catálogo
 * completo com todos os aplicativos vive em /aplicativos.
 */
export default async function Home() {
  const perfil = await getPerfil();
  const apps = appsParaBusca("cliente", "free");
  const areas = portais("cliente");
  const assinante =
    perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  return (
    <div className="aurora-clara flex min-h-dvh flex-col bg-gradient-to-b from-slate-50 to-white">
      <PaletaComandos apps={apps} />
      <BarraLateral />

      {/* `flex-1` já estica esta coluna até o fim: repetir `min-h-dvh` aqui
          (o pai já tem) somava altura que não dava para rolar, e os últimos
          pixels do rodapé ficavam fora de alcance no celular. */}
      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          assinante={assinante}
          logado={!!perfil}
          portais={areas}
        />

        {/* A home cabe em uma tela porque o CONTEÚDO é compacto, não porque
            está recortado: já tentamos `overflow-hidden` aqui e ele cortava
            blocos em silêncio e espremia o rodapé contra a borda. */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2.5 px-5 pb-3 pt-2.5 [@media(max-height:800px)]:gap-2">
          {/* Fita de indicadores do mercado ao vivo (SELIC, CDI, IPCA...) */}
          <BarraMercado />

          <section className="surgir flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="titulo-secao text-2xl sm:text-[1.9rem] [@media(max-height:820px)]:text-xl">
                Ecossistema Novare
              </h1>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground [@media(max-height:820px)]:hidden">
                Organizar, investir e decidir com clareza. Sem comissão, sem
                letra miúda.
              </p>
            </div>
            <BuscaDestaque />
          </section>

          {/* O Planejamento Financeiro abre a fileira com o selo PRO; as áreas gratuitas
              seguem com o selo Grátis. Um olhar já diz o que se compra. */}
          <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="surgir">
              <CardPlanejamentoHome />
            </div>
            {areas.map((area, i) => (
              <div
                key={area.chave}
                className="surgir"
                style={{ animationDelay: `${(i + 1) * 70}ms` }}
              >
                <CardPortal portal={area} />
              </div>
            ))}
          </section>

          {/* Em tela baixa (notebook 768px) o robô sai para a home caber
              inteira sem rolagem — ele é enfeite vivo, não conteúdo. */}
          <div className="[@media(max-height:820px)]:hidden">
            <RoboNovare />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <CardDiagnosticoDestaque />
            <CardNovareNews />
          </div>
        </main>

        <Rodape />
      </div>
    </div>
  );
}

/**
 * As carreiras que a Novare já atende.
 *
 * Cada uma leva à página que fala do dinheiro DAQUELA profissão. O gancho
 * abaixo é a dor real listada em `src/lib/profissoes.ts` — não é slogan: é o
 * que trava o dinheiro de quem vive daquela carreira, resumido numa linha.
 * Ver a própria dor escrita é o que faz a pessoa clicar; "mapear suas
 * finanças" não descreve ninguém.
 */
const CARREIRAS: { slug: string; curto: string; icone: LucideIcon }[] = [
  { slug: "medicos", curto: "Médico", icone: Stethoscope },
  { slug: "dentistas", curto: "Dentista", icone: Smile },
  { slug: "engenheiros-e-arquitetos", curto: "Engenheiro", icone: HardHat },
  { slug: "advogados", curto: "Advogado", icone: Scale },
];

/**
 * O gancho vem da PRIMEIRA dor cadastrada da carreira, não de um texto solto
 * aqui: assim o card e a página nunca contam histórias diferentes sobre a
 * mesma profissão.
 */
const ganchoDa = (slug: string) =>
  PROFISSOES.find((p) => p.slug === slug)?.dores[0]?.titulo ?? "";

/**
 * O Diagnóstico Gratuito, nichado por profissão.
 *
 * Antes era um banner genérico — "mapear suas finanças, investimentos e
 * metas" —, e genérico não converte porque não descreve ninguém: o médico não
 * se reconhece ali, o advogado também não.
 *
 * Agora a primeira coisa que a pessoa faz é se identificar, e cada tile traz a
 * foto da carreira sob um véu navy, o ícone e a dor específica. O clique já a
 * leva para uma página escrita para ela.
 *
 * Quem não está nas quatro continua com a porta aberta: o exame de saúde
 * financeira serve a qualquer profissão.
 */
function CardDiagnosticoDestaque() {
  return (
    <div className="glass-card relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className="tile-cine flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success text-white shadow-md shadow-success/20">
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-bold text-primary">
              Diagnóstico Financeiro
            </span>
            <span className="rounded-md bg-success/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success-strong">
              gratuito
            </span>
          </div>
          <p className="mt-1 max-w-xl text-xs leading-snug text-muted-foreground sm:text-sm [@media(max-height:800px)]:hidden">
            O que trava o seu dinheiro depende da sua profissão. Escolha a sua.
          </p>
        </div>
      </div>

      <ul className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 [@media(max-height:920px)]:mt-3 [@media(max-height:680px)]:hidden">
        {CARREIRAS.map(({ slug, curto, icone: Icone }) => (
          <li key={slug}>
            <Link
              href={`/profissionais/${slug}`}
              className="group/carreira relative block h-[4.5rem] overflow-hidden rounded-xl border border-border transition-all hover:-translate-y-0.5 hover:shadow-card sm:h-24 [@media(max-height:920px)]:h-[4.25rem] [@media(max-height:760px)]:h-[3.25rem] [@media(max-height:680px)]:h-10"
            >
              {/* `unoptimized`: são quatro miniaturas de 50–100 KB no caminho
                  crítico da home. Passá-las pelo otimizador do Next cria quatro
                  round-trips a mais e, com as quatro simultâneas, o otimizador
                  local trava e as imagens nunca chegam a pintar. Servir o JPEG
                  como está é mais rápido e não tem esse risco. */}
              <Image
                src={`/profissoes/${slug}.jpg`}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 640px) 45vw, 160px"
                className="object-cover transition-transform duration-500 group-hover/carreira:scale-105"
              />
              {/* Véu navy: sem ele o texto branco some sobre a foto clara. */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(215 55% 15% / 0.35) 0%, hsl(215 60% 10% / 0.88) 72%)",
                }}
              />
              <span className="absolute inset-0 flex flex-col justify-end p-2.5 text-white">
                <span className="flex items-center gap-1.5">
                  <Icone className="h-3.5 w-3.5 shrink-0 text-accent-claro" strokeWidth={2} />
                  <span className="truncate font-display text-xs font-bold">{curto}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-white/70 [@media(max-height:760px)]:hidden">
                  {ganchoDa(slug)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Versão de tela baixa: os mesmos quatro destinos, em chips. */}
      <ul className="mt-2.5 hidden flex-wrap gap-1.5 [@media(max-height:680px)]:flex">
        {CARREIRAS.map(({ slug, curto, icone: Icone }) => (
          <li key={slug}>
            <Link
              href={`/profissionais/${slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-2xs font-bold text-primary transition-colors hover:border-accent hover:text-accent-strong"
            >
              <Icone className="h-3.5 w-3.5 shrink-0 text-accent-strong" strokeWidth={2} />
              {curto}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 [@media(max-height:680px)]:mt-2">
        <Link
          href="/exame-saude-financeira"
          className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-success-strong"
        >
          <span className="[@media(max-height:680px)]:hidden">Outra profissão? </span>
          Faça o exame
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/consultoria/diagnostico"
          className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
        >
          Falar com um especialista
        </Link>
      </div>
    </div>
  );
}

/**
 * O Novare News na home: um produto gratuito da casa, como as ferramentas.
 * Mostra a manchete mais recente para o canal parecer o que ele é — algo
 * vivo, não um link institucional parado.
 */
function CardNovareNews() {
  const recente = artigosOrdenados()[0];

  return (
    <Link
      href="/novare-news"
      className="glass-card group relative flex h-full flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 pl-5 pr-5 transition-colors hover:border-primary/25"
    >
      {/* Imagem de redação sangrando pela direita: o canal precisa
          parecer jornal, não um aviso de sistema. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden sm:block">
        <Image
          src="/cards/card-novare.webp"
          alt=""
          fill
          sizes="380px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, white 0%, transparent 55%)",
          }}
        />
      </div>

      <div className="relative flex min-w-0 items-center gap-4">
        {/* O "N" da marca no lugar do ícone genérico. */}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary">
          <Image
            src="/icon.svg"
            alt="Novare"
            width={44}
            height={44}
            className="h-11 w-11 object-cover"
          />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-primary">
              Novare News
            </span>
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Grátis
            </span>
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground [@media(max-height:720px)]:hidden">
            {recente.titulo}
          </p>
        </div>
      </div>
      <span className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-primary-soft">
        Ler agora
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
