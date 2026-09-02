"use client";

import Image from "next/image";
import Link from "next/link";
import { CONTAGEM } from "@/lib/apps";
import { falarNoWhatsApp } from "@/lib/contato";
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
    href: "/assinar/workspace",
    nome: "Workspace",
    desc: "Todos os produtos numa assinatura",
    icone: Sparkles,
  },
  {
    href: "/planejamento",
    nome: "Planejamento",
    desc: "Retrato, diagnóstico e plano — em 10 minutos",
    icone: Sunrise,
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
      className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md"
    >
      {/* No celular a barra é mais baixa: com a trilha do ecossistema
          embaixo, duas faixas altas comeriam meia tela de leitura. */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:h-16 sm:gap-5">
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
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-2xs font-bold uppercase tracking-[0.12em] transition-colors ${
                aberto
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
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
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[21rem] overflow-hidden rounded-2xl border border-border bg-white shadow-elevated"
              >
                {ECOSSISTEMA.map((item) => (
                  <LinkEco
                    key={item.nome}
                    item={item}
                    onClick={() => setAberto(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <ItemEco item={item} />
                  </LinkEco>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/aplicativos"
            className="flex h-10 items-center rounded-xl px-3 text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            Ferramentas
          </Link>
          <Link
            href="/consultoria"
            className="flex h-10 items-center rounded-xl px-3 text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                <s.Icone className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          <a
            // Falar COM a Novare: precisa de destinatário — por isso o
            // ajudante do lib de contato, não um wa.me escrito à mão.
            href={falarNoWhatsApp("Quero receber o Novare News no WhatsApp.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-2xs font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary md:flex"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Inscreva-se
          </a>

          <Link
            href="/assinar/workspace"
            className="flex items-center gap-1.5 rounded-xl bg-accent-btn px-3.5 py-2 text-2xs font-bold text-accent-foreground transition-colors hover:bg-accent-strong sm:px-4"
          >
            <span className="hidden sm:inline">Quero meu Workspace</span>
            <span className="sm:hidden">Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* No celular o menu inteiro não cabe na barra. Em vez de esconder o
          ecossistema atrás de um hambúrguer, ele vira uma trilha rolável —
          quem chega por um artigo continua enxergando a casa toda. */}
      <div className="border-t border-border lg:hidden">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex w-max items-center gap-1 py-2">
            {/* Sem o Workspace: o botão laranja dele está logo acima. */}
            {ECOSSISTEMA.filter((item) => item.href !== "/assinar/workspace").map((item) => (
              <LinkEco
                key={item.nome}
                item={item}
                className="shrink-0 rounded-full px-3 py-1.5 text-2xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                {item.nome}
              </LinkEco>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Um item do ecossistema.
 *
 * Já foi `<a>` ou `<Link>` conforme o destino saísse do app Next: o antigo
 * Vida Plan morava em outro host. Agora todo o ecossistema é servido aqui
 * dentro, então é sempre `<Link>` — mas o componente continua existindo
 * para o menu do desktop e a trilha do celular não divergirem.
 */
function LinkEco({
  item,
  className,
  onClick,
  children,
}: {
  item: (typeof ECOSSISTEMA)[number];
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function ItemEco({ item }: { item: (typeof ECOSSISTEMA)[number] }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07]">
        <item.icone className="h-4 w-4 text-primary" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-primary">{item.nome}</span>
        <span className="block truncate text-2xs text-muted-foreground">
          {item.desc}
        </span>
      </span>
    </>
  );
}
