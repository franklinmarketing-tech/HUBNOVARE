/**
 * COMO A NOVARE TRABALHA, em três passos — a ponte entre as ferramentas
 * (logo acima) e o Jefferson (logo abaixo).
 *
 * Pedido do dono em 19/10/2026 ("humanizar"). A home mostrava muita
 * ferramenta e nenhuma explicação de quem está por trás nem do que acontece
 * se a pessoa quiser ajuda. O terceiro passo é o que diferencia a casa de um
 * app qualquer: tem gente, e essa gente não ganha comissão de produto
 * ("Consultoria sem comissão" é o que o próprio rodapé já afirma).
 */
const PASSOS = [
  {
    titulo: "Você usa de graça",
    texto: "Calculadoras, aplicativos e a Íris, sem cartão e sem pegadinha.",
  },
  {
    titulo: "Entende o seu dinheiro",
    texto: "O resultado vem explicado em português, sem jargão de banco.",
  },
  {
    titulo: "Se quiser, fala com a gente",
    texto: "Quando precisar de alguém, a Novare atende — sem comissão de produto.",
  },
];

/**
 * ⚠️ RESUMIDA em 25/10/2026, pedido do dono ("redundante… pra não ficar muito poluído"): cada
 * cartão dizia o número três vezes — "ETAPA 01", "01/03" e o 01 gigante. Agora é uma faixa só, com
 * o número pequeno ao lado do título. O laranja continua só no passo que tem gente.
 */
export function ComoTrabalhamos() {
  return (
    <section aria-labelledby="como-titulo" className="cine">
      <p className="chapeu chapeu-ciano">Como a Novare trabalha</p>
      <h2 id="como-titulo" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
        Organize seu dinheiro.{" "}
        <span className="text-accent-strong">Gente por perto se precisar.</span>
      </h2>
      <ol className="cartao-cp mt-4 grid gap-1 p-2 sm:grid-cols-3">
        {PASSOS.map((p, i) => {
          const ultima = i === PASSOS.length - 1;
          return (
            <li
              key={p.titulo}
              className={`flex items-start gap-3 rounded-2xl p-4 ${
                ultima ? "bg-gradient-to-br from-accent-btn to-[hsl(16_82%_52%)] text-white shadow-laranja" : ""
              }`}
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  ultima ? "bg-white/20 text-white" : "bg-ciano-tint text-ciano-forte"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block font-display text-base font-semibold ${ultima ? "text-white" : "text-primary"}`}>
                  {p.titulo}
                </span>
                <span className={`mt-0.5 block text-sm leading-relaxed ${ultima ? "text-white/90" : "text-muted-foreground"}`}>
                  {p.texto}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
