/**
 * O FINCASH — hierarquia de categorias e orçamento fixo × variável.
 *
 * POR QUE ESTE ARQUIVO EXISTE, e não é mais um pedaço do `modelo.ts`
 * Tudo aqui é FUNÇÃO PURA: entra array, sai número. Nenhuma linha fala com o
 * Supabase. É essa restrição que deixa `scripts/testar-categorias.mjs` provar a
 * agregação sem banco, sem browser e sem sessão — e agregação de dinheiro que
 * ninguém consegue testar é agregação em que ninguém deveria confiar.
 * O CRUD, que precisa de rede, ficou no `modelo.ts`, ao lado do resto da
 * escrita. Os tipos vêm de lá por `import type`, que some na compilação: este
 * arquivo continua sem nenhuma dependência de execução.
 *
 * AS DUAS REGRAS QUE MANDAM AQUI
 *
 * 1. `categoria_id` É SEMPRE O PAI. A subcategoria vive em `subcategoria_id` e
 *    é opcional. Lançamento sem subcategoria não é lançamento incompleto — é o
 *    caso normal, e ele soma no pai exatamente como somava antes do v3. Toda
 *    função daqui trata `subcategoria_id: null` como cidadão de primeira
 *    classe, nunca como dado faltando.
 *
 * 2. O TOTAL DO PAI INCLUI AS FILHAS. "Assinaturas: R$ 210" quer dizer tudo
 *    que é assinatura, streaming inclusive. A alternativa — pai mostrando só o
 *    que não foi classificado — faria a soma dos grupos na tela não bater com o
 *    total gasto do mês, e planilha que não fecha é planilha que perde o
 *    cliente. O que sobrou sem filha aparece separado, em `proprio`.
 */

import type {
  Categoria,
  GrupoCategoria,
  Lancamento,
  TipoLancamento,
} from "./modelo";

// ── Hierarquia ──────────────────────────────────────────────────────────────

/** Um pai com as filhas dele, já na ordem em que a tela desenha. */
export type NoCategoria = {
  pai: Categoria;
  filhas: Categoria[];
};

/**
 * Ordenação da árvore: `ordem` manda, nome desempata.
 *
 * O desempate por nome não é firula: até o v3 rodar o backfill, ou quando duas
 * linhas nascem no mesmo segundo, várias categorias empatam em `ordem` — e
 * lista que troca de posição a cada carregamento é lista em que a pessoa nunca
 * aprende onde as coisas ficam.
 */
const porOrdem = (a: Categoria, b: Categoria) =>
  (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome, "pt-BR");

/**
 * A lista plana do banco vira a árvore de dois níveis.
 *
 * ÓRFÃ VIRA RAIZ. Se `pai_id` aponta para uma categoria que não veio na lista
 * (arquivada e filtrada fora, por exemplo), a filha é promovida a raiz em vez
 * de sumir. Categoria que desaparece da tela leva junto a chance de a pessoa
 * consertar o que está errado — e ela nem fica sabendo que existia.
 */
export function montarArvore(
  categorias: Categoria[],
  opcoes: {
    tipo?: TipoLancamento;
    /** Padrão: fora. Arquivada existe para o histórico, não para a lista. */
    incluirArquivadas?: boolean;
  } = {},
): NoCategoria[] {
  const { tipo, incluirArquivadas = false } = opcoes;

  const visiveis = categorias.filter(
    (c) =>
      (tipo === undefined || c.tipo === tipo) &&
      (incluirArquivadas || !c.arquivada),
  );

  const idsVisiveis = new Set(visiveis.map((c) => c.id));
  const raizes = visiveis.filter((c) => !c.pai_id || !idsVisiveis.has(c.pai_id));

  const filhasDe = new Map<string, Categoria[]>();
  for (const c of visiveis) {
    if (!c.pai_id || !idsVisiveis.has(c.pai_id)) continue;
    const lista = filhasDe.get(c.pai_id);
    if (lista) lista.push(c);
    else filhasDe.set(c.pai_id, [c]);
  }

  return raizes.sort(porOrdem).map((pai) => ({
    pai,
    filhas: (filhasDe.get(pai.id) ?? []).sort(porOrdem),
  }));
}

/** O pai de qualquer categoria — ela mesma, quando já é raiz. */
export function paiDe(id: string, categorias: Categoria[]): string {
  const c = categorias.find((x) => x.id === id);
  return c?.pai_id ?? id;
}

/**
 * A próxima `ordem` de um nível.
 *
 * Salto de 10 de propósito: é o que permite encaixar uma categoria entre duas
 * existentes mudando UMA linha (a média das vizinhas), em vez de reescrever a
 * lista inteira a cada arrastada.
 */
export const proximaOrdem = (irmas: Categoria[]) =>
  irmas.reduce((maior, c) => Math.max(maior, c.ordem ?? 0), 0) + 10;

/**
 * A nova sequência de `ordem` depois de mover uma linha para cima ou para
 * baixo, já como lista de updates.
 *
 * DEVOLVE SÓ QUEM MUDOU. Reordenar dez categorias para trocar duas de lugar são
 * dez escritas, dez chances de uma falhar no meio e a lista ficar embaralhada.
 * Aqui a troca é sempre de dois valores de `ordem` entre vizinhas — duas
 * escritas, e o pior caso de falha deixa a lista igual ao que estava.
 */
export function trocarOrdem(
  irmas: Categoria[],
  id: string,
  direcao: -1 | 1,
): { id: string; ordem: number }[] {
  const lista = [...irmas].sort(porOrdem);
  const i = lista.findIndex((c) => c.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) return [];

  const a = lista[i];
  const b = lista[j];

  /* Empate em `ordem` (herança de banco antigo) faria a troca não trocar nada:
     os dois continuariam com o mesmo número e o desempate por nome mandaria de
     novo. Nesse caso reordena o nível inteiro, que é o único jeito de a lista
     passar a ter uma ordem de verdade. */
  if ((a.ordem ?? 0) === (b.ordem ?? 0)) {
    const trocada = [...lista];
    trocada[i] = b;
    trocada[j] = a;
    return trocada.map((c, k) => ({ id: c.id, ordem: (k + 1) * 10 }));
  }

  return [
    { id: a.id, ordem: b.ordem ?? 0 },
    { id: b.id, ordem: a.ordem ?? 0 },
  ];
}

// ── Agregação em dois níveis ────────────────────────────────────────────────

export type TotalSubcategoria = {
  id: string;
  nome: string;
  cor: string;
  total: number;
};

export type TotalCategoria = {
  id: string;
  nome: string;
  cor: string;
  grupo: GrupoCategoria | null;
  /** O total do bloco: o que é do pai MAIS o que é das filhas. */
  total: number;
  /** Só o que ficou sem subcategoria. A diferença entre este e `total` é o
      quanto a pessoa já detalhou — e é o que a tela usa para saber se vale a
      pena mostrar a árvore aberta. */
  proprio: number;
  subs: TotalSubcategoria[];
};

const SEM_CATEGORIA = "sem";

/**
 * Quanto saiu (ou entrou) por categoria, com as subcategorias dentro.
 *
 * O LANÇAMENTO ANTIGO CONTINUA CERTO: quem não tem `subcategoria_id` soma no
 * pai e pronto. E o lançamento que tem soma NOS DOIS — na filha, para responder
 * "quanto em streaming?", e no pai, porque streaming também é assinatura. Somar
 * só na filha faria o total do mês encolher no dia em que a pessoa começasse a
 * detalhar, e "organizei melhor e gastei menos" é a mentira mais fácil de um
 * app de finanças contar.
 *
 * CATEGORIA ARQUIVADA NÃO SOME DAQUI. Ela sai da lista de escolha (`montarArvore`
 * a esconde), mas o gasto de março continua sendo de março. Se a agregação a
 * ignorasse, arquivar uma categoria apagaria dinheiro do passado — e o total do
 * mês passaria a discordar do extrato.
 */
export function agregarPorCategoria(
  lancamentos: Lancamento[],
  categorias: Categoria[],
  opcoes: { tipo?: TipoLancamento } = {},
): TotalCategoria[] {
  const tipo = opcoes.tipo ?? "despesa";
  const porId = new Map(categorias.map((c) => [c.id, c]));

  const blocos = new Map<string, TotalCategoria>();
  const subs = new Map<string, Map<string, TotalSubcategoria>>();

  for (const l of lancamentos) {
    if (l.tipo !== tipo) continue;

    /* O pai vem do lançamento, mas a hierarquia tem a última palavra: se um
       dia um registro chegar com `categoria_id` apontando para uma filha (import
       antigo, escrita fora do app), `pai_id` corrige aqui em vez de a filha
       aparecer como bloco de primeiro nível ao lado do próprio pai. */
    const catBruta = l.categoria_id ?? SEM_CATEGORIA;
    const cat = porId.get(catBruta)?.pai_id ?? catBruta;

    let bloco = blocos.get(cat);
    if (!bloco) {
      const c = porId.get(cat);
      bloco = {
        id: cat,
        nome: c?.nome ?? "Sem categoria",
        cor: c?.cor ?? "#64748b",
        grupo: c?.grupo ?? null,
        total: 0,
        proprio: 0,
        subs: [],
      };
      blocos.set(cat, bloco);
    }

    const valor = Number(l.valor);
    bloco.total += valor;

    const subId = l.subcategoria_id ?? null;
    if (!subId) {
      bloco.proprio += valor;
      continue;
    }

    let mapa = subs.get(cat);
    if (!mapa) {
      mapa = new Map();
      subs.set(cat, mapa);
    }
    const s = porId.get(subId);
    const atual = mapa.get(subId);
    if (atual) atual.total += valor;
    else
      mapa.set(subId, {
        id: subId,
        nome: s?.nome ?? "Sem subcategoria",
        cor: s?.cor ?? bloco.cor,
        total: valor,
      });
  }

  for (const [cat, mapa] of subs) {
    const bloco = blocos.get(cat);
    if (bloco) bloco.subs = [...mapa.values()].sort((a, b) => b.total - a.total);
  }

  // Do maior para o menor, dentro e fora: em lista alfabética, a categoria que
  // está estourando pode ficar no fim e ninguém rola até lá.
  return [...blocos.values()].sort((a, b) => b.total - a.total);
}

// ── Orçamento: fixo × variável ──────────────────────────────────────────────

export type ModoOrcamento = "fixo" | "variavel";

export type Orcamento = {
  id: string;
  categoria_id: string;
  /** Nulo = o orçamento é da categoria inteira. */
  subcategoria_id: string | null;
  /** Nulo quando `modo = "fixo"` — é justamente o que o fixo não tem. */
  mes_ref: string | null;
  modo: ModoOrcamento;
  valor: number;
};

/**
 * A chave de uma LINHA de orçamento: categoria, ou categoria + subcategoria.
 *
 * Um só formato de chave, num lugar só. Duas telas montando `${cat}|${sub}` de
 * jeitos diferentes é como uma delas passa a não achar o orçamento que a outra
 * gravou — e o cliente vê o limite sumir ao trocar de aba.
 */
export const chaveOrcamento = (
  categoriaId: string,
  subcategoriaId?: string | null,
) => `${categoriaId}|${subcategoriaId ?? ""}`;

export type OrcamentoEfetivo = {
  categoria_id: string;
  subcategoria_id: string | null;
  /** O valor que vale NESTE mês. */
  valor: number;
  /** Como ele foi definido. `"fixo"` aqui quer dizer "veio do fixo, sem
      exceção neste mês". */
  modo: ModoOrcamento;
  /** Existe um fixo E este mês foi ajustado à mão. É o estado que a tela
      precisa explicar em palavras: senão a pessoa muda dezembro, vê janeiro
      intacto e conclui que o app não salvou. */
  excecao: boolean;
  /** O valor do fixo, quando existe — para a tela poder oferecer o "voltar ao
      fixo" mostrando para onde ela volta. */
  valorFixo: number | null;
  /** A linha que vale, para editar ou apagar sem uma segunda busca. */
  id: string | null;
  idFixo: string | null;
};

/**
 * O orçamento que vale em um mês, resolvido nos dois modos.
 *
 * A PRECEDÊNCIA, e ela é a regra inteira: **variável do mês ganha do fixo.**
 * O fixo é a regra ("meu aluguel é 1.800"); o variável do mês é a exceção
 * ("em dezembro foi 2.100"). É o mesmo desenho que `fin_recorrencias` já usa
 * neste app — regra que fica, mês que vira registro editável — e repetir um
 * padrão que a casa já entende vale mais que inventar um melhor.
 *
 * O QUE ACONTECE QUANDO A PESSOA EDITA UM MÊS DE UM FIXO
 * Nasce a exceção, o fixo não é tocado, e os outros onze meses continuam no
 * valor da regra. `excecao: true` é o que permite a tela dizer isso com todas
 * as letras em vez de deixar a pessoa descobrir sozinha em janeiro.
 */
export function orcamentoDoMes(
  orcamentos: Orcamento[],
  ref: string,
): Map<string, OrcamentoEfetivo> {
  const fixos = new Map<string, Orcamento>();
  const doMes = new Map<string, Orcamento>();

  for (const o of orcamentos) {
    const k = chaveOrcamento(o.categoria_id, o.subcategoria_id);
    if (o.modo === "fixo") fixos.set(k, o);
    else if (o.mes_ref === ref) doMes.set(k, o);
  }

  const saida = new Map<string, OrcamentoEfetivo>();

  for (const k of new Set([...fixos.keys(), ...doMes.keys()])) {
    const fixo = fixos.get(k);
    const mes = doMes.get(k);
    const vale = mes ?? fixo;
    if (!vale) continue;

    saida.set(k, {
      categoria_id: vale.categoria_id,
      subcategoria_id: vale.subcategoria_id,
      valor: Number(vale.valor),
      modo: mes ? "variavel" : "fixo",
      excecao: Boolean(mes && fixo),
      valorFixo: fixo ? Number(fixo.valor) : null,
      id: vale.id,
      idFixo: fixo?.id ?? null,
    });
  }

  return saida;
}

/**
 * O total planejado de um mês.
 *
 * SÓ AS LINHAS-PAI SEM FILHA ORÇADA, mais as filhas orçadas. Somar o limite do
 * pai E o das filhas contaria o mesmo dinheiro duas vezes: quem orça R$ 600 de
 * Assinaturas e R$ 90 de Streaming não planeja gastar R$ 690 — planeja 600, com
 * 90 deles reservados para streaming. Esta é a conta que a barra do topo mostra
 * e é a que precisa bater com o extrato.
 */
export function totalPlanejado(
  efetivo: Map<string, OrcamentoEfetivo>,
): number {
  let total = 0;
  for (const o of efetivo.values()) {
    /* Filha cujo pai também tem limite não entra: o limite do pai já é o teto
       do bloco inteiro, e a filha é um recorte DENTRO dele. Filha sem pai
       orçado entra, porque aí ela é o único limite que existe naquele bloco. */
    if (o.subcategoria_id && efetivo.has(chaveOrcamento(o.categoria_id, null))) {
      continue;
    }
    total += o.valor;
  }
  return total;
}

/** O gasto do mês por chave de orçamento — pai e filha, prontos para casar
    com o que `orcamentoDoMes` devolve. */
export function gastoPorChave(
  lancamentos: Lancamento[],
  categorias: Categoria[],
): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const bloco of agregarPorCategoria(lancamentos, categorias)) {
    mapa.set(chaveOrcamento(bloco.id, null), bloco.total);
    for (const s of bloco.subs) {
      mapa.set(chaveOrcamento(bloco.id, s.id), s.total);
    }
  }
  return mapa;
}
