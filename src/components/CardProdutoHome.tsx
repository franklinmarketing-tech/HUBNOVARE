import Image from "next/image";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { APPS, type NovareApp } from "@/lib/apps";

/**
 * A CASCA DOS CARDS DE PRODUTO DA HOME — laranja, selo PRO, palco + rodapé.
 *
 * ═══ POR QUE ELA EXISTE (13/09/2026) ═══════════════════════════════════════
 *
 * Ela nasceu de um clone. `CardFincashHome` e `CardPlanejamentoHome` eram o
 * mesmo arquivo duas vezes: mesmo gradiente, mesma imagem de fundo, mesmo
 * `min-h` com o degrau de tela alta, mesmo rodapé de três estados. As duas
 * cópias já tinham começado a divergir — uma lia o nome do catálogo e a outra
 * escrevia "Planejamento" à mão —, que é exatamente como duas telas do mesmo
 * produto passam a dizer coisas diferentes.
 *
 * Quando o FINPLAN ganhou o card dele na home, a escolha era clonar uma
 * terceira vez ou extrair a casca. Aqui está a casca.
 *
 * ⚠️ O QUE ESTE COMPONENTE NÃO DECIDE: o preço. Ele recebe o rodapé pronto
 * (`rodape`), e isso é deliberado — ver o aviso em `CardFinplanHome`. A casa
 * tem UMA assinatura e UM preço, e dois cards com valor na mesma dobra leem
 * como dois planos. Quem centralizar a lógica de preço aqui vai, no primeiro
 * refactor distraído, pintar o valor nos dois.
 *
 * ⚠️ O `min-h` TEM DE SEGUIR O `CardPortal`, incluindo o degrau em tela alta:
 * estes cards ficam lado a lado com os de área na mesma fileira, e mexer só
 * num deixa o produto mais baixo que os vizinhos.
 */

/**
 * Nome e chamada saem do CATÁLOGO, como na landing (`fincash/Pacote.tsx`).
 *
 * O `throw` é de propósito: se o slug sumir, o build para com o culpado
 * escrito, em vez de a home publicar um card sem nome. Duas frases para o
 * mesmo produto em dois arquivos é como a home e a landing começam a
 * discordar.
 */
export function doCatalogo(slug: string): NovareApp {
  const achado = APPS.find((a) => a.slug === slug);
  if (!achado) {
    throw new Error(
      `CardProdutoHome: não existe app com slug "${slug}" em lib/apps.ts. ` +
        "Os cards de produto da home são montados a partir dele — corrija o " +
        "slug na chamada ou devolva a entrada ao catálogo.",
    );
  }
  return achado;
}

export function CardProdutoHome({
  app,
  href,
  Icone,
  linhaExtra,
  rodape,
}: {
  /** A entrada do catálogo: dá o nome e a chamada. */
  app: NovareApp;
  href: string;
  Icone: LucideIcon;
  /** A linha miúda do palco — o que vem junto. Opcional. */
  linhaExtra?: string;
  /** O rodapé branco, montado por quem chama (ver o aviso sobre preço). */
  rodape: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 group-hover:brightness-[1.12] [@media(min-height:860px)]:min-h-[13rem]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, hsl(18 76% 44%) 0%, hsl(15 74% 32%) 60%, hsl(13 70% 24%) 100%)",
            boxShadow: "inset 0 1px 0 hsl(35 90% 80% / 0.28)",
          }}
        />

        {/* O render dos painéis de vidro por trás do laranja. Entra em
            `soft-light` e com opacidade baixa: vira textura e brilho, não
            uma segunda imagem competindo com o título do card. */}
        <Image
          aria-hidden
          alt=""
          src="/cenas/cena-painel-3d.webp"
          fill
          sizes="(max-width: 640px) 100vw, 25vw"
          className="pointer-events-none object-cover opacity-25 mix-blend-soft-light transition-transform duration-500 group-hover:scale-105"
        />

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 50% -20%, hsl(38 95% 62% / 0.32), transparent 65%)",
          }}
        />
        <span className="absolute right-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-accent-strong">
          PRO
        </span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-white/[0.18]">
          <Icone className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          {app.nome}
        </span>
        <span className="relative text-xs leading-snug text-white/80">
          {app.chamada}
        </span>
        {linhaExtra ? (
          <span className="relative text-2xs leading-snug text-white/65">
            {linhaExtra}
          </span>
        ) : null}
      </span>

      {/* `gap-2` e não só `justify-between`: com a fonte mais estreita da
          marca o preço e a letra miúda passaram a caber na mesma linha, e
          `justify-between` sozinho não reserva folga quando o conteúdo enche
          a largura — os dois encostavam e viravam uma palavra só. */}
      <span className="flex items-center justify-between gap-2 border-t border-primary/5 px-4 py-3">
        {rodape}
      </span>
    </Link>
  );
}

/** A seta do rodapé, igual nos dois cards. */
export function SetaRodape() {
  return (
    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-strong transition-transform group-hover:translate-x-0.5" />
  );
}
