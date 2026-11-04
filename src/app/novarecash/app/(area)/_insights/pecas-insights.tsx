import {
  Car,
  Copy,
  Database,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Plane,
  Receipt,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { Alerta, TipoAlerta } from "@/lib/novarecash/insights";
import type { IconeMeta } from "@/lib/novarecash/metas";
import { Cartao, brl } from "../pecas";

export const ICONE_ALERTA: Record<TipoAlerta, LucideIcon> = {
  assinatura: Repeat,
  tarifas: Receipt,
  duplicada: Copy,
  padrao: TrendingUp,
  orcamento: Target,
};

/** Texto da economia, igual na tela de Alertas e no Início. */
export function textoEconomia(a: Alerta): string | null {
  if (!a.economia || a.economia.valor <= 0) return null;
  return a.economia.periodo === "mes"
    ? `Pode economizar ${brl(a.economia.valor)} por mês`
    : `Pode recuperar ${brl(a.economia.valor)} (uma vez)`;
}

/**
 * Peças das telas de Alertas, Relatórios e Metas (04/11/2026). Sem hooks:
 * servem ao servidor (cartões do Início) e ao navegador.
 */

/** As tabelas novas (`ncash_alertas_dispensados`, `ncash_metas`) ainda não existem. */
export function AvisoSqlInsights({ oque = "esta tela" }: { oque?: string }) {
  return (
    <Cartao className="border-dashed border-ouro/35 p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Database className="h-4 w-4 shrink-0 text-ouro" />
        Falta um passo de instalação
      </p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
        A tabela de {oque} ainda não foi criada. Para quem administra: rode o arquivo{" "}
        <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs text-ouro">
          supabase/novarecash_insights.sql
        </code>{" "}
        no editor SQL do Supabase (depois do <code className="font-mono text-2xs">novarecash_compartilhar.sql</code>) e
        recarregue a página.
      </p>
    </Cartao>
  );
}

export const ICONE_DA_META: Record<IconeMeta, LucideIcon> = {
  reserva: ShieldCheck,
  viagem: Plane,
  casa: House,
  carro: Car,
  estudo: GraduationCap,
  presente: Gift,
  saude: HeartPulse,
  outro: Sparkles,
};
