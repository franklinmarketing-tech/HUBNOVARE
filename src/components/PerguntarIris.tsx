"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

/**
 * A barra de pergunta da Íris, no topo da home.
 *
 * Antes a Íris era um banner que levava para outra página: dois cliques e
 * uma tela inteira até a primeira pergunta. Aqui a pessoa escreve na home e
 * cai na conversa com a pergunta já feita — o diferencial da casa vira ação
 * em vez de link.
 *
 * NÃO é a busca. A busca (⌘K) acha aplicativo pelo nome; isto responde
 * pergunta. Por isso o campo tem cara de conversa — pastilha da Íris à
 * esquerda, botão de enviar à direita — e não de campo de busca com lupa.
 */
const SUGESTOES = [
  "Quanto preciso guardar por mês para me aposentar?",
  "Vale mais a pena quitar dívida ou investir?",
  "O que é CDI e por que ele aparece em tudo?",
];

/** O mesmo teto que a página da Íris aplica ao ler a URL. */
const MAX = 300;

export function PerguntarIris({
  className = "",
  /** Atraso da entrada, para a barra cair na cascata da home. */
  delay = 0,
}: {
  className?: string;
  delay?: number;
} = {}) {
  const [texto, setTexto] = useState("");
  const router = useRouter();

  function perguntar(pergunta: string) {
    const limpa = pergunta.trim();
    if (limpa.length < 2) return;
    router.push(`/iris?p=${encodeURIComponent(limpa.slice(0, MAX))}`);
  }

  return (
    <section className={className} style={{ transitionDelay: `${delay}ms` }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          perguntar(texto);
        }}
        className="glass-card group flex items-center gap-3 rounded-2xl bg-white p-2 pl-3.5 shadow-card ring-1 ring-primary/10 transition-all focus-within:ring-2 focus-within:ring-ciano/40 hover:shadow-card-hover"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-ciano" strokeWidth={2} />

        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={MAX}
          aria-label="Pergunte à Íris sobre sua vida financeira"
          placeholder="Pergunte à Íris sobre seu dinheiro..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          disabled={texto.trim().length < 2}
          aria-label="Perguntar à Íris"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_6px_16px_-6px_hsl(215_50%_23%_/_0.8)] transition-all hover:bg-primary-soft hover:shadow-[0_8px_20px_-6px_hsl(215_50%_23%_/_0.9)] disabled:cursor-not-allowed disabled:opacity-25 disabled:shadow-none"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {/* As sugestões tiram a pessoa da folha em branco — o problema real de
          qualquer campo de conversa é não saber o que perguntar. */}
      <ul className="mt-2 flex flex-wrap gap-1.5 [@media(max-height:820px)]:hidden">
        {SUGESTOES.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => perguntar(s)}
              className="rounded-full bg-white/70 px-2.5 py-1 text-2xs text-muted-foreground ring-1 ring-primary/10 transition-colors hover:bg-white hover:text-primary hover:ring-primary/25"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
