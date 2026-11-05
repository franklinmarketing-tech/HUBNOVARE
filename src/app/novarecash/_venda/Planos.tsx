import { ArrowRight, Check, Clock, Landmark, ShieldCheck } from "lucide-react";
import { GARANTIA_DIAS, NOVARECASH_NOME, RECURSOS } from "@/lib/novarecash/config";
import { avisoBancos, brl, statusRecurso, textoBancos, textoPorDia, type Oferta } from "@/lib/novarecash/oferta";
import { medirClique } from "@/lib/medir";

/**
 * Os planos.
 *
 * ⚠️ NENHUM NÚMERO NASCE AQUI. Preço, valor riscado, % OFF, preço por dia e
 * limite de bancos vêm de `ofertas()` (que lê `PLANOS`, em `config.ts`).
 *
 * 05/11/2026 (aprovado pelo dono): TRÊS PLANOS MENSAIS — Essencial, Plus e
 * Premium —, que só mudam no limite de bancos conectados. Por isso os recursos
 * aparecem UMA vez, embaixo ("Todos os planos incluem"), e não repetidos nos três
 * cartões. O Plus é o destaque (`PLANO_DESTAQUE`).
 *
 * ⚠️ CDC: enquanto o Open Finance não estiver no ar, a frase de `avisoBancos()`
 * fica junto dos cartões — o limite de bancos é do que vem, não do que já funciona.
 */
export function Planos({ lista }: { lista: Oferta[] }) {
  if (lista.length === 0) return null;
  const aviso = avisoBancos();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto grid max-w-md items-stretch gap-5 lg:max-w-none lg:grid-cols-3">
        {lista.map((o) => (
          <CartaoPlano key={o.plano} oferta={o} />
        ))}
      </div>

      {aviso && (
        <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-white/75">
          <Clock className="mt-[0.2rem] h-4 w-4 shrink-0 text-ouro" />
          <span>{aviso}</span>
        </p>
      )}

      {/* Os recursos, uma vez só: são os mesmos nos três planos. */}
      <div className="mx-auto mt-8 max-w-3xl rounded-[1.75rem] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8">
        <p className="font-display text-lg font-semibold text-white">Todos os planos incluem</p>
        <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {RECURSOS.map((r) => {
            const s = statusRecurso(r);
            return (
              <li key={r.chave} className="flex items-start gap-2.5 text-sm">
                {s.noAr ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ouro" />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                )}
                <span className="text-white/85">
                  {r.titulo}
                  {!s.noAr && <span className="block text-2xs text-white/55">{s.rotulo}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function CartaoPlano({ oferta: o }: { oferta: Oferta }) {
  const d = o.destaque;
  return (
    <div
      className={`relative flex flex-col rounded-[1.75rem] p-6 sm:p-7 ${
        d
          ? "borda-viva bg-white text-foreground ring-2 ring-ouro shadow-[0_18px_44px_-16px_hsl(42_74%_62%/0.5)]"
          : "bg-white/[0.06] text-white ring-1 ring-white/15"
      }`}
    >
      {o.selo && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-noite px-3 py-1 text-2xs font-bold uppercase tracking-wider text-ouro ring-1 ring-ouro/50">
          {o.selo}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <p className={`font-display text-lg font-semibold ${d ? "text-primary" : "text-white"}`}>
          {NOVARECASH_NOME} {o.nome}
        </p>
        {o.desconto != null && o.desconto > 0 && (
          <span className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${d ? "bg-ouro-tint text-ouro-forte" : "bg-ouro/15 text-ouro"}`}>
            {o.desconto}% OFF
          </span>
        )}
      </div>

      <div className="mt-5">
        {o.cheioPorMes != null && (
          <p className={`text-sm ${d ? "text-muted-foreground" : "text-white/60"}`}>
            de <s>{brl(o.cheioPorMes)}</s> por mês
          </p>
        )}
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl ${d ? "text-primary" : "text-white"}`}>
            {brl(o.porMes)}
          </span>
          <span className={`text-sm font-medium ${d ? "text-muted-foreground" : "text-white/70"}`}>/mês</span>
        </p>
        {/* 05/11/2026: o mês em dias, calculado do preço real (`textoPorDia`). Nada de "se paga em X meses". */}
        <p className={`mt-1 text-sm font-semibold ${d ? "text-ouro-forte" : "text-ouro"}`}>
          {textoPorDia(o.porMes).replace(/^./, (c) => c.toUpperCase())}
        </p>
      </div>

      <ul className={`mt-5 space-y-2 border-t pt-4 text-sm ${d ? "border-border" : "border-white/10"}`}>
        <li className="flex items-center gap-2.5 font-semibold">
          <Landmark className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          {textoBancos(o.bancos)}
        </li>
        <li className={`flex items-center gap-2.5 ${d ? "text-foreground" : "text-white/85"}`}>
          <Check className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          Todos os recursos do {NOVARECASH_NOME}
        </li>
        <li className={`flex items-center gap-2.5 ${d ? "text-foreground" : "text-white/85"}`}>
          <Check className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          Cobrado todo mês, cancela quando quiser
        </li>
      </ul>

      <a
        href={o.checkout}
        {...medirClique("venda:plano")}
        target={o.peloWhatsApp ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`mt-6 w-full ${d ? "btn-cp cta-halo cta-varredura" : "btn-claro"}`}
      >
        Assinar o {o.nome}
        <ArrowRight className="h-4 w-4" />
      </a>
      <p className={`mt-3 flex items-start justify-center gap-1.5 text-center text-2xs ${d ? "text-muted-foreground" : "text-white/60"}`}>
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
        {o.peloWhatsApp
          ? `${GARANTIA_DIAS} dias de garantia. A equipe da Novare conclui a assinatura pelo WhatsApp.`
          : `${GARANTIA_DIAS} dias de garantia. Pagamento seguro pela Hotmart.`}
      </p>
    </div>
  );
}
