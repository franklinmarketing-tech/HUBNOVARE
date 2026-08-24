import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { artigosOrdenados } from "@/lib/news";
import { BuscaDestaque } from "@/components/BuscaDestaque";
import { RoboNovare } from "@/components/RoboNovare";
import { BarraLateral } from "@/components/BarraLateral";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CardPortal } from "@/components/CardPortal";
import { CardVidaPlanHome } from "@/components/CardVidaPlanHome";
import { Rodape } from "@/components/Rodape";
import { portais } from "@/lib/categorias";
import { appsParaBusca } from "@/lib/navegacao";
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

          {/* As cinco áreas, cada uma com a sua cor. */}
          <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {areas.map((area, i) => (
              <div
                key={area.chave}
                className="surgir"
                style={{ animationDelay: `${i * 70}ms` }}
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

          {/* O único produto pago tem lugar só dele, antes das iscas grátis. */}
          <CardVidaPlanHome />

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
 * Banner de conversão do Diagnóstico Gratuito: a porta de entrada principal de leads.
 */
function CardDiagnosticoDestaque() {
  return (
    <div className="glass-card group relative flex h-full flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50/80 via-white to-white p-4 sm:p-5 shadow-sm transition-all hover:border-emerald-500/50">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-slate-900">
              Diagnóstico Financeiro Individual
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              100% Gratuito
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
            Uma sessão com especialista para mapear suas finanças, investimentos e metas sem compromisso.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          href="/exame-saude-financeira"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:text-sm"
        >
          Fazer Exame (0–100)
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/consultoria#diagnostico"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          Agendar com especialista
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
