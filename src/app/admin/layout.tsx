import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { NavAdmin } from "./NavAdmin";

/**
 * A CASCA DO PAINEL DA NOVARE.
 *
 * ═══ POR QUE ELE PASSOU A EXISTIR (17/10/2026) ════════════════════════════
 *
 * Havia três telas de administração e **nenhum layout**: cada `page.tsx`
 * repetia o mesmo par `getPerfil()` + `notFound()`, e não havia menu nenhum.
 * De `/admin/leads` não existia link para `/admin/assinantes` — a navegação
 * era de mão única, por um link de rodapé em letra miúda.
 *
 * Duas consequências, e a segunda é a grave:
 *
 * 1. Quem entrava não sabia o que mais existia ali.
 * 2. ⚠️ A GUARDA ESTAVA COPIADA. Três cópias da mesma regra de papel é a
 *    receita de uma tela nova nascer sem ela — e uma tela de administração
 *    sem guarda é vazamento de lista de clientes, não bug de layout.
 *
 * Agora a guarda é uma só, e vale para tudo que estiver debaixo de `/admin`,
 * inclusive o que ainda não foi escrito.
 *
 * ═══ 404, NUNCA "ACESSO RESTRITO" ════════════════════════════════════════
 *
 * Quem não é admin nem equipe recebe `notFound()`. Uma página de "acesso
 * restrito" responde 200 e, ao fazer isso, CONFIRMA que existe administração
 * naquele endereço — informação que não se dá de graça a quem está
 * tentando. O 404 não confirma nada.
 *
 * ⚠️ AS PÁGINAS FILHAS MANTÊM A PRÓPRIA GUARDA, de propósito. Esta não
 * substitui aquelas — soma-se a elas. `/admin/assinantes` exige `admin` e
 * barra `equipe`, porque mexer em acesso pago é mexer em dinheiro; essa
 * regra é mais estrita que a daqui e precisa continuar onde está.
 */

/* ⚠️ AS ABAS MORAM EM `NavAdmin.tsx` desde 19/10/2026. Aqui ficavam
   sete; saíram Assinantes (o Hub não cobra mais nada) e Uso (media o mesmo
   que Iscas). O porquê de cada uma está lá. */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  /* O número da aba de Leads. Uma consulta a mais por tela, barata, e é o
     que faz alguém entrar em Leads sem precisar lembrar de olhar. Sem o SQL
     rodado, fica em zero — a aba não pode derrubar o painel. */
  let leadsEsperando = 0;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("hub_saude", { p_dias: 30 });
    leadsEsperando = Number((data as { por_tratar?: number }[] | null)?.[0]?.por_tratar ?? 0);
  } catch {
    leadsEsperando = 0;
  }

  return (
    <div className="min-h-dvh bg-background">
      <NavAdmin
        nome={perfil.nome}
        email={perfil.email}
        papel={perfil.role as "admin" | "equipe"}
        leadsEsperando={leadsEsperando}
      />
      <main className="mx-auto max-w-6xl px-4 py-7 sm:py-9">{children}</main>
    </div>
  );
}
