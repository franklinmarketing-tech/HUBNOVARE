import { redirect } from "next/navigation";

/**
 * A antiga home logada. Foi substituída por `/` (o Workspace redesenhado:
 * saudação, painel do assinante, catálogo em destaque, busca).
 *
 * Fica como redirect — não como 404 — porque links antigos (e-mails
 * enviados, favoritos salvos, o próprio histórico do navegador de quem usa
 * o produto há tempo) apontam para /hub. Trocar por 404 quebraria esses
 * caminhos sem aviso; redirecionar é silencioso e correto.
 */
export default function HubPage() {
  redirect("/");
}
