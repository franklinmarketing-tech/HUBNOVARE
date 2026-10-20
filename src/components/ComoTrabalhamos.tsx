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
      <p className="chapeu chapeu-ciano">Como a Novare trabalha</p>
      <h2 id="como-titulo" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
        Simples de usar.{" "}
        <span className="text-accent-strong">Gente por perto se precisar.</span>
      </h2>
      {/* As etapas no desenho da Carteira Pontual: "ETAPA 01 · 01/03", o
          número grande e fino em ciano e o traço no pé. A ÚLTIMA vem cheia
          de laranja — é a que tem gente, e é o que diferencia a casa. */}
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {PASSOS.map((p, i) => {
          const ultima = i === PASSOS.length - 1;
          const n = String(i + 1).padStart(2, "0");
          return (
            <li
              key={p.titulo}
              className={`flex flex-col rounded-[1.75rem] p-6 ${
                ultima
                  ? "bg-gradient-to-br from-accent-btn to-[hsl(16_82%_52%)] text-white shadow-laranja"
                  : "cartao-cp"
              }`}
            >
              <span className={`flex items-center justify-between border-b pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${ultima ? "border-white/25 text-white/80" : "border-border text-muted-foreground"}`}>
                <span>Etapa {n}</span>
                <span className="tracking-normal">{n}/{String(PASSOS.length).padStart(2, "0")}</span>
              </span>
              <span className={`numero-etapa mt-4 ${ultima ? "!text-white" : ""}`}>{n}</span>
              <span className={`mt-3 block font-display text-base font-semibold ${ultima ? "text-white" : "text-primary"}`}>
                {p.titulo}
              </span>
              <span className={`mt-1 block text-sm leading-relaxed ${ultima ? "text-white/90" : "text-muted-foreground"}`}>
                {p.texto}
              </span>
              {/* O espaçador empurra o traço para o pé: com textos de tamanhos
                  diferentes, os três traços ficam na mesma altura. */}
              <span aria-hidden className="min-h-5 flex-1" />
              <span aria-hidden className={`block h-0.5 w-full rounded-full ${ultima ? "bg-white/60" : "bg-ciano"}`} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
