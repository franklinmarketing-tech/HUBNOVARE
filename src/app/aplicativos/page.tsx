import { Suspense } from "react";
import type { Metadata } from "next";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { CatalogoFiltrado } from "@/components/CatalogoFiltrado";
import { appsParaBusca, filtrosDoTopo } from "@/lib/navegacao";
import { CONTAGEM } from "@/lib/apps";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";
import { FitaMercado } from "@/components/FitaMercado";

export const metadata: Metadata = {
  title: "Aplicativos",
  description:
    "Todas as ferramentas de dinheiro da Novare, de graça: salário, rescisão, financiamento, reserva, investimento e mais. Sem cadastro e sem pegar o seu cartão.",
  alternates: { canonical: "/aplicativos" },
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
    <div className="aurora-clara min-h-dvh pb-14 md:pb-0">
      <PaletaComandos apps={apps} />
      <BarraLateral />
      <BarraInferior />

      <div className="md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          email={perfil?.email}
          assinante={assinante}
          admin={perfil?.role === "admin"}
          logado={!!perfil}
          notificacoes={notificacoes}
        />
        {/* A fita do mercado, logo abaixo do topo (TradeMap, 21/10/2026). */}
        <FitaMercado />

        <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
          <h1 className="titulo-secao text-2xl sm:text-[2rem]">
            Tudo o que a Novare tem
          </h1>
          {/* Dois números, não um. Antes esta linha somava tudo e chamava o
              conjunto de "ferramentas" — mas as consultorias entravam na
              conta, e consultoria é gente atendendo, não calculadora. Dizia
              25 enquanto a home somava 20 e a /assinar anunciava outro
              número ainda. Os dois vêm de CONTAGEM, a mesma fonte que as
              outras telas usam. */}
          {/* Três números, não dois. Assim que as ferramentas de assinante
              entraram no catálogo, dizer "28 ferramentas prontas para usar"
              passou a incluir 8 que só abrem pagando — e "pronta para usar"
              é exatamente o que elas NÃO estão para quem chega de busca. */}
          <p className="mt-2.5 max-w-xl text-muted-foreground">
            {/* ⚠️ AQUI DIZIA "N exclusivas de assinante", e o N foi a ZERO em
                13/09/2026, quando as oito ferramentas pagas saíram do catálogo
                por duplicarem o FINCASH. "0 exclusivas" é pior que silêncio.
                A frase passou a dizer o que é verdade hoje: as ferramentas
                são abertas, e o que se assina são os produtos. */}
            {CONTAGEM.ferramentas} ferramentas prontas para usar, de graça e
            sem cadastro, e {CONTAGEM.consultorias}{" "}
            {/* ⚠️ Concordância de verdade: a página dizia "1 formatos" desde
                que sobrou um serviço só. O número vem de CONTAGEM, então o
                plural tem de vir do número, não escrito à mão. */}
            {CONTAGEM.consultorias === 1 ? "serviço" : "serviços"} de
            consultoria. Filtre por área ou use a busca.
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
