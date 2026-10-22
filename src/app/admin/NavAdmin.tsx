"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, Inbox, LifeBuoy, Magnet, Megaphone, MessageSquareText, Users } from "lucide-react";

/**
 * A BARRA DO PAINEL — marca, quem está logado e as abas.
 *
 * ⚠️ ANTES ERA O CABEÇALHO GENÉRICO DO SITE, com os ícones de Instagram e
 * YouTube e uma fita de cotação. Dentro de uma ferramenta de trabalho isso é
 * ruído: ninguém abre o painel para ir ao Instagram. E as abas eram links
 * soltos sem estado — NENHUMA mostrava em que tela você estava, então quem
 * caía num link direto não sabia onde estava.
 *
 * ⚠️ É CLIENT COMPONENT POR UM MOTIVO SÓ: `usePathname`. O layout é server
 * component e não sabe a rota atual; sem ela, a aba ativa não tem como
 * acender. Todo o resto — perfil, contagens — chega pronto do servidor.
 *
 * ── AS ABAS, e por que são cinco e não sete ─────────────────────────────
 *
 * "Assinantes" saiu porque não há mais assinante: o Hub é gratuito, e a
 * tela falava de "pagante", "teste vencido" e "+1 mês" para uma casa que
 * não cobra nada. O que ela tinha de útil — e-mail de cada pessoa e o
 * papel de acesso — foi para Clientes.
 *
 * "Uso" saiu porque media a MESMA coisa que Iscas (`hub_eventos`), em
 * outra tela e com outro desenho. Duas telas para o mesmo número é como
 * duas pessoas chegam a conclusões diferentes olhando o mesmo dado.
 */

const ABAS = [
  { href: "/admin", rotulo: "Saúde", Icone: Activity, exato: true },
  { href: "/admin/leads", rotulo: "Leads", Icone: Inbox, contagem: "leads" as const },
  // As notas das ferramentas e o "Fale com a gente" (21/10/2026).
  { href: "/admin/feedback", rotulo: "Feedback", Icone: MessageSquareText, contagem: "mensagens" as const },
  { href: "/admin/clientes", rotulo: "Clientes", Icone: Users },
  { href: "/admin/iscas", rotulo: "Iscas", Icone: Magnet },
  { href: "/admin/avisos", rotulo: "Avisos", Icone: Megaphone },
  // Só para o papel admin, e com senha extra lá dentro (21/10/2026).
  { href: "/admin/suporte", rotulo: "Suporte", Icone: LifeBuoy, soAdmin: true },
] as { href: string; rotulo: string; Icone: typeof Activity; exato?: boolean; contagem?: "leads" | "mensagens"; soAdmin?: boolean }[];

export function NavAdmin({
  nome,
  email,
  papel,
  leadsEsperando,
  mensagensPendentes = 0,
}: {
  nome: string;
  email: string;
  papel: "admin" | "equipe";
  leadsEsperando: number;
  /** Mensagens do "Fale com a gente" sem resposta (aba Feedback). */
  mensagensPendentes?: number;
}) {
  const caminho = usePathname() ?? "/admin";

  const ativa = (href: string, exato?: boolean) =>
    exato ? caminho === href : caminho === href || caminho.startsWith(href + "/");

  const iniciais =
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || email.slice(0, 1).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 text-white shadow-[0_10px_30px_-18px_hsl(215_60%_10%/0.7)]"
      style={{
        background:
          "linear-gradient(120deg, hsl(199 76% 12%) 0%, hsl(199 72% 16%) 55%, hsl(212 50% 25%) 100%)",
      }}
    >
      {/* O filete de luz na base da barra, nas duas cores da marca. É o que
          separa a barra do conteúdo sem precisar de uma borda dura. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,hsl(210_75%_65%/0.5),hsl(16_85%_62%/0.45),transparent)]"
      />

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-3 sm:gap-4">
        <Link href="/admin" className="flex min-h-11 shrink-0 items-center gap-3" aria-label="Painel da Novare">
          <Image
            src="/marca/logo-novare-branca.png"
            alt="Novare"
            width={110}
            height={32}
            priority
            style={{ height: 26, width: "auto" }}
          />
          <span className="hidden rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-[0.16em] text-white/75 sm:inline">
            Painel
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white md:flex"
          >
            Ver o Hub
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>

          {/* Quem está logado — com dois sócios usando o painel, é o que
              evita um achar que está na conta do outro. */}
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,hsl(16_86%_58%),hsl(16_82%_44%))] text-xs font-bold">
              {iniciais}
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block max-w-[11rem] truncate text-xs font-semibold">{nome || email}</span>
              <span className="block text-2xs uppercase tracking-wider text-white/50">{papel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rola na horizontal no celular em vez de quebrar em duas linhas:
          menu quebrado empurra o conteúdo para baixo em toda tela. */}
      <nav aria-label="Seções do painel" className="mx-auto max-w-6xl px-2 sm:px-3">
        <ul className="-mb-px flex gap-0.5 overflow-x-auto pt-2">
          {ABAS.filter((a) => !a.soAdmin || papel === "admin").map(({ href, rotulo, Icone, exato, contagem }) => {
            const ligada = ativa(href, exato);
            const numero = contagem === "leads" ? leadsEsperando : contagem === "mensagens" ? mensagensPendentes : 0;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={ligada ? "page" : undefined}
                  className={`relative flex min-h-11 items-center gap-2 rounded-t-xl px-3.5 text-sm font-semibold transition-colors ${
                    ligada
                      ? "bg-background text-primary"
                      : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Icone className="h-4 w-4" strokeWidth={ligada ? 2.2 : 1.9} />
                  {rotulo}
                  {numero > 0 && (
                    /* O número de leads esperando fica NA ABA: é o que faz
                       alguém entrar em Leads sem precisar lembrar de olhar. */
                    <span
                      className={`min-w-5 rounded-full px-1.5 py-px text-center text-2xs font-bold tabular-nums ${
                        ligada ? "bg-accent text-white" : "bg-[hsl(16_86%_58%)] text-white"
                      }`}
                    >
                      {numero > 99 ? "99+" : numero}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
