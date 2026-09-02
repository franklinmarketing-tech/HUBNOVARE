import Image from "next/image";

/**
 * Emblema 3D com halo, no lugar do ícone de traço.
 *
 * O projeto já tem trinta destes em /public/icones-3d, produzidos para o
 * app, e a landing vinha desenhando tudo com ícone de linha. Um emblema
 * renderizado dá acabamento de produto onde o traço dá acabamento de
 * wireframe, e não custa desenho novo: a arte já foi paga.
 *
 * O halo fica ATRÁS, num pseudo-elemento sem eventos, para o ícone nunca
 * perder nitidez por causa do brilho.
 */
export function Icone3D({
  src,
  tamanho = 56,
  tom = "ciano",
  className = "",
}: {
  /** Caminho dentro de /public, ex.: "/icones-3d/icon-growth-3d.png". */
  src: string;
  tamanho?: number;
  tom?: "ciano" | "accent" | "neutro";
  className?: string;
}) {
  const halo =
    tom === "accent"
      ? "hsl(16 85% 55% / 0.45)"
      : tom === "neutro"
        ? "hsl(215 50% 45% / 0.35)"
        : "hsl(197 80% 55% / 0.45)";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: tamanho, height: tamanho }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: `radial-gradient(circle, ${halo}, transparent 70%)` }}
      />
      <Image
        src={src}
        alt=""
        width={tamanho}
        height={tamanho}
        className="relative object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
      />
    </span>
  );
}
