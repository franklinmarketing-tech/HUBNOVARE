import { MessageCircle } from "lucide-react";
import { LINKEDIN_JEFFERSON, falarNoWhatsApp } from "@/lib/contato";

/**
 * A ASSINATURA DO JEFFERSON embaixo de toda foto dele (pedido do dono,
 * 21/10/2026, no padrão dos integrantes da Nord): nome, as certificações e a
 * fileira de ícones redondos — WhatsApp, Instagram, LinkedIn e YouTube —, com
 * o nome do destino ao passar o mouse.
 *
 * ⚠️ CERTIFICAÇÕES: preencher com as que ele tem de verdade (ex.: "CEA ·
 * CFP®"). Vazio, a linha não aparece — nunca inventar título profissional.
 */
export const CERTIFICACOES_JEFFERSON: string[] = [];

const REDES = [
  { nome: "WhatsApp · Novare", href: falarNoWhatsApp("Olá, Jefferson! Vim pelo site da Novare."), Icone: WhatsappIcone },
  { nome: "Instagram · Novare", href: "https://www.instagram.com/novare.invest", Icone: InstagramBranco },
  { nome: "LinkedIn · Jefferson Freitas", href: LINKEDIN_JEFFERSON, Icone: LinkedinBranco },
  { nome: "YouTube · Novare", href: "https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ", Icone: YoutubeBranco },
];

/* Glifos BRANCOS para o círculo ciano (os de LogosSociais são coloridos). */
function WhatsappIcone({ className }: { className?: string }) {
  return <MessageCircle className={className} strokeWidth={2.2} />;
}
function InstagramBranco({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function LinkedinBranco({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="4" y="9" width="3.3" height="11" rx="0.6" />
      <circle cx="5.65" cy="5.2" r="1.95" />
      <path d="M10 9h3.1v1.5c.5-.9 1.6-1.8 3.3-1.8 3.4 0 4 2.1 4 4.9V20h-3.3v-5.6c0-1.3-.1-2.9-1.8-2.9-1.8 0-2 1.4-2 2.8V20H10V9Z" />
    </svg>
  );
}
function YoutubeBranco({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function AssinaturaJefferson({
  tom = "escuro",
  nome = true,
  alinhar = "esquerda",
  className = "",
}: {
  /** "escuro" = sobre fundo noite; "claro" = sobre fundo branco. */
  tom?: "escuro" | "claro";
  /** Mostra nome e cargo junto (desligue quando o bloco já os mostra). */
  nome?: boolean;
  alinhar?: "esquerda" | "centro";
  className?: string;
}) {
  const escuro = tom === "escuro";
  return (
    <div className={`${alinhar === "centro" ? "text-center" : ""} ${className}`}>
      {nome && (
        <>
          <p className={`font-display text-lg font-semibold tracking-[-0.02em] ${escuro ? "text-white" : "text-primary"}`}>
            Jefferson Freitas
          </p>
          <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${escuro ? "text-ciano-claro" : "text-ciano-forte"}`}>
            Fundador · Novare
          </p>
        </>
      )}
      {CERTIFICACOES_JEFFERSON.length > 0 && (
        <p className={`mt-1 text-sm font-medium ${escuro ? "text-white/80" : "text-slate-600"}`}>
          {CERTIFICACOES_JEFFERSON.join(" · ")}
        </p>
      )}
      <ul className={`mt-3 flex gap-2.5 ${alinhar === "centro" ? "justify-center" : ""}`}>
        {REDES.map(({ nome: rotulo, href, Icone }) => (
          <li key={rotulo} className="group relative">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={rotulo}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ciano text-white shadow-ciano transition-transform hover:-translate-y-0.5 hover:brightness-110"
            >
              <Icone className="h-[18px] w-[18px]" />
            </a>
            {/* A dica com o destino, como na Nord. */}
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-800 opacity-0 shadow-md ring-1 ring-black/5 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {rotulo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
