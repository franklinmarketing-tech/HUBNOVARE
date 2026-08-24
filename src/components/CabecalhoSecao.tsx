/**
 * Cabeçalho de seção: título, contagem, filete e uma ação opcional à direita.
 * Deliberadamente sem eyebrow em caixa alta, que é ruído repetido.
 */
export function CabecalhoSecao({
  titulo,
  total,
  children,
}: {
  titulo: string;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <h2 className="titulo-secao text-xl sm:text-2xl">{titulo}</h2>
      <span className="text-[11px] tabular-nums text-muted-foreground/60">
        {total}
      </span>
      <span className="h-px flex-1 bg-border" />
      {children}
    </div>
  );
}
