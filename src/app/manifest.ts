import type { MetadataRoute } from "next";

/**
 * Manifesto PWA: o Workspace pode ser instalado como app no celular e no
 * desktop, que é como uma ferramenta de uso diário deve viver.
 *
 * ═══ ⚠️ O ÍCONE ERA UM "N" DESENHADO À MÃO (14/09/2026) ════════════════════
 *
 * Até esta data o único ícone era um `icon.svg` com a letra N em Georgia
 * dentro de um quadrado navy, com uma bolinha laranja. Não era a marca da
 * Novare — era um monograma improvisado. Quem instalasse o app punha na tela
 * inicial um ícone que a empresa não usa em lugar nenhum.
 *
 * Agora sai de `public/marca/icone-novare.png`, a marca oficial, aparada e
 * centralizada por script (o PNG original tinha margem transparente desigual,
 * então centralizar sem aparar deixava o desenho fora do eixo).
 *
 * ═══ POR QUE QUATRO ARQUIVOS, E NÃO UM SVG "any" ══════════════════════════
 *
 * O manifesto antigo declarava um SVG com `sizes: "any"`. Funciona no papel e
 * falha na prática:
 *
 *   • O Chrome no Android só oferece "instalar" com PNG de 192 e 512. Com
 *     apenas SVG, o prompt de instalação simplesmente não aparece — sem erro,
 *     sem aviso.
 *   • `purpose: "maskable"` é o que impede o Android de recortar o desenho.
 *     Sem ele o sistema desenha o ícone dentro de um círculo e corta a seta
 *     da marca, que é justamente o que a identifica.
 *   • O iOS ignora o manifesto inteiro para o ícone: ele lê
 *     `apple-touch-icon`. Sem esse arquivo, o atalho na tela inicial do iPhone
 *     vira uma miniatura desfocada da página.
 *
 * ⚠️ A MARGEM DO MASKABLE É MAIOR DE PROPÓSITO (22% contra 12%). O Android
 * pode recortar até 20% de cada lado conforme o formato do lançador — círculo,
 * quadrado arredondado, gota. A marca inteira precisa caber na zona segura
 * central, e foi conferida contra ela antes de entrar.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    /* `name` aparece no prompt de instalação e na lista de apps; `short_name`
       é o que cabe embaixo do ícone na tela inicial, onde o Android corta
       perto de 12 caracteres. "Novare Workspace" não caberia — por isso o
       curto é só a marca. */
    name: "Novare Workspace",
    short_name: "Novare",
    description:
      "Todas as ferramentas financeiras da Novare em um lugar só: organização, investimentos, crédito e patrimônio.",
    start_url: "/",
    /* `standalone`: abre sem a barra de endereço, como app instalado. */
    display: "standalone",
    orientation: "portrait",
    /* O fundo da tela de abertura, enquanto o app carrega. É o creme da casa,
       o mesmo da home — assim a splash não pisca branco antes da página. */
    background_color: "#faf7f2",
    /* A cor da barra de status no Android. Navy institucional. */
    theme_color: "#1d3658",
    lang: "pt-BR",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        /* ⚠️ SEM ESTE, o Android recorta a marca. Ver o aviso no topo. */
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
