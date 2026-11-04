import { ArrowRight, Check, Clock, ShieldCheck } from "lucide-react";
import { BLACK, GARANTIA_DIAS, RECURSOS } from "@/lib/novarecash/config";
import { brl, statusRecurso, textoCompra, type Oferta } from "@/lib/novarecash/oferta";

/**
 * Os planos.
 *
 * ⚠️ NENHUM NÚMERO NASCE AQUI. Preço, valor riscado e % OFF vêm de
 * `ofertas()` (que lê `lib/novarecash/config.ts`).
 *
 * 04/11/2026: a Lista VIP saiu ("já vamos vender o produto, valor mensal").
 * Hoje só o mensal tem preço — e um plano sozinho é sempre o destaque.
 */
export function Planos({ lista }: { lista: Oferta[] }) {
  if (lista.length === 0) return null;
  const sozinho = lista.length === 1;

  return (
    <div className={`mx-auto grid gap-5 ${sozinho ? "max-w-md" : "max-w-3xl sm:grid-cols-2"}`}>
      {/* O anual primeiro quando houver: é a oferta que a casa quer vender. */}
      {[...lista]
        .sort((a, b) => (a.prazo === "anual" ? -1 : b.prazo === "anual" ? 1 : 0))
        .map((o) => (
          <CartaoPlano
            key={o.prazo}
            oferta={o}
            destaque={sozinho || o.prazo === "anual"}
            /* O selo da campanha só existe com desconto de verdade (`desconto` vem de `ofertas()`). */
            rotuloDestaque={sozinho ? (o.desconto ? BLACK.nome : null) : "Melhor oferta"}
          />
        ))}
    </div>
  );
}

function CartaoPlano({
  oferta: o,
  destaque,
  rotuloDestaque,
}: {
  oferta: Oferta;
  destaque: boolean;
  rotuloDestaque: string | null;
}) {
  const nome = o.prazo === "anual" ? "Anual" : "Mensal";
  return (
    <div
      className={`relative flex flex-col rounded-[1.75rem] p-6 sm:p-7 ${
        destaque
          ? "borda-viva bg-white text-foreground ring-2 ring-ouro shadow-[0_18px_44px_-16px_hsl(42_74%_62%/0.5)]"
          : "bg-white/[0.06] text-white ring-1 ring-white/15"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={`font-display text-lg font-semibold ${destaque ? "text-primary" : "text-white"}`}>
          NovareCash {nome}
        </p>
        {destaque && rotuloDestaque && (
          <span className="rounded-full bg-noite px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-ouro">
            {rotuloDestaque}
          </span>
        )}
        {o.desconto != null && o.desconto > 0 && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
              destaque ? "bg-ouro-tint text-ouro-forte" : "bg-ouro/15 text-ouro"
            }`}
          >
            {o.desconto}% OFF
          </span>
        )}
      </div>

      <div className="mt-5">
        {o.cheioPorMes != null && (
          <p className={`text-sm ${destaque ? "text-muted-foreground" : "text-white/60"}`}>
            de <s>{brl(o.cheioPorMes)}</s> por mês
          </p>
        )}
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span
            className={`font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl ${
              destaque ? "text-primary" : "text-white"
            }`}
          >
            {brl(o.porMes)}
          </span>
          <span className={`text-sm font-medium ${destaque ? "text-muted-foreground" : "text-white/70"}`}>/mês</span>
        </p>
        <p className={`mt-1 text-xs ${destaque ? "text-muted-foreground" : "text-white/60"}`}>
          {o.prazo === "anual" ? (
            <>
              Cobrado uma vez por ano: {o.cheio != null && <s className="mr-1">{brl(o.cheio)}</s>}
              <strong className={destaque ? "text-foreground" : "text-white"}>{brl(o.agora)}</strong>
            </>
          ) : (
            "Cobrado todo mês. Cancela quando quiser, sem multa."
          )}
        </p>
      </div>

      <ul className="mt-5 space-y-2.5">
        {RECURSOS.map((r) => {
          const s = statusRecurso(r);
          return (
            <li key={r.chave} className="flex items-start gap-2.5 text-sm">
              {s.noAr ? (
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${destaque ? "text-ouro-forte" : "text-ouro"}`} />
              ) : (
                <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${destaque ? "text-muted-foreground" : "text-white/50"}`} />
              )}
              <span className={destaque ? "text-foreground" : "text-white/85"}>
                {r.titulo}
                {!s.noAr && (
                  <span className={`block text-2xs ${destaque ? "text-muted-foreground" : "text-white/55"}`}>
                    {s.rotulo}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <a
        href={o.checkout}
        target={o.peloWhatsApp ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`mt-6 w-full ${destaque ? "btn-cp cta-halo cta-varredura" : "btn-claro"}`}
      >
        {textoCompra(o.porMes)}
        <ArrowRight className="h-4 w-4" />
      </a>
      <p
        className={`mt-3 flex items-center justify-center gap-1.5 text-center text-2xs ${
          destaque ? "text-muted-foreground" : "text-white/60"
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        {o.peloWhatsApp
          ? `${GARANTIA_DIAS} dias de garantia: não gostou, o dinheiro volta. A equipe da Novare conclui a assinatura pelo WhatsApp.`
          : `${GARANTIA_DIAS} dias de garantia: não gostou, o dinheiro volta. Pagamento seguro pela Hotmart.`}
      </p>
    </div>
  );
}
