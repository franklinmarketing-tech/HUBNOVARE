import Link from "next/link";
import { ASSINATURA_ATIVA } from "@/lib/assinatura";
import {
  ClipboardCheck,
  Handshake,
  Scale,
  Sunrise,
  Wallet,
  Sparkles,
  ArrowRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  PRECOS_DEFINIDOS,
  ROTULO_DESCONTO,
  precoComDesconto,
  type Consultoria,
} from "@/lib/consultoria";

/** Identidade visual e gradiente de cada produto */
const IDENTIDADE: Record<string, { icone: LucideIcon; h: number; s: number }> = {
  diagnostico: { icone: ClipboardCheck, h: 152, s: 65 }, // Verde esmeralda para isca gratuita
  investimentos: { icone: Handshake, h: 215, s: 65 }, // Azul royal Novare + Nord
  "plano-vida": { icone: Sunrise, h: 28, s: 80 }, // Laranja / Âmbar
  "consultoria-financeira": { icone: Wallet, h: 195, s: 65 }, // Azul petróleo
  "revisao-carteira": { icone: Scale, h: 230, s: 55 }, // Indigo
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Card compacto de consultoria/produto oficial */
export function CardConsultoria({
  item,
  assinante,
}: {
  item: Consultoria;
  assinante: boolean;
}) {
  const id = IDENTIDADE[item.slug] ?? IDENTIDADE.diagnostico;
  const Icone = id.icone;

  return (
    <Link
      href={`/consultoria/${item.slug}`}
      className={`glass-card group flex h-full flex-col rounded-2xl p-5 transition-all duration-300 ${
        item.isIsca
          ? 'bg-secondary border-secondary'
          : item.coBranding
          ? 'bg-primary border-primary'
          : 'bg-white border-slate-200/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="tile-cine flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(${id.h} ${id.s}% 48%), hsl(${id.h} ${id.s + 10}% 32%))`,
            boxShadow: `0 8px 20px -6px hsl(${id.h} ${id.s}% 38% / 0.45)`,
          }}
        >
          <Icone className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>

        {item.isIsca ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            100% Grátis
          </span>
        ) : item.coBranding ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/90 border border-blue-200/60 px-2.5 py-1 text-[11px] font-bold text-blue-900 shadow-2xs">
            {item.coBranding.badge}
          </span>
        ) : ASSINATURA_ATIVA ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
            {ROTULO_DESCONTO}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 font-display text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary">
        {item.nome}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
        {item.chamada}
      </p>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{item.duracao}</span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100/80">
        <span className="font-display text-sm font-extrabold text-primary">
          {item.isIsca
            ? "Análise Gratuita"
            : PRECOS_DEFINIDOS
            ? brl(assinante ? precoComDesconto(item.precoCheio) : item.precoCheio)
            : "Sob consulta"}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
          Conhecer
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
