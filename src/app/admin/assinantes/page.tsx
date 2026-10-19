import { redirect } from "next/navigation";

/**
 * ⚠️ "ASSINANTES" DEIXOU DE EXISTIR em 19/10/2026.
 *
 * A tela falava de "pagante", "teste vencido", "+1 mês" e "+1 ano" — o
 * vocabulário de uma assinatura que acabou quando o Hub virou gratuito. E
 * tinha dois defeitos próprios: desenhava um SEGUNDO cabeçalho do site
 * dentro do painel (dois logos empilhados, um com a fita de cotação) e não
 * reconhecia o erro "função não encontrada" do PostgREST, então mostrava a
 * mensagem crua em inglês em vez da instrução.
 *
 * O que ela tinha de útil — o e-mail de cada pessoa e o papel de acesso —
 * está em Clientes, que agora também edita.
 *
 * O endereço continua respondendo, mas manda para lá: quem salvou o link
 * cai no lugar certo em vez de num 404.
 */
export default function Assinantes() {
  redirect("/admin/clientes");
}
