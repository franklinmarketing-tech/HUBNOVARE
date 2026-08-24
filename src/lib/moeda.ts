/**
 * Máscara de dinheiro estilo caixa (R$ 8.000,00) — o padrão dos apps
 * financeiros brasileiros (Nubank, Itaú, Mobills). O estado da ferramenta
 * continua guardando uma string numérica em reais ("8000", "8000.5"),
 * 100% compatível com `parseFloat`/`Number` — só a EXIBIÇÃO no input muda.
 *
 * `formatarMoedaInput(value)` → texto exibido no campo ("8.000,00").
 * `digitosParaReais(raw)`     → lê o que foi digitado (só os dígitos contam,
 *                                interpretados como centavos) e devolve reais.
 */
export function formatarMoedaInput(value: string): string {
  if (value === "" || value == null) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function digitosParaReais(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  return String(parseInt(digits, 10) / 100);
}
