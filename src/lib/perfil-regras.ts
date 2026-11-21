import type { Role, PlanoCliente } from "@/lib/apps";

/**
 * AS REGRAS DO PERFIL, SEM SUPABASE (21/11/2026).
 *
 * Moram aqui, num arquivo que não importa nada do servidor, porque agora são
 * usadas nos DOIS lados: `lib/perfil.ts` (servidor, áreas logadas) e
 * `lib/quem-sou.ts` (navegador, páginas públicas que saem prontas). Uma regra
 * só — plano vencido vale free, papel desconhecido vale cliente — para o
 * topo nunca dizer uma coisa numa tela e outra na seguinte.
 */

export type Perfil = {
  id: string;
  email: string;
  nome: string;
  role: Role;
  plano: PlanoCliente;
};

export type LinhaPerfil = {
  nome?: string | null;
  role?: string | null;
  plano?: string | null;
  plano_expira_em?: string | null;
} | null;

type Usuario = {
  id: string;
  email?: string | null;
  user_metadata?: { nome?: string } | null;
};

const ROLES_VALIDAS: Role[] = ["admin", "equipe", "cliente"];
const PLANOS_VALIDOS: PlanoCliente[] = ["free", "pro"];

export function montarPerfil(user: Usuario, data: LinhaPerfil): Perfil {
  const role: Role =
    data?.role && ROLES_VALIDAS.includes(data.role as Role)
      ? (data.role as Role)
      : "cliente";

  // Plano expirado vale o mesmo que free — a data manda sobre o campo.
  const expirou =
    !!data?.plano_expira_em && new Date(data.plano_expira_em) < new Date();

  const plano: PlanoCliente =
    !expirou && data?.plano && PLANOS_VALIDOS.includes(data.plano as PlanoCliente)
      ? (data.plano as PlanoCliente)
      : "free";

  return {
    id: user.id,
    email: user.email ?? "",
    nome: data?.nome || user.user_metadata?.nome || user.email?.split("@")[0] || "",
    role,
    plano,
  };
}

/** Pagante, admin ou equipe — quem não vê preço nem convite de assinatura. */
export function ehAssinante(perfil: Perfil | null): boolean {
  return perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");
}

/* ── NOTIFICAÇÕES ───────────────────────────────────────────────────────── */

export type TipoNotificacao = "aviso" | "novidade" | "conta" | "alerta";

export type Notificacao = {
  id: string;
  titulo: string;
  texto: string | null;
  href: string | null;
  tipo: TipoNotificacao;
  lida: boolean;
  criadoEm: string;
};

/** Quantas o sino mostra. Passou disso, a pessoa vai para /notificacoes. */
export const LIMITE_NOTIFICACOES = 8;
export const COLUNAS_NOTIFICACAO = "id, titulo, texto, href, tipo, lida_em, criado_em";

export function lerNotificacao(n: Record<string, unknown>): Notificacao {
  return {
    id: n.id as string,
    titulo: n.titulo as string,
    texto: (n.texto as string | null) ?? null,
    href: (n.href as string | null) ?? null,
    tipo: (n.tipo as TipoNotificacao) ?? "aviso",
    lida: !!n.lida_em,
    criadoEm: n.criado_em as string,
  };
}

/* ── ASSINATURA ─────────────────────────────────────────────────────────── */

export type EstadoAssinatura =
  /** Nunca teve nada: vê a oferta. */
  | { fase: "sem" }
  /** Está no teste grátis. `dias` é quanto falta (mínimo 1). */
  | { fase: "teste"; dias: number }
  /** Pagante, admin ou equipe: nenhum preço aparece. */
  | { fase: "ativa" };

const DIA_MS = 24 * 60 * 60 * 1000;

/** Mesma ordem de `trial.ts`: o Hub manda, o teste é o segundo critério. */
export function perfilJaAtiva(perfil: LinhaPerfil): boolean {
  if (!perfil) return false;
  const expirou =
    !!perfil.plano_expira_em && new Date(perfil.plano_expira_em) < new Date();
  const proValido = perfil.plano === "pro" && !expirou;
  const equipe = perfil.role === "admin" || perfil.role === "equipe";
  return proValido || equipe;
}

export function faseDaAssinatura(
  assinatura: { status?: string | null; trial_until?: string | null } | null,
): EstadoAssinatura {
  if (!assinatura) return { fase: "sem" };
  if (assinatura.status === "active") return { fase: "ativa" };

  if (assinatura.status === "trial" && assinatura.trial_until) {
    const dias = Math.ceil(
      (new Date(assinatura.trial_until).getTime() - Date.now()) / DIA_MS,
    );
    // Zero ou negativo é teste vencido, e vencido volta a ver a oferta.
    if (dias > 0) return { fase: "teste", dias };
  }

  return { fase: "sem" };
}
