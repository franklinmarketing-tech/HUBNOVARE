import { InstagramLogo } from "@/components/LogosSociais";

/**
 * Convite para seguir no Instagram.
 *
 * Sem token da Meta Business API não existe jeito legítimo de buscar os
 * posts mais recentes do perfil — a Graph API exige app revisado e conta
 * comercial autenticada. Em vez de simular um feed com dado velho ou
 * raspar a página (contra os termos da Meta), o card convida a seguir
 * direto na fonte.
 */
export function SigaInstagram() {
  return (
    <div className="glass-card overflow-hidden rounded-2xl bg-primary p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <InstagramLogo className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(16_90%_75%)]">
            @novare.invest
          </p>
          <p className="font-display text-sm font-bold">Siga no Instagram</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/70">
        Bastidores, conteúdo rápido e os próximos lançamentos do Workspace,
        direto no feed.
      </p>
      <a
        href="https://www.instagram.com/novare.invest"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-primary hover:bg-white/90"
      >
        Ver o perfil
      </a>
    </div>
  );
}
