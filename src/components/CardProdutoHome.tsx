import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { APPS, type NovareApp } from "@/lib/apps";

/**
 * A CASCA DOS CARDS DE PRODUTO DA HOME — foto de gente + corpo branco.
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
 * ⚠️ O FORMATO TEM DE SEGUIR O `CardPortal` (foto 4:3 + corpo): estes cards
 * ficam lado a lado com os de área na mesma fileira, e mexer só num deixa o
 * produto desalinhado dos vizinhos.
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
  foto,
  linhaExtra,
  rodape,
}: {
  /** A entrada do catálogo: dá o nome e a chamada. */
  app: NovareApp;
  href: string;
  /** A foto de gente no topo do card (ver o aviso abaixo). */
  foto: string;
  /** A linha miúda do corpo — o que vem junto. Opcional. */
  linhaExtra?: string;
  /** O rodapé, montado por quem chama (ver o aviso sobre preço). */
  rodape: React.ReactNode;
}) {
  /* ⚠️ ATÉ 19/10/2026 ERA UM PALCO LARANJA com o render 3D de painéis e o
     nome em maiúsculas. O dono achou a home "com cara de banco e app": o
     card passou a ter o MESMO formato do `CardPortal` (foto de gente em
     cima, corpo branco embaixo), e o laranja ficou só no detalhe — a borda
     de cima e o texto do rodapé — para o produto continuar se destacando
     das áreas sem gritar. */
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-suave ring-1 ring-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-laranja"
    >
      <span className="relative block aspect-[4/3] overflow-hidden border-t-[3px] border-accent">
        <Image
          src={foto}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-semibold text-white shadow-sm">
          App gratuito
        </span>
      </span>

      <span className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <span className="font-display text-lg font-semibold tracking-[-0.03em] text-primary">
          {app.nome}
        </span>
        <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {app.chamada}
          {linhaExtra ? ` · ${linhaExtra}` : ""}
        </span>
        {/* `gap-2` e não só `justify-between`: com conteúdo que enche a
            largura, `justify-between` sozinho deixa os dois lados encostarem. */}
        <span className="mt-auto flex items-center justify-between gap-2 pt-4">
          {rodape}
        </span>
      </span>
    </Link>
  );
}

export function SetaRodape() {
  return (
    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-strong transition-transform group-hover:translate-x-0.5" />
  );
}
