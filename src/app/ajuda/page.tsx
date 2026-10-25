import type { Metadata } from "next";
import Link from "next/link";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { CentralAjuda } from "@/components/CentralAjuda";
import { FitaMercado } from "@/components/FitaMercado";
import { PaletaComandos } from "@/components/PaletaComandos";
import { Rodape } from "@/components/Rodape";
import { TopoApp } from "@/components/TopoApp";
import { appsParaBusca } from "@/lib/navegacao";
import { getNotificacoes } from "@/lib/notificacoes";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Central de ajuda",
  description:
    "Vídeos curtos e manuais passo a passo de todas as ferramentas gratuitas da Novare e de cada tela do FINCASH. Busque pela sua dúvida.",
  alternates: { canonical: "/ajuda" },
};

/**
 * /ajuda — A CENTRAL DE AJUDA (25/10/2026). Os manuais vêm de `lib/manuais`;
 * a busca e a janela ficam em `CentralAjuda` (cliente). Moldura igual à do
 * /calendario-economico.
 */
export default async function AjudaPage() {
  const [perfil, notificacoes] = await Promise.all([getPerfil(), getNotificacoes()]);
  const apps = appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil);
  const assinante = perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  return (
    <div className="aurora-clara flex min-h-dvh flex-col bg-background pb-14 md:pb-0">
      <PaletaComandos apps={apps} />
      <BarraLateral />
      <BarraInferior />

      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          email={perfil?.email}
          assinante={assinante}
          admin={perfil?.role === "admin"}
          logado={!!perfil}
          notificacoes={notificacoes}
        />
        <FitaMercado />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6">
          <header className="topo-ferramenta secao-noite !mt-0">
            <p className="chapeu chapeu-claro">Central de ajuda</p>
            <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
              Aprenda cada tela{" "}
              <span className="text-accent-claro">em 15 segundos.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
              Um vídeo curto e um manual passo a passo para cada ferramenta e cada tela do FINCASH. Digite
              sua dúvida e veja só o que importa.
            </p>
            <nav aria-label="Atalhos" className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/aplicativos" className="pilula-vidro text-sm font-semibold transition-transform hover:-translate-y-0.5">
                Ver as ferramentas
              </Link>
              <Link href="/fincash" className="pilula-vidro text-sm font-semibold transition-transform hover:-translate-y-0.5">
                Conhecer o FINCASH
              </Link>
            </nav>
          </header>

          <CentralAjuda />
        </main>

        <Rodape />
      </div>
    </div>
  );
}
