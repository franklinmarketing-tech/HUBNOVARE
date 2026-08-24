"use client";

import Image from "next/image";
import Link from "next/link";
import { CONTAGEM } from "@/lib/apps";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Sunrise,
  Users,
} from "lucide-react";
import { InstagramLogo, YoutubeLogo } from "@/components/LogosSociais";

/**
 * Cabeçalho próprio do Novare News, no molde dos grandes portais de
 * investimento: logo do canal à esquerda, o dropdown "Ecossistema Novare"
 * (o guarda-chuva de produtos, como o "Grupo X" desses portais), links
 * diretos, sociais e o CTA do Workspace fechando à direita.
 *
 * É separado do cabeçalho do app de propósito: o News é a vitrine externa
 * da casa — quem chega por um artigo precisa enxergar o ecossistema
 * inteiro sem já estar dentro dele.
 */

const ECOSSISTEMA = [
  {
    href: "/assinar",
    nome: "Workspace",
    desc: "Todos os produtos numa assinatura",
    icone: Sparkles,
  },
  {
    href: "/vidaplan/login?demo=1",
    nome: "Vida Plan",
    desc: "Seu plano de vida em números · demo aberta",
    icone: Sunrise,
    externo: true,
  },
  {
    href: "/iris",
    nome: "Íris",
    desc: "A IA que lê seu extrato",
    icone: Bot,
  },
  {
    href: "/consultoria",
    nome: "Consultoria",
    desc: "Primeira análise grátis",
    icone: Users,
  },
  {
    href: "/aplicativos",
    nome: "Todas as ferramentas",
    desc: `${CONTAGEM.ferramentas} ferramentas gratuitas`,
    icone: LayoutGrid,
  },
];

const SOCIAIS = [
  { nome: "Instagram", href: "https://www.instagram.com/novare.invest", Icone: InstagramLogo },
  {
    nome: "YouTube",
    href: "https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ",
    Icone: YoutubeLogo,
  },
];

export function CabecalhoNews() {
  const [aberto, setAberto] = useState(false);
  const fechamento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raiz = useRef<HTMLElement>(null);

  function agendarFechamento() {
    if (fechamento.current) clearTimeout(fechamento.current);
    fechamento.current = setTimeout(() => setAberto(false), 180);
  }
  function cancelarFechamento() {
    if (fechamento.current) clearTimeout(fechamento.current);
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    function aoClicarFora(e: MouseEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  return (
    <header
      ref={raiz}
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4">
        {/* A marca do canal: logo da casa + selo NEWS. */}
        <Link href="/novare-news" className="flex shrink-0 items-center gap-2">
          <Image
            src="/marca/logo-novare.png"
            alt="Novare"
            width={112}
            height={28}
            priority
            className="h-6 w-auto sm:h-7"
          />
          <span className="rounded-md bg-primary px-1.5 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wider text-white">
            News
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          {/* O guarda-chuva de produtos, como os portais fazem. */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => {
                cancelarFechamento();
                setAberto(true);
              }}
              onMouseLeave={agendarFechamento}
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                aberto
                  ? "bg-slate-100 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              Ecossistema Novare
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  aberto ? "rotate-180" : ""
                }`}
              />
            </button>

            {aberto && (
              <div
                onMouseEnter={cancelarFechamento}
                onMouseLeave={agendarFechamento}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[21rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_hsl(215_50%_23%_/_0.45)]"
              >
                {ECOSSISTEMA.map((item) =>
                  item.externo ? (
                    <a
                      key={item.nome}
                      href={item.href}
                      onClick={() => setAberto(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <ItemEco item={item} />
                    </a>
                  ) : (
                    <Link
                      key={item.nome}
                      href={item.href}
                      onClick={() => setAberto(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <ItemEco item={item} />
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>

          <Link
            href="/aplicativos"
            className="flex h-10 items-center rounded-xl px-3 text-[13px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
          >
            Ferramentas
          </Link>
          <Link
            href="/consultoria"
            className="flex h-10 items-center rounded-xl px-3 text-[13px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
          >
            Consultoria
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Sociais como texto: esta versão do lucide não traz ícone de
              marca, e desenhar logo alheio à mão é pedir para errar. */}
          <div className="hidden items-center gap-1.5 xl:flex">
            {SOCIAIS.map((s) => (
              <a
                key={s.nome}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Novare no ${s.nome}`}
                title={s.nome}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <s.Icone className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          <a
            href="https://wa.me/5519983402827?text=Quero%20receber%20o%20Novare%20News%20no%20WhatsApp."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary md:flex"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Inscreva-se
          </a>

          <Link
            href="/assinar"
            className="flex items-center gap-1.5 rounded-xl bg-accent-btn px-3.5 py-2 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-strong sm:px-4"
          >
            <span className="hidden sm:inline">Quero meu Workspace</span>
            <span className="sm:hidden">Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ItemEco({ item }: { item: (typeof ECOSSISTEMA)[number] }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07]">
        <item.icone className="h-4 w-4 text-primary" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-slate-800">
          {item.nome}
        </span>
        <span className="block truncate text-[11px] text-slate-500">
          {item.desc}
        </span>
      </span>
    </>
  );
}
