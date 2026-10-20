/**
 * O EXTRATO DE EXEMPLO da Íris (20/10/2026): o botão "Ver um exemplo" cola
 * isto no campo e pede a leitura, para quem chega ver a Íris trabalhando em
 * um clique, antes de ir atrás do arquivo do próprio banco.
 *
 * ⚠️ É FICTÍCIO E A TELA DIZ ISSO. Três meses de uma pessoa inventada, com
 * o que mais aparece num extrato de verdade: salário, aluguel, mercado,
 * três assinaturas, tarifa de pacote, juro de cheque especial e IOF. Os
 * números saem do mesmo leitor (`lib/extrato.ts`) que lê o extrato real.
 */
const MESES = ["08", "09", "10"] as const;

function mes(m: (typeof MESES)[number], i: number): string {
  const d = (dia: number) => `${String(dia).padStart(2, "0")}/${m}/2026`;
  const linhas = [
    [d(1), "SALARIO EMPRESA LTDA", 6200],
    [d(3), "ALUGUEL APARTAMENTO", -1850],
    [d(4), "CONDOMINIO RESIDENCIAL", -420],
    [d(5), "ENERGIA ELETRICA", -186.4 - i * 9],
    [d(6), "INTERNET FIBRA", -119.9],
    [d(7), "SUPERMERCADO BOM PRECO", -612.35 + i * 22],
    [d(9), "NETFLIX.COM", -44.9],
    [d(9), "SPOTIFY", -21.9],
    [d(10), "TARIFA PACOTE DE SERVICOS", -64.9],
    [d(12), "POSTO SHELL COMBUSTIVEL", -230 + i * 15],
    [d(14), "IFOOD *RESTAURANTE", -96.8 + i * 11],
    [d(15), "DROGARIA SAO PAULO", -88.4],
    [d(17), "AMAZON PRIME", -19.9],
    [d(18), "UBER *TRIP", -42.6 + i * 6],
    [d(20), "PADARIA PAO QUENTE", -58.7],
    [d(22), "SUPERMERCADO BOM PRECO", -387.1 - i * 14],
    [d(25), "JUROS CHEQUE ESPECIAL", -73.45 + i * 18],
    [d(25), "IOF CHEQUE ESPECIAL", -6.82 + i],
    [d(27), "RESTAURANTE SABOR CASEIRO", -134],
  ] as const;
  return linhas.map(([data, desc, v]) => `${data};${desc};${v.toFixed(2).replace(".", ",")}`).join("\n");
}

export const EXTRATO_EXEMPLO = MESES.map((m, i) => mes(m, i)).join("\n");
