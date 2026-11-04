import Link from "next/link";
import { AlertTriangle, Database, RefreshCw, type LucideIcon } from "lucide-react";

import type { OrigemTransacao } from "@/lib/novarecash/dados";
import { ORIGEM_ROTULO } from "@/lib/novarecash/dados";

export { brl } from "@/lib/calculos";

/**
 * AS PEÇAS DO NOVARECASH — escuras e premium, para o app parecer o produto
 * dele, e não outro app da casa com outra cor.
 *
 * Fundo `noite`, cartão `noite-2`, destaque `ouro`, apoio `ciano`. O botão de
 * AÇÃO continua laranja (`accent-btn`, 4,77:1 com texto branco), como em todo
 * o Hub. Texto secundário em branco 60–75%: passa AA sobre a noite com folga.
 *
 * Sem hooks aqui: as peças servem a telas de servidor e de navegador.
 */

export const ANEL =
  "outline-none focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-2 focus-visible:ring-offset-noite";

/** Verde e laranja claros: legíveis sobre a noite (o verde e o vermelho da casa são para fundo claro). */
export const COR_ENTRADA = "text-[hsl(152_60%_62%)]";
export const COR_SAIDA = "text-accent-claro";

/** Campo de formulário sobre a noite. */
export const CAMPO =
  "block min-h-11 w-full rounded-xl border border-white/15 bg-noite px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-ouro focus:ring-2 focus:ring-ouro/25 disabled:opacity-60";

export const ROTULO_CAMPO = "block text-2xs font-semibold text-white/70";

export function Cartao({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-noite-2 shadow-[0_20px_44px_-30px_hsl(203_100%_1%/0.9)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Cabecalho({
  titulo,
  resumo,
  children,
}: {
  titulo: string;
  resumo?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">NovareCash</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">{titulo}</h1>
        {resumo && <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-white/70">{resumo}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

type VarianteBotao = "acao" | "contorno" | "fantasma" | "perigo";

const ESTILO_BOTAO: Record<VarianteBotao, string> = {
  acao: "bg-accent-btn text-white shadow-[0_8px_24px_-12px_hsl(16_80%_55%/0.7)] hover:brightness-110",
  contorno: "border border-white/20 text-white hover:border-ouro/60 hover:bg-white/[0.04]",
  fantasma: "text-white/80 hover:bg-white/[0.06] hover:text-white",
  perigo: "border border-accent-claro/40 text-accent-claro hover:bg-accent-claro/10",
};

export function Botao({
  href,
  onClick,
  type = "button",
  variante = "acao",
  Icone,
  desabilitado,
  className = "",
  children,
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variante?: VarianteBotao;
  Icone?: LucideIcon;
  desabilitado?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${ANEL} ${ESTILO_BOTAO[variante]} ${className}`;
  const miolo = (
    <>
      {Icone && <Icone className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 truncate">{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {miolo}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={desabilitado} className={classes}>
      {miolo}
    </button>
  );
}

export type TomSelo = "ouro" | "ciano" | "verde" | "alerta" | "perigo" | "neutro";

const ESTILO_SELO: Record<TomSelo, string> = {
  ouro: "bg-ouro/15 text-ouro ring-ouro/30",
  ciano: "bg-ciano/15 text-ciano-claro ring-ciano/30",
  verde: "bg-[hsl(152_55%_41%/0.15)] text-[hsl(152_60%_62%)] ring-[hsl(152_55%_41%/0.35)]",
  alerta: "bg-warning/15 text-warning-claro ring-warning/35",
  perigo: "bg-accent/15 text-accent-claro ring-accent/35",
  neutro: "bg-white/[0.06] text-white/75 ring-white/15",
};

export function Selo({ tom = "neutro", children }: { tom?: TomSelo; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset ${ESTILO_SELO[tom]}`}
    >
      {children}
    </span>
  );
}

const TOM_ORIGEM: Record<OrigemTransacao, TomSelo> = { manual: "neutro", whatsapp: "verde", openfinance: "ciano", importacao: "ouro" };

export function SeloOrigem({ origem }: { origem: OrigemTransacao }) {
  return <Selo tom={TOM_ORIGEM[origem]}>{ORIGEM_ROTULO[origem]}</Selo>;
}

export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.06] motion-reduce:animate-none" />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

/** Falha amigável. `onTentar` só nas telas de navegador; no servidor, `href` recarrega. */
export function AvisoErro({
  titulo = "Não consegui carregar agora",
  mensagem = "O que você registrou continua guardado. Tente de novo em instantes.",
  onTentar,
  href,
}: {
  titulo?: string;
  mensagem?: string;
  onTentar?: () => void;
  href?: string;
}) {
  return (
    <Cartao className="p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning-claro" />
        {titulo}
      </p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">{mensagem}</p>
      {(onTentar || href) && (
        <div className="mt-4">
          <Botao variante="contorno" Icone={RefreshCw} onClick={onTentar} href={href}>
            Tentar de novo
          </Botao>
        </div>
      )}
    </Cartao>
  );
}

/** As tabelas `ncash_*` ainda não existem: falta um passo de instalação, não é defeito. */
export function AvisoSemTabela() {
  return (
    <Cartao className="border-dashed border-ouro/35 p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Database className="h-4 w-4 shrink-0 text-ouro" />
        O NovareCash está sendo instalado
      </p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
        As tabelas do extrato ainda não foram criadas. Para quem administra: rode o arquivo{" "}
        <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs text-ouro">supabase/novarecash_dados.sql</code>{" "}
        no editor SQL do Supabase e recarregue a página.
      </p>
    </Cartao>
  );
}

export function Vazio({
  Icone,
  titulo,
  texto,
  children,
}: {
  Icone: LucideIcon;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <Cartao className="px-5 py-8 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-ouro/15 text-ouro ring-1 ring-ouro/25"
      >
        <Icone className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-base font-semibold text-white">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/70">{texto}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </Cartao>
  );
}

/** Barra de progresso. `fracao` 0..∞; a barra para em 100%. */
export function Barra({ fracao, tom = "ciano" }: { fracao: number; tom?: "ciano" | "ouro" | "alerta" | "perigo" }) {
  const cor = { ciano: "bg-ciano", ouro: "bg-ouro", alerta: "bg-warning", perigo: "bg-accent" }[tom];
  const largura = Number.isFinite(fracao) ? Math.min(100, Math.max(0, fracao * 100)) : 100;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${fracao > 0 ? Math.max(3, largura) : 0}%` }} />
    </div>
  );
}
