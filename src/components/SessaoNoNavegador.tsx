"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { AssistenteFerramentas } from "@/components/AssistenteFerramentas";
import { CatalogoFiltrado } from "@/components/CatalogoFiltrado";
import { appsParaBusca, filtrosDoTopo } from "@/lib/navegacao";
import { useQuemSou } from "@/lib/quem-sou";
import type { Portal } from "@/lib/categorias";

/**
 * AS PEÇAS DO TOPO PARA PÁGINA QUE SAI PRONTA (21/11/2026).
 *
 * Mesmos componentes de sempre (`TopoApp`, `PaletaComandos`,
 * `AssistenteFerramentas`), só que a pessoa logada vem do navegador
 * (`useQuemSou`) em vez do servidor. Página pública usa estas; página logada
 * (que já é montada no servidor) segue passando as props direto.
 */

export function useAppsDaBusca() {
  const { perfil } = useQuemSou();
  return useMemo(
    () => appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil),
    [perfil],
  );
}

export function TopoAppSessao({ portais, comBusca }: { portais?: Portal[]; comBusca?: boolean }) {
  const { pronto, perfil, assinante, notificacoes } = useQuemSou();
  return (
    <TopoApp
      portais={portais}
      comBusca={comBusca}
      carregando={!pronto}
      nome={perfil?.nome ?? null}
      email={perfil?.email}
      assinante={assinante}
      admin={perfil?.role === "admin"}
      logado={!!perfil}
      notificacoes={notificacoes}
    />
  );
}

export function PaletaComandosSessao() {
  return <PaletaComandos apps={useAppsDaBusca()} />;
}

export function AssistenteFerramentasSessao() {
  return <AssistenteFerramentas apps={useAppsDaBusca()} />;
}

/** O catálogo de /aplicativos: quem está logado vê aberto o que a conta libera. */
export function CatalogoFiltradoSessao({ filtros }: { filtros: ReturnType<typeof filtrosDoTopo> }) {
  return <CatalogoFiltrado apps={useAppsDaBusca()} filtros={filtros} />;
}

/**
 * O link do canto das vitrines (Íris, Consultoria): "Voltar ao Workspace" para
 * quem está logado, "Entrar" para quem não está. Enquanto lê, guarda o lugar.
 */
export function LinkVoltarOuEntrar() {
  const { pronto, perfil } = useQuemSou();
  return (
    <Link
      href={perfil ? "/" : "/login"}
      className={`text-xs font-medium text-muted-foreground transition-[color,opacity] hover:text-primary ${pronto ? "opacity-100" : "opacity-0"}`}
    >
      {perfil ? "Voltar ao Workspace" : "Entrar"}
    </Link>
  );
}
