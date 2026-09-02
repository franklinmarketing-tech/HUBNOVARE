import Image from "next/image";
import Link from "next/link";
import { InstagramLogo, YoutubeLogo, LinkedinLogo } from "@/components/LogosSociais";

const ANO = new Date().getFullYear();

/**
 * Rodapé enxuto de sistema: uma linha só, para não roubar a altura que a
 * home precisa para caber numa tela. O aviso legal fica junto porque
 * consultoria de investimento é obrigada a exibi-lo.
 */
export function Rodape() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 px-5 py-3 [@media(max-height:800px)]:py-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          {/* A marca assina o rodapé — antes só havia o nome em texto. */}
          <Image
            src="/marca/logo-novare.png"
            alt="Novare"
            width={84}
            height={22}
            className="hidden h-5 w-auto shrink-0 opacity-70 sm:block"
          />
          <p className="text-[11px] text-muted-foreground">
            © {ANO} <span className="font-semibold">Novare Consultoria</span> ·
            Consultoria sem comissão. Conteúdo educativo, não é recomendação
            personalizada de investimento.
          </p>
        </div>

        {/* flex-wrap + gap-y: com três redes sociais a linha não cabe em 390px
            e empurrava a página inteira para o lado. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/profissionais"
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-primary"
          >
            Sua profissão
          </Link>
          <Link
            href="/consultoria"
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-primary"
          >
            Consultoria
          </Link>
          <Link
            href="/assinar/workspace"
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-primary"
          >
            Workspace
          </Link>
          <Link
            href="/privacidade"
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-primary"
          >
            Privacidade & LGPD
          </Link>
          {/* Marcas não têm ícone nesta versão do lucide, e desenhar SVG de
              logo alheio é pedir para ficar errado: texto resolve. */}
          <a
            href="https://www.instagram.com/novare.invest"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Novare no Instagram"
            // -m-2 p-2: o alvo de toque cresce sem empurrar o layout.
            className="-m-2 p-2 text-slate-500 transition-colors hover:text-primary"
          >
            <InstagramLogo className="h-4 w-4" />
          </a>
          <a
            href="https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Novare no YouTube"
            className="-m-2 p-2 text-slate-500 transition-colors hover:text-primary"
          >
            <YoutubeLogo className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/novare-consultoria-de-investimentos-ab0808386/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Novare no LinkedIn"
            className="-m-2 p-2 text-slate-500 transition-colors hover:text-primary"
          >
            <LinkedinLogo className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
