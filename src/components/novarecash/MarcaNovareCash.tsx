import Image from "next/image";

/**
 * A MARCA DO NOVARECASH (03/11/2026): o ícone da Novare + "Novare" + "Cash" em
 * ouro. É o único lugar que desenha o nome — app, página de venda e pop-up usam
 * este componente, para o logo não ganhar três versões.
 *
 * `tom="escuro"` é sobre a noite (texto claro); `tom="claro"` sobre fundo claro.
 */
export function MarcaNovareCash({
  tom = "escuro",
  tamanho = "md",
  className = "",
}: {
  tom?: "escuro" | "claro";
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const icone = tamanho === "lg" ? 40 : tamanho === "sm" ? 24 : 30;
  const texto = tamanho === "lg" ? "text-3xl" : tamanho === "sm" ? "text-lg" : "text-2xl";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="NovareCash">
      <Image src="/marca/icone-novare.png" alt="" width={icone} height={icone} className="shrink-0" />
      <span aria-hidden className={`font-display font-semibold tracking-[-0.03em] ${texto}`}>
        <span className={tom === "escuro" ? "text-white" : "text-primary"}>Novare</span>
        <span className={tom === "escuro" ? "text-ouro" : "text-ouro-forte"}>Cash</span>
      </span>
    </span>
  );
}
