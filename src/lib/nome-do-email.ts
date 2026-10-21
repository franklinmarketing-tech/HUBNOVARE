/**
 * Nome provisório a partir do e-mail, para ninguém aparecer como "Sem nome"
 * no admin (pedido do dono, 21/10/2026). "deivid.pires@…" vira "Deivid Pires".
 * É só exibição: o nome de verdade continua vazio no banco até a pessoa (ou
 * a equipe, pelo "Editar") preencher.
 */
export function nomeDoEmail(email: string): string {
  const antes = email.split("@")[0] ?? "";
  const partes = antes
    .replace(/[0-9]+/g, " ")
    .split(/[._\-+]+|\s+/)
    .filter((p) => p.length > 1);
  if (!partes.length) return antes || email;
  return partes
    .slice(0, 3)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
