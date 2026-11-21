import type { Metadata } from "next";
import { portais } from "@/lib/categorias";
import Link from "next/link";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { CalendarioEconomico } from "@/components/CalendarioEconomico";
import { FitaMercado } from "@/components/FitaMercado";
import { PaletaComandosSessao, TopoAppSessao } from "@/components/SessaoNoNavegador";
import { Rodape } from "@/components/Rodape";
import { getCalendarioEconomico } from "@/lib/calendario-economico";

export const metadata: Metadata = {
  title: "Calendário econômico",
  description:
    "Copom, IPCA, PIB, Fed, inflação e emprego dos EUA: as datas que mexem com juros, inflação e bolsa, em português e direto das fontes oficiais, com a projeção do mercado.",
  alternates: { canonical: "/calendario-economico" },
};

/* A página sai PRONTA e é remontada no máximo a cada 10 min — o mesmo prazo do
   calendário guardado em `lib/calendario-economico.ts` (21/11/2026). Antes era
   montada a cada visita. */
export const revalidate = 600;

/**
 * /calendario-economico (pedido do dono, 22/10/2026, a partir do do BTG).
 * Os dados e as fontes estão em `lib/calendario-economico.ts`; esta página
 * só monta a moldura (a mesma de /indicadores) e entrega à tela filtrável.
 */
export default async function CalendarioEconomicoPage() {
  const calendario = await getCalendarioEconomico();

  return (
    <div className="aurora-clara flex min-h-dvh flex-col bg-background pb-14 md:pb-0">
      <PaletaComandosSessao />
      <BarraLateral />
      <BarraInferior />

      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoAppSessao
          portais={portais("cliente")}
        />
        <FitaMercado />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6">
          <header className="topo-ferramenta secao-noite !mt-0">
            <p className="chapeu chapeu-claro">Agenda oficial</p>
            <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
              O que vai mexer com o mercado,{" "}
              <span className="text-accent-claro">em português.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
              Copom, inflação, PIB, Fed e emprego americano — com o resultado anterior, a projeção do
              mercado e o que cada evento muda no seu bolso. Direto das fontes oficiais.
            </p>
            <nav aria-label="Atalhos" className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/indicadores" className="pilula-vidro text-sm font-semibold transition-transform hover:-translate-y-0.5">
                Indicadores de hoje
              </Link>
              <Link href="/ferramentas/tesouro-direto" className="pilula-vidro text-sm font-semibold transition-transform hover:-translate-y-0.5">
                Simular o Tesouro Direto
              </Link>
            </nav>
          </header>

          {calendario.falhas.length > 0 && (
            <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm text-foreground">
              Uma fonte não respondeu agora: {calendario.falhas.join(", ")}. O restante do calendário está
              atualizado.
            </p>
          )}

          <CalendarioEconomico eventos={calendario.eventos} agora={new Date().toISOString()} />

          <p className="mt-12 text-2xs leading-relaxed text-muted-foreground">
            Fontes: IBGE (agenda de divulgações), Banco Central do Brasil (Copom, Focus, IBC-Br, Relatório
            de Política Monetária, Selic e IPCA), Federal Reserve e Bureau of Labor Statistics. A projeção
            é a mediana do boletim Focus. As datas são das fontes e podem mudar. Conteúdo educativo: não é
            recomendação de investimento.
          </p>
        </main>

        <Rodape />
      </div>
    </div>
  );
}
