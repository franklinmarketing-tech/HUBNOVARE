import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * A SENHA EXTRA DO /admin/suporte (pedido do dono, 21/10/2026: "um campo
 * dentro do admin, suporte, com senha; só eu tenho acesso").
 *
 * ⚠️ A SENHA NÃO ESTÁ NO CÓDIGO. A variável `SUPORTE_SENHA_HASH` guarda o
 * SHA-256 dela (em hexadecimal) — na Vercel e no `.env.local`. Para trocar a
 * senha, troque o hash:
 *   node -e "console.log(require('crypto').createHash('sha256').update('NOVA').digest('hex'))"
 *
 * Depois da senha certa, um cookie httpOnly assinado vale 8 horas, preso ao
 * id do usuário (outro login no mesmo navegador não herda o acesso).
 */
export const COOKIE_SUPORTE = "novare_suporte";
const VALIDADE_MS = 8 * 60 * 60 * 1000;

function hashConfigurado(): string | null {
  const h = process.env.SUPORTE_SENHA_HASH?.trim().toLowerCase();
  return h && /^[0-9a-f]{64}$/.test(h) ? h : null;
}

export function suporteConfigurado(): boolean {
  return hashConfigurado() !== null;
}

export function senhaConfere(senha: string): boolean {
  const alvo = hashConfigurado();
  if (!alvo) return false;
  const dado = createHash("sha256").update(senha).digest("hex");
  return timingSafeEqual(Buffer.from(dado), Buffer.from(alvo));
}

function assinar(texto: string): string {
  return createHmac("sha256", hashConfigurado() ?? "sem-senha").update(texto).digest("hex");
}

export function emitirFicha(usuarioId: string): string {
  const ate = Date.now() + VALIDADE_MS;
  return `${ate}.${assinar(`${usuarioId}.${ate}`)}`;
}

export function fichaValida(ficha: string | undefined, usuarioId: string): boolean {
  if (!ficha || !hashConfigurado()) return false;
  const [ateTxt, assinatura] = ficha.split(".");
  const ate = Number(ateTxt);
  if (!Number.isFinite(ate) || ate < Date.now() || !assinatura) return false;
  const esperado = assinar(`${usuarioId}.${ate}`);
  return assinatura.length === esperado.length && timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado));
}
