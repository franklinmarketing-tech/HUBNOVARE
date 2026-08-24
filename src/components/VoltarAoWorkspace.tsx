import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * O caminho de volta, presente em toda ferramenta.
 *
 * Cada uma das 62 ferramentas tem o seu próprio cabeçalho, escrito à mão,
 * e neles a única saída é a marca — que muita gente não sabe que é
 * clicável. Em vez de editar 62 arquivos (e quebrar algum), este botão
 * entra uma vez só, pelo layout de `/ferramentas`.
 *
 * Fica embaixo à ESQUERDA: o assistente flutuante ocupa a direita
 * (`bottom-5 right-5`) e o cabeçalho de cada página ocupa o topo.
 */
export function VoltarAoWorkspace() {
  return (
    <Link
      href="/"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-600 shadow-[0_10px_30px_-12px_hsl(215_50%_23%_/_0.5)] backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {/* No celular o espaço é do polegar: só a seta e a palavra curta. */}
      <span className="hidden sm:inline">Voltar ao Workspace</span>
      <span className="sm:hidden">Workspace</span>
    </Link>
  );
}
