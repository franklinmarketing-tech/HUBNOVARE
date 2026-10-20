"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { diaDe, type Alerta, type ConfigAlertas } from "@/lib/fincash/alertas";
import {
  alertasDoDia,
  corpoDoAlerta,
  DESTINO_DO_ALERTA,
  TITULO_DO_ALERTA,
} from "@/lib/fincash/alertas-do-dia";

/**
 * O ALERTA DO FINCASH: um pop-up ao abrir o app.
 *
 * É o único canal dos alertas (decisão do dono, 19/10/2026): o WhatsApp saiu
 * do FINCASH e o e-mail também. O app é gratuito, e o aviso aparece onde a
 * pessoa já está — dentro dele.
 *
 * ⚠️ SÓ APARECE O QUE A PESSOA LIGOU em Avisos. Sem nada ligado, este
 * componente não faz consulta nenhuma além da própria configuração.
 *
 * ⚠️ UMA VEZ POR DIA POR ASSUNTO. Ao fechar, grava `ultimo_*` = hoje, e o
 * motor (`alertas.ts`) cala aquele assunto até amanhã. Se a pessoa sair sem
 * fechar, o pop-up volta na próxima abertura — não viu, não conta.
 */
export function PopupAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [usuario, setUsuario] = useState<string | null>(null);
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const db = createClient();
        const { data: sessao } = await db.auth.getUser();
        if (!sessao.user) return;

        const { data: cfg } = await db
          .from("fin_alertas")
          .select("*")
          .eq("usuario_id", sessao.user.id)
          .maybeSingle();
        if (!cfg) return;

        const lista = await alertasDoDia(db, sessao.user.id, cfg as ConfigAlertas);
        if (vivo && lista.length) {
          setUsuario(sessao.user.id);
          setAlertas(lista);
        }
      } catch {
        /* Alerta é acessório: se a leitura falhar, o app segue sem pop-up. */
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const aberto = alertas.length > 0;

  useEffect(() => {
    if (!aberto) return;
    botao.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  function fechar() {
    const vistos = alertas;
    setAlertas([]);
    if (!usuario || !vistos.length) return;

    const hoje = diaDe(new Date());
    const marcas: Record<string, string> = {};
    for (const a of vistos) marcas[`ultimo_${a.tipo}`] = hoje;
    /* ⚠️ O `.then()` NÃO É ENFEITE: a consulta do Supabase só sai quando
       alguém a aguarda. Com `void` na frente ela nunca era enviada, e o
       pop-up voltava a cada abertura. */
    createClient()
      .from("fin_alertas")
      .update(marcas)
      .eq("usuario_id", usuario)
      .then(() => {});
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-[2px] sm:items-center print:hidden"
      onClick={(e) => e.target === e.currentTarget && fechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-alertas-titulo"
        className="max-h-[85dvh] w-[min(100%,30rem)] overflow-y-auto rounded-3xl border border-border bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
            <Bell className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="popup-alertas-titulo" className="font-display text-base font-bold text-primary">
              {alertas.length === 1 ? "Um alerta para hoje" : `${alertas.length} alertas para hoje`}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Você ligou estes avisos em Avisos.
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-primary"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <ul className="mt-4 space-y-3">
          {alertas.map((a) => (
            <li key={a.tipo} className="rounded-2xl border border-border bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-foreground">{TITULO_DO_ALERTA[a.tipo]}</p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {corpoDoAlerta(a.texto)}
              </p>
              <Link
                href={DESTINO_DO_ALERTA[a.tipo]}
                onClick={fechar}
                className="mt-2.5 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
              >
                Ver no app
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>

        <button
          ref={botao}
          type="button"
          onClick={fechar}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-soft"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
