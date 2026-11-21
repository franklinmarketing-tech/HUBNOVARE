"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  COLUNAS_NOTIFICACAO,
  LIMITE_NOTIFICACOES,
  ehAssinante,
  faseDaAssinatura,
  lerNotificacao,
  montarPerfil,
  perfilJaAtiva,
  type EstadoAssinatura,
  type Notificacao,
  type Perfil,
} from "@/lib/perfil-regras";

/**
 * QUEM ESTÁ OLHANDO, LIDO NO NAVEGADOR (21/11/2026).
 *
 * As páginas públicas (home, ferramentas, aplicativos, ajuda…) eram montadas
 * no servidor a CADA visita só para saber o nome no topo e o sino — inclusive
 * para robô e visitante sem conta. Isso era a maior parte do processamento
 * que a Vercel cobrava. Agora elas saem PRONTAS (iguais para todos) e a parte
 * de cada pessoa chega por aqui, depois que a página abriu.
 *
 * ⚠️ SÓ PARA MOSTRAR. `getSession()` confia no cookie sem checar no servidor,
 * e isso é aceitável aqui porque nada é liberado com base nisto: o painel
 * admin, as áreas logadas e as rotas de API continuam conferindo no servidor
 * (middleware + `getPerfil`), e as tabelas lidas abaixo têm RLS — quem forjar
 * o cookie vê, no máximo, um nome errado no próprio topo.
 *
 * Um estado só por aba (não um contexto): qualquer componente chama
 * `useQuemSou()` e todos dividem a mesma leitura.
 */

export type QuemSou = {
  /** `false` até a primeira leitura terminar — o topo esconde o "Entrar" enquanto isso. */
  pronto: boolean;
  perfil: Perfil | null;
  assinante: boolean;
  notificacoes: Notificacao[];
  assinatura: EstadoAssinatura;
};

const ANONIMO: QuemSou = {
  pronto: false,
  perfil: null,
  assinante: false,
  notificacoes: [],
  assinatura: { fase: "sem" },
};

let estado: QuemSou = ANONIMO;
let lendo: Promise<void> | null = null;
let lidoEm = 0;
let ouvindoLogin = false;
const ouvintes = new Set<() => void>();

/** Navegar entre páginas não relê; voltar à aba depois de um tempo, sim. */
const VALIDADE_MS = 60_000;

function trocar(novo: QuemSou) {
  estado = novo;
  ouvintes.forEach((f) => f());
}

async function ler(): Promise<void> {
  const sb = createClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  const user = session?.user;

  if (!user) {
    trocar({ ...ANONIMO, pronto: true });
    return;
  }

  // As três leituras em paralelo; cada tabela responde só pela própria pessoa (RLS).
  const [linhaPerfil, linhasAvisos, linhaAssinatura] = await Promise.all([
    sb.from("hub_profiles").select("nome, role, plano, plano_expira_em").eq("id", user.id).maybeSingle(),
    sb
      .from("hub_notificacoes")
      .select(COLUNAS_NOTIFICACAO)
      .order("criado_em", { ascending: false })
      .limit(LIMITE_NOTIFICACOES),
    sb.from("vidaplan_subscriptions").select("status, trial_until").eq("user_id", user.id).maybeSingle(),
  ]);

  const perfil = montarPerfil(user, linhaPerfil.data);
  const assinatura: EstadoAssinatura = perfilJaAtiva(linhaPerfil.data)
    ? { fase: "ativa" }
    : faseDaAssinatura(linhaAssinatura.data);

  trocar({
    pronto: true,
    perfil,
    assinante: ehAssinante(perfil),
    notificacoes:
      linhasAvisos.error || !linhasAvisos.data
        ? []
        : linhasAvisos.data.map((n) => lerNotificacao(n as Record<string, unknown>)),
    assinatura,
  });
}

function garantir(forcar = false) {
  if (lendo) return lendo;
  if (!forcar && estado.pronto && Date.now() - lidoEm < VALIDADE_MS) return Promise.resolve();
  lendo = ler()
    .catch(() => trocar({ ...ANONIMO, pronto: true }))
    .finally(() => {
      lidoEm = Date.now();
      lendo = null;
    });

  if (!ouvindoLogin) {
    ouvindoLogin = true;
    createClient().auth.onAuthStateChange((evento) => {
      if (evento !== "SIGNED_IN" && evento !== "SIGNED_OUT" && evento !== "USER_UPDATED") return;
      // ⚠️ Nunca chamar o Supabase DENTRO deste aviso (trava o cliente de auth):
      // a releitura sai para a próxima volta do relógio.
      setTimeout(() => void garantir(true), 0);
    });
  }
  return lendo;
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

/**
 * Quem está logado nesta aba. No HTML pronto (e no primeiro desenho do
 * navegador) é sempre o visitante anônimo com `pronto: false`; a leitura
 * começa assim que o componente aparece.
 */
export function useQuemSou(): QuemSou {
  useEffect(() => {
    void garantir();
  }, []);
  return useSyncExternalStore(
    assinar,
    () => estado,
    () => ANONIMO,
  );
}
