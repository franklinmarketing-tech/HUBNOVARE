import type { SupabaseClient } from "@supabase/supabase-js";

import { RECURSOS } from "./config";

/**
 * O CHECKLIST "PRIMEIROS PASSOS" DO INÍCIO (05/11/2026): cada item se marca
 * SOZINHO pelo que já existe no banco. Leituras leves: `limit(1)` em cada
 * tabela, só para saber se há pelo menos uma linha — nada de contar tudo.
 *
 * Sempre do DONO do NovareCash aberto (conta compartilhada: o que o par já fez vale).
 * Erro numa tabela (ex.: `ncash_metas` antes do SQL dela) = item não feito; nunca quebra o Início.
 *
 * O 5º item (banco ou WhatsApp) segue a regra de honestidade de `config.ts`:
 * enquanto NENHUM dos dois estiver no ar, ele é `null` — a tela mostra
 * "libera em …" e ele NÃO entra na conta do progresso.
 */

export type PrimeirosPassos = {
  conta: boolean;
  gasto: boolean;
  orcamento: boolean;
  meta: boolean;
  /** `null` = banco e WhatsApp ainda não estão no ar para o cliente. */
  conexao: boolean | null;
  /** Para onde leva o 5º item quando ele estiver no ar. */
  conexaoHref: string;
  /** A data prometida, enquanto não está no ar. */
  conexaoLiberaEm: string;
};

export async function lerPrimeirosPassos(sb: SupabaseClient, dono: string): Promise<PrimeirosPassos> {
  const existe = async (consulta: PromiseLike<{ data: unknown[] | null; error: unknown }>) => {
    try {
      const { data, error } = await consulta;
      return !error && (data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  };

  const banco = RECURSOS.find((r) => r.chave === "banco");
  const whats = RECURSOS.find((r) => r.chave === "whatsapp");
  const origens = [banco?.noAr && "openfinance", whats?.noAr && "whatsapp"].filter((o): o is string => Boolean(o));

  const [conta, gasto, orcamento, meta, conectado] = await Promise.all([
    existe(sb.from("ncash_contas").select("user_id").eq("user_id", dono).limit(1)),
    existe(sb.from("ncash_transacoes").select("user_id").eq("user_id", dono).eq("tipo", "saida").limit(1)),
    existe(sb.from("ncash_orcamentos").select("user_id").eq("user_id", dono).limit(1)),
    existe(sb.from("ncash_metas").select("user_id").eq("user_id", dono).limit(1)),
    // Conectou = já entrou algum lançamento pelo banco ou pelo WhatsApp (só dos que estão no ar).
    origens.length
      ? existe(sb.from("ncash_transacoes").select("user_id").eq("user_id", dono).in("origem", origens).limit(1))
      : Promise.resolve(false),
  ]);

  return {
    conta,
    gasto,
    orcamento,
    meta,
    conexao: origens.length ? conectado : null,
    conexaoHref: banco?.noAr ? "/novarecash/app/banco" : "/novarecash/app/whatsapp",
    conexaoLiberaEm: banco?.liberaEm ?? whats?.liberaEm ?? "breve",
  };
}
