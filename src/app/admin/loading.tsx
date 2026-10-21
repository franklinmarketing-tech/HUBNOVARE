/**
 * Tela de espera do admin (21/10/2026: "o menu demora para carregar").
 * Com este arquivo a aba troca NA HORA e o conteúdo chega por cima — o Next
 * também pré-carrega este esqueleto nos links do menu.
 */
export default function CarregandoAdmin() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8" aria-busy="true" aria-label="Carregando">
      <div className="h-40 animate-pulse rounded-[1.75rem] bg-primary/10" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-muted" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/70" />
        ))}
      </div>
    </main>
  );
}
