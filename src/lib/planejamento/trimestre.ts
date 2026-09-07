/**
 * O trimestre, na mesma convenção de data do resto do banco.
 *
 * `periodo_ref` em `revisoes` é o PRIMEIRO DIA do mês inicial do trimestre —
 * 2026-07-01 para o terceiro. Mesma escolha que `month_ref` já fez: data,
 * sempre dia 1, para ordenar e comparar sem ambiguidade.
 *
 * Aqui nada usa `new Date("2026-07-01")`. Essa string é lida como UTC e, em
 * UTC-3, retrocede um dia — o bug que fazia o app escrever "agosto" para o mês
 * gravado como setembro.
 */

/** O trimestre a que uma data pertence, como `YYYY-MM-01`. */
export function trimestreDe(hoje = new Date()): string {
  const ano = hoje.getFullYear();
  const inicio = Math.floor(hoje.getMonth() / 3) * 3; // 0, 3, 6 ou 9
  return `${ano}-${String(inicio + 1).padStart(2, "0")}-01`;
}

/** Recua um `YYYY-MM-01` de trimestre para o anterior. */
export function trimestreAnterior(ref: string): string {
  const [ano, mes] = ref.split("-").map(Number);
  const d = new Date(ano, mes - 4, 1); // -3 meses a partir do mês inicial
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** "3º trimestre de 2026" — o rótulo que vai para a tela. */
export function rotuloTrimestre(ref: string): string {
  const [ano, mes] = ref.split("-").map(Number);
  if (!ano || !mes) return "";
  return `${Math.floor((mes - 1) / 3) + 1}º trimestre de ${ano}`;
}

/**
 * Um `periodo_ref` só é válido se for o primeiro dia de um mês de trimestre.
 * Vale para o que vem da URL: sem isto, uma string torta iria direto para o
 * `.eq("periodo_ref", …)` do Supabase.
 */
export function refDeTrimestreValido(ref: string | null | undefined): boolean {
  if (!ref || !/^\d{4}-\d{2}-01$/.test(ref)) return false;
  return [1, 4, 7, 10].includes(Number(ref.slice(5, 7)));
}
