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

export function ComoTrabalhamos() {
  return (
    <section aria-labelledby="como-titulo" className="cine">
      <h2 id="como-titulo" className="titulo-secao text-lg sm:text-xl">
        Como a Novare trabalha
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {PASSOS.map((p, i) => (
          <li key={p.titulo} className="relative flex gap-4 rounded-2xl bg-white/70 p-5 ring-1 ring-primary/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block font-display text-base font-bold text-primary">
                {p.titulo}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {p.texto}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
