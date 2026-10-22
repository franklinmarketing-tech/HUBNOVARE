"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Desfaz o "Mover para o Suporte" da aba Clientes (21/10/2026). Só existe
 * para conta movida À MÃO: a que caiu aqui pela regra (e-mail de teste,
 * equipe) voltaria sozinha para o Suporte no mesmo instante.
 */
export function VoltarParaClientes({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function voltar() {
    if (!window.confirm(`Voltar ${email} para a aba Clientes?\n\nA conta volta a entrar nas contagens.`)) return;
    setSalvando(true);
    setErro(null);
    const { error } = await createClient().rpc("hub_voltar_para_clientes", { p_usuario: id });
    setSalvando(false);
    if (error) return setErro(error.message);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={voltar}
        disabled={salvando}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
        Voltar para Clientes
      </button>
      {erro && (
        <p role="alert" className="mt-1 text-2xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
