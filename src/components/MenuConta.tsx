"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronDown, Crown, LogOut, Settings, UserRound } from "lucide-react";
import { sair } from "@/app/perfil/actions";
import { usarFecharFora } from "@/lib/usarFecharFora";

/** Iniciais para o avatar. Duas no máximo — três já viram borrão. */
function iniciais(nome: string, email: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (email.slice(0, 2) || "??").toUpperCase();
}

/**
 * Avatar do topo com o menu da conta.
 *
 * Substituiu o selo estático de plano: o selo ocupava o mesmo espaço e não
 * levava a lugar nenhum — quem quisesse trocar de plano ou sair tinha que
 * adivinhar o caminho.
 */
export function MenuConta({
  nome,
  email,
  assinante,
  admin,
}: {
  nome: string;
  email: string;
  assinante: boolean;
  admin: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const area = usarFecharFora<HTMLDivElement>(aberto, fechar);

  const primeiroNome = nome.trim().split(/\s+/)[0] || "Minha conta";

  return (
    <div ref={area} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label="Menu da conta"
        className={`flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-2 transition-colors ${
          aberto
            ? "border-primary/30 bg-primary-light"
            : "border-transparent hover:border-slate-200 hover:bg-slate-50"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
            assinante ? "bg-accent-btn" : "bg-primary"
          }`}
        >
          {iniciais(nome, email)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-bold text-foreground">
            {primeiroNome}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            {assinante ? "Workspace" : "Plano Free"}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_hsl(215_50%_23%_/_0.45)] animate-[surgir_.18s_ease-out]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-foreground">{nome || primeiroNome}</p>
            <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                assinante
                  ? "bg-accent-tint text-accent-strong"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Crown className="h-3 w-3" />
              {assinante ? "Workspace ativo" : "Plano Free"}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/perfil"
              onClick={fechar}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
            >
              <UserRound className="h-4 w-4 text-slate-400" />
              Meu cadastro
            </Link>

            {admin && (
              <Link
                href="/admin"
                onClick={fechar}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Administração
              </Link>
            )}

            {!assinante && (
              <Link
                href="/assinar"
                onClick={fechar}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-accent-strong transition-colors hover:bg-accent-tint"
              >
                <Crown className="h-4 w-4" />
                Liberar o Workspace
              </Link>
            )}
          </div>

          <form action={sair} className="border-t border-slate-100">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
