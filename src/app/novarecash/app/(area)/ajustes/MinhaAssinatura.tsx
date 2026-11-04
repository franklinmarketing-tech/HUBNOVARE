import { ExternalLink, Headset, Users } from "lucide-react";

import type { MinhaAssinatura as Assinatura } from "@/lib/novarecash/acesso";
import { falarNoWhatsApp } from "@/lib/contato";
import { Cartao, Selo, type TomSelo } from "../pecas";

/**
 * MINHA ASSINATURA: o estado de hoje (de `minhaAssinatura()`, pelo e-mail da
 * conta) e o caminho para cancelar. Quem cobra é a Hotmart, então é lá que se
 * cancela — a central do comprador, em "Assinaturas". O link fica à vista: o
 * Código de Defesa do Consumidor pede cancelamento tão fácil quanto a compra.
 */

/** A central do comprador da Hotmart (Minhas compras → Assinaturas). */
const CENTRAL_HOTMART = "https://consumer.hotmart.com/";

const STATUS: Record<string, { rotulo: string; tom: TomSelo }> = {
  ativa: { rotulo: "Ativa", tom: "verde" },
  cancelada: { rotulo: "Cancelada", tom: "alerta" },
  atrasada: { rotulo: "Pagamento atrasado", tom: "alerta" },
  reembolsada: { rotulo: "Reembolsada", tom: "neutro" },
  chargeback: { rotulo: "Encerrada", tom: "neutro" },
};

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function MinhaAssinatura({
  assinatura,
  email,
  equipe,
  membroDe,
}: {
  assinatura: Assinatura;
  email: string;
  equipe: boolean;
  /** Nome do dono, quando a pessoa usa o NovareCash pelo convite dele. */
  membroDe: string | null;
}) {
  const s = assinatura ? STATUS[assinatura.status] ?? { rotulo: assinatura.status, tom: "neutro" as TomSelo } : null;
  const suporte = falarNoWhatsApp(`Olá! Tenho uma dúvida sobre a minha assinatura do NovareCash (${email}).`);

  return (
    <Cartao className="p-4 sm:p-5">
      {assinatura && s ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold text-white">
              NovareCash{assinatura.plano ? ` ${assinatura.plano}` : ""}
            </p>
            <Selo tom={s.tom}>{s.rotulo}</Selo>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/75">
            {assinatura.status === "ativa" &&
              (assinatura.expira_em
                ? `Renova sozinha pela Hotmart. O período pago vai até ${dia(assinatura.expira_em)}.`
                : "Renova sozinha pela Hotmart.")}
            {assinatura.status === "cancelada" &&
              (assinatura.expira_em
                ? `A renovação foi cancelada. Você continua usando até ${dia(assinatura.expira_em)}.`
                : "A renovação foi cancelada.")}
            {assinatura.status === "atrasada" && "A Hotmart não conseguiu cobrar. Atualize o pagamento lá para não perder o acesso."}
            {(assinatura.status === "reembolsada" || assinatura.status === "chargeback") && "Esta assinatura foi encerrada."}
          </p>
          <p className="mt-1 break-all text-2xs text-white/55">E-mail da compra: {email}</p>
        </>
      ) : membroDe ? (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-white/85">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-ouro" />
          <span>
            Você usa o NovareCash pelo convite de <strong className="break-words text-white">{membroDe}</strong>. A
            assinatura é do titular: você não paga nada.
          </span>
        </p>
      ) : equipe ? (
        <p className="text-sm leading-relaxed text-white/85">Acesso da equipe Novare: sem assinatura.</p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-white/85">
            Não encontrei uma assinatura no e-mail <span className="break-all">{email}</span>.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            Se você comprou com outro e-mail, fale com a gente que ajustamos.
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {assinatura && (
          <a
            href={CENTRAL_HOTMART}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:border-ouro/60 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro"
          >
            <ExternalLink className="h-4 w-4" />
            {assinatura.status === "ativa" || assinatura.status === "atrasada" ? "Cancelar pela Hotmart" : "Abrir a Hotmart"}
          </a>
        )}
        <a
          href={suporte}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-ouro hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro"
        >
          <Headset className="h-4 w-4" />
          Falar com a Novare
        </a>
      </div>
      {assinatura && (assinatura.status === "ativa" || assinatura.status === "atrasada") && (
        <p className="mt-2 text-2xs leading-relaxed text-white/55">
          Na Hotmart, entre com o e-mail da compra e abra Assinaturas. Cancelando, você continua usando até o fim do período
          já pago.
        </p>
      )}
    </Cartao>
  );
}
