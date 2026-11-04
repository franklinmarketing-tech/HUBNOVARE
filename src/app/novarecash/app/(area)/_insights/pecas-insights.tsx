import {
  Car,
  Copy,
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
import { AvisoInstalacao, Cartao, brl } from "../pecas";

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
  return <AvisoInstalacao titulo={`A parte de ${oque} está quase pronta`} arquivo="supabase/novarecash_insights.sql" />;
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
