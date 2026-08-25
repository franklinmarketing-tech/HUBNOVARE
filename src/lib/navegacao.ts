import {
  APPS,
  ORDEM_FAMILIAS,
  FAMILIAS,
  podeAbrir,
  type NovareApp,
  type Role,
  type PlanoCliente,
} from "@/lib/apps";

/**
 * Lista de apps em formato serializável, para atravessar a fronteira
 * server/client (componente React não atravessa; o ícone é resolvido no
 * cliente por `icones.ts`).
 */
export type AppLeve = {
  slug: string;
  nome: string;
  chamada: string;
  href: string;
  externo: boolean;
  grupo: string;
  aberto: boolean;
  /** Benchmark mundial que a ferramenta persegue. */
  referencia?: string;
  /** Chave do filtro: família, ou "workspace" / "interno". */
  filtro: string;
  emBreve: boolean;
  /** Presentes só nos produtos da casa: alimentam o popup do card. */
  descricao?: string;
  pontosFortes?: string[];
};

/**
 * Grupo do app. Pago SEM família é o Workspace (Planejamento, Íris);
 * pago COM família (o Assistente IA) fica na prateleira da categoria dele.
 */
function filtroDe(app: NovareApp): string {
  if (app.plano === "pago" && !app.familia) return "workspace";
  if (app.plano === "interno") return "interno";
  return app.familia ?? "organizacao";
}

function rotuloDe(app: NovareApp): string {
  const filtro = filtroDe(app);
  if (filtro === "workspace") return "Workspace";
  if (filtro === "interno") return "Interno";
  return FAMILIAS[filtro as keyof typeof FAMILIAS];
}

/**
 * Para onde o card leva quem ainda não tem acesso.
 *
 * Um app pago cujo `href` já É a própria página de venda continua indo para
 * ela: mandar para `/assinar` seria pior do que não linkar, porque essa página
 * anuncia que está tudo liberado — o visitante clica no produto pago e lê que
 * nada está à venda. Só cai em `/assinar` o que não tem vitrine própria.
 */
function destinoBloqueado(app: NovareApp): string {
  const temVitrinePropria = app.plano === "pago" && !app.externo;
  return temVitrinePropria ? app.href : `/assinar?app=${app.slug}`;
}

export function appsParaBusca(role: Role, plano: PlanoCliente): AppLeve[] {
  return APPS.filter((a) => a.roles.includes(role)).map((a) => ({
    slug: a.slug,
    nome: a.nome,
    chamada: a.chamada,
    href: podeAbrir(a, role, plano) ? a.href : destinoBloqueado(a),
    externo: !!a.externo && podeAbrir(a, role, plano),
    referencia: a.referencia,
    grupo: rotuloDe(a),
    aberto: podeAbrir(a, role, plano),
    filtro: filtroDe(a),
    emBreve: a.status === "em-breve",
    descricao: a.descricao,
    pontosFortes: a.pontosFortes,
  }));
}

/** Filtros do topo, na ordem da prateleira. */
export function filtrosDoTopo(role: Role) {
  const visiveis = APPS.filter((a) => a.roles.includes(role));
  const conta = (filtro: string) =>
    visiveis.filter((a) => filtroDe(a) === filtro).length;

  return [
    { chave: "todos", rotulo: "Tudo", total: visiveis.length },
    { chave: "workspace", rotulo: "Workspace", total: conta("workspace") },
    ...ORDEM_FAMILIAS.map((familia) => ({
      chave: familia as string,
      rotulo: FAMILIAS[familia],
      total: conta(familia),
    })),
    { chave: "interno", rotulo: "Interno", total: conta("interno") },
  ].filter((f) => f.total > 0);
}
