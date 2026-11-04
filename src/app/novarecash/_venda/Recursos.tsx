import { Bell, CalendarCheck, CalendarClock, CheckCircle2, CreditCard, Flag, Headset, Landmark, MessageCircle, ReceiptText, Sparkles, Users, type LucideIcon } from "lucide-react";
import { RECURSOS, type Recurso } from "@/lib/novarecash/config";
import { statusRecurso } from "@/lib/novarecash/oferta";

const ICONE: Record<Recurso["chave"], LucideIcon> = {
  ia: Sparkles,
  whatsapp: MessageCircle,
  banco: Landmark,
  extrato: ReceiptText,
  cartoes: CreditCard,
  contas: CalendarCheck,
  alertas: Bell,
  metas: Flag,
  compartilhada: Users,
  consultor: Headset,
};

/**
 * O que vem no NovareCash, recurso por recurso, com o status de cada um.
 *
 * ⚠️ CÓDIGO DE DEFESA DO CONSUMIDOR: o que ainda não funciona diz QUANDO
 * libera (`liberaEm`), em destaque igual ao do que já funciona — nunca
 * "incluso", nunca escondido em letra miúda. A fonte é `RECURSOS`, em
 * `lib/novarecash/config.ts`: ligou o recurso, troca o `noAr` lá.
 */
export function Recursos() {
  const pendentes = RECURSOS.some((r) => !r.noAr);
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {RECURSOS.map((r) => {
          const Icone = ICONE[r.chave];
          const s = statusRecurso(r);
          return (
            <li key={r.chave} className="cartao-cp flex flex-col p-6">
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${s.noAr ? "bg-ouro" : "bg-ciano"}`} />
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    s.noAr ? "bg-ouro-tint text-ouro-forte" : "bg-ciano-tint text-ciano-forte"
                  }`}
                >
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-semibold ${
                    s.noAr ? "bg-success/12 text-success-strong" : "bg-ciano-tint text-ciano-forte"
                  }`}
                >
                  {s.noAr ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                  {s.rotulo}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary">{r.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.texto}</p>
            </li>
          );
        })}
      </ul>
      {pendentes && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          O que tem data ainda não funciona. Quando ligar, entra na mesma assinatura. Até lá, esta
          página mostra a data, não a promessa.
        </p>
      )}
    </>
  );
}
