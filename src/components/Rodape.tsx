import { RodapeCompleto } from "@/components/RodapeCompleto";

/**
 * O rodapé das telas do Workspace (home, Meu dia, Indicadores…).
 *
 * ⚠️ ERA UMA LINHA SÓ ("rodapé enxuto de sistema") até 21/10/2026, quando o
 * dono pediu um rodapé "moderno, completo, padrão Novare". Agora é o mesmo
 * `RodapeCompleto` das ferramentas, do News e da Íris — um rodapé para o
 * site inteiro. O nome `Rodape` ficou para não mexer nas páginas.
 */
export function Rodape() {
  return <RodapeCompleto />;
}
