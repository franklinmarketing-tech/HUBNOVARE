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
import { interpretar } from "../src/lib/fincash/whatsapp.ts";

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

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s). Pedido não entendido = canal gratuito perdido.`);
  process.exit(1);
}
console.log("o assistente entende os pedidos, e não confunde relato com pergunta.");
