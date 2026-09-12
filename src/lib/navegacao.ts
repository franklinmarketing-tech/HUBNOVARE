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
  /**
   * O que a ASSINATURA abre, e em que forma — `null` no que é aberto a
   * qualquer um.
   *
   * Existe porque o catálogo tinha um problema de vitrine, não de dados: as
   * oito ferramentas exclusivas estavam espalhadas por três áreas, cada uma
   * como um cadeado solto no meio das gratuitas. Quem chegava para comprar
   * via oito obstáculos; nunca via um benefício. Com esta marca, `/aplicativos`
   * consegue reuni-las numa prateleira só ("Incluso na assinatura") sem
   * arrancá-las da área a que pertencem — quem filtra "Investimentos"
   * continua encontrando o Raio-X da Carteira lá dentro.
   *
   * "app" é produto com porta própria (FINCASH, Planejamento); "ferramenta"
   * é calculadora exclusiva. A distinção não é decorativa: os dois têm cards
   * diferentes, e o app precisa parecer produto, não item de lista.
   */
  assinatura: "app" | "ferramenta" | null;
  emBreve: boolean;
  /** Presentes só nos produtos da casa: alimentam o popup do card. */
  descricao?: string;
  pontosFortes?: string[];
};

/**
 * A ÁREA do app — o assunto dele, sempre.
 *
 * Havia aqui um desvio "pago sem família vira Workspace". Ele não classificava
 * mais ninguém (todo app pago do catálogo tem família) e, pior, dava a
 * entender que o que se paga não pertence a assunto nenhum. O que a assinatura
 * abre agora tem uma prateleira própria, em cima de `assinaturaDe`, e cada app
 * continua morando na área a que pertence.
 */
function filtroDe(app: NovareApp): string {
  if (app.plano === "interno") return "interno";
  return app.familia ?? "organizacao";
}

/**
 * A chave da prateleira "Incluso na assinatura", e o rótulo dela.
 *
 * ⚠️ NÃO se chama "workspace". Desde 12/09/2026 o que se assina é o FINCASH
 * (ver `lib/assinatura.ts`), e "Workspace" virou um dos entregáveis — nunca o
 * sujeito da frase "assine o ___". Uma aba chamada Workspace ao lado de um
 * card de preço reconstrói a confusão que a virada desfez.
 */
export const FILTRO_ASSINATURA = "assinatura";
const ROTULO_ASSINATURA = "Incluso na assinatura";

/** O que a assinatura abre, e em que forma. Ver `AppLeve.assinatura`. */
function assinaturaDe(app: NovareApp): "app" | "ferramenta" | null {
  if (app.plano !== "pago") return null;
  return app.href.includes("/ferramentas/") ? "ferramenta" : "app";
}

function rotuloDe(app: NovareApp): string {
  const filtro = filtroDe(app);
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

export function appsParaBusca(
  role: Role,
  plano: PlanoCliente,
  /** Sem sessão, `role`/`plano` chegam como "cliente"/"free" por convenção —
   *  o mesmo formato de quem está em teste. Este parâmetro é o que separa
   *  os dois casos (ver `podeAbrir`). */
  logado = false,
): AppLeve[] {
  return APPS.filter((a) => a.roles.includes(role)).map((a) => ({
    slug: a.slug,
    nome: a.nome,
    chamada: a.chamada,
    href: podeAbrir(a, role, plano, logado) ? a.href : destinoBloqueado(a),
    externo: !!a.externo && podeAbrir(a, role, plano, logado),
    // O benchmark interno NÃO entra aqui: este objeto vai para o cliente,
    // e mandá-lo colocaria "Monarch Money" no JSON da página mesmo sem
    // nenhuma tela renderizando o campo.
    grupo: rotuloDe(a),
    aberto: podeAbrir(a, role, plano, logado),
    filtro: filtroDe(a),
    /* Lido do CATÁLOGO e não do `href` já resolvido acima: para quem não pode
       abrir, o `href` do objeto vira o destino de bloqueio, e uma marca
       calculada em cima dele mudaria de valor conforme quem está olhando. */
    assinatura: assinaturaDe(a),
    emBreve: a.status === "em-breve",
    descricao: a.descricao,
    pontosFortes: a.pontosFortes,
  }));
}

/**
 * Filtros do topo, na ordem da prateleira.
 *
 * "Incluso na assinatura" vem logo depois de "Tudo" — é a primeira pergunta
 * de quem chega pela landing do FINCASH ("o que eu levo?"), e a única aba que
 * responde com produto em vez de tema.
 *
 * ⚠️ Ele atravessa as áreas de propósito: o mesmo app aparece aqui e dentro da
 * família dele. Não é duplicata mal resolvida — são duas perguntas diferentes
 * ("o que a assinatura abre" e "o que existe sobre investimentos"), e a
 * resposta honesta para as duas inclui o Raio-X da Carteira.
 */
export function filtrosDoTopo(role: Role) {
  const visiveis = APPS.filter((a) => a.roles.includes(role));
  const conta = (filtro: string) =>
    visiveis.filter((a) => filtroDe(a) === filtro).length;

  return [
    { chave: "todos", rotulo: "Tudo", total: visiveis.length },
    {
      chave: FILTRO_ASSINATURA,
      rotulo: ROTULO_ASSINATURA,
      total: visiveis.filter((a) => assinaturaDe(a)).length,
    },
    ...ORDEM_FAMILIAS.map((familia) => ({
      chave: familia as string,
      rotulo: FAMILIAS[familia],
      total: conta(familia),
    })),
    { chave: "interno", rotulo: "Interno", total: conta("interno") },
  ].filter((f) => f.total > 0);
}
