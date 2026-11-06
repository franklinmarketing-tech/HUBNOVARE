/**
 * AS CATEGORIAS DO NOVARECASH — lista FECHADA, no código (03/11/2026).
 *
 * O extrato, o orçamento, a IA, o WhatsApp e a importação do banco usam estas
 * chaves. A tabela `ncash_transacoes.categoria` guarda a `chave`; o rótulo e o
 * ícone moram só aqui. Categoria nova = linha nova aqui, e nada mais.
 *
 * `palavras` ajuda a classificar o que chega do banco e do WhatsApp sem IA
 * (é o primeiro palpite; a pessoa corrige no extrato).
 */
export type ChaveCategoria =
  | "moradia" | "mercado" | "restaurantes" | "transporte" | "saude" | "educacao" | "lazer"
  | "assinaturas" | "compras" | "tarifas" | "impostos" | "transferencias" | "investimentos" | "outros"
  | "salario" | "renda_extra" | "rendimentos" | "outras_entradas"
  | "pagamento_fatura" | "entre_contas";

export type Categoria = {
  chave: ChaveCategoria;
  rotulo: string;
  tipo: "saida" | "entrada";
  palavras: string[];
};

export const CATEGORIAS: Categoria[] = [
  { chave: "moradia", rotulo: "Moradia", tipo: "saida", palavras: ["aluguel", "condominio", "condomínio", "luz", "energia", "agua", "água", "sabesp", "gas", "internet", "iptu"] },
  { chave: "mercado", rotulo: "Mercado", tipo: "saida", palavras: ["mercado", "supermercado", "atacad", "assai", "assaí", "carrefour", "pao de acucar", "hortifruti", "padaria", "acougue", "açougue"] },
  { chave: "restaurantes", rotulo: "Restaurantes e delivery", tipo: "saida", palavras: ["restaurante", "ifood", "lanchonete", "bar ", "pizzaria", "rappi", "almoço", "almoco", "jantar", "lanche"] },
  { chave: "transporte", rotulo: "Transporte", tipo: "saida", palavras: ["uber", "99", "combustivel", "combustível", "posto", "gasolina", "estacionamento", "pedagio", "pedágio", "onibus", "ônibus", "metro", "metrô"] },
  { chave: "saude", rotulo: "Saúde", tipo: "saida", palavras: ["farmacia", "farmácia", "drogaria", "droga", "medico", "médico", "consulta", "exame", "plano de saude", "unimed", "dentista"] },
  { chave: "educacao", rotulo: "Educação", tipo: "saida", palavras: ["escola", "faculdade", "curso", "mensalidade escolar", "livro", "material escolar"] },
  { chave: "lazer", rotulo: "Lazer", tipo: "saida", palavras: ["cinema", "show", "viagem", "hotel", "passeio", "ingresso"] },
  { chave: "assinaturas", rotulo: "Assinaturas", tipo: "saida", palavras: ["netflix", "spotify", "amazon prime", "disney", "youtube", "assinatura", "icloud", "google one", "hbo", "globoplay"] },
  { chave: "compras", rotulo: "Compras", tipo: "saida", palavras: ["loja", "shopee", "mercado livre", "amazon", "magalu", "shein", "roupa"] },
  { chave: "tarifas", rotulo: "Tarifas e juros", tipo: "saida", palavras: ["tarifa", "juros", "iof", "anuidade", "multa", "encargo"] },
  { chave: "impostos", rotulo: "Impostos", tipo: "saida", palavras: ["imposto", "ipva", "darf", "das ", "irpf", "taxa"] },
  { chave: "transferencias", rotulo: "Transferências e Pix enviados", tipo: "saida", palavras: ["pix enviado", "transferencia enviada", "ted enviada", "doc enviado"] },
  { chave: "investimentos", rotulo: "Aplicações", tipo: "saida", palavras: ["aplicacao", "aplicação", "cdb", "tesouro", "corretora"] },
  // 04/11/2026 (cartões): a saída da conta corrente que PAGA a fatura. Não é gasto — os gastos são as compras do cartão.
  { chave: "pagamento_fatura", rotulo: "Pagamento de fatura", tipo: "saida", palavras: ["pagamento fatura", "pag fatura", "pgto cartao", "pagamento de fatura", "pgto cartão", "pgto fatura"] },
  { chave: "outros", rotulo: "Outros gastos", tipo: "saida", palavras: [] },
  { chave: "salario", rotulo: "Salário", tipo: "entrada", palavras: ["salario", "salário", "folha", "pagamento empresa", "pro-labore", "pró-labore"] },
  { chave: "renda_extra", rotulo: "Renda extra", tipo: "entrada", palavras: ["freela", "comissao", "comissão", "venda", "bico"] },
  { chave: "rendimentos", rotulo: "Rendimentos", tipo: "entrada", palavras: ["rendimento", "dividendo", "juros recebidos", "resgate"] },
  { chave: "outras_entradas", rotulo: "Outras entradas", tipo: "entrada", palavras: ["pix recebido", "transferencia recebida", "ted recebida", "reembolso", "estorno"] },
  // 06/11/2026 (Open Finance): dinheiro que volta de um "bolso"/cofrinho/caixinha da PRÓPRIA pessoa. Não é renda.
  { chave: "entre_contas", rotulo: "Entre minhas contas", tipo: "entrada", palavras: ["do bolso", "cofrinho", "caixinha", "mesma titularidade"] },
];

const POR_CHAVE = new Map(CATEGORIAS.map((c) => [c.chave, c]));

export function categoria(chave: string | null | undefined): Categoria {
  return POR_CHAVE.get(chave as ChaveCategoria) ?? POR_CHAVE.get("outros")!;
}

/** Minúsculas e SEM ACENTO: "Transferência" e "transferencia" são a mesma palavra. */
export const semAcento = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/**
 * Primeiro palpite pela descrição. Sem acerto: 'outros' (saída) ou 'outras_entradas' (entrada).
 *
 * ⚠️ COMPARA SEM ACENTO (06/11/2026). O banco escreve "Transferência enviada" e a lista
 * tem "transferencia enviada": com acento de um lado só, nada casava e tudo caía em
 * "Outros gastos" (visto no primeiro teste real com o Mercado Pago).
 */
export function adivinharCategoria(descricao: string, tipo: "entrada" | "saida"): ChaveCategoria {
  const d = ` ${semAcento(descricao)} `;
  for (const c of CATEGORIAS) {
    if (c.tipo !== tipo) continue;
    if (c.palavras.some((p) => d.includes(semAcento(p)))) return c.chave;
  }
  return tipo === "entrada" ? "outras_entradas" : "outros";
}

// ── Categorias PERSONALIZADAS (04/11/2026) ──────────────────────────────────
//
// A lista acima continua fechada e no código. Além dela, a pessoa pode criar as
// próprias em Ajustes (tabela `ncash_categorias_custom`, `supabase/novarecash_extras.sql`),
// com chave `c_<slug>` — o prefixo garante que nunca colida com uma chave fixa.
//
// ⚠️ `categoria(chave)` NÃO conhece as personalizadas (cai em "outros"). Tela que
// mostra ou escolhe categoria deve montar a lista com `todasAsCategorias(custom)`
// e achar o rótulo com `categoriaNaLista(chave, lista)`.

export type CategoriaCustom = {
  chave: string;
  rotulo: string;
  tipo: "saida" | "entrada";
  arquivada: boolean;
};

/** Uma categoria fixa OU personalizada. `chave` é `string` porque a personalizada não está na união. */
export type CategoriaDaLista = {
  chave: string;
  rotulo: string;
  tipo: "saida" | "entrada";
  personalizada: boolean;
};

/**
 * As fixas + as personalizadas, na ordem dos seletores: para cada tipo, as fixas,
 * depois as personalizadas (A–Z) e, no fim, o "Outros" daquele tipo.
 *
 * Arquivada fica FORA (some do seletor), a menos de `incluirArquivadas` — use
 * isso para achar o RÓTULO de um lançamento antigo que ainda está nela.
 */
export function todasAsCategorias(
  custom: CategoriaCustom[] = [],
  opcoes: { incluirArquivadas?: boolean } = {},
): CategoriaDaLista[] {
  const fixa = (c: Categoria): CategoriaDaLista => ({ chave: c.chave, rotulo: c.rotulo, tipo: c.tipo, personalizada: false });
  const minhas = custom
    .filter((c) => opcoes.incluirArquivadas || !c.arquivada)
    .filter((c) => /^c_[a-z0-9_]{1,40}$/.test(c.chave))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"))
    .map((c): CategoriaDaLista => ({ chave: c.chave, rotulo: c.rotulo, tipo: c.tipo, personalizada: true }));

  const lista: CategoriaDaLista[] = [];
  for (const tipo of ["saida", "entrada"] as const) {
    const resto = tipo === "saida" ? "outros" : "outras_entradas";
    lista.push(...CATEGORIAS.filter((c) => c.tipo === tipo && c.chave !== resto).map(fixa));
    lista.push(...minhas.filter((c) => c.tipo === tipo));
    lista.push(fixa(categoria(resto)));
  }
  return lista;
}

/** A categoria de uma chave dentro de uma lista de `todasAsCategorias`. Chave desconhecida: a fixa (ou "outros"). */
export function categoriaNaLista(chave: string | null | undefined, lista: CategoriaDaLista[]): CategoriaDaLista {
  const achada = lista.find((c) => c.chave === chave);
  if (achada) return achada;
  const c = categoria(chave);
  return { chave: c.chave, rotulo: c.rotulo, tipo: c.tipo, personalizada: false };
}

/** "Pet & Veterinário" → "c_pet_veterinario". Vazio quando não sobra letra nem número. */
export function chaveCustomDe(rotulo: string): string {
  const slug = rotulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
    .replace(/_+$/g, "");
  return slug ? `c_${slug}` : "";
}

/**
 * O QUE NÃO É GASTO (04/11/2026): dinheiro que só MUDA DE LUGAR.
 *
 * - `pagamento_fatura`: pagar a fatura não é gastar; o gasto foi cada compra do
 *   cartão. Contar os dois soma o mesmo dinheiro duas vezes.
 * - `transferencias`: Pix/TED entre contas.
 * - `investimentos`: aplicação continua sendo dinheiro seu.
 * - `entre_contas` (06/11/2026): o que volta do cofrinho/bolso da própria pessoa.
 *
 * ⚠️ Vale para os DOIS tipos: o "Pagar fatura" grava uma saída na conta e uma
 * ENTRADA no cartão, ambas `pagamento_fatura` — e essa entrada também não é
 * receita. Todo total de gasto ou de receita deve pular estas chaves.
 */
export const NAO_E_GASTO = new Set<string>(["pagamento_fatura", "transferencias", "investimentos", "entre_contas"]);
