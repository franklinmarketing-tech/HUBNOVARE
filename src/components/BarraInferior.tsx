"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  LayoutGrid,
  Newspaper,
  Search,
} from "lucide-react";

/**
 * A navegação do celular.
 *
 * O trilho lateral se descreve como "o que diferencia um produto de um site —
 * a navegação nunca some", mas ele é `hidden … md:flex`: abaixo de 768px
 * sumia inteiro e não havia substituto. Sobravam o logo e uma lupa, e o
 * catálogo passava a depender de uma paleta que se anuncia por um `⌘K`
 * também escondido no celular.
 *
 * Os quatro primeiros destinos são os mesmos do trilho, na mesma ordem, para
 * quem alterna entre computador e telefone não ter de reaprender. O quinto é
 * a busca: no toque não existe atalho de teclado, então ela precisa de um
 * lugar próprio.
 *
 * ONDE ELA NÃO ENTRA, e por quê: `/assinar` já tem a `BarraAssinarFixa`
 * ocupando o rodapé, e as ferramentas já têm o `VoltarAoWorkspace` e o
 * assistente flutuante nos dois cantos de baixo. Empilhar barra sobre barra
 * cobriria o conteúdo — por isso ela é colocada página a página, e não no
 * layout raiz.
 */
const ITENS = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/meu-dia", rotulo: "Meu dia", icone: LayoutDashboard },
  { href: "/aplicativos", rotulo: "Apps", icone: LayoutGrid },
  { href: "/novare-news", rotulo: "News", icone: Newspaper },
];

export function BarraInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      // `pb` com `safe-area-inset`: no iPhone a faixa do gesto de voltar come
      // os últimos pixels, e sem isso o último rótulo fica sob ela.
      className="nao-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch">
        {ITENS.map(({ href, rotulo, icone: Icone }) => {
          const ativo =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
                  ativo ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icone
                  className="h-5 w-5"
                  strokeWidth={ativo ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-none">
                  {rotulo}
                </span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
            className="flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground transition-colors"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            <span className="text-[10px] font-semibold leading-none">
              Buscar
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
