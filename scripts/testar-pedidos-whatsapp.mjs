/**
 * O ASSISTENTE ENTENDE O QUE O CLIENTE PEDE?
 *
 * ⚠️ POR QUE ESTE TESTE EXISTE: os avisos do FINCASH saem de graça pelo sino
 * e por e-mail. Pelo WhatsApp, uma mensagem que a CASA inicia custa R$ 0,035
 * na Meta — mas quando é o CLIENTE que pergunta, a resposta entra nas 1.000
 * mensagens de serviço gratuitas do mês. Daí a regra do canal: a casa não
 * avisa pelo WhatsApp, a casa RESPONDE.
 *
 * Isso só funciona se o assistente entender o pedido. "minha fatura" virando
 * "não entendi" não é um bug pequeno: é o canal gratuito deixando de existir.
 *
 * ⚠️ A ARMADILHA QUE ESTE TESTE PEGOU, e que pegaria de novo: são DUAS
 * listas de palavras (`CONSULTA` e `PERGUNTA_DE_CONSULTA`) e `interpretar`
 * exige as duas. Acrescentar palavra em uma só não faz efeito nenhum, e o
 * sintoma é o assistente responder "não entendi" a uma pergunta clara.
 *
 *   node scripts/testar-pedidos-whatsapp.mjs
 */
import {
  interpretar,
  respostaCodigoInvalido,
  respostaDeAjuda,
  respostaDeSaldo,
  respostaIndefinida,
  respostaNaoVinculado,
} from "../src/lib/fincash/whatsapp.ts";
import { CATEGORIAS, adivinharCategoria } from "../src/lib/novarecash/categorias.ts";

const CTX = {
  hoje: new Date(2026, 9, 18),
  contas: [{ id: "c1", nome: "Nubank" }],
  cartoes: [{ id: "k1", nome: "Visa" }],
  categorias: [{ id: "g1", nome: "Mercado", tipo: "despesa" }],
};

let falhas = 0;
const conferir = (frase, esperado, ctx = CTX) => {
  const i = interpretar(frase, ctx);
  const veio =
    i.tipo === "consulta" ? i.consulta.escopo
    : i.tipo === "indefinido" ? `indefinido:${i.motivo}`
    : i.tipo;
  const ok = veio === esperado;
  if (!ok) falhas++;
  console.log(
    (ok ? "  ok  " : "FALHOU") + `  "${frase}" → ${veio}` +
    (ok ? "" : `   (esperado ${esperado})`),
  );
};

console.log("\nOs pedidos que substituem os avisos pagos");
console.log("─────────────────────────────────────────");
conferir("o que tenho para pagar", "contas");
conferir("quais contas vao vencer", "contas");
conferir("contas a pagar", "contas");
conferir("quais contas vencem essa semana", "contas");
conferir("quando fecha a fatura", "fatura");
conferir("minha fatura", "fatura");
conferir("quando o cartao fecha", "fatura");

console.log("\nO que já funcionava, e não pode quebrar");
console.log("───────────────────────────────────────");
conferir("saldo", "saldo");
conferir("resumo", "resumo");
conferir("quanto sobrou", "resumo");
conferir("quanto gastei no mercado", "categoria");

console.log("\nRelato continua sendo relato");
console.log("────────────────────────────");
/* ⚠️ A diferença entre pergunta e relato é o VALOR na frase, não a palavra.
   Por isso as listas podem conter "pagar" e "fatura" sem transformar
   "paguei 50" em consulta. */
const soConta = { ...CTX, cartoes: [] };
conferir("paguei 50 no mercado", "registrar", soConta);
conferir("conta de luz 180", "registrar", soConta);
conferir("fatura do visa 1200", "registrar");

console.log("\nCom conta E cartão, sem dizer qual, ele pergunta");
console.log("────────────────────────────────────────────────");
conferir("paguei 50 no mercado", "indefinido:conta-ambigua");

/* ── NOVARECASH (03/11/2026) ───────────────────────────────────────────
   O assistente grava no NovareCash. Três coisas aqui quebrariam calado:
   quem não tem conta nenhuma tem de GRAVAR sem conta (não perguntar), as
   categorias da lista fechada do NovareCash têm de casar, e nenhum texto
   pode voltar a falar em FINCASH ou mandar para /fincash. */
console.log("\nNovareCash: sem conta nenhuma, grava sem conta");
console.log("──────────────────────────────────────────────");
const semNada = { ...CTX, contas: [], cartoes: [] };
conferir("uber 35", "registrar", semNada);
{
  const i = interpretar("uber 35", semNada);
  const ok = i.tipo === "registrar" && i.rascunho.conta_id === null && i.rascunho.cartao_id === null;
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + "  sem conta → conta_id e cartao_id nulos");
}

console.log("\nNovareCash: as categorias da lista fechada");
console.log("──────────────────────────────────────────");
// Mesma tradução de `CATEGORIAS_ALVO` em `whatsapp-servidor.ts`.
const NCASH = {
  ...semNada,
  categorias: CATEGORIAS.map((c) => ({
    id: c.chave,
    nome: c.rotulo,
    tipo: c.tipo === "entrada" ? "receita" : "despesa",
  })),
};
const categoriaDe = (frase, esperada) => {
  const i = interpretar(frase, NCASH);
  const veio = i.tipo === "registrar" ? `${i.rascunho.tipo}:${i.rascunho.categoria_id}` : i.tipo;
  const ok = veio === esperada;
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + `  "${frase}" → ${veio}` + (ok ? "" : `   (esperado ${esperada})`));
};
categoriaDe("uber 35", "despesa:transporte");
categoriaDe("mercado 280 ontem", "despesa:mercado");
categoriaDe("ifood 42,90", "despesa:restaurantes");
categoriaDe("farmacia 30", "despesa:saude");
categoriaDe("netflix 55", "despesa:assinaturas");
categoriaDe("recebi 5000 de salario", "receita:salario");
categoriaDe("freela 800 recebi", "receita:renda_extra");
{
  // Consulta por categoria do NovareCash: o `categoria_id` é a CHAVE.
  const i = interpretar("quanto gastei com mercado", NCASH);
  const ok = i.tipo === "consulta" && i.consulta.categoria_id === "mercado";
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + "  consulta por categoria usa a chave do NovareCash");
}
{
  // O segundo palpite do servidor (`adivinharCategoria`) usa a DESCRIÇÃO, sem
  // o valor: "camiseta 99" não pode cair em Transporte pelo "99" do app de corrida.
  const i = interpretar("camiseta 99", NCASH);
  const desc = i.tipo === "registrar" ? i.rascunho.descricao : "";
  const ok = desc === "Camiseta" && adivinharCategoria(desc, "saida") !== "transporte";
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + `  palpite pela descrição sem o valor ("${desc}")`);
}

console.log("\nNovareCash: nenhum texto fala em FINCASH");
console.log("────────────────────────────────────────");
{
  const textos = [
    respostaDeAjuda(),
    respostaNaoVinculado("https://hub.novareapp.com.br"),
    respostaCodigoInvalido("https://hub.novareapp.com.br"),
    respostaIndefinida("conta-ambigua", ["Nubank", "Visa"]),
    respostaIndefinida("sem-valor"),
    respostaDeSaldo([]),
  ];
  const sujos = textos.filter((t) => /fincash/i.test(t));
  const ok = sujos.length === 0;
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + "  nenhuma resposta cita FINCASH ou /fincash" + (ok ? "" : `: ${sujos[0]}`));

  const link = respostaNaoVinculado("https://hub.novareapp.com.br");
  const okLink = link.includes("https://hub.novareapp.com.br/novarecash/app/whatsapp");
  if (!okLink) falhas++;
  console.log((okLink ? "  ok  " : "FALHOU") + "  o vínculo aponta para /novarecash/app/whatsapp");
}

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s). Pedido não entendido = canal gratuito perdido.`);
  process.exit(1);
}
console.log("o assistente entende os pedidos, e não confunde relato com pergunta.");
