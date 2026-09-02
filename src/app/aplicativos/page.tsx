import { Suspense } from "react";
import type { Metadata } from "next";
import { BarraLateral } from "@/components/BarraLateral";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { CatalogoFiltrado } from "@/components/CatalogoFiltrado";
import { appsParaBusca, filtrosDoTopo } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";

export const metadata: Metadata = {
  title: "Aplicativos",
  description:
    "Todos os aplicativos financeiros da Novare: organização, investimentos, crédito, patrimônio e ferramentas inteligentes.",
};

/** O catálogo completo. Os portais da home entram aqui já filtrados. */
export default async function AplicativosPage() {
  const perfil = await getPerfil();
  const notificacoes = await getNotificacoes();
  const apps = appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil);
  const filtros = filtrosDoTopo("cliente");
  const assinante =
    perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  return (
    <div className="aurora-clara min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <PaletaComandos apps={apps} />
      <BarraLateral />

      <div className="md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          email={perfil?.email}
          assinante={assinante}
          admin={perfil?.role === "admin"}
          logado={!!perfil}
          notificacoes={notificacoes}
        />

        <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
          <h1 className="titulo-secao text-2xl sm:text-[2rem]">
            Todos os aplicativos
          </h1>
          <p className="mt-2.5 max-w-xl text-muted-foreground">
            {apps.filter((a) => !a.emBreve).length} ferramentas prontas para
            usar. Filtre por área ou busque com ⌘K.
          </p>

          <div className="mt-7">
            <Suspense fallback={null}>
              <CatalogoFiltrado apps={apps} filtros={filtros} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
