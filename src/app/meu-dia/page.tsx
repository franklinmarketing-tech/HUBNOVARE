import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { Rodape } from "@/components/Rodape";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { PainelMeuDia } from "@/components/PainelMeuDia";
import { portais } from "@/lib/categorias";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";
import { ASSINATURA_PRECO_ROTULO, ASSINATURA_TRIAL_DIAS } from "@/lib/assinatura";

export const metadata: Metadata = {
  title: "Meu dia",
  description:
    "O painel da sua vida financeira: saúde, plano de vida, reserva e as próximas ações — tudo num lugar só.",
  // Painel privado: não faz sentido no índice do Google.
  robots: { index: false, follow: false },
};

/**
 * O painel do assinante em tamanho real.
 *
 * A home é uma vitrine e cabe numa tela; ela mostra o RESUMO de como a
 * pessoa está. Aqui é o oposto: nenhuma venda, nenhum card de produto — só
 * os números dela, em blocos modulares. É a página para quem já pagou e
 * abre o Hub de manhã para saber o que fazer hoje.
 *
 * Quem não assina não vê painel nenhum: vê o convite. Deixar a casca do
 * painel visível com números zerados seria pior que não ter a página.
 */
export default async function MeuDiaPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=%2Fmeu-dia");

  const notificacoes = await getNotificacoes();
  const apps = appsParaBusca(perfil.role, perfil.plano, true);
  const areas = portais("cliente");
  const assinante = perfil.plano === "pro" || perfil.role !== "cliente";

  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const saudacao =
    hora < 6 || hora >= 18 ? "Boa noite" : hora < 12 ? "Bom dia" : "Boa tarde";

  const hoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const primeiraPalavra = perfil.nome?.trim().split(/\s+/)[0] ?? "";
  const primeiroNome = /^[a-záàâãéêíóôõúüç]{2,15}$/i.test(primeiraPalavra)
    ? primeiraPalavra[0].toUpperCase() + primeiraPalavra.slice(1).toLowerCase()
    : undefined;

  return (
    <div className="aurora-clara flex min-h-dvh flex-col bg-gradient-to-b from-creme via-creme to-white pb-14 md:pb-0">
      <RevelarAoRolar />
      <PaletaComandos apps={apps} />
      <BarraLateral />
      <BarraInferior />

      <div className="flex flex-1 flex-col md:pl-[72px]">
        <TopoApp
          nome={perfil.nome ?? null}
          email={perfil.email}
          assinante={assinante}
          admin={perfil.role === "admin"}
          logado
          portais={areas}
          notificacoes={notificacoes}
          comBusca
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-4">
          <header className="cine">
            <p className="text-2xs font-bold uppercase tracking-[0.16em] text-ciano-forte">
              {hoje}
            </p>
            <h1 className="titulo-secao mt-1 text-2xl sm:text-3xl">
              {primeiroNome ? `${saudacao}, ${primeiroNome}` : `${saudacao}!`}
            </h1>
          </header>

          {assinante ? (
            <PainelMeuDia />
          ) : (
            <ConvitePainel />
          )}
        </main>

        <Rodape />
      </div>
    </div>
  );
}

/** Quem ainda não assina não vê painel vazio — vê o convite. */
function ConvitePainel() {
  return (
    <section
      className="cine palco-cta mt-6 overflow-hidden rounded-3xl p-8 text-white sm:p-10"
      style={{
        background:
          "linear-gradient(140deg, hsl(216 54% 16%) 0%, hsl(219 58% 11%) 100%)",
      }}
    >
      <Crown className="h-6 w-6 text-warning-claro" strokeWidth={1.75} />
      <h2 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">
        Este painel é do Workspace
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
        Sua nota de saúde financeira, o plano de vida, a reserva e as próximas
        ações — calculados a partir dos seus números, atualizados a cada mês.
      </p>
      <Link
        href="/assinar"
        className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-warning-claro px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-warning"
      >
        Começar {ASSINATURA_TRIAL_DIAS} dias grátis
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <p className="mt-3 text-xs text-white/50">
        Depois {ASSINATURA_PRECO_ROTULO}/mês · sem cartão para testar
      </p>
    </section>
  );
}
