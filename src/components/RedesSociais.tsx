import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@/components/LogosSociais";

/**
 * AS REDES DA NOVARE, EM UM LUGAR SÓ.
 *
 * ═══ POR QUE VIROU COMPONENTE (21/09/2026) ════════════════════════════════
 *
 * Os três links estavam copiados à mão em cada topo que os tinha, e o
 * resultado foi o que sempre é: cada cópia com um conteúdo diferente.
 *
 *   • `TopoApp` tinha as três — mas só aparecia para quem NÃO estava logado,
 *     e só a partir de `lg`. Assinante nunca via rede social nenhuma.
 *   • `CabecalhoNews` tinha só Instagram e YouTube. O LinkedIn, adicionado
 *     aos rodapés em agosto, nunca chegou aqui.
 *   • `Cabecalho` — o topo de /consultoria, /assinar/em-breve e do admin —
 *     não tinha nenhuma.
 *
 * O dono pediu as redes em todos os topos. Com um componente, acrescentar a
 * quarta rede (ou trocar uma URL) é uma edição, não uma caçada.
 *
 * ⚠️ AS URLs SÃO AS OFICIAIS e estão repetidas nos rodapés. Não unifiquei os
 * rodapés nesta passada para não misturar dois trabalhos — mas se mexer numa
 * URL aqui, `Rodape.tsx` e `RodapeNovare.tsx` têm as mesmas.
 */

const REDES = [
  {
    nome: "Instagram",
    href: "https://www.instagram.com/novare.invest",
    Icone: InstagramLogo,
  },
  {
    nome: "YouTube",
    href: "https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ",
    Icone: YoutubeLogo,
  },
  {
    nome: "LinkedIn",
    href: "https://www.linkedin.com/in/jeffersonfreittas-sociofundadornovare/",
    Icone: LinkedinLogo,
  },
] as const;

export function RedesSociais({
  className = "",
  tamanho = "h-[18px] w-[18px]",
}: {
  /** Onde a barra aparece. Quem chama decide o breakpoint e o espaçamento. */
  className?: string;
  tamanho?: string;
}) {
  return (
    <div className={`items-center gap-2.5 ${className}`}>
      {REDES.map(({ nome, href, Icone }) => (
        <a
          key={nome}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Novare no ${nome}`}
          title={nome}
          /* A margem negativa com padding aumenta a área de toque para os 44px
             do dedo sem afastar os ícones uns dos outros na tela. */
          className="-m-1.5 p-1.5 opacity-80 transition-opacity hover:opacity-100"
        >
          <Icone className={tamanho} />
        </a>
      ))}
    </div>
  );
}
