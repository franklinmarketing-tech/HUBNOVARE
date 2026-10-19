import { redirect } from "next/navigation";

/**
 * ⚠️ "USO" FOI JUNTADO A "ISCAS" em 19/10/2026.
 *
 * As duas telas liam a MESMA tabela (`hub_eventos`), com desenhos e
 * períodos diferentes. Duas telas para o mesmo número é como duas pessoas
 * chegam a conclusões diferentes olhando o mesmo dado. Iscas mostra as
 * ferramentas do catálogo e, embaixo, as outras páginas que captaram —
 * que era o que Uso mostrava.
 *
 * O texto desta tela também tinha envelhecido: mandava rodar
 * `hub_eventos.sql` (hoje é `painel_admin_INSTALAR.sql`) e citava um
 * componente `RegistrarUso` que nunca existiu — o registro de visita é o
 * `RegistrarVisita`, no layout das ferramentas.
 */
export default function Uso() {
  redirect("/admin/iscas");
}
