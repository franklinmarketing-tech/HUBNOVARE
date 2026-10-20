import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { Rodape } from "@/components/Rodape";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";
import { GRUPOS, getCartoesIndicadores, type CartaoIndicador } from "@/lib/indicadores";
import { Minigrafico } from "@/components/Minigrafico";

export const metadata: Metadata = {
  title: "Indicadores econômicos hoje",
  description:
    "Selic, CDI, IPCA, IGP-M, INCC, dólar, euro, IBC-Br e desemprego, com os dados oficiais do Banco Central — e o que cada um muda no seu bolso.",
  alternates: { canonical: "/indicadores" },
};

/**
 * OS INDICADORES DA ECONOMIA, EM PORTUGUÊS (pedido do Jefferson, 20/10/2026,
 * no molde da página de índices da Nord). Os dados vêm de
 * `lib/indicadores.ts`; esta página só organiza: topo noite, um bloco por
 * grupo, um cartão por índice com o minigráfico dos últimos 12 meses.
 */
export default async function IndicadoresPage() {
  const [perfil, notificacoes, cartoes] = await Promise.all([
    getPerfil(),
    getNotificacoes(),
    getCartoesIndicadores(),
  ]);
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6">
          <header className="topo-ferramenta secao-noite !mt-0">
            <p className="chapeu chapeu-claro">Dados do Banco Central</p>
            <h1 className="mt-3 max-w-2xl font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
              Os números da economia,{" "}
              <span className="text-accent-claro">em português.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
              Juros, inflação, câmbio e emprego com os dados oficiais — e o que
              cada um muda no seu bolso. Atualizados todos os dias.
            </p>
            <nav aria-label="Grupos de indicadores" className="mt-7 flex flex-wrap gap-2.5">
              {GRUPOS.map((g) => (
                <a key={g} href={`#${ancora(g)}`} className="pilula-vidro text-sm font-semibold transition-transform hover:-translate-y-0.5">
                  {g}
                </a>
              ))}
            </nav>
          </header>

          {GRUPOS.map((g) => {
            const doGrupo = cartoes.filter((c) => c.grupo === g);
            if (!doGrupo.length) return null;
            return (
              <section key={g} id={ancora(g)} aria-labelledby={`${ancora(g)}-t`} className="mt-12 scroll-mt-24">
                <p className="chapeu chapeu-ciano">Indicadores</p>
                <h2 id={`${ancora(g)}-t`} className="titulo-cp mt-2 text-2xl sm:text-[2rem]">{g}</h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {doGrupo.map((c) => (
                    <li key={c.chave}>
                      <Cartao c={c} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <p className="mt-12 text-2xs leading-relaxed text-muted-foreground">
            Fonte: Sistema Gerenciador de Séries Temporais do Banco Central (com
            dados de IBGE e FGV). Conteúdo educativo: os números explicam a
            economia, não são recomendação de investimento.
          </p>
        </main>

        <Rodape />
      </div>
    </div>
  );
}

const ancora = (g: string) =>
  g.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");

function Cartao({ c }: { c: CartaoIndicador }) {
  return (
    <article className="cartao-cp cartao-fita-ciano flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-primary">{c.nome}</h3>
        {c.historico.length > 1 && <Minigrafico pontos={c.historico} />}
      </div>

      {c.valor ? (
        <>
          <p className="mt-2 font-display text-[2.25rem] font-medium leading-none tracking-[-0.04em] text-primary tabular-nums">
            {c.valor}
          </p>
          <p className="mt-1.5 text-2xs text-muted-foreground">{c.referencia}</p>
          {c.extra && (
            <p className="mt-2 inline-flex w-fit rounded-full bg-ciano-tint px-2.5 py-1 text-2xs font-semibold text-ciano-forte">
              {c.extra}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Indisponível agora — o Banco Central não respondeu. Tente mais tarde.</p>
      )}

      <div className="painel-gelo mt-4 space-y-2 p-4 text-sm leading-relaxed">
        <p className="text-slate-700">
          <b className="font-semibold text-primary">O que é: </b>
          {c.oQueE}
        </p>
        <p className="text-slate-700">
          <b className="font-semibold text-primary">Para você: </b>
          {c.paraVoce}
        </p>
      </div>

      {c.link && (
        <Link
          href={c.link.href}
          className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-accent-strong"
        >
          {c.link.rotulo}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </article>
  );
}
