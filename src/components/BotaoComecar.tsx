import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * O BOTÃO PRINCIPAL DA LANDING.
 *
 * ═══ ELE SUBSTITUIU O `BotaoAssinarPlano` EM 18/10/2026 ══════════════════
 *
 * O antigo abria um modal de checkout ou mandava direto para a Hotmart. Com
 * o Hub gratuito, isso virou um convite para comprar o que não está à venda:
 * quem clicava em "Começar agora" na landing caía numa página de compra.
 *
 * ⚠️ ISSO PASSOU POR TODA A LIMPEZA DE PREÇO SEM SER NOTADO, e vale
 * registrar por quê: o destino não é texto na página — é o resultado de uma
 * função (`assinaturaCheckout`), resolvido só no clique. Varredura de texto
 * não vê, conferência visual não vê, e o guardião de "nada à venda" lê a
 * página parada. Apareceu numa busca por componentes órfãos.
 *
 * ⚠️ O NOME MUDOU DE PROPÓSITO. "BotaoAssinarPlano" com destino de cadastro
 * gratuito seria a mesma armadilha do campo `plano: "pago"` que não cobrava:
 * um nome que mente sobrevive à mudança e volta a mentir no próximo
 * refactor.
 */
export function BotaoComecar({
  rotulo = "Criar conta grátis",
  destino = "/login?modo=criar&proximo=/fincash/app",
  tamanho = "normal",
  variante = "escura",
  destaque = false,
}: {
  rotulo?: string;
  /** Para onde leva. O padrão é o cadastro do FINCASH. */
  destino?: string;
  tamanho?: "normal" | "grande";
  variante?: "escura" | "clara";
  /** Liga a varredura de luz, para o botão principal da dobra. */
  destaque?: boolean;
}) {
  const estilo =
    variante === "clara"
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-accent-btn text-white hover:bg-accent-strong";

  const medida =
    tamanho === "grande"
      ? "h-13 px-7 text-base sm:h-14 sm:px-8"
      : "h-11 px-5 text-sm";

  return (
    <Link
      href={destino}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all hover:-translate-y-0.5 ${estilo} ${medida} ${destaque ? "cta-varredura" : ""}`}
    >
      {rotulo}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
