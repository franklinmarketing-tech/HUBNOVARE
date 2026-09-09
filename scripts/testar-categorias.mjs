/**
 * O motor de categorias e orçamento do FINCASH.
 *
 * Confere a aritmética contra contas feitas à mão, sem banco e sem browser.
 * É aqui que a migração do v3 se defende: se a agregação em dois níveis
 * mentir, ela mente com cara de coisa séria — o total continua bonito, a barra
 * continua verde, e o cliente só descobre no extrato do banco.
 *
 * O QUE ESTE ARQUIVO PROVA, e cada item existe porque a alternativa era um bug
 * silencioso em produção:
 *   1. lançamento SEM subcategoria continua somando na categoria pai;
 *   2. lançamento COM subcategoria soma nos dois níveis, sem dobrar o total;
 *   3. categoria arquivada some da escolha e NÃO some do histórico;
 *   4. orçamento fixo vale em todo mês, variável vale só no mês dele;
 *   5. um mês editado no meio de um fixo vira EXCEÇÃO e não contamina os
 *      outros onze.
 *
 * Roda com: node scripts/testar-categorias.mjs
 */
import {
  agregarPorCategoria,
  chaveOrcamento,
  gastoPorChave,
  montarArvore,
  orcamentoDoMes,
  proximaOrdem,
  totalPlanejado,
  trocarOrdem,
} from "../src/lib/fincash/categorias.ts";

let falhas = 0;
let oks = 0;

function checar(nome, condicao, obtido) {
  if (condicao) {
    oks++;
  } else {
    falhas++;
    console.log(`  XX  ${nome}${obtido !== undefined ? ` — obtido: ${obtido}` : ""}`);
  }
}

const titulo = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);

/* -------------------------------------------------------------------------- */
/* O cenário                                                                  */
/* -------------------------------------------------------------------------- */
// Uma árvore pequena e uma vida plausível: assinaturas detalhadas, mercado
// não, e uma categoria antiga arquivada com gasto no passado.

const cat = (id, nome, extras = {}) => ({
  id,
  nome,
  tipo: "despesa",
  grupo: "estilo",
  cor: "#000",
  arquivada: false,
  pai_id: null,
  ordem: 0,
  ...extras,
});

const CATEGORIAS = [
  cat("assin", "Assinaturas", { ordem: 20 }),
  cat("stream", "Streaming", { pai_id: "assin", ordem: 10 }),
  cat("apps", "Aplicativos", { pai_id: "assin", ordem: 20 }),
  cat("mercado", "Mercado", { grupo: "necessidades", ordem: 10 }),
  cat("tv", "TV a cabo", { ordem: 30, arquivada: true }),
];

const lanc = (valor, categoria_id, subcategoria_id = null) => ({
  id: `l${valor}${categoria_id}${subcategoria_id ?? ""}`,
  tipo: "despesa",
  descricao: "x",
  valor,
  data: "2026-03-10",
  categoria_id,
  subcategoria_id,
  conta_id: "c1",
  cartao_id: null,
  pago: true,
  parcela_num: null,
  parcela_total: null,
  observacao: null,
});

const LANCAMENTOS = [
  lanc(45, "assin", "stream"),   // Netflix
  lanc(35, "assin", "stream"),   // Spotify
  lanc(30, "assin", "apps"),     // iCloud
  lanc(20, "assin"),             // uma assinatura que ela não detalhou
  lanc(800, "mercado"),          // mercado inteiro, sem detalhe nenhum
  lanc(120, "tv"),               // categoria ARQUIVADA, gasto de verdade
  lanc(60, null),                // sem categoria: existe e não pode sumir
  { ...lanc(999, "mercado"), tipo: "receita" }, // receita não entra na despesa
];

/* -------------------------------------------------------------------------- */
titulo("1. Hierarquia");
/* -------------------------------------------------------------------------- */

const arvore = montarArvore(CATEGORIAS, { tipo: "despesa" });

checar(
  "arquivada fora da lista de escolha",
  arvore.length === 2 && !arvore.some((n) => n.pai.id === "tv"),
  arvore.map((n) => n.pai.id).join(","),
);
checar(
  "ordem da pessoa manda: Mercado (10) antes de Assinaturas (20)",
  arvore[0].pai.id === "mercado" && arvore[1].pai.id === "assin",
  arvore.map((n) => n.pai.id).join(","),
);
checar(
  "Assinaturas tem duas filhas, na ordem definida",
  arvore[1].filhas.map((f) => f.id).join(",") === "stream,apps",
  arvore[1].filhas.map((f) => f.id).join(","),
);
checar(
  "arquivada aparece quando pedida",
  montarArvore(CATEGORIAS, { tipo: "despesa", incluirArquivadas: true }).length === 3,
);

// A filha de um pai fora da lista vira raiz em vez de sumir: categoria que
// desaparece da tela leva junto a chance de a pessoa consertar.
const orfa = montarArvore([CATEGORIAS[1]], { tipo: "despesa" });
checar("filha órfã vira raiz, não some", orfa.length === 1 && orfa[0].pai.id === "stream");

checar("próxima ordem salta de 10", proximaOrdem(arvore.map((n) => n.pai)) === 30);

const troca = trocarOrdem(
  arvore.map((n) => n.pai),
  "assin",
  -1,
);
checar(
  "subir troca só os dois valores de ordem",
  troca.length === 2 &&
    troca.find((t) => t.id === "assin").ordem === 10 &&
    troca.find((t) => t.id === "mercado").ordem === 20,
  JSON.stringify(troca),
);
checar(
  "no topo, subir não faz nada",
  trocarOrdem(arvore.map((n) => n.pai), "mercado", -1).length === 0,
);
// Banco herdado: todo mundo empatado em 0. A troca precisa renumerar o nível
// inteiro, senão a lista continua exatamente onde estava.
const empatadas = [cat("a", "A"), cat("b", "B"), cat("c", "C")];
const renumerada = trocarOrdem(empatadas, "c", -1);
checar(
  "empate em ordem renumera o nível inteiro",
  renumerada.length === 3 && renumerada.map((r) => r.id).join(",") === "a,c,b",
  JSON.stringify(renumerada),
);

/* -------------------------------------------------------------------------- */
titulo("2. Agregação em dois níveis");
/* -------------------------------------------------------------------------- */

const totais = agregarPorCategoria(LANCAMENTOS, CATEGORIAS);
const por = (id) => totais.find((t) => t.id === id);

// Assinaturas = 45 + 35 + 30 + 20 = 130, das quais 110 detalhadas e 20 não.
checar("total do pai inclui as filhas", por("assin").total === 130, por("assin").total);
checar("o que ficou sem subcategoria aparece em `proprio`", por("assin").proprio === 20);
checar("Streaming soma as duas linhas dele", por("assin").subs.find((s) => s.id === "stream").total === 80);
checar("Aplicativos soma a linha dele", por("assin").subs.find((s) => s.id === "apps").total === 30);
checar(
  "filhas ordenadas do maior para o menor",
  por("assin").subs.map((s) => s.id).join(",") === "stream,apps",
);

// A prova de que o total não dobra: a soma dos blocos tem de bater com a soma
// crua das despesas. É este número que a barra do topo mostra.
const somaCrua = LANCAMENTOS.filter((l) => l.tipo === "despesa").reduce(
  (s, l) => s + l.valor,
  0,
);
checar(
  "soma dos blocos = soma crua das despesas (nada contado duas vezes)",
  totais.reduce((s, t) => s + t.total, 0) === somaCrua,
  `${totais.reduce((s, t) => s + t.total, 0)} vs ${somaCrua}`,
);

checar("mercado sem subcategoria continua válido e somando", por("mercado").total === 800);
checar("mercado não inventa subcategoria", por("mercado").subs.length === 0);
checar("receita não entra na conta de despesa", por("mercado").total === 800);
checar("lançamento sem categoria nenhuma não some", por("sem").total === 60);

// O caso que sustenta o "arquivar em vez de apagar": o gasto de março continua
// sendo de março mesmo com a categoria fora da lista de escolha.
checar("categoria ARQUIVADA continua somando no histórico", por("tv").total === 120);
checar("e continua com o nome dela, não 'Sem categoria'", por("tv").nome === "TV a cabo");

// Blindagem: registro antigo/importado que aponta `categoria_id` para uma
// FILHA é corrigido pela hierarquia, e não vira um bloco ao lado do pai.
const torto = agregarPorCategoria([lanc(10, "stream")], CATEGORIAS);
checar(
  "categoria_id apontando para filha é normalizado no pai",
  torto.length === 1 && torto[0].id === "assin" && torto[0].total === 10,
  JSON.stringify(torto.map((t) => t.id)),
);

/* -------------------------------------------------------------------------- */
titulo("3. Orçamento fixo × variável");
/* -------------------------------------------------------------------------- */

const orc = (id, categoria_id, subcategoria_id, modo, mes_ref, valor) => ({
  id,
  categoria_id,
  subcategoria_id,
  modo,
  mes_ref,
  valor,
});

const ORCAMENTOS = [
  orc("o1", "moradia", null, "fixo", null, 1800),        // aluguel: a regra
  orc("o2", "mercado", null, "variavel", "2026-03", 900), // março
  orc("o3", "mercado", null, "variavel", "2026-04", 750), // abril
  orc("o4", "assin", "stream", "fixo", null, 90),         // streaming, todo mês
];

const marco = orcamentoDoMes(ORCAMENTOS, "2026-03");
const abril = orcamentoDoMes(ORCAMENTOS, "2026-04");
const maio = orcamentoDoMes(ORCAMENTOS, "2026-05");

const K = chaveOrcamento;

checar("fixo vale em março", marco.get(K("moradia")).valor === 1800);
checar("fixo vale em abril", abril.get(K("moradia")).valor === 1800);
checar("fixo vale em maio, sem ninguém digitar nada", maio.get(K("moradia")).valor === 1800);
checar("fixo se anuncia como fixo", maio.get(K("moradia")).modo === "fixo");

checar("variável de março é o de março", marco.get(K("mercado")).valor === 900);
checar("variável de abril é o de abril", abril.get(K("mercado")).valor === 750);
checar(
  "variável NÃO vaza para maio: mês sem valor é mês sem limite",
  maio.get(K("mercado")) === undefined,
);

checar("subcategoria também se orça", marco.get(K("assin", "stream")).valor === 90);
checar(
  "e o orçamento da sub não vira orçamento do pai",
  marco.get(K("assin")) === undefined,
);

/* -------------------------------------------------------------------------- */
titulo("4. O mês editado no meio de um fixo");
/* -------------------------------------------------------------------------- */
// Dezembro do aluguel foi ajustado à mão para 2.100. A regra continua 1.800.

const COM_EXCECAO = [
  ...ORCAMENTOS,
  orc("o5", "moradia", null, "variavel", "2026-12", 2100),
];

const dez = orcamentoDoMes(COM_EXCECAO, "2026-12");
const jan = orcamentoDoMes(COM_EXCECAO, "2026-01");

checar("a exceção ganha do fixo no mês dela", dez.get(K("moradia")).valor === 2100);
checar("e se declara exceção", dez.get(K("moradia")).excecao === true);
checar(
  "guardando o valor do fixo, para a tela oferecer o 'voltar ao fixo'",
  dez.get(K("moradia")).valorFixo === 1800,
);
checar(
  "a linha que vale é a exceção, e é ela que o botão apaga",
  dez.get(K("moradia")).id === "o5" && dez.get(K("moradia")).idFixo === "o1",
);

checar("janeiro NÃO foi contaminado: continua 1.800", jan.get(K("moradia")).valor === 1800);
checar("e janeiro não é exceção", jan.get(K("moradia")).excecao === false);

// "Voltar ao fixo" = apagar a exceção. O fixo volta a valer sozinho, e não uma
// cópia do valor: se o aluguel subir, dezembro sobe junto.
const semExcecao = orcamentoDoMes(
  COM_EXCECAO.filter((o) => o.id !== "o5"),
  "2026-12",
);
checar(
  "apagar a exceção devolve o mês ao fixo",
  semExcecao.get(K("moradia")).valor === 1800 &&
    semExcecao.get(K("moradia")).excecao === false,
);

/* -------------------------------------------------------------------------- */
titulo("5. O total planejado do mês");
/* -------------------------------------------------------------------------- */

// Março: moradia 1.800 (fixo) + mercado 900 (variável) + streaming 90 (sub sem
// pai orçado, então ela É o limite daquele bloco) = 2.790.
checar("soma os dois modos", totalPlanejado(marco) === 2790, totalPlanejado(marco));

// Com o pai orçado, a filha vira recorte DENTRO dele e não soma por fora:
// quem orça 600 de Assinaturas e 90 de Streaming planeja 600, não 690.
const comPai = orcamentoDoMes(
  [...ORCAMENTOS, orc("o6", "assin", null, "fixo", null, 600)],
  "2026-03",
);
checar(
  "filha orçada dentro de pai orçado não soma duas vezes",
  totalPlanejado(comPai) === 1800 + 900 + 600,
  totalPlanejado(comPai),
);

// E a chave do gasto casa com a chave do orçamento — se não casasse, a tela
// mostraria limite sem gasto e gasto sem limite, lado a lado.
const gastos = gastoPorChave(LANCAMENTOS, CATEGORIAS);
checar("gasto do pai pela chave do orçamento", gastos.get(K("assin")) === 130);
checar("gasto da filha pela chave do orçamento", gastos.get(K("assin", "stream")) === 80);

/* -------------------------------------------------------------------------- */
console.log(
  `\n${falhas === 0 ? "OK" : "FALHOU"} — ${oks} conferências passaram, ${falhas} falharam.`,
);
process.exit(falhas === 0 ? 0 : 1);
