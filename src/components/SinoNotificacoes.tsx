"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Bell, Check, Megaphone, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { marcarLidas } from "@/app/notificacoes/actions";
import { usarFecharFora } from "@/lib/usarFecharFora";
import type { Notificacao, TipoNotificacao } from "@/lib/notificacoes";

const ICONE: Record<TipoNotificacao, typeof Bell> = {
  aviso: Megaphone,
  novidade: Sparkles,
  conta: UserRound,
  alerta: TriangleAlert,
};

/** Cor da pastilha do ícone. Só o alerta foge do azul da casa. */
const TOM: Record<TipoNotificacao, string> = {
  aviso: "bg-primary-light text-primary",
  novidade: "bg-ciano-tint text-ciano-forte",
  conta: "bg-slate-100 text-slate-600",
  alerta: "bg-accent-tint text-accent-strong",
};

/** "há 3 h", "ontem" — mais legível que a data cheia numa lista curta. */
function quando(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

/**
 * O sino do topo: badge com o número de não lidas e um painel com as
 * últimas. Abrir NÃO marca como lida — quem decide isso é o clique no item
 * ou no "marcar todas", senão o aviso some antes de ser lido.
 */
export function SinoNotificacoes({ notificacoes }: { notificacoes: Notificacao[] }) {
  const [aberto, setAberto] = useState(false);
  const [lidasAgora, setLidasAgora] = useState<string[]>([]);
  const [, iniciar] = useTransition();

  const fechar = useCallback(() => setAberto(false), []);
  const area = usarFecharFora<HTMLDivElement>(aberto, fechar);

  const foiLida = (n: Notificacao) => n.lida || lidasAgora.includes(n.id);
  const naoLidas = notificacoes.filter((n) => !foiLida(n));

  function marcar(ids: string[]) {
    if (!ids.length) return;
    // Otimista: a bolinha apaga na hora e o servidor confirma depois.
    setLidasAgora((atuais) => [...atuais, ...ids]);
    iniciar(() => {
      marcarLidas(ids);
    });
  }

  return (
    <div ref={area} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={
          naoLidas.length
            ? `Notificações, ${naoLidas.length} não lidas`
            : "Notificações"
        }
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
          aberto
            ? "border-primary/30 bg-primary-light text-primary"
            : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary"
        }`}
      >
        <Bell className="h-4 w-4" />
        {naoLidas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-btn px-1 text-[10px] font-bold leading-none text-white">
            {naoLidas.length > 9 ? "9+" : naoLidas.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[21rem] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_hsl(215_50%_23%_/_0.45)] animate-[surgir_.18s_ease-out]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display text-sm font-bold text-primary">
              Notificações
            </p>
            {naoLidas.length > 0 && (
              <button
                type="button"
                onClick={() => marcar(naoLidas.map((n) => n.id))}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-strong hover:underline"
              >
                <Check className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nada por aqui ainda.
              <br />
              Avisamos você quando algo mudar.
            </p>
          ) : (
            <ul className="max-h-[24rem] overflow-y-auto">
              {notificacoes.map((n) => {
                const Icone = ICONE[n.tipo] ?? Megaphone;
                const lida = foiLida(n);
                const Conteudo = (
                  <>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TOM[n.tipo] ?? TOM.aviso}`}
                    >
                      <Icone className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] leading-tight ${
                          lida ? "font-semibold text-slate-600" : "font-bold text-slate-900"
                        }`}
                      >
                        {n.titulo}
                      </span>
                      {n.texto && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                          {n.texto}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] uppercase tracking-wide text-slate-400">
                        {quando(n.criadoEm)}
                      </span>
                    </span>
                    {!lida && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </>
                );

                const classe = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                  lida ? "" : "bg-primary-light/40"
                }`;

                return (
                  <li key={n.id} className="border-b border-slate-100 last:border-0">
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => {
                          marcar([n.id]);
                          fechar();
                        }}
                        className={classe}
                      >
                        {Conteudo}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => marcar([n.id])}
                        className={classe}
                      >
                        {Conteudo}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
