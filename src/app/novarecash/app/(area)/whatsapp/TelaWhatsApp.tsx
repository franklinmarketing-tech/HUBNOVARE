"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, MessageCircle, PowerOff, RefreshCw, Smartphone } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { categoria } from "@/lib/novarecash/categorias";
import {
  ErroDados,
  dataCurta,
  lerContas,
  lerUltimas,
  usuarioDaSessao,
  type Conta,
  type Transacao,
} from "@/lib/novarecash/dados";
import { ANEL, AvisoErro, AvisoSemTabela, Botao, CAMPO, COR_ENTRADA, Cartao, Esqueleto, ROTULO_CAMPO, Selo, brl } from "../pecas";
import { Toast, useToast } from "../Toast";

/**
 * A TELA DO WHATSAPP do NovareCash (própria, sem nada de outro app).
 *
 * O VÍNCULO só pela rota `/api/whatsapp/vincular`:
 *   GET    → { vinculado, final, ativo, ncash_conta_padrao_id, numeroDoAssistente, ... }
 *   POST   → { codigo, expira_em, numeroDoAssistente } (403 sem assinatura, 429 em rajada)
 *   PATCH  → { ncash_conta_padrao_id } escolhe a conta padrão (409 = ainda não ligado; 503 = falta SQL)
 *   DELETE → desliga.
 * Os campos `conta_padrao_id` e `cartao_padrao_id` do GET são legado e ficam de fora.
 *
 * Enquanto o código está vivo, a tela pergunta a cada 6 s se ele já chegou:
 * sem a API de envio da Meta, o assistente não responde no WhatsApp, e a
 * pessoa precisa ver em algum lugar que deu certo.
 */

type Vinculo = {
  vinculado: boolean;
  final: string | null;
  ativo: boolean;
  ncash_conta_padrao_id: string | null;
  numeroDoAssistente: string | null;
};

type CodigoVivo = { codigo: string; expira_em: string | null };

const segundosAte = (iso: string | null) => (iso ? Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 1000)) : 0);
const relogio = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Acorda o componente a cada segundo enquanto houver prazo; o restante é calculado no render. */
function useContagem(ate: string | null): number {
  const [, tique] = useState(0);
  useEffect(() => {
    if (!ate) return;
    const t = setInterval(() => tique((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [ate]);
  return segundosAte(ate);
}

export function TelaWhatsApp({ envioLigado }: { envioLigado: boolean }) {
  const sb = useMemo(() => createClient(), []);
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [recentes, setRecentes] = useState<Transacao[]>([]);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sem-tabela" | "erro">("carregando");

  const [codigo, setCodigo] = useState<CodigoVivo | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const toast = useToast();
  // `mostrar` é estável; o objeto `toast` não (muda a cada render) e reiniciaria a conferência a cada segundo.
  const mostrarToast = toast.mostrar;

  const restante = useContagem(codigo?.expira_em ?? null);
  const codigoVivo = Boolean(codigo) && (codigo?.expira_em ? restante > 0 : true);

  const lerVinculo = useCallback(async (): Promise<Vinculo | null> => {
    const r = await fetch("/api/whatsapp/vincular", { cache: "no-store" });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<Vinculo>;
    return {
      vinculado: Boolean(d.vinculado),
      final: d.final ?? null,
      ativo: Boolean(d.ativo),
      ncash_conta_padrao_id: d.ncash_conta_padrao_id ?? null,
      numeroDoAssistente: d.numeroDoAssistente ?? null,
    };
  }, []);

  const carregar = useCallback(async () => {
    try {
      const eu = await usuarioDaSessao(sb);
      const [v, cs, rs] = await Promise.all([lerVinculo(), lerContas(sb, eu), lerUltimas(sb, eu, 10, "whatsapp")]);
      if (!v) {
        setEstado("erro");
        return;
      }
      setVinculo(v);
      setContas(cs.filter((c) => c.tipo === "conta" || c.tipo === "cartao"));
      setRecentes(rs);
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb, lerVinculo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const conferir = useCallback(
    async (manual = false) => {
      if (manual) setOcupado("conferir");
      try {
        const v = await lerVinculo();
        if (v?.vinculado) {
          setCodigo(null);
          setRecado(null);
          await carregar();
          mostrarToast({ texto: "Pronto: o seu WhatsApp está ligado ao NovareCash." });
        } else if (manual) {
          setRecado(
            "Ainda não chegou. Confira se você mandou os seis dígitos para o número certo, do celular que você quer ligar.",
          );
        }
      } catch {
        // Rede caiu no meio da conferência: a automática (a cada 6 s) tenta de novo sozinha; a manual avisa.
        if (manual) setRecado("Não consegui conferir agora. Tente de novo em instantes.");
      } finally {
        if (manual) setOcupado(null);
      }
    },
    [lerVinculo, carregar, mostrarToast],
  );

  useEffect(() => {
    if (!codigoVivo) return;
    const t = setInterval(() => conferir(), 6000);
    return () => clearInterval(t);
  }, [codigoVivo, conferir]);

  async function gerarCodigo() {
    setOcupado("gerar");
    setRecado(null);
    setCopiado(false);
    try {
      const r = await fetch("/api/whatsapp/vincular", { method: "POST" });
      const d = (await r.json().catch(() => null)) as { codigo?: string; expira_em?: string; erro?: string } | null;
      if (!r.ok || !d?.codigo) {
        setRecado(d?.erro ?? "Não consegui gerar o código agora. Tente de novo.");
        return;
      }
      setCodigo({ codigo: d.codigo, expira_em: d.expira_em ?? null });
    } catch {
      setRecado("Não consegui gerar o código agora. Tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  async function escolherPadrao(id: string) {
    setOcupado("padrao");
    setRecado(null);
    const antes = vinculo?.ncash_conta_padrao_id ?? null;
    setVinculo((v) => (v ? { ...v, ncash_conta_padrao_id: id || null } : v));
    try {
      const r = await fetch("/api/whatsapp/vincular", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ncash_conta_padrao_id: id || null }),
      });
      if (r.ok) toast.mostrar({ texto: id ? "Conta padrão salva." : "Sem conta padrão: o que chegar entra sem conta." });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { erro?: string } | null;
        setVinculo((v) => (v ? { ...v, ncash_conta_padrao_id: antes } : v));
        setRecado(
          d?.erro ??
            (r.status === 503
              ? "A escolha da conta padrão está sendo instalada. Tente de novo mais tarde."
              : "Não consegui salvar a conta padrão agora."),
        );
      }
    } catch {
      setVinculo((v) => (v ? { ...v, ncash_conta_padrao_id: antes } : v));
      setRecado("Não consegui salvar a conta padrão agora.");
    } finally {
      setOcupado(null);
    }
  }

  async function desligar() {
    setOcupado("desligar");
    try {
      const r = await fetch("/api/whatsapp/vincular", { method: "DELETE" });
      if (!r.ok) {
        setRecado("Não consegui desligar agora. Tente de novo.");
        return;
      }
      setConfirmandoSaida(false);
      await carregar();
      toast.mostrar({ texto: "Número desligado. O que já entrou continua no Extrato." });
    } catch {
      setRecado("Não consegui desligar agora. Tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem permissão de área de transferência: o código continua grande na tela */
    }
  }

  if (estado === "carregando") return <Esqueleto linhas={2} />;
  if (estado === "sem-tabela") return <AvisoSemTabela />;
  if (estado === "erro" || !vinculo) {
    return <AvisoErro mensagem="Não consegui ler o estado do WhatsApp agora." onTentar={carregar} />;
  }

  const numero = vinculo.numeroDoAssistente?.replace(/\D/g, "") ?? "";
  const temNumero = numero.length >= 10;
  const link = codigo ? `https://wa.me/${numero}?text=${encodeURIComponent(codigo.codigo)}` : `https://wa.me/${numero}`;
  const contaPadrao = contas.some((c) => c.id === vinculo.ncash_conta_padrao_id) ? vinculo.ncash_conta_padrao_id! : "";

  return (
    <div className="space-y-4">
      {!envioLigado && (
        <p className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning-claro">
          O assistente ainda não responde no WhatsApp: ele entende e registra a mensagem, e você confere aqui no app.
        </p>
      )}

      {vinculo.vinculado ? (
        <Cartao className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-display text-base font-semibold text-white">
              <Smartphone className="h-5 w-5 text-ouro" />
              Número ligado{vinculo.final ? ` (final ${vinculo.final})` : ""}
            </p>
            <Selo tom={vinculo.ativo ? "verde" : "neutro"}>{vinculo.ativo ? "Ativo" : "Pausado"}</Selo>
          </div>

          <label className="mt-4 block">
            <span className={ROTULO_CAMPO}>Conta padrão dos lançamentos (opcional)</span>
            <select
              value={contaPadrao}
              onChange={(e) => escolherPadrao(e.target.value)}
              disabled={ocupado !== null}
              className={`${CAMPO} mt-1`}
            >
              <option value="">Sem conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.tipo === "cartao" ? " (cartão)" : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-2xs text-white/55">
              {contas.length === 0
                ? "Sem conta cadastrada, o que chega pelo WhatsApp entra no extrato sem conta."
                : "O que chegar pelo WhatsApp entra nesta conta, e o saldo dela anda junto."}
            </span>
          </label>

          <div className="mt-4">
            {confirmandoSaida ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/75">Desligar este número?</span>
                <Botao variante="perigo" Icone={PowerOff} onClick={desligar} desabilitado={ocupado !== null}>
                  {ocupado === "desligar" ? "Desligando…" : "Sim, desligar"}
                </Botao>
                <Botao variante="fantasma" onClick={() => setConfirmandoSaida(false)}>
                  Cancelar
                </Botao>
              </div>
            ) : (
              <Botao variante="contorno" Icone={PowerOff} onClick={() => setConfirmandoSaida(true)}>
                Desligar o número
              </Botao>
            )}
          </div>
        </Cartao>
      ) : (
        <Cartao className="p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-white">Ligar o seu número</h2>
          <ol className="mt-3 space-y-2 text-xs leading-relaxed text-white/70">
            <li>1. Toque em <strong className="text-white">Gerar código</strong>.</li>
            <li>
              2. Mande os seis dígitos, do seu celular, para o número do assistente
              {temNumero ? "" : " (o número aparece aqui assim que for configurado)"}.
            </li>
            <li>3. Pronto: esta tela percebe sozinha que ligou.</li>
          </ol>

          {codigo && codigoVivo ? (
            <div className="mt-4 rounded-2xl border border-ouro/30 bg-ouro/[0.08] p-4 text-center">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">Seu código</p>
              <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.3em] text-white tabular-nums">{codigo.codigo}</p>
              {codigo.expira_em && <p className="mt-1 text-2xs text-white/60">Vale por mais {relogio(restante)}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {temNumero && (
                  <Botao href={link} Icone={MessageCircle}>
                    Abrir o WhatsApp
                  </Botao>
                )}
                <Botao variante="contorno" Icone={copiado ? Check : Copy} onClick={() => copiar(codigo.codigo)}>
                  {copiado ? "Copiado" : "Copiar código"}
                </Botao>
                <Botao variante="fantasma" Icone={RefreshCw} onClick={() => conferir(true)} desabilitado={ocupado !== null}>
                  {ocupado === "conferir" ? "Conferindo…" : "Já mandei"}
                </Botao>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {codigo && <p className="mb-2 text-xs text-warning-claro">Este código venceu. Gere outro.</p>}
              <Botao Icone={Smartphone} onClick={gerarCodigo} desabilitado={ocupado !== null}>
                {ocupado === "gerar" ? "Gerando…" : "Gerar código"}
              </Botao>
            </div>
          )}
        </Cartao>
      )}

      {recado && (
        <p role="status" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-white">
          {recado}
        </p>
      )}

      <section aria-labelledby="titulo-recentes">
        <h2 id="titulo-recentes" className="mb-2 font-display text-base font-semibold text-white">
          Registrado pelo WhatsApp
        </h2>
        {recentes.length === 0 ? (
          <Cartao className="p-5">
            <p className="text-xs leading-relaxed text-white/70">
              Nada ainda. Quando você mandar a primeira mensagem, o lançamento aparece aqui e no Extrato.
            </p>
          </Cartao>
        ) : (
          <Cartao>
            <ul className="divide-y divide-white/[0.07]">
              {recentes.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <span className="w-11 shrink-0 text-2xs tabular-nums text-white/55">{dataCurta(t.data)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{t.descricao}</span>
                    <span className="block truncate text-2xs text-ouro">{categoria(t.categoria).rotulo}</span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${t.tipo === "entrada" ? COR_ENTRADA : "text-white"}`}
                  >
                    {t.tipo === "entrada" ? "+ " : "− "}
                    {brl(t.valor)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/[0.07] px-3 py-1 sm:px-4">
              <Link
                href="/novarecash/app/extrato"
                className={`inline-flex min-h-11 items-center text-2xs font-semibold text-ouro hover:underline ${ANEL}`}
              >
                Corrigir no extrato
              </Link>
            </div>
          </Cartao>
        )}
      </section>

      <Toast {...toast} />
    </div>
  );
}
