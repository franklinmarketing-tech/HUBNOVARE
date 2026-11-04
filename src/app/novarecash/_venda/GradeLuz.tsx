"use client";

/**
 * A grade do bento, com a luz dourada que segue o cursor dentro de cada bloco.
 *
 * Só anota a posição do mouse em `--mx`/`--my` do bloco sob o cursor: quem
 * desenha a luz é o CSS (`.ncv-bloco` em `venda.css`). Nenhum `useState`, então
 * mover o mouse não re-renderiza nada. No toque (`pointerType` diferente de
 * "mouse") não faz nada: a página não depende de hover.
 */
export function GradeLuz({ className, children }: { className: string; children: React.ReactNode }) {
  function mover(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "mouse") return;
    const bloco = (e.target as HTMLElement).closest<HTMLElement>("[data-luz]");
    if (!bloco) return;
    const caixa = bloco.getBoundingClientRect();
    bloco.style.setProperty("--mx", `${e.clientX - caixa.left}px`);
    bloco.style.setProperty("--my", `${e.clientY - caixa.top}px`);
  }

  return (
    <ul className={className} onPointerMove={mover}>
      {children}
    </ul>
  );
}
