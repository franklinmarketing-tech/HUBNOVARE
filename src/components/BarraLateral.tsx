"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Newspaper,
  Search,
  Sparkles,
  User,
} from "lucide-react";

/**
 * Trilho lateral de aplicativo: estreito, fixo, só ícones.
 * É o que diferencia um produto de um site — a navegação nunca some.
 */
const ITENS = [
  // `rotulo` é o nome inteiro, para leitor de tela e `title`. `curto` é o
  // que cabe embaixo do ícone num trilho de 72px sem quebrar linha —
  // "Novare News" não cabe, "News" cabe e ninguém confunde.
  { href: "/", rotulo: "Início", curto: "Início", icone: Home },
  { href: "/meu-dia", rotulo: "Meu dia", curto: "Meu dia", icone: LayoutDashboard },
  { href: "/aplicativos", rotulo: "Aplicativos", curto: "Apps", icone: LayoutGrid },
  { href: "/novare-news", rotulo: "Novare News", curto: "News", icone: Newspaper },
  { href: "/assinar", rotulo: "Workspace", curto: "Workspace", icone: Sparkles },
];

export function BarraLateral() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center border-r border-slate-200 bg-white py-4 md:flex">
      {/* O monograma da Novare morava aqui e saiu.
          Eram duas marcas diferentes a poucos pixels uma da outra, as duas
          linkando para "/": o ícone quadrado neste trilho e a marca NOVARE
          por extenso no topo. Duas identidades visuais que não conversam
          entre si, para o mesmo destino. Ficou a marca, que é a de verdade;
          o "Início" logo abaixo já leva para casa. */}

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
              className={`relative flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all ${
                ativo
                  ? "bg-primary text-white shadow-[0_8px_20px_-8px_hsl(215_50%_23%_/_0.7)]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-primary"
              }`}
            >
              {/* O traço ciano à esquerda: num trilho só de ícones, a cor de
                  fundo sozinha não diz "você está aqui" com força suficiente
                  quando dois itens têm ícones parecidos. */}
              {ativo && (
                <span
                  aria-hidden
                  className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-ciano"
                />
              )}
              <item.icone className="h-5 w-5" strokeWidth={1.75} />
              {/* O nome, sempre visível.
                  Eram seis ícones mudos, e dois deles quase idênticos
                  (LayoutDashboard do "Meu dia" e LayoutGrid dos
                  "Aplicativos"): quadrados divididos em quadrados. O
                  `title` do HTML só aparece depois de parar o mouse em
                  cima por um segundo — e não existe no celular. */}
              <span className="text-[9px] font-semibold leading-none">
                {item.curto}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
          title="Buscar"
          aria-label="Buscar aplicativo"
          className="flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
        >
          <Search className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold leading-none">Buscar</span>
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
        className="flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        <User className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[9px] font-semibold leading-none">Perfil</span>
      </Link>

      {/* Havia aqui um segundo botão para /assinar, um cadeado sem rótulo —
          e o item "Workspace" do menu acima já vai para a MESMA página. Dois
          destinos iguais no mesmo trilho, um deles representado por um
          cadeado que tanto podia ser "assinar" quanto "sair" ou "privacidade".
          Ficou o do menu, que tem nome. */}
    </aside>
  );
}
