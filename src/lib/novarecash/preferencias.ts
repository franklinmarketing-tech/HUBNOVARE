import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O "JÁ VIU" DO GUIA DE PRIMEIRO USO (05/11/2026): as boas-vindas e o cartão
 * "Primeiros passos" dispensado.
 *
 * Guardado em DOIS lugares:
 *   • no banco, `ncash_preferencias` (`supabase/novarecash_guia.sql`), para valer
 *     em qualquer aparelho — é da PESSOA (auth.uid()), não do NovareCash aberto:
 *     na conta compartilhada, cada um vê as próprias boas-vindas;
 *   • no localStorage, para não perguntar ao banco toda vez e para funcionar
 *     ANTES de o SQL rodar. Sem a tabela, só o localStorage vale — sem erro.
 *
 * Módulo comum (sem "use client"): o Início lê no servidor, as boas-vindas no navegador.
 */

export type CampoPreferencia = "boas_vindas_em" | "checklist_dispensado_em";

export type Preferencias = { boasVindas: boolean; checklistDispensado: boolean };

/** `null` = não deu para ler (tabela ainda não existe, sem rede): quem chama usa o localStorage. */
export async function lerPreferencias(sb: SupabaseClient, uid: string): Promise<Preferencias | null> {
  try {
    const { data, error } = await sb
      .from("ncash_preferencias")
      .select("boas_vindas_em, checklist_dispensado_em")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) return null;
    return {
      boasVindas: Boolean(data?.boas_vindas_em),
      checklistDispensado: Boolean(data?.checklist_dispensado_em),
    };
  } catch {
    return null;
  }
}

/** Grava "agora" no campo. Falhou (sem tabela)? Fica só o localStorage; nada a avisar. */
export async function marcarPreferencia(sb: SupabaseClient, uid: string, campo: CampoPreferencia): Promise<void> {
  try {
    await sb
      .from("ncash_preferencias")
      .upsert({ user_id: uid, [campo]: new Date().toISOString() }, { onConflict: "user_id" });
  } catch {
    /* sem tabela ou sem rede: o localStorage segura */
  }
}

const chaveLocal = (campo: CampoPreferencia, uid: string | null) => `ncash_${campo}:${uid ?? "aparelho"}`;

export function lerLocal(campo: CampoPreferencia, uid: string | null): boolean {
  try {
    return localStorage.getItem(chaveLocal(campo, uid)) !== null;
  } catch {
    return false;
  }
}

export function gravarLocal(campo: CampoPreferencia, uid: string | null) {
  try {
    localStorage.setItem(chaveLocal(campo, uid), new Date().toISOString());
  } catch {
    /* localStorage bloqueado: vale o banco */
  }
}
