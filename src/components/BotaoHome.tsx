import Link from "next/link";
import { Home } from "lucide-react";

/**
 * Saída explícita para a home, no cabeçalho de toda ferramenta.
 *
 * A logo já era clicável, mas isso é conhecimento de quem faz site: muita
 * gente não tenta clicar nela e acaba usando o voltar do navegador — ou
 * fecha a aba. Um botão escrito resolve, e o rótulo some no celular para
 * não competir com o nome da ferramenta.
 */
export function BotaoHome() {
  return (
    <Link
      href="/"
      aria-label="Voltar para a página inicial"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
    >
      <Home className="h-3.5 w-3.5" strokeWidth={2} />
      <span className="hidden sm:inline">Início</span>
    </Link>
  );
}
