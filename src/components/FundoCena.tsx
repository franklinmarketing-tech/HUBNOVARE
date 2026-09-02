import Image from "next/image";

/**
 * Uma cena de fundo atrás de uma seção escura.
 *
 * As seções navy da casa eram gradiente puro — corretas, mas mudas. Esta
 * peça põe uma imagem por trás SEM tirar a legibilidade: a foto entra com
 * opacidade baixa e leva um véu do próprio navy por cima, então o texto
 * continua com o mesmo contraste de antes mesmo que a arte troque.
 *
 * Regras de uso:
 *
 * - A seção precisa ser `relative overflow-hidden`; o conteúdo dela precisa
 *   ficar em `relative` para subir acima da cena.
 * - `aria-hidden` sempre: é decoração. Nada aqui carrega informação, então
 *   nada aqui vira `alt` para leitor de tela.
 * - Só a cena da primeira dobra recebe `prioridade`. As de baixo entram
 *   preguiçosas — são fundo, não conteúdo.
 */
export function FundoCena({
  src,
  opacidade = 0.4,
  /** Espelha a imagem. Serve para a mesma arte não se repetir igual. */
  espelhada = false,
  /** Véu extra no rodapé da seção, para o conteúdo seguinte emendar limpo. */
  fundir = false,
  prioridade = false,
  /** `object-position` da cena. Serve para tirar o miolo da arte de trás do
   *  título — foi o que salvou a headline do herói. */
  posicao = "center",
  className = "",
}: {
  src: string;
  opacidade?: number;
  espelhada?: boolean;
  fundir?: boolean;
  prioridade?: boolean;
  posicao?: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        // `sizes` largo de propósito: a cena cobre a seção inteira, então em
        // qualquer tela ela vale a largura da viewport.
        sizes="100vw"
        priority={prioridade}
        className={`object-cover ${espelhada ? "scale-x-[-1]" : ""}`}
        style={{ opacity: opacidade, objectPosition: posicao }}
      />
      {/* O véu, em duas camadas.
          
          A primeira é VERTICAL, não radial: o texto de uma seção mora na
          metade de cima, então é lá que o escuro precisa ser quase opaco —
          e a metade de baixo pode ficar aberta, que é onde a arte aparece.
          O véu radial que existia aqui antes escurecia tudo por igual e
          apagava a cena inteira só para proteger a headline.
          
          A segunda soma duas coisas: um halo escuro bem em cima da
          headline (que é o único ponto onde o contraste aperta) e uma
          vinheta lateral fraca, que segura as bordas. */}
      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(216 58% 11% / 0.72) 0%, hsl(216 58% 11% / 0.6) 40%, hsl(216 58% 11% / 0.42) 70%, hsl(216 58% 11% / 0.3) 100%)",
        }}
      />
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(85% 60% at 50% 22%, hsl(216 58% 11% / 0.62) 0%, transparent 70%), radial-gradient(120% 100% at 50% 50%, transparent 55%, hsl(216 58% 11% / 0.5) 100%)",
        }}
      />
      {fundir && (
        <span
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background:
              "linear-gradient(180deg, transparent, hsl(216 58% 11% / 0.85))",
          }}
        />
      )}
    </span>
  );
}
