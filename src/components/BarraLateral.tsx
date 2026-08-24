"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Lock, Newspaper, Search, Sparkles, User } from "lucide-react";

/**
 * Trilho lateral de aplicativo: estreito, fixo, só ícones.
 * É o que diferencia um produto de um site — a navegação nunca some.
 */
const ITENS = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/aplicativos", rotulo: "Aplicativos", icone: LayoutGrid },
  { href: "/novare-news", rotulo: "Novare News", icone: Newspaper },
  { href: "/assinar", rotulo: "Workspace", icone: Sparkles },
];

export function BarraLateral() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center border-r border-slate-200 bg-white py-4 md:flex">
      {/* Voltar para a home é recomeçar: sem filtro de área pendurado na
          URL e com a página no topo, não onde a pessoa parou antes. */}
      <Link
        href="/"
        aria-label="Novare, início"
        className="mb-6"
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <Image
          src="/marca/icone-novare.png"
          alt="Novare"
          width={40}
          height={40}
          className="rounded-xl"
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {ITENS.map((item) => {
          const ativo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.rotulo}
              aria-label={item.rotulo}
              aria-current={ativo ? "page" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                ativo
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-primary"
              }`}
            >
              <item.icone className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
          title="Buscar"
          aria-label="Buscar aplicativo"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
        >
          <Search className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </nav>

      {/* O perfil abre numa aba ao lado: mexer nos seus dados não pode
          custar o lugar onde a pessoa estava no Workspace. */}
      <Link
        href="/perfil"
        target="_blank"
        rel="noopener"
        title="Meu perfil (abre em nova aba)"
        aria-label="Meu perfil, abre em nova aba"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        <User className="h-5 w-5" strokeWidth={1.75} />
      </Link>

      <Link
        href="/assinar"
        title="Assinar o Workspace"
        aria-label="Assinar o Workspace"
        className="mt-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-accent-btn hover:text-white"
      >
        <Lock className="h-4 w-4" strokeWidth={1.75} />
      </Link>
    </aside>
  );
}
