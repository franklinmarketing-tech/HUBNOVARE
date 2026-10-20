import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
    <div className="aurora-clara flex min-h-dvh flex-col bg-background pb-14 md:pb-0">
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
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-ciano-forte">
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

/**
 * Logado sem painel: o caminho para ele nascer, não uma venda.
 *
 * ⚠️ ATÉ 20/10/2026 ERA "Este painel é do Workspace · Assinar o …", com preço
 * e garantia, para quem já estava logado — numa casa em que tudo é gratuito.
 * O dono: "não existe essa de assinar quando estou logado". O painel do mês
 * nasce no FINCASH, que é grátis.
 */
function ConvitePainel() {
  return (
    <section className="cine secao-noite mt-6 rounded-[1.75rem] p-8 sm:p-10">
      <p className="chapeu chapeu-claro">Seu painel</p>
      <h2 className="mt-3 font-display text-2xl font-medium leading-tight tracking-[-0.03em] sm:text-4xl">
        Seu painel nasce no <span className="text-accent-claro">FINCASH</span>
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">
        Lance as contas do mês — é grátis — e os seus números aparecem aqui.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href="/fincash/app" className="group btn-cp">
          Abrir meu FINCASH
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/exame-saude-financeira" className="text-sm font-semibold text-ciano-claro underline-offset-4 hover:underline">
          Fazer o Exame de Saúde Financeira
        </Link>
      </div>
    </section>
  );
}
