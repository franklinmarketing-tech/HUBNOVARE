"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, PowerOff, Send } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { lerContas, usuarioDaSessao, type Conta } from "@/lib/novarecash/dados";
import { ANEL, Botao, CAMPO, Cartao, ROTULO_CAMPO, Selo } from "../pecas";

import { useConfirmar } from "../Confirmacao";
/**
 * O TELEGRAM DO NOVARECASH (15/11/2026): o mesmo assistente do WhatsApp —
 * texto, áudio, foto, parcelado, contas, fiado, limite — e, de bônus, o
 * lembrete das 8h (no Telegram o robô pode avisar primeiro, sem custo).
 *
 * Ligar é UM toque: o botão abre o robô com `/start <código>`, e o servidor
 * carimba o chat que abriu. Enquanto a pessoa está no Telegram, a tela
 * pergunta a cada 4 s se já ligou.
 *
 * Tudo pela rota `/api/telegram/vincular` (GET/POST/PATCH/DELETE).
 */

type Estado = {
  configurado: boolean;
  semSql?: boolean;
  vinculado: boolean;
  nome?: string | null;
  lembretes?: boolean;
  ncash_conta_padrao_id?: string | null;
  robo?: string | null;
};

export function CartaoTelegram() {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [esperando, setEsperando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const { confirmar, caixa } = useConfirmar("janela");

  const ler = useCallback(async (): Promise<Estado | null> => {
    try {
      const r = await fetch("/api/telegram/vincular", { cache: "no-store" });
      if (!r.ok) return null;
      const e = (await r.json()) as Estado;
      setEstado(e);
      return e;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    ler();
    usuarioDaSessao(sb)
      .then((eu) => lerContas(sb, eu))
      .then((cs) => setContas(cs.filter((c) => c.tipo === "conta" || c.tipo === "cartao")))
      .catch(() => setContas([]));
  }, [ler, sb]);

  // Abriu o Telegram: confere até ligar (ou 15 min).
  useEffect(() => {
    if (!esperando) return;
    const inicio = Date.now();
    const t = setInterval(async () => {
      const e = await ler();
      if (e?.vinculado || Date.now() - inicio > 15 * 60_000) {
        setEsperando(false);
        if (e?.vinculado) setRecado("Telegram ligado. Manda “Uber 35” lá para testar.");
      }
    }, 4000);
    return () => clearInterval(t);
  }, [esperando, ler]);

  async function ligar() {
    setOcupado(true);
    setRecado(null);
    // A janela abre NO CLIQUE (senão o navegador do celular bloqueia); o endereço chega depois.
    const janela = window.open("", "_blank");
    try {
      const r = await fetch("/api/telegram/vincular", { method: "POST" });
      const d = (await r.json()) as { link?: string; erro?: string };
      if (!r.ok || !d.link) throw new Error(d.erro ?? "Não consegui gerar o link agora.");
      if (janela) janela.location.href = d.link;
      else window.location.href = d.link;
      setEsperando(true);
    } catch (e) {
      janela?.close();
      setRecado(e instanceof Error ? e.message : "Não consegui gerar o link agora.");
    } finally {
      setOcupado(false);
    }
  }

  async function ajustar(campos: { lembretes?: boolean; ncash_conta_padrao_id?: string | null }) {
    setOcupado(true);
    setRecado(null);
    try {
      const r = await fetch("/api/telegram/vincular", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campos) });
      const d = (await r.json()) as { erro?: string };
      if (!r.ok) throw new Error(d.erro ?? "Não consegui salvar.");
      await ler();
      setRecado("Salvo.");
    } catch (e) {
      setRecado(e instanceof Error ? e.message : "Não consegui salvar.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    if (!(await confirmar("Desligar o Telegram? O que ele já lançou continua no Extrato.", "Desligar"))) return;
    setOcupado(true);
    try {
      await fetch("/api/telegram/vincular", { method: "DELETE" });
      await ler();
      setRecado("Telegram desligado.");
    } finally {
      setOcupado(false);
    }
  }

  if (!estado) return null;

  return (
    <Cartao className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9]/15 text-[#5fc0ec] ring-1 ring-[#229ED9]/30">
          <Send className="h-4 w-4" />
        </span>
        <p className="font-display text-base font-semibold text-white">Telegram</p>
        {estado.vinculado ? <Selo tom="verde">Ligado{estado.nome ? ` · ${estado.nome}` : ""}</Selo> : <Selo tom="neutro">Não ligado</Selo>}
      </div>

      {!estado.configurado ? (
        <p className="mt-2 text-xs leading-relaxed text-white/70">O Telegram está sendo ligado pela Novare. Em breve, um toque aqui e pronto.</p>
      ) : estado.semSql ? (
        <p className="mt-2 text-xs leading-relaxed text-white/70">O Telegram está quase pronto. Volte em alguns minutos.</p>
      ) : !estado.vinculado ? (
        <>
          <p className="mt-2 text-xs leading-relaxed text-white/75">
            O mesmo assistente, no Telegram: texto, áudio, foto da nota, parcelado, contas, fiado e limites. E todo dia de manhã ele
            avisa as contas que vencem e quem você tem para cobrar.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Botao Icone={Send} onClick={ligar} desabilitado={ocupado}>
              {esperando ? "Abrir de novo" : "Ligar no Telegram"}
            </Botao>
            {esperando && <span className="text-2xs text-white/60" aria-live="polite">No Telegram, toque em <strong>Iniciar</strong>. Esta tela atualiza sozinha.</span>}
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3">
            <Bell className="h-4 w-4 shrink-0 text-ouro" aria-hidden />
            <span className="min-w-0 flex-1 text-sm text-white">
              Lembrete das 8h no Telegram
              <span className="block text-2xs text-white/60">Contas na véspera, no dia e no atraso; cobranças do A receber.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={estado.lembretes !== false}
              aria-checked={estado.lembretes !== false}
              disabled={ocupado}
              onChange={(e) => ajustar({ lembretes: e.target.checked })}
              className="h-6 w-6 shrink-0 accent-ouro"
            />
          </label>
          {contas.length > 1 && (
            <label className="block">
              <span className={ROTULO_CAMPO}>Quando você não diz de onde saiu, lançar em</span>
              <select
                value={estado.ncash_conta_padrao_id ?? ""}
                disabled={ocupado}
                onChange={(e) => ajustar({ ncash_conta_padrao_id: e.target.value || null })}
                className={`${CAMPO} mt-1`}
              >
                <option value="">Perguntar (ou a mesma do WhatsApp)</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.tipo === "cartao" ? " (cartão)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {estado.robo && (
              <a
                href={`https://t.me/${estado.robo}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:border-ouro/50 ${ANEL}`}
              >
                <Send className="h-4 w-4 text-[#5fc0ec]" /> Abrir conversa
              </a>
            )}
            <button
              type="button"
              onClick={desligar}
              disabled={ocupado}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white disabled:opacity-50 ${ANEL}`}
            >
              <PowerOff className="h-4 w-4" /> Desligar
            </button>
          </div>
        </div>
      )}

      {recado && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-2xs text-white/75">
          <Check className="h-3.5 w-3.5 text-ouro" aria-hidden /> {recado}
        </p>
      )}
      {caixa}
    </Cartao>
  );
}
