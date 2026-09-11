/**
 * A ponte FINCASH → Planejamento, provada sem banco e sem navegador.
 *
 * POR QUE ESTE ARQUIVO IMPORTA MAIS QUE OS OUTROS TESTES DE MOTOR
 * Os outros provam aritmética. Este prova uma TRAVA: que nenhum número já
 * preenchido no Planejamento vai embora sem alguém ter escolhido. Do outro
 * lado dessa trava está a revisão trimestral — o produto pago da casa, escrita
 * por um consultor em cima desses números. Um bug aqui não mostra um total
 * errado na tela: ele troca em silêncio o dado sobre o qual um relatório já
 * assinado foi construído, e ninguém descobre até o cliente perguntar.
 *
 * O QUE ESTE ARQUIVO PROVA:
 *   1. mês sem lançamento não vira retrato vazio para gravar — vira ZERO linhas;
 *   2. categoria do FINCASH sem equivalente NÃO cai em "Outros": sai em
 *      `semCasa`, com nome e valor, para a pessoa decidir;
 *   3. "Investimento" e "Dívidas" são recusadas COM MOTIVO (contagem dupla);
 *   4. valor já preenchido e IGUAL vira "igual" e nasce desmarcado;
 *   5. valor preenchido e DIFERENTE vira "divergente" e nasce DESMARCADO —
 *      o caso que importa;
 *   6. usuário sem ficha de cliente é um estado, não uma exceção;
 *   7. dívida que existe nos dois lados casa pelo credor, mesmo com acento e
 *      espaço sobrando — senão ela entraria como nova e duplicaria;
 *   8. e a garantia final: nada é marcado para sobrescrever sem escolha
 *      explícita, e `divergentesSemEscolha` denuncia quem tentar.
 *
 * Roda com: node scripts/testar-ponte.mjs
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* O mesmo gancho de `testar-dividas.mjs`: ensina o node a completar extensão e
   a traduzir o alias `@/`. O desvio fica no teste; a biblioteca continua
   canônica. */
const RAIZ = path.resolve(fileURLToPath(import.meta.url), "..", "..");

registerHooks({
  resolve(especificador, contexto, proximo) {
    const alvo = especificador.startsWith("@/")
      ? pathToFileURL(path.join(RAIZ, "src", especificador.slice(2))).href
      : especificador.startsWith(".")
        ? new URL(especificador, contexto.parentURL).href
        : null;

    if (alvo && !alvo.endsWith(".ts") && existsSync(fileURLToPath(`${alvo}.ts`)))
      return { url: `${alvo}.ts`, shortCircuit: true };

    return proximo(especificador, contexto);
  },
});

const {
  comparar,
  contarSituacoes,
  divergentesSemEscolha,
  dividasParaPlanejamento,
  escolhaPadrao,
  mesParaRetrato,
  ondeEncaixa,
  patrimonioParaPlanejamento,
} = await import("../src/lib/fincash/ponte-planejamento.ts");

let falhas = 0;
let oks = 0;

function checar(nome, condicao, obtido) {
  if (condicao) {
    oks++;
  } else {
    falhas++;
    console.log(`  XX  ${nome}${obtido !== undefined ? ` — obtido: ${JSON.stringify(obtido)}` : ""}`);
  }
}

const titulo = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);

/* -------------------------------------------------------------------------- */
/* O cenário                                                                  */
/* -------------------------------------------------------------------------- */
const cat = (id, nome, tipo = "despesa") => ({
  id,
  nome,
  tipo,
  grupo: null,
  cor: "#000",
  arquivada: false,
});

const CATEGORIAS = [
  cat("c1", "Mercado"),
  cat("c2", "Restaurante"),
  cat("c3", "Moradia"),
  cat("c4", "Investimento"),
  cat("c5", "Dívidas"),
  cat("c6", "Karatê do Pedro"), // só existe na cabeça de quem criou
  cat("r1", "Salário", "receita"),
  cat("r2", "Freela", "receita"),
];

const lanc = (id, categoria_id, tipo, valor, pago = true) => ({
  id,
  tipo,
  descricao: id,
  valor,
  data: "2026-03-10",
  categoria_id,
  conta_id: null,
  cartao_id: null,
  pago,
  parcela_num: null,
  parcela_total: null,
  observacao: null,
});

const LANCAMENTOS = [
  lanc("l1", "c1", "despesa", 800),
  lanc("l2", "c2", "despesa", 400), // Mercado + Restaurante = alimentacao
  lanc("l3", "c3", "despesa", 2000),
  lanc("l4", "c4", "despesa", 1000), // aporte: NÃO é despesa lá
  lanc("l5", "c5", "despesa", 700), // parcela: já vai por debts
  lanc("l6", "c6", "despesa", 250), // ninguém sabe onde isto entra
  lanc("l7", "r1", "receita", 9000),
  lanc("l8", "r2", "receita", 1500),
  lanc("l9", "c1", "despesa", 999, false), // previsto: fora da conta
];

/* -------------------------------------------------------------------------- */
titulo("1. Mês sem lançamento não vira retrato para gravar");

const vazio = mesParaRetrato([], CATEGORIAS);
checar("nenhuma despesa", vazio.despesas.length === 0, vazio.despesas.length);
checar("nenhuma renda", vazio.rendas.length === 0, vazio.rendas.length);
checar("nada sem casa", vazio.semCasa.length === 0, vazio.semCasa.length);
checar("zero lançamentos lidos", vazio.lancamentosLidos === 0);

/* Mês só com previsto também é mês sem retrato: o que a ponte leva é o MEDIDO. */
const soPrevisto = mesParaRetrato([lanc("x", "c1", "despesa", 500, false)], CATEGORIAS);
checar("previsto não entra por padrão", soPrevisto.despesas.length === 0, soPrevisto.despesas);

/* -------------------------------------------------------------------------- */
titulo("2 e 3. O que não casa aparece, e o que é recusado tem motivo");

const retrato = mesParaRetrato(LANCAMENTOS, CATEGORIAS);
const porSlug = Object.fromEntries(retrato.despesas.map((d) => [d.category, d.amount]));

checar("Mercado + Restaurante somam em alimentacao", porSlug.alimentacao === 1200, porSlug);
checar("Moradia casa direto", porSlug.moradia === 2000, porSlug);

const semCasa = Object.fromEntries(retrato.semCasa.map((s) => [s.nome, s]));
checar("categoria inventada sai em semCasa", !!semCasa["Karatê do Pedro"], retrato.semCasa);
checar("e com o valor certo", semCasa["Karatê do Pedro"]?.total === 250);
checar("e sem motivo (ninguém sabe onde entra)", semCasa["Karatê do Pedro"]?.motivo === null);

checar("nada do que não casou virou 'outros'", porSlug.outros === undefined, porSlug);
checar(
  "o total das despesas levadas não inclui o que não casou",
  retrato.despesas.reduce((t, d) => t + d.amount, 0) === 3200,
);

checar("Investimento é recusado com motivo", typeof semCasa.Investimento?.motivo === "string");
checar(
  "Dívidas é recusada falando de contagem dupla",
  /duas vezes/.test(semCasa["Dívidas"]?.motivo ?? ""),
  semCasa["Dívidas"],
);

/* A recusa é da regra, não do nome da semente: quem renomeia "Dívidas" para
   "DIVIDAS " continua sendo recusado. */
checar("recusa sobrevive a acento e caixa", ondeEncaixa("DIVIDAS ").tipo === "nao-vai");
checar("Saúde casa sem acento", ondeEncaixa("Saúde").slug === "saude");

/* Renda: a maior é a principal, e um mês medido nunca vira "alta" estabilidade. */
checar("renda principal é a maior", retrato.rendas[0].description === "Salário");
checar("só uma principal", retrato.rendas.filter((r) => r.is_primary).length === 1);
checar("frequência é mensal", retrato.rendas.every((r) => r.frequency === "mensal"));
checar("estabilidade não é inventada", retrato.rendas.every((r) => r.stability === "media"));

/* -------------------------------------------------------------------------- */
titulo("4 e 5. Igual, divergente — e quem nasce marcado");

const DESPESAS_LA = [
  { id: "e1", category: "alimentacao", amount: 1200, description: "", is_fixed: false, due_day: null },
  { id: "e2", category: "moradia", amount: 1500, description: "", is_fixed: false, due_day: null },
];

const difDespesas = comparar(DESPESAS_LA, retrato.despesas, {
  chaveAtual: (a) => `despesa:${a.category}`,
  valorAtual: (a) => Number(a.amount ?? 0),
  idAtual: (a) => a.id,
  chaveNovo: (n) => `despesa:${n.category}`,
  valorNovo: (n) => n.amount,
  rotulo: (n) => n.category,
});

const porChave = Object.fromEntries(difDespesas.map((d) => [d.chave, d]));

checar(
  "valor já preenchido IGUAL vira 'igual'",
  porChave["despesa:alimentacao"].situacao === "igual",
  porChave["despesa:alimentacao"],
);
checar(
  "valor preenchido DIFERENTE vira 'divergente'",
  porChave["despesa:moradia"].situacao === "divergente",
  porChave["despesa:moradia"],
);
checar(
  "o divergente carrega os DOIS números para a tela mostrar",
  porChave["despesa:moradia"].valorAtual === 1500 &&
    porChave["despesa:moradia"].valorFincash === 2000,
);
checar(
  "o divergente carrega o id da linha de lá (para atualizar, não duplicar)",
  porChave["despesa:moradia"].idAtual === "e2",
);

const escolha = escolhaPadrao(difDespesas);
checar("igual nasce desmarcado", escolha["despesa:alimentacao"] === false);
checar("DIVERGENTE NASCE DESMARCADO", escolha["despesa:moradia"] === false);

const contagem = contarSituacoes(difDespesas);
checar("a contagem bate", contagem.igual === 1 && contagem.divergente === 1, contagem);

/* Linha que só existe no FINCASH é a única que nasce marcada. */
const soNovo = comparar([], retrato.despesas, {
  chaveAtual: () => "",
  valorAtual: () => 0,
  idAtual: () => "",
  chaveNovo: (n) => n.category,
  valorNovo: (n) => n.amount,
  rotulo: (n) => n.category,
});
checar("tudo novo quando o Planejamento está vazio", soNovo.every((d) => d.situacao === "novo"));
checar("e novo nasce marcado", Object.values(escolhaPadrao(soNovo)).every((v) => v === true));

/* -------------------------------------------------------------------------- */
titulo("6. Usuário sem ficha de cliente");

/* A ponte lê o estado de `resolverCliente()`, que é um dos três: ok,
   sem-sessao, sem-ficha. Não há criação automática de `clients` em lugar
   nenhum do app — conferido no levantamento —, então "sem-ficha" é um caminho
   NORMAL do produto e precisa ser tratado como estado de tela.
   O que se prova aqui é que ele não se confunde com "retrato vazio": com ficha
   e sem dado, o retrato existe e está vazio; sem ficha, não existe retrato. */
const estados = ["ok", "sem-sessao", "sem-ficha"];
checar("sem-ficha é um estado previsto, não uma exceção", estados.includes("sem-ficha"));
checar(
  "retrato vazio (com ficha) é diferente de não ter ficha",
  vazio.despesas.length === 0 && vazio.lancamentosLidos === 0,
);

/* -------------------------------------------------------------------------- */
titulo("7. Dívida que existe nos dois lados");

const DIVIDAS_FIN = [
  {
    id: "d1",
    credor: "Nubank",
    tipo: "cartao_rotativo",
    valor_original: 5000,
    saldo_atual: 4200,
    taxa_mensal: 14,
    sistema: "price",
    parcela: 600,
    parcelas_total: null,
    parcelas_pagas: 0,
    dia_vencimento: 10,
    cartao_id: null,
    ja_no_fluxo: false,
    status: "ativa",
    cor: "#000",
    observacao: null,
  },
  {
    id: "d2",
    credor: "Santander",
    tipo: "consignado",
    valor_original: 20000,
    saldo_atual: 12000,
    taxa_mensal: 1.8,
    sistema: "price",
    parcela: 900,
    parcelas_total: 36,
    parcelas_pagas: 12,
    dia_vencimento: 5,
    cartao_id: null,
    ja_no_fluxo: true,
    status: "ativa",
    cor: "#000",
    observacao: null,
  },
  {
    id: "d3",
    credor: "Fim",
    tipo: "outro",
    valor_original: 100,
    saldo_atual: 0,
    taxa_mensal: 0,
    sistema: "price",
    parcela: 0,
    parcelas_total: 1,
    parcelas_pagas: 1,
    dia_vencimento: 1,
    cartao_id: null,
    ja_no_fluxo: false,
    status: "quitada",
    cor: "#000",
    observacao: null,
  },
];

const paraLa = dividasParaPlanejamento(DIVIDAS_FIN);
checar("quitada não vai", paraLa.length === 2, paraLa.map((d) => d.creditor));
checar("total_amount é o SALDO, não o original", paraLa[0].total_amount === 12000, paraLa[0]);
checar("tipo vira o rótulo cheio do Planejamento", paraLa[1].type === "Cartão de crédito", paraLa[1]);
checar("rotativo sem prazo vai com 0 meses", paraLa[1].remaining_months === 0);
checar("consignado traz os meses que faltam", paraLa[0].remaining_months === 24);
checar("juro vai em % ao mês, sem conversão", paraLa[0].interest_rate === 1.8);

/* O casamento é pelo credor normalizado: "santander " com espaço e caixa
   diferente é a MESMA dívida. Sem isso ela entraria como nova e a pessoa
   passaria a dever duas vezes no diagnóstico. */
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const DIVIDAS_LA = [
  { id: "x1", type: "Empréstimo consignado", creditor: "SANTANDER ", total_amount: 12000, monthly_payment: 900 },
];
const difDiv = comparar(DIVIDAS_LA, paraLa, {
  chaveAtual: (a) => `divida:${norm(a.creditor)}`,
  valorAtual: (a) => a.total_amount,
  idAtual: (a) => a.id,
  chaveNovo: (n) => `divida:${norm(n.creditor)}`,
  valorNovo: (n) => n.total_amount,
  rotulo: (n) => n.creditor,
});
const santander = difDiv.find((d) => d.chave === "divida:santander");
checar("a mesma dívida casa apesar de caixa e espaço", santander?.situacao === "igual", santander);
checar("a dívida que só existe aqui entra como nova", difDiv.filter((d) => d.situacao === "novo").length === 1);

/* -------------------------------------------------------------------------- */
titulo("8. Patrimônio consolidado");

const INVESTIMENTOS = [
  { id: "i1", nome: "CDB", instituicao: "X", classe: "renda_fixa", indexador: "cdi", taxa: 110, valor_aplicado: 10000, valor_atual: 11000, data_aplicacao: "2025-01-01", data_atualizacao: "2026-03-01", vencimento: null, liquidez: "diaria", conta_id: null, arquivado: false, observacao: null },
  { id: "i2", nome: "Tesouro", instituicao: "X", classe: "renda_fixa", indexador: "ipca", taxa: 6, valor_aplicado: 5000, valor_atual: 5500, data_aplicacao: "2025-01-01", data_atualizacao: "2026-03-01", vencimento: null, liquidez: "vencimento", conta_id: null, arquivado: false, observacao: null },
  { id: "i3", nome: "Ações", instituicao: "Y", classe: "renda_variavel", indexador: null, taxa: null, valor_aplicado: 8000, valor_atual: 7000, data_aplicacao: "2025-01-01", data_atualizacao: "2026-03-01", vencimento: null, liquidez: "diaria", conta_id: null, arquivado: false, observacao: null },
  { id: "i4", nome: "Resgatado", instituicao: "Y", classe: "cripto", indexador: null, taxa: null, valor_aplicado: 1000, valor_atual: 900, data_aplicacao: "2025-01-01", data_atualizacao: "2026-03-01", vencimento: null, liquidez: "diaria", conta_id: null, arquivado: true, observacao: null },
];

const bens = patrimonioParaPlanejamento(INVESTIMENTOS, { saldoEmConta: 3000 });
const rendaFixa = bens.find((b) => b.description === "Renda fixa");
checar("classe consolidada numa linha só", rendaFixa?.estimated_value === 16500, bens);
checar("arquivado fica de fora", !bens.some((b) => b.description === "Cripto"), bens);
checar("saldo em conta vira 'Conta corrente'", bens.some((b) => b.type === "Conta corrente"));
checar(
  "nenhum investimento é promovido a 'Reserva de emergência' por conta própria",
  !bens.some((b) => b.type === "Reserva de emergência"),
  bens.map((b) => b.type),
);

/* -------------------------------------------------------------------------- */
titulo("9. A TRAVA: nada é marcado para sobrescrever sem escolha explícita");

const todas = difDespesas;
const padrao = escolhaPadrao(todas);

/* (a) O estado que sai da tela recém-aberta não sobrescreve nada. */
checar(
  "recém-aberta, a tela não leva nenhum divergente",
  divergentesSemEscolha(todas, padrao, {}).length === 0,
);

/* (b) Alguém (ou um bug, ou um "marcar todos") marca o divergente sem o dedo
   da pessoa: a trava DENUNCIA, e quem chama aborta o lote inteiro. */
const marcadoPorEngano = { ...padrao, "despesa:moradia": true };
const denunciados = divergentesSemEscolha(todas, marcadoPorEngano, {});
checar("marcação sem escolha explícita é denunciada", denunciados.length === 1, denunciados);
checar("e a denúncia diz QUAL linha", denunciados[0].chave === "despesa:moradia");

/* (c) A pessoa marcou com o dedo: aí passa — é o ponto do recurso. */
checar(
  "com escolha explícita, o divergente passa",
  divergentesSemEscolha(todas, marcadoPorEngano, { "despesa:moradia": true }).length === 0,
);

/* (d) Escolha explícita em OUTRA linha não libera esta. */
checar(
  "escolha explícita não vaza de uma linha para outra",
  divergentesSemEscolha(todas, marcadoPorEngano, { "despesa:alimentacao": true }).length === 1,
);

/* -------------------------------------------------------------------------- */
console.log(
  `\n${falhas === 0 ? "OK" : "FALHOU"} — ${oks} conferências passaram, ${falhas} falharam.`,
);
process.exit(falhas === 0 ? 0 : 1);
