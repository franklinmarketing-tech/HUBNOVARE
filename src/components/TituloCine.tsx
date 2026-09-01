/**
 * Headline que entra palavra por palavra, em cascata.
 *
 * O texto é fatiado no servidor e cada palavra vira um `<span>` com o índice
 * em `--i`, que o CSS usa para escalonar o atraso. Fatiar aqui — e não com
 * JS no cliente — significa que o crawler e quem está sem JS recebem a frase
 * inteira, em texto, do mesmo jeito.
 *
 * O espaço entre as palavras fica FORA do span (`{" "}`), senão o
 * `inline-block` come a quebra de linha e a frase vira uma palavra só.
 */
export function TituloCine({
  texto,
  destaque,
  className = "",
  comTraco = true,
}: {
  texto: string;
  /** A parte colorida, na linha de baixo. */
  destaque?: string;
  className?: string;
  /** O traço que se desenha sob o destaque. */
  comTraco?: boolean;
}) {
  const palavras = texto.trim().split(/\s+/);
  const palavrasDestaque = destaque?.trim().split(/\s+/) ?? [];

  return (
    <h1 className={`cine ${className}`}>
      {palavras.map((palavra, i) => (
        <span key={`${palavra}-${i}`}>
          <span className="cine-palavra" style={{ "--i": i } as React.CSSProperties}>
            {palavra}
          </span>{" "}
        </span>
      ))}

      {destaque && (
        <>
          <br />
          <span className="relative inline-block text-accent-claro">
            {palavrasDestaque.map((palavra, i) => (
              <span key={`${palavra}-${i}`}>
                <span
                  className="cine-palavra"
                  style={{ "--i": palavras.length + i } as React.CSSProperties}
                >
                  {palavra}
                </span>
                {i < palavrasDestaque.length - 1 ? " " : ""}
              </span>
            ))}
            {comTraco && (
              <span
                aria-hidden
                className="cine-traco absolute -bottom-1.5 left-0 h-1 w-full rounded-full bg-ciano-claro/70"
              />
            )}
          </span>
        </>
      )}
    </h1>
  );
}
