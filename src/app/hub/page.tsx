import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, LogOut } from "lucide-react";
import { BotaoBusca } from "@/components/BotaoBusca";
import { PaletaComandos } from "@/components/PaletaComandos";
import { BarraMercado } from "@/components/BarraMercado";
import { CatalogoFiltrado } from "@/components/CatalogoFiltrado";
import { CardConsultoria } from "@/components/CardConsultoria";
import { CabecalhoSecao } from "@/components/CabecalhoSecao";
import { appsParaBusca, filtrosDoTopo } from "@/lib/navegacao";
import { CONSULTORIAS, ROTULO_DESCONTO } from "@/lib/consultoria";
import { ASSINATURA_ATIVA } from "@/lib/assinatura";
import { getPerfil } from "@/lib/perfil";
import { sair } from "./actions";

export const metadata: Metadata = { title: "Meu Hub" };

export default async function HubPage() {
  const perfil = await getPerfil();

  // O middleware já barra quem não tem sessão; isto é a segunda tranca.
  if (!perfil) redirect("/login");

  const apps = appsParaBusca(perfil.role, perfil.plano);
  const filtros = filtrosDoTopo(perfil.role);
  const ehCliente = perfil.role === "cliente";
  const assinante = !ehCliente || perfil.plano === "pro";

  return (
    <div className="aurora-clara min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <PaletaComandos apps={apps} />

      <header className="sticky top-0 z-20 border-b border-border/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 28, width: "auto" }}
            />
          </Link>

          <div className="ml-auto w-40 sm:w-56">
            <BotaoBusca />
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-foreground">
              {perfil.nome.split(" ")[0]}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {assinante ? "Workspace" : "Free"}
            </p>
          </div>

          <form action={sair}>
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        <BarraMercado />


        <div className="mt-7">
          <CatalogoFiltrado apps={apps} filtros={filtros} />
        </div>

        <section className="mt-12">
          <CabecalhoSecao titulo="Soluções e Consultorias Oficiais" total={CONSULTORIAS.length}>
            {/* Enquanto a assinatura não está à venda, não se anuncia número
                de desconto: a /assinar diz que não há o que comprar, e as duas
                telas não podem se contradizer. */}
            <span className="text-xs text-muted-foreground">
              {!ASSINATURA_ATIVA
                ? "Primeira análise gratuita"
                : assinante
                  ? `seu desconto de ${ROTULO_DESCONTO}`
                  : `${ROTULO_DESCONTO} para assinantes`}
            </span>
          </CabecalhoSecao>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CONSULTORIAS.map((item) => (
              <CardConsultoria
                key={item.slug}
                item={item}
                assinante={assinante}
              />
            ))}
          </div>
        </section>

        {!assinante && (
          <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent-soft bg-accent-tint p-5">
            <div>
              <h2 className="font-display text-lg font-bold text-primary">
                {ASSINATURA_ATIVA
                  ? "Assine o Workspace e leve tudo"
                  : "O Workspace inteiro está liberado"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {ASSINATURA_ATIVA
                  ? `Vida Plan, Íris e ${ROTULO_DESCONTO} em qualquer consultoria.`
                  : "Vida Plan, Íris e todas as ferramentas, sem assinatura."}
              </p>
            </div>
            <Link
              href="/assinar"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent-btn px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Ver o Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
