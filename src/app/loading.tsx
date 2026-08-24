/**
 * Espera padrão do Workspace.
 *
 * Várias páginas são server components que consultam o Supabase e os
 * indicadores do Banco Central antes de renderizar. Sem este arquivo, o
 * clique não dava retorno nenhum em conexão lenta — a tela simplesmente
 * ficava parada, que é o sintoma clássico de site amador.
 */
export default function Carregando() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        {/* Anel da marca girando: navy com o corte laranja. */}
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary/15 border-t-accent"
          aria-hidden="true"
        />
        <p className="text-xs font-medium text-muted-foreground">Carregando…</p>
      </div>
    </div>
  );
}
